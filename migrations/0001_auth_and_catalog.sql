CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    category TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

ALTER TABLE products ADD COLUMN author TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

INSERT INTO products (name, author, description, price, category, stock, featured)
SELECT 'Đừng Ngại Sống', 'Nguyễn Nhật Ánh', 'Câu chuyện truyền cảm hứng về sự dũng cảm và chủ động trong cuộc sống.', 189000, 'van-hoc', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Đừng Ngại Sống');
INSERT INTO products (name, author, description, price, category, stock, featured)
SELECT 'Siêu Trí Nhớ', 'David', 'Phương pháp cải thiện trí nhớ và khả năng tập trung hiệu quả.', 160000, 'giao-duc', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Siêu Trí Nhớ');
INSERT INTO products (name, author, description, price, category, stock, featured)
SELECT 'Bí Mật Tư Duy Tích Cực', 'Maya', 'Khám phá cách thay đổi thói quen, suy nghĩ và hành vi mỗi ngày.', 220000, 'ky-nang', 20, 0
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Bí Mật Tư Duy Tích Cực');
INSERT INTO products (name, author, description, price, category, stock, featured)
SELECT 'Làm Giàu Từ Tài Sản', 'Bennett', 'Hướng dẫn xây dựng nền tảng tài chính bền vững và thông minh.', 260000, 'kinh-doanh', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Làm Giàu Từ Tài Sản');
INSERT INTO products (name, author, description, price, category, stock, featured)
SELECT 'Những Cánh Buồm', 'Hemingway', 'Tác phẩm nổi tiếng về lòng can đảm và ước mơ vượt qua bão giông.', 145000, 'van-hoc', 20, 0
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Những Cánh Buồm');
INSERT INTO products (name, author, description, price, category, stock, featured)
SELECT 'Khởi Nghiệp Cho Học Sinh', 'Linh Phạm', 'Bộ sách khuyến khích tinh thần sáng tạo và làm chủ cuộc đời.', 175000, 'giao-duc', 20, 0
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Khởi Nghiệp Cho Học Sinh');
INSERT INTO products (name, author, description, price, category, stock, featured)
SELECT 'Vùng Đất Của Những Chiếc Cầu', 'Minh Lan', 'Truyện thiếu nhi tuyệt đẹp với nhân vật đáng yêu và tình bạn ý nghĩa.', 99000, 'thieu-nhi', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Vùng Đất Của Những Chiếc Cầu');
INSERT INTO products (name, author, description, price, category, stock, featured)
SELECT '7 Thói Quen Hiệu Quả', 'Stephen R. Covey', 'Một cuốn sách giúp bạn thấu hiểu cách sống hiệu quả và bền vững.', 215000, 'ky-nang', 20, 0
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = '7 Thói Quen Hiệu Quả');