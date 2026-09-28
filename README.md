# Shoplite
cửa hàng 
HELO 

## Chuyển khoản VietQR

Shoplite tạo mã VietQR theo số tiền và mã đơn. Cần cấu hình các biến môi trường cho Cloudflare Worker:

- `BANK_ID`: mã ngân hàng VietQR, ví dụ `VCB` hoặc `MB`.
- `BANK_ACCOUNT`: số tài khoản nhận tiền.
- `BANK_ACCOUNT_NAME`: tên chủ tài khoản, viết không dấu theo định dạng ngân hàng.

Có thể thiết lập bằng Wrangler secrets (`npx wrangler secret put BANK_ID`, rồi nhập giá trị trực tiếp trong terminal; lặp lại cho hai biến còn lại) và triển khai Worker. Các giá trị này được trả về checkout để người mua biết nơi chuyển tiền, nên không dùng chúng làm thông tin bí mật.

Đây là chuyển khoản thủ công: Shoplite chưa nhận webhook hoặc tự đối soát giao dịch và chưa ghi nhận đơn hàng thanh toán vào cơ sở dữ liệu. Không giao hàng chỉ dựa trên việc người mua nhìn thấy mã QR.