# Shoplite

Shoplite chạy giao diện tĩnh trên Cloudflare Workers Static Assets, API trên Hono Worker và dữ liệu trên Cloudflare D1.

## Chạy local

```powershell
npm install
npm run db:migrate:local
```

Tạo file `.dev.vars` ở thư mục gốc với token khởi tạo riêng:

```text
ADMIN_SETUP_TOKEN=thay-bang-chuoi-ngau-nhien-dai
```

Sau đó chạy `npm run dev`. Mở URL Wrangler in ra, đăng ký tài khoản khách hàng ở nút **Đăng nhập**, rồi tạo admin một lần bằng API:

```powershell
$token = "token-trong-file-dev-vars"
$body = @{ name = "Shop Admin"; email = "admin@example.com"; password = "mat-khau-it-nhat-12-ky-tu" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:8787/api/auth/bootstrap-admin" -Headers @{ "X-Admin-Setup-Token" = $token } -ContentType "application/json" -Body $body
```

Không dùng mật khẩu mẫu ở trên. Endpoint bootstrap chỉ tạo được admin đầu tiên; sau đó đăng nhập bằng email admin để mở khu quản trị sách và đơn hàng. Đăng ký công khai luôn tạo tài khoản khách hàng, không thể tự cấp quyền admin.

## Triển khai Cloudflare

1. Tạo D1 database tên `shoplite-db`, rồi cập nhật `database_id` trong `wrangler.jsonc` nếu dùng database khác.
2. Chạy `npm run db:migrate:remote` để tạo bảng và dữ liệu sách mẫu.
3. Chạy `npx wrangler secret put ADMIN_SETUP_TOKEN` và nhập token khởi tạo; thêm `BANK_ID`, `BANK_ACCOUNT`, `BANK_ACCOUNT_NAME` nếu bật thanh toán QR.
4. Chạy `npm run deploy`, sau đó gọi `POST /api/auth/bootstrap-admin` với header `X-Admin-Setup-Token` để tạo admin đầu tiên.
5. Xóa secret bootstrap sau khi tạo admin: `npx wrangler secret delete ADMIN_SETUP_TOKEN`.

## Tài khoản và đơn hàng

Khách cần đăng nhập bằng tài khoản khách hàng để đặt hàng. Giá, phí giao hàng, tồn kho và chủ sở hữu đơn được xác thực ở Worker; khách chỉ xem được đơn của mình. COD được lưu thành đơn chờ xử lý với trạng thái thanh toán khi nhận; đơn QR được lưu ở trạng thái chờ chuyển khoản cùng tổng tiền và mã giao dịch. Admin được tạo sản phẩm, sửa thông tin/tồn kho, xem đơn, cập nhật trạng thái giao hàng và xác nhận thanh toán sau khi đối soát. Mật khẩu được băm PBKDF2; phiên đăng nhập lưu hash token trong D1 và dùng cookie HttpOnly.

Thanh toán QR là chuyển khoản thủ công. Đơn được lưu ở trạng thái chờ xác nhận; Shoplite chưa tích hợp webhook ngân hàng hoặc tự đối soát giao dịch, nên cửa hàng cần xác minh giao dịch trước khi giao hàng.