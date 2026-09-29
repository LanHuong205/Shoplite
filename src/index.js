import { Hono } from 'hono'

const app = new Hono()

const SESSION_DURATION = 7 * 24 * 60 * 60
const PASSWORD_ITERATIONS = 120000
const encoder = new TextEncoder()

function toHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function fromHex(value) {
  return Uint8Array.from(value.match(/.{2}/g) || [], (byte) => parseInt(byte, 16))
}

async function digest(value) {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
}

async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PASSWORD_ITERATIONS }, key, 256)
  return `pbkdf2$${PASSWORD_ITERATIONS}$${toHex(salt)}$${toHex(hash)}`
}

async function verifyPassword(password, storedHash) {
  const [, iterations, saltHex, expectedHex] = storedHash.split('$')
  if (!iterations || !saltHex || !expectedHex) return false
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const actual = new Uint8Array(await crypto.subtle.deriveBits({
    name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: Number(iterations)
  }, key, 256))
  const expected = fromHex(expectedHex)
  return actual.length === expected.length && actual.reduce((difference, byte, index) => difference | (byte ^ expected[index]), 0) === 0
}

function cookieOptions(c, maxAge) {
  const secure = new URL(c.req.url).protocol === 'https:' ? '; Secure' : ''
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

async function getCurrentUser(c) {
  const cookie = c.req.header('Cookie') || ''
  const token = cookie.match(/(?:^|;\s*)shoplite_session=([a-f0-9]{64})(?:;|$)/)?.[1]
  if (!token) return null
  const session = await c.env.shoplite_db.prepare(
    'SELECT users.id, users.name, users.email, users.role FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?'
  ).bind(await digest(token), new Date().toISOString()).first()
  return session || null
}

async function createSession(c, userId) {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)))
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000).toISOString()
  await c.env.shoplite_db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await digest(token), userId, expiresAt).run()
  c.header('Set-Cookie', `shoplite_session=${token}; ${cookieOptions(c, SESSION_DURATION)}`)
}

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

function validAccount(body, minimumPasswordLength = 8) {
  const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''
  return body && typeof body.name === 'string' && body.name.trim().length >= 2 && body.name.trim().length <= 100 &&
    email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    typeof body.password === 'string' && body.password.length >= minimumPasswordLength && body.password.length <= 128
}

function validProduct(body) {
  return body && typeof body.name === 'string' && body.name.trim().length > 0 && body.name.length <= 160 &&
    typeof body.author === 'string' && body.author.length <= 120 &&
    typeof body.description === 'string' && body.description.length <= 2000 &&
    Number.isSafeInteger(body.price) && body.price > 0 &&
    typeof body.category === 'string' && body.category.length <= 80 &&
    Number.isSafeInteger(body.stock) && body.stock >= 0 &&
    typeof body.featured === 'boolean' &&
    (body.image_url == null || (typeof body.image_url === 'string' && body.image_url.length <= 500))
}

function buildVietQrDetails(env, amount, orderCode) {
  const { BANK_ID, BANK_ACCOUNT, BANK_ACCOUNT_NAME } = env
  const qrUrl = new URL(`https://img.vietqr.io/image/${encodeURIComponent(BANK_ID)}-${encodeURIComponent(BANK_ACCOUNT)}-compact2.png`)
  qrUrl.search = new URLSearchParams({ amount: String(amount), addInfo: orderCode, accountName: BANK_ACCOUNT_NAME }).toString()
  return {
    bankId: BANK_ID,
    accountNumber: BANK_ACCOUNT,
    accountName: BANK_ACCOUNT_NAME,
    amount,
    orderCode,
    qrUrl: qrUrl.toString()
  }
}

async function requireAdmin(c) {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Vui lòng đăng nhập.' }, 401)
  if (user.role !== 'admin') return c.json({ error: 'Bạn không có quyền thực hiện thao tác này.' }, 403)
  return null
}

// Kiểm tra API
app.get('/api', (c) => {
  return c.json({
    message: 'Shoplite API đang hoạt động!'
  })
})

app.post('/api/auth/register', async (c) => {
  let body
  try { body = await c.req.json() } catch { return c.json({ error: 'Thông tin đăng ký không hợp lệ.' }, 400) }
  if (!validAccount(body)) return c.json({ error: 'Vui lòng nhập tên, email hợp lệ và mật khẩu có ít nhất 8 ký tự.' }, 400)

  const email = normalizeEmail(body.email)
  try {
    const name = body.name.trim()
    const token = toHex(crypto.getRandomValues(new Uint8Array(32)))
    const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000).toISOString()
    const [result] = await c.env.shoplite_db.batch([
      c.env.shoplite_db.prepare(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')"
      ).bind(name, email, await hashPassword(body.password)),
      c.env.shoplite_db.prepare(
        'INSERT INTO sessions (token_hash, user_id, expires_at) SELECT ?, id, ? FROM users WHERE email = ?'
      ).bind(await digest(token), expiresAt, email)
    ])
    c.header('Set-Cookie', `shoplite_session=${token}; ${cookieOptions(c, SESSION_DURATION)}`)
    return c.json({ user: { id: result.meta.last_row_id, name, email, role: 'user' } }, 201)
  } catch (error) {
    if (String(error).includes('UNIQUE')) return c.json({ error: 'Email này đã được đăng ký.' }, 409)
    throw error
  }
})

app.post('/api/auth/login', async (c) => {
  let body
  try { body = await c.req.json() } catch { return c.json({ error: 'Thông tin đăng nhập không hợp lệ.' }, 400) }
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return c.json({ error: 'Vui lòng nhập email và mật khẩu.' }, 400)
  }
  const user = await c.env.shoplite_db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE email = ?')
    .bind(normalizeEmail(body.email)).first()
  if (!user || !(await verifyPassword(body.password, user.password_hash))) {
    return c.json({ error: 'Email hoặc mật khẩu không chính xác.' }, 401)
  }
  await createSession(c, user.id)
  return c.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

app.post('/api/auth/logout', async (c) => {
  const user = await getCurrentUser(c)
  const token = (c.req.header('Cookie') || '').match(/(?:^|;\s*)shoplite_session=([a-f0-9]{64})(?:;|$)/)?.[1]
  if (user && token) {
    await c.env.shoplite_db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await digest(token)).run()
  }
  c.header('Set-Cookie', `shoplite_session=; ${cookieOptions(c, 0)}`)
  return c.json({ ok: true })
})

app.get('/api/auth/me', async (c) => c.json({ user: await getCurrentUser(c) }))

app.post('/api/auth/bootstrap-admin', async (c) => {
  const setupToken = c.req.header('X-Admin-Setup-Token') || ''
  if (!c.env.ADMIN_SETUP_TOKEN || setupToken !== c.env.ADMIN_SETUP_TOKEN) {
    return c.json({ error: 'Mã khởi tạo quản trị không hợp lệ.' }, 403)
  }
  const existingAdmin = await c.env.shoplite_db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first()
  if (existingAdmin) return c.json({ error: 'Tài khoản quản trị đã được khởi tạo.' }, 409)

  let body
  try { body = await c.req.json() } catch { return c.json({ error: 'Thông tin khởi tạo không hợp lệ.' }, 400) }
  if (!validAccount(body, 12)) return c.json({ error: 'Mật khẩu admin cần ít nhất 12 ký tự.' }, 400)
  const email = normalizeEmail(body.email)
  try {
    const result = await c.env.shoplite_db.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')"
    ).bind(body.name.trim(), email, await hashPassword(body.password)).run()
    await createSession(c, result.meta.last_row_id)
    return c.json({ user: { id: result.meta.last_row_id, name: body.name.trim(), email, role: 'admin' } }, 201)
  } catch (error) {
    if (String(error).includes('UNIQUE')) return c.json({ error: 'Email này đã được đăng ký.' }, 409)
    throw error
  }
})

app.post('/api/payments/vietqr', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Vui lòng đăng nhập để thanh toán đơn hàng.' }, 401)
  const { BANK_ID, BANK_ACCOUNT, BANK_ACCOUNT_NAME } = c.env

  if (!BANK_ID || !BANK_ACCOUNT || !BANK_ACCOUNT_NAME) {
    return c.json({ error: 'Cửa hàng chưa cấu hình tài khoản nhận chuyển khoản.' }, 503)
  }

  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Thông tin thanh toán không hợp lệ.' }, 400)
  }

  const amount = Number(body.amount)
  const orderCode = typeof body.orderCode === 'string' ? body.orderCode : ''
  if (!Number.isSafeInteger(amount) || amount <= 0 || !/^SL[A-Z0-9]{6,12}$/.test(orderCode)) {
    return c.json({ error: 'Số tiền hoặc mã đơn hàng không hợp lệ.' }, 400)
  }

  const order = await c.env.shoplite_db.prepare(
    'SELECT total_amount FROM orders WHERE order_code = ? AND user_id = ? AND payment_method = \'bank\' AND status = \'pending\''
  ).bind(orderCode, user.id).first()
  if (!order || order.total_amount !== amount) {
    return c.json({ error: 'Không tìm thấy đơn chuyển khoản hợp lệ.' }, 404)
  }

  return c.json(buildVietQrDetails(c.env, amount, orderCode))
})

// Lấy danh sách sản phẩm
app.get('/api/products', async (c) => {
  const { results } = await c.env.shoplite_db
    .prepare('SELECT id, name, author, description, price, image_url, category, stock, featured FROM products ORDER BY id DESC')
    .all()

  return c.json(results)
})

app.post('/api/products', async (c) => {
  const denied = await requireAdmin(c)
  if (denied) return denied
  let body
  try { body = await c.req.json() } catch { return c.json({ error: 'Thông tin sách không hợp lệ.' }, 400) }
  if (!validProduct(body)) return c.json({ error: 'Vui lòng kiểm tra lại thông tin sách.' }, 400)
  const result = await c.env.shoplite_db.prepare(
    'INSERT INTO products (name, author, description, price, image_url, category, stock, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(body.name.trim(), body.author.trim(), body.description.trim(), body.price, body.image_url || null, body.category, body.stock, body.featured ? 1 : 0).run()
  return c.json({ id: result.meta.last_row_id }, 201)
})

app.patch('/api/products/:id', async (c) => {
  const denied = await requireAdmin(c)
  if (denied) return denied
  let body
  try { body = await c.req.json() } catch { return c.json({ error: 'Thông tin sách không hợp lệ.' }, 400) }
  if (!validProduct(body)) return c.json({ error: 'Vui lòng kiểm tra lại thông tin sách.' }, 400)
  const result = await c.env.shoplite_db.prepare(
    'UPDATE products SET name = ?, author = ?, description = ?, price = ?, image_url = ?, category = ?, stock = ?, featured = ? WHERE id = ?'
  ).bind(body.name.trim(), body.author.trim(), body.description.trim(), body.price, body.image_url || null, body.category, body.stock, body.featured ? 1 : 0, c.req.param('id')).run()
  if (!result.meta.changes) return c.json({ error: 'Không tìm thấy sách.' }, 404)
  return c.json({ ok: true })
})

app.delete('/api/products/:id', async (c) => {
  const denied = await requireAdmin(c)
  if (denied) return denied
  const result = await c.env.shoplite_db.prepare('DELETE FROM products WHERE id = ?').bind(c.req.param('id')).run()
  if (!result.meta.changes) return c.json({ error: 'Không tìm thấy sách.' }, 404)
  return c.json({ ok: true })
})

app.post('/api/orders', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Vui lòng đăng nhập bằng tài khoản khách hàng để đặt hàng.' }, 401)
  if (user.role !== 'user') return c.json({ error: 'Chỉ tài khoản khách hàng mới được đặt hàng.' }, 403)

  let body
  try { body = await c.req.json() } catch { return c.json({ error: 'Thông tin đơn hàng không hợp lệ.' }, 400) }
  if (!body || typeof body.fullName !== 'string' || body.fullName.trim().length < 2 || body.fullName.length > 120 ||
    typeof body.phone !== 'string' || !/^[0-9 +()-]{9,20}$/.test(body.phone) ||
    typeof body.address !== 'string' || body.address.trim().length < 6 || body.address.length > 500 ||
    !['cod', 'bank'].includes(body.payment) || !Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
    return c.json({ error: 'Vui lòng kiểm tra lại thông tin giao hàng và sản phẩm.' }, 400)
  }
  if (body.payment === 'bank' && (!c.env.BANK_ID || !c.env.BANK_ACCOUNT || !c.env.BANK_ACCOUNT_NAME)) {
    return c.json({ error: 'Cửa hàng chưa cấu hình thanh toán QR. Đơn hàng chưa được tạo.' }, 503)
  }

  const quantities = new Map()
  for (const item of body.items) {
    if (!Number.isSafeInteger(item.id) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      return c.json({ error: 'Số lượng sách không hợp lệ.' }, 400)
    }
    quantities.set(item.id, (quantities.get(item.id) || 0) + item.quantity)
  }

  const ids = [...quantities.keys()]
  const placeholders = ids.map(() => '?').join(', ')
  const { results: books } = await c.env.shoplite_db.prepare(
    `SELECT id, name, price, stock FROM products WHERE id IN (${placeholders})`
  ).bind(...ids).all()
  if (books.length !== ids.length) return c.json({ error: 'Một hoặc nhiều sách không còn tồn tại.' }, 409)
  for (const book of books) {
    if (book.stock < quantities.get(book.id)) return c.json({ error: `Sách "${book.name}" không đủ số lượng trong kho.` }, 409)
  }

  const subtotal = books.reduce((sum, book) => sum + book.price * quantities.get(book.id), 0)
  const shipping = subtotal === 0 || subtotal >= 300000 ? 0 : 30000
  const orderCode = `SL${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`
  const total = subtotal + shipping
  const paymentStatus = body.payment === 'bank' ? 'awaiting_payment' : 'cash_on_delivery'
  const paymentDetails = body.payment === 'bank' ? buildVietQrDetails(c.env, total, orderCode) : null
  const statements = [
    c.env.shoplite_db.prepare(
      "INSERT INTO orders (user_id, total_amount, status, customer_name, phone, address, payment_method, payment_status, order_code) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)"
    ).bind(user.id, total, body.fullName.trim(), body.phone.trim(), body.address.trim(), body.payment, paymentStatus, orderCode)
  ]
  for (const book of books) {
    const quantity = quantities.get(book.id)
    statements.push(c.env.shoplite_db.prepare(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?'
    ).bind(quantity, book.id, quantity))
    statements.push(c.env.shoplite_db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ((SELECT id FROM orders WHERE order_code = ?), ?, ?, ?)'
    ).bind(orderCode, book.id, quantity, book.price))
  }

  await c.env.shoplite_db.batch(statements)
  return c.json({ orderCode, subtotal, shipping, total, paymentStatus, payment: paymentDetails }, 201)
})

app.get('/api/orders', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: 'Vui lòng đăng nhập.' }, 401)
  const isAdmin = user.role === 'admin'
  const { results } = await c.env.shoplite_db.prepare(
    `SELECT orders.id, orders.order_code, orders.total_amount, orders.status, orders.payment_method, orders.payment_status,
      orders.customer_name, orders.phone, orders.address, orders.created_at, users.name AS account_name,
      GROUP_CONCAT(products.name || ' x' || order_items.quantity, ', ') AS items
      FROM orders JOIN users ON users.id = orders.user_id
      JOIN order_items ON order_items.order_id = orders.id
      JOIN products ON products.id = order_items.product_id
      ${isAdmin ? '' : 'WHERE orders.user_id = ?'}
      GROUP BY orders.id ORDER BY orders.id DESC LIMIT 100`
  ).bind(...(isAdmin ? [] : [user.id])).all()
  return c.json(results)
})

app.patch('/api/orders/:id', async (c) => {
  const denied = await requireAdmin(c)
  if (denied) return denied
  let body
  try { body = await c.req.json() } catch { return c.json({ error: 'Thông tin trạng thái không hợp lệ.' }, 400) }
  const order = await c.env.shoplite_db.prepare('SELECT status, payment_method, payment_status FROM orders WHERE id = ?')
    .bind(c.req.param('id')).first()
  if (!order) return c.json({ error: 'Không tìm thấy đơn hàng.' }, 404)
  if (body.status !== undefined && !['pending', 'processing', 'shipped', 'completed', 'cancelled'].includes(body.status)) {
    return c.json({ error: 'Trạng thái đơn hàng không hợp lệ.' }, 400)
  }
  if (body.paymentStatus !== undefined) {
    const validStatuses = order.payment_method === 'bank'
      ? ['awaiting_payment', 'paid', 'cancelled']
      : ['cash_on_delivery', 'paid', 'cancelled']
    if (!validStatuses.includes(body.paymentStatus)) return c.json({ error: 'Trạng thái thanh toán không hợp lệ.' }, 400)
  }
  if (body.status === undefined && body.paymentStatus === undefined) {
    return c.json({ error: 'Cần cung cấp trạng thái đơn hàng hoặc thanh toán.' }, 400)
  }
  await c.env.shoplite_db.prepare(
    'UPDATE orders SET status = COALESCE(?, status), payment_status = COALESCE(?, payment_status) WHERE id = ?'
  ).bind(body.status ?? null, body.paymentStatus ?? null, c.req.param('id')).run()
  return c.json({ ok: true })
})

export default app