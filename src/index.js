import { Hono } from 'hono'

const app = new Hono()

// Kiểm tra API
app.get('/api', (c) => {
  return c.json({
    message: 'Shoplite API đang hoạt động!'
  })
})

app.post('/api/payments/vietqr', async (c) => {
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

  const qrUrl = new URL(`https://img.vietqr.io/image/${encodeURIComponent(BANK_ID)}-${encodeURIComponent(BANK_ACCOUNT)}-compact2.png`)
  qrUrl.search = new URLSearchParams({
    amount: String(amount),
    addInfo: orderCode,
    accountName: BANK_ACCOUNT_NAME
  }).toString()

  return c.json({
    bankId: BANK_ID,
    accountNumber: BANK_ACCOUNT,
    accountName: BANK_ACCOUNT_NAME,
    amount,
    orderCode,
    qrUrl: qrUrl.toString()
  })
})

// Lấy danh sách sản phẩm
app.get('/api/products', async (c) => {
  const { results } = await c.env.shoplite_db
    .prepare('SELECT * FROM products ORDER BY id DESC')
    .all()

  return c.json(results)
})

export default app