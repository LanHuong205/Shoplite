let products = [
  {
    id: 1,
    name: "Đừng Ngại Sống",
    category: "van-hoc",
    author: "Nguyễn Nhật Ánh",
    price: 189000,
    rating: 4.9,
    symbol: "📖",
    desc: "Câu chuyện truyền cảm hứng về sự dũng cảm và chủ động trong cuộc sống.",
    featured: true,
  },
  {
    id: 2,
    name: "Siêu Trí Nhớ",
    category: "giao-duc",
    author: "David",
    price: 160000,
    rating: 4.8,
    symbol: "🧠",
    desc: "Phương pháp cải thiện trí nhớ và khả năng tập trung hiệu quả.",
    featured: true,
  },
  {
    id: 3,
    name: "Bí Mật Tư Duy Tích Cực",
    category: "ky-nang",
    author: "Maya",
    price: 220000,
    rating: 4.7,
    symbol: "✨",
    desc: "Khám phá cách thay đổi thói quen, suy nghĩ và hành vi mỗi ngày.",
    featured: false,
  },
  {
    id: 4,
    name: "Làm Giàu Từ Tài Sản",
    category: "kinh-doanh",
    author: "Bennett",
    price: 260000,
    rating: 4.9,
    symbol: "💼",
    desc: "Hướng dẫn xây dựng nền tảng tài chính bền vững và thông minh.",
    featured: true,
  },
  {
    id: 5,
    name: "Những Cánh Buồm",
    category: "van-hoc",
    author: "Hemingway",
    price: 145000,
    rating: 4.6,
    symbol: "🌊",
    desc: "Tác phẩm nổi tiếng về lòng can đảm và ước mơ vượt qua bão giông.",
    featured: false,
  },
  {
    id: 6,
    name: "Khởi Nghiệp Cho Học Sinh",
    category: "giao-duc",
    author: "Linh Phạm",
    price: 175000,
    rating: 4.7,
    symbol: "🚀",
    desc: "Bộ sách khuyến khích tinh thần sáng tạo và làm chủ cuộc đời.",
    featured: false,
  },
  {
    id: 7,
    name: "Vùng Đất Của Những Chiếc Cầu",
    category: "thieu-nhi",
    author: "Minh Lan",
    price: 99000,
    rating: 4.8,
    symbol: "🧒",
    desc: "Truyện thiếu nhi tuyệt đẹp với nhân vật đáng yêu và tình bạn ý nghĩa.",
    featured: true,
  },
  {
    id: 8,
    name: "7 Thói Quen Hiệu Quả",
    category: "ky-nang",
    author: "Stephen R. Covey",
    price: 215000,
    rating: 4.9,
    symbol: "✅",
    desc: "Một cuốn sách giúp bạn thấu hiểu cách sống hiệu quả và bền vững.",
    featured: false,
  },
];

const cart = [];
const productList = document.getElementById("product-list");
const featuredBooks = document.getElementById("featured-books");
const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const cartPanel = document.getElementById("cart-panel");
const checkoutModal = document.getElementById("checkout-modal");
const checkoutForm = document.getElementById("checkout-form");
const checkoutMessage = document.getElementById("checkout-message");
const checkoutButton = document.getElementById("checkout-button");
const sortSelect = document.getElementById("sortSelect");
const categoryButtons = document.querySelectorAll(".category");
const bankTransferInstructions = document.getElementById("bank-transfer-instructions");
const checkoutSuccess = document.getElementById("checkout-success");
const bankPaymentOption = checkoutForm.querySelector('input[name="payment"][value="bank"]');
const codPaymentOption = checkoutForm.querySelector('input[name="payment"][value="cod"]');
const accountModal = document.getElementById("account-modal");
const accountForm = document.getElementById("account-form");
const accountMessage = document.getElementById("account-message");
const accountNameField = document.getElementById("account-name-field");
const accountModeToggle = document.getElementById("account-mode-toggle");
const accountButton = document.getElementById("account-button");
const productForm = document.getElementById("product-form");
const adminMessage = document.getElementById("admin-message");
const adminOrders = document.getElementById("admin-orders");

let selectedCategory = "all";
let currentUser = null;
let accountMode = "login";
let continueToCheckout = false;

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Không thể kết nối tới cửa hàng.");
  return data;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function normalizeProduct(item) {
  return {
    ...item,
    desc: item.description || "",
    featured: item.featured === true || item.featured === 1,
    rating: item.rating || "4.8",
    symbol: item.symbol || ({ "van-hoc": "📖", "kinh-doanh": "💼", "giao-duc": "🧠", "thieu-nhi": "🧒", "ky-nang": "✨" }[item.category] || "📚"),
  };
}

async function loadProducts() {
  const data = await apiRequest("/api/products");
  if (data.length) products = data.map(normalizeProduct);
  renderFeaturedBooks();
  renderProducts();
}

function updateAccountUI() {
  accountButton.textContent = currentUser ? `${currentUser.name} · Đăng xuất` : "Đăng nhập";
  accountButton.setAttribute("aria-label", currentUser ? `Đăng xuất tài khoản ${currentUser.name}` : "Đăng nhập tài khoản khách hàng");
  document.getElementById("admin-panel").hidden = currentUser?.role !== "admin";
  if (currentUser?.role === "admin") loadAdminOrders();
}

async function loadCurrentUser() {
  const data = await apiRequest("/api/auth/me");
  currentUser = data.user;
  updateAccountUI();
}

function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getFilteredProducts() {
  let result = [...products];

  if (selectedCategory !== "all") {
    result = result.filter((item) => item.category === selectedCategory);
  }

  const sortBy = sortSelect.value;
  if (sortBy === "price-asc") {
    result.sort((a, b) => a.price - b.price);
  }
  if (sortBy === "price-desc") {
    result.sort((a, b) => b.price - a.price);
  }

  return result;
}

function renderFeaturedBooks() {
  const featured = products.filter((item) => item.featured).slice(0, 4);
  featuredBooks.innerHTML = featured
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-cover" data-symbol="${escapeHtml(product.symbol)}">${product.image_url ? `<img src="${escapeHtml(product.image_url)}" alt="Bìa ${escapeHtml(product.name)}" loading="lazy">` : ""}</div>
          <div class="product-body">
            <div class="product-meta">
              <span>${escapeHtml(product.author)}</span>
              <span>★ ${product.rating}</span>
            </div>
            <h3>${escapeHtml(product.name)}</h3>
            <p class="product-desc">${escapeHtml(product.desc)}</p>
            <div class="product-bottom">
              <span class="price">${formatPrice(product.price)}</span>
              ${currentUser?.role === "admin" ? `<button class="edit-product-button" data-id="${product.id}" type="button" aria-label="Sửa ${escapeHtml(product.name)}">Sửa</button>` : ""}
              <button class="add-to-cart" data-id="${product.id}" aria-label="Thêm ${escapeHtml(product.name)} vào giỏ hàng">+</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();

  productList.innerHTML = filteredProducts
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-cover" data-symbol="${escapeHtml(product.symbol)}">${product.image_url ? `<img src="${escapeHtml(product.image_url)}" alt="Bìa ${escapeHtml(product.name)}" loading="lazy">` : ""}</div>
          <div class="product-body">
            <div class="product-meta">
              <span>${escapeHtml(product.author)}</span>
              <span>★ ${product.rating}</span>
            </div>
            <h3>${escapeHtml(product.name)}</h3>
            <p class="product-desc">${escapeHtml(product.desc)}</p>
            <div class="product-bottom">
              <span class="price">${formatPrice(product.price)}</span>
              ${currentUser?.role === "admin" ? `<button class="edit-product-button" data-id="${product.id}" type="button" aria-label="Sửa ${escapeHtml(product.name)}">Sửa</button>` : ""}
              <button class="add-to-cart" data-id="${product.id}" aria-label="Thêm ${escapeHtml(product.name)} vào giỏ hàng">+</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderCart() {
  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-cart">Giỏ hàng của bạn đang trống.</p>';
    cartCount.textContent = "0";
    cartTotal.textContent = "0đ";
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <div class="cart-thumb">${escapeHtml(item.symbol)}</div>
          <div style="flex: 1;">
            <h4>${escapeHtml(item.name)}</h4>
            <p>${formatPrice(item.price)}</p>
            <div class="quantity">
              <div>
                <button class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
                <span style="margin: 0 8px; font-weight: 700;">${item.quantity}</span>
                <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
              </div>
              <strong>${formatPrice(item.price * item.quantity)}</strong>
            </div>
          </div>
        </div>
      `
    )
    .join("");

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartCount.textContent = totalItems;
  cartTotal.textContent = formatPrice(totalPrice);
}

function addToCart(productId) {
  const product = products.find((item) => item.id === Number(productId));
  if (!product) return;

  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  renderCart();
  cartPanel.classList.add("open");
}

function updateQuantity(productId, action) {
  const item = cart.find((entry) => entry.id === Number(productId));
  if (!item) return;

  if (action === "increase") {
    item.quantity += 1;
  }
  if (action === "decrease") {
    item.quantity -= 1;
  }

  if (item.quantity <= 0) {
    const index = cart.findIndex((entry) => entry.id === Number(productId));
    cart.splice(index, 1);
  }

  renderCart();
}

function getCartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 300000 ? 0 : 30000;
  return { subtotal, shipping, total: subtotal + shipping };
}

function renderCheckoutSummary() {
  const { subtotal, shipping, total } = getCartTotals();
  document.getElementById("checkout-subtotal").textContent = formatPrice(subtotal);
  document.getElementById("checkout-shipping").textContent = shipping ? formatPrice(shipping) : "Miễn phí";
  document.getElementById("checkout-total").textContent = formatPrice(total);
}

function openCheckout() {
  if (!currentUser || currentUser.role !== "user") {
    continueToCheckout = true;
    cartPanel.classList.remove("open");
    openAccount("login", "Vui lòng đăng nhập bằng tài khoản khách hàng để tiếp tục mua hàng.");
    return;
  }
  if (!cart.length) {
    checkoutMessage.textContent = "Vui lòng thêm ít nhất một sản phẩm vào giỏ hàng.";
    return;
  }

  checkoutMessage.textContent = "";
  checkoutMessage.classList.remove("success");
  bankTransferInstructions.hidden = true;
  checkoutSuccess.hidden = true;
  checkoutForm.hidden = false;
  checkoutForm.querySelector('button[type="submit"]').disabled = false;
  checkoutForm.querySelector('button[type="submit"]').textContent = "Xác nhận đặt hàng";
  if (!checkoutForm.elements.fullName.value) checkoutForm.elements.fullName.value = currentUser.name;
  codPaymentOption.checked = true;
  renderCheckoutSummary();
  cartPanel.classList.remove("open");
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  checkoutForm.elements.fullName.focus();
}

function closeCheckout() {
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
}

function openAccount(mode = "login", message = "") {
  accountMode = mode;
  accountForm.reset();
  accountNameField.hidden = mode !== "register";
  accountForm.elements.name.required = mode === "register";
  accountForm.elements.password.autocomplete = mode === "register" ? "new-password" : "current-password";
  document.getElementById("account-title").textContent = mode === "register" ? "Tạo tài khoản khách hàng" : "Đăng nhập";
  document.getElementById("account-submit").textContent = mode === "register" ? "Tạo tài khoản" : "Đăng nhập";
  accountModeToggle.textContent = mode === "register" ? "Đã có tài khoản? Đăng nhập" : "Tạo tài khoản khách hàng";
  accountMessage.textContent = message;
  accountModal.classList.add("open");
  accountModal.setAttribute("aria-hidden", "false");
}

function closeAccount() {
  accountModal.classList.remove("open");
  accountModal.setAttribute("aria-hidden", "true");
}

function resetProductForm() {
  productForm.reset();
  productForm.elements.id.value = "";
  productForm.hidden = true;
  adminMessage.textContent = "";
}

function editProduct(productId) {
  const product = products.find((item) => item.id === Number(productId));
  if (!product) return;
  productForm.hidden = false;
  productForm.elements.id.value = product.id;
  productForm.elements.name.value = product.name;
  productForm.elements.author.value = product.author;
  productForm.elements.price.value = product.price;
  productForm.elements.stock.value = product.stock;
  productForm.elements.category.value = product.category;
  productForm.elements.image_url.value = product.image_url || "";
  productForm.elements.description.value = product.desc;
  productForm.elements.featured.checked = product.featured;
  productForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function loadAdminOrders() {
  try {
    const orders = await apiRequest("/api/orders");
    adminOrders.innerHTML = `<h3>Đơn hàng mới nhất</h3>${orders.length ? orders.map((order) => `
      <article class="admin-order-row">
        <div><strong>${escapeHtml(order.order_code)}</strong><span>${escapeHtml(order.customer_name)} · ${escapeHtml(order.phone)}</span><small>${escapeHtml(order.items)} · ${formatPrice(order.total_amount)}</small></div>
        <div class="admin-order-controls">
          <label>Giao hàng<select class="order-status" data-id="${order.id}" aria-label="Trạng thái giao hàng ${escapeHtml(order.order_code)}">
            ${[["pending", "Chờ xử lý"], ["processing", "Đang chuẩn bị"], ["shipped", "Đang giao"], ["completed", "Hoàn tất"], ["cancelled", "Đã hủy"]].map(([value, label]) => `<option value="${value}" ${order.status === value ? "selected" : ""}>${label}</option>`).join("")}
          </select></label>
          <label>Thanh toán<select class="payment-status" data-id="${order.id}" aria-label="Trạng thái thanh toán ${escapeHtml(order.order_code)}">
            ${(order.payment_method === "bank" ? [["awaiting_payment", "Chờ chuyển khoản"], ["paid", "Đã thanh toán"], ["cancelled", "Đã hủy"]] : [["cash_on_delivery", "Thu khi giao hàng"], ["paid", "Đã thu tiền"], ["cancelled", "Đã hủy"]]).map(([value, label]) => `<option value="${value}" ${order.payment_status === value ? "selected" : ""}>${label}</option>`).join("")}
          </select></label>
        </div>
      </article>`).join("") : "<p>Chưa có đơn hàng.</p>"}`;
  } catch (error) {
    adminOrders.textContent = error.message;
  }
}

function showBankTransferQr(payment) {
  if (!payment?.qrUrl) throw new Error("Đơn chưa có mã QR thanh toán.");
  const submitButton = checkoutForm.querySelector('button[type="submit"]');
  document.getElementById("bank-transfer-qr").src = payment.qrUrl;
  document.getElementById("bank-transfer-bank").textContent = payment.bankId;
  document.getElementById("bank-transfer-name").textContent = payment.accountName;
  document.getElementById("bank-transfer-account").textContent = payment.accountNumber;
  document.getElementById("bank-transfer-amount").textContent = formatPrice(payment.amount);
  document.getElementById("bank-transfer-reference").textContent = payment.orderCode;
  bankTransferInstructions.hidden = false;
  checkoutMessage.textContent = "Đơn đã lưu. Quét QR và chờ cửa hàng xác nhận giao dịch.";
  checkoutMessage.classList.add("success");
  submitButton.disabled = true;
  submitButton.textContent = "Đơn đã tạo · Chờ chuyển khoản";
}

codPaymentOption.addEventListener("change", () => {
  bankTransferInstructions.hidden = true;
  checkoutMessage.textContent = "";
  checkoutMessage.classList.remove("success");
  const submitButton = checkoutForm.querySelector('button[type="submit"]');
  submitButton.disabled = false;
  submitButton.textContent = "Xác nhận đặt hàng";
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;
    categoryButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderProducts();
  });
});

sortSelect.addEventListener("change", renderProducts);

document.addEventListener("click", (event) => {
  const editButton = event.target.closest(".edit-product-button");
  if (editButton) {
    editProduct(editButton.dataset.id);
    return;
  }

  const addButton = event.target.closest(".add-to-cart");
  if (addButton) {
    addToCart(addButton.dataset.id);
    return;
  }

  const qtyButton = event.target.closest(".qty-btn");
  if (qtyButton) {
    updateQuantity(qtyButton.dataset.id, qtyButton.dataset.action);
    return;
  }

  if (event.target.closest(".cart-button")) {
    cartPanel.classList.add("open");
    return;
  }

  if (event.target.closest("#close-cart")) {
    cartPanel.classList.remove("open");
    return;
  }

  if (event.target.closest("#checkout-button")) {
    openCheckout();
    return;
  }

  if (event.target.closest("#close-checkout") || event.target === checkoutModal) {
    closeCheckout();
    return;
  }

  if (event.target.closest("#success-close")) {
    closeCheckout();
  }
});

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || currentUser.role !== "user") {
    closeCheckout();
    continueToCheckout = true;
    openAccount("login", "Vui lòng đăng nhập bằng tài khoản khách hàng để tiếp tục mua hàng.");
    return;
  }
  const submitButton = checkoutForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  checkoutMessage.textContent = "Đang ghi nhận đơn hàng...";
  try {
    const order = await apiRequest("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        fullName: checkoutForm.elements.fullName.value,
        phone: checkoutForm.elements.phone.value,
        address: checkoutForm.elements.address.value,
        payment: checkoutForm.elements.payment.value,
        items: cart.map(({ id, quantity }) => ({ id, quantity })),
      }),
    });
    cart.length = 0;
    renderCart();
    if (order.payment) {
      showBankTransferQr(order.payment);
    } else {
      document.getElementById("success-order-code").textContent = order.orderCode;
      document.getElementById("success-payment-message").textContent = "Đơn hàng đã được lưu. Bạn thanh toán khi nhận sách.";
      checkoutForm.hidden = true;
      checkoutSuccess.hidden = false;
    }
    if (currentUser.role === "admin") loadAdminOrders();
  } catch (error) {
    checkoutMessage.textContent = error.message;
    submitButton.disabled = false;
  }
});

accountButton.addEventListener("click", async () => {
  if (!currentUser) {
    openAccount("login");
    return;
  }
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
    currentUser = null;
    updateAccountUI();
    renderFeaturedBooks();
    renderProducts();
  } catch (error) {
    window.alert(error.message);
  }
});

accountModeToggle.addEventListener("click", () => {
  openAccount(accountMode === "login" ? "register" : "login");
});

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = document.getElementById("account-submit");
  submitButton.disabled = true;
  accountMessage.textContent = "Đang xác thực...";
  const payload = {
    email: accountForm.elements.email.value,
    password: accountForm.elements.password.value,
  };
  if (accountMode === "register") payload.name = accountForm.elements.name.value;
  try {
    const data = await apiRequest(`/api/auth/${accountMode === "register" ? "register" : "login"}`, {
      method: "POST", body: JSON.stringify(payload),
    });
    currentUser = data.user;
    updateAccountUI();
    renderFeaturedBooks();
    renderProducts();
    closeAccount();
    if (continueToCheckout) {
      continueToCheckout = false;
      openCheckout();
    }
  } catch (error) {
    accountMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

document.getElementById("close-account").addEventListener("click", closeAccount);
accountModal.addEventListener("click", (event) => {
  if (event.target === accountModal) closeAccount();
});

document.getElementById("new-product-button").addEventListener("click", () => {
  resetProductForm();
  productForm.hidden = false;
  productForm.scrollIntoView({ behavior: "smooth", block: "center" });
});
document.getElementById("cancel-product-button").addEventListener("click", resetProductForm);

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(productForm);
  const id = form.get("id");
  const payload = {
    name: form.get("name").trim(),
    author: form.get("author").trim(),
    price: Number(form.get("price")),
    stock: Number(form.get("stock")),
    category: form.get("category"),
    image_url: form.get("image_url").trim() || null,
    description: form.get("description").trim(),
    featured: form.has("featured"),
  };
  try {
    await apiRequest(id ? `/api/products/${id}` : "/api/products", {
      method: id ? "PATCH" : "POST", body: JSON.stringify(payload),
    });
    resetProductForm();
    await loadProducts();
  } catch (error) {
    adminMessage.textContent = error.message;
  }
});

adminOrders.addEventListener("change", async (event) => {
  if (!event.target.matches(".order-status, .payment-status")) return;
  const update = event.target.matches(".order-status")
    ? { status: event.target.value }
    : { paymentStatus: event.target.value };
  try {
    await apiRequest(`/api/orders/${event.target.dataset.id}`, {
      method: "PATCH", body: JSON.stringify(update),
    });
  } catch (error) {
    window.alert(error.message);
    loadAdminOrders();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && checkoutModal.classList.contains("open")) {
    closeCheckout();
  }
  if (event.key === "Escape" && accountModal.classList.contains("open")) closeAccount();
});

renderFeaturedBooks();
renderProducts();
renderCart();
loadProducts().catch((error) => console.error("Không tải được danh sách sách:", error));
loadCurrentUser().catch((error) => console.error("Không kiểm tra được phiên đăng nhập:", error));
