const products = [
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

let selectedCategory = "all";

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
          <div class="product-cover" data-symbol="${product.symbol}"></div>
          <div class="product-body">
            <div class="product-meta">
              <span>${product.author}</span>
              <span>★ ${product.rating}</span>
            </div>
            <h3>${product.name}</h3>
            <p class="product-desc">${product.desc}</p>
            <div class="product-bottom">
              <span class="price">${formatPrice(product.price)}</span>
              <button class="add-to-cart" data-id="${product.id}" aria-label="Thêm ${product.name} vào giỏ hàng">+</button>
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
          <div class="product-cover" data-symbol="${product.symbol}"></div>
          <div class="product-body">
            <div class="product-meta">
              <span>${product.author}</span>
              <span>★ ${product.rating}</span>
            </div>
            <h3>${product.name}</h3>
            <p class="product-desc">${product.desc}</p>
            <div class="product-bottom">
              <span class="price">${formatPrice(product.price)}</span>
              <button class="add-to-cart" data-id="${product.id}" aria-label="Thêm ${product.name} vào giỏ hàng">+</button>
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
          <div class="cart-thumb">${item.symbol}</div>
          <div style="flex: 1;">
            <h4>${item.name}</h4>
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
  if (!cart.length) {
    checkoutMessage.textContent = "Vui lòng thêm ít nhất một sản phẩm vào giỏ hàng.";
    return;
  }

  checkoutMessage.textContent = "";
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

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;
    categoryButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderProducts();
  });
});

sortSelect.addEventListener("change", renderProducts);

document.addEventListener("click", (event) => {
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
  }
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const orderCode = `SL${Date.now().toString().slice(-6)}`;
  checkoutMessage.textContent = `Đặt hàng thành công! Mã đơn hàng của bạn là ${orderCode}.`;
  checkoutMessage.classList.add("success");
  checkoutForm.querySelector('button[type="submit"]').disabled = true;
  cart.length = 0;
  renderCart();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && checkoutModal.classList.contains("open")) {
    closeCheckout();
  }
});

renderFeaturedBooks();
renderProducts();
renderCart();
