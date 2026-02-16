# GC Admin - Onboarding & Vận hành chuẩn

Tài liệu này dành cho nhân sự mới (seller/admin) để có thể làm việc ngay trong ngày đầu, giảm thời gian training và hạn chế sai sót vận hành.

## 1. Mục tiêu tài liệu

- Nắm nhanh luồng vận hành bán giò chả theo kg.
- Hiểu rõ quyền hạn giữa `ADMIN` và `SELLER`.
- Thao tác đúng trên các trang chính: Products, Price Profiles, New Order, Orders, Customers.
- Biết xử lý các tình huống thường gặp mà không cần hỏi lại nhiều lần.

## 2. Bản đồ hệ thống trong 60 giây

- `Dashboard` (`/dashboard`): xem tổng quan doanh thu, đơn hàng, trạng thái, hiệu suất seller.
- `Products` (`/products`): quản lý danh mục sản phẩm (tên, mô tả, trạng thái).
- `Price Profiles` (`/price-profiles`): quản lý bảng giá theo phiên bản.
- `New Order` (`/orders/new`): tạo đơn theo giỏ hàng kg.
- `Orders` (`/orders`): theo dõi toàn bộ đơn, duyệt đơn, cập nhật trạng thái.
- `Customers` (`/customers`): quản lý người mua và tài khoản seller.
- `Account` (`/account`): đổi mật khẩu.

## 3. Khái niệm bắt buộc phải hiểu

### 3.1 Product

- Sản phẩm bán theo `kg`.
- Sản phẩm không chứa giá cố định trong bản ghi sản phẩm.

### 3.2 Price profile

**COST (giá vốn)**

- Chỉ `ADMIN` tạo/bật/tắt.
- Tại mọi thời điểm chỉ có **1 profile COST active duy nhất**.
- Dùng để tính chi phí, lãi/lỗ nội bộ.

**SALE (giá bán)**

- `ADMIN` tạo profile hệ thống (gợi ý cho toàn đội).
- `SELLER` có thể tạo profile bán riêng.
- Seller chỉ thấy profile hệ thống + profile của chính seller đó.

### 3.3 Snapshot giá theo đơn

- Khi tạo đơn, hệ thống lưu snapshot giá theo profile tại thời điểm đó.
- Thay đổi profile sau này không làm sai lịch sử đơn cũ.

### 3.4 Trạng thái đơn hàng

- Luồng đơn hàng: `PENDING_APPROVAL -> CONFIRMED -> PICKED -> DELIVERING -> DELIVERED` hoặc `CANCELED`.
- Trạng thái vòng vốn NCC: `UNPAID_SUPPLIER`, `SUPPLIER_PAID`, `CAPITAL_CYCLE_COMPLETED`.
- Trạng thái thu tiền: `UNPAID`, `PARTIALLY_PAID`, `PAID_IN_FULL`, `REFUNDED`.

### 3.5 Quy tắc duyệt đơn

- Mọi đơn do `SELLER` tạo đều vào `PENDING_APPROVAL`.
- `ADMIN` phải duyệt thì đơn mới chuyển `CONFIRMED`.
- Nếu seller xin discount, admin có 3 lựa chọn:
- Duyệt giảm giá.
- Xác nhận đơn không áp giảm.
- Từ chối đơn.

## 4. Ma trận quyền hạn (rút gọn)

| Chức năng | Admin | Seller |
| --- | --- | --- |
| Quản lý Products | Có | Có |
| Tạo/Cập nhật COST profile | Có | Không |
| Xem giá vốn | Có | Không |
| Tạo SALE profile hệ thống | Có | Không |
| Tạo SALE profile của mình | Có (nếu cần) | Có |
| Tạo đơn hàng | Có | Có |
| Duyệt đơn chờ | Có | Không |
| Duyệt discount | Có | Không |
| Quản lý seller account | Có | Không |
| Reset password seller | Có | Không |

## 5. Quy trình setup ngày đầu cho Admin

Nếu hệ thống mới hoàn toàn, có thể dùng tài khoản mặc định: `admin@gc.vn / Admin@123`.

1. Đăng nhập admin.
2. Đổi mật khẩu ngay tại `/account`.
3. Kiểm tra dữ liệu nền.
- Nếu trống dữ liệu, vào `Dashboard` chạy `Seed initial data`.
4. Kiểm tra danh mục sản phẩm tại `/products`.
5. Tạo và active 1 profile `COST` chuẩn tại `/price-profiles`.
6. Tạo các profile `SALE` hệ thống (ví dụ: "Giá bán chuẩn", "Giá cuối tuần").
7. Tạo seller accounts tại `/customers` tab Sellers.
8. Tạo khách hàng mẫu tại `/customers` tab Customers.
9. Kiểm tra nhanh quy trình bằng 1 đơn test tại `/orders/new`.

## 6. Kịch bản training seller trong 15-20 phút

1. Đăng nhập và đổi ngôn ngữ (VI/EN) nếu cần.
2. Giới thiệu 3 màn hình seller dùng nhiều nhất: `/orders/new`, `/orders`, `/customers`.
3. Tạo đơn mẫu.
- Chọn customer.
- Chọn ngày giao.
- Chọn sale profile.
- Nhập khối lượng theo từng sản phẩm.
- Submit đơn.
4. Giải thích trạng thái sau submit.
- Đơn seller tạo luôn chờ admin duyệt trước.
5. Mô phỏng xin discount.
- Chỉ xin discount khi dùng profile hệ thống.
- Nhập % giảm và lý do rõ ràng.
6. Cách theo dõi đơn.
- Dùng filter trong `/orders` theo trạng thái và ngày giao.
7. Nhắc quy định bắt buộc.
- Không tự báo giá ngoài profile khi chưa được duyệt.
- Không chia sẻ thông tin giá vốn.

## 7. SOP hằng ngày cho Seller

### 7.1 Đầu ca (2-3 phút)

1. Mở `/orders`.
2. Lọc nhanh đơn hôm nay.
3. Kiểm tra đơn nào đang `PENDING_APPROVAL`.
4. Kiểm tra profile bán đang dùng ở `/price-profiles`.

### 7.2 Khi lên đơn mới

1. Vào `/orders/new`.
2. Chọn đúng customer.
3. Chọn profile bán phù hợp.
- `System profile` (gợi ý hệ thống).
- `My profile` (profile seller tự tạo).
4. Nhập giỏ hàng theo kg.
5. Kiểm tra bảng tạm tính trước submit.
6. Nếu cần bán thấp hơn giá hệ thống.
- Dùng discount request (có lý do rõ ràng).
7. Submit và theo dõi trạng thái duyệt.

### 7.3 Cuối ca

1. Vào `/orders`.
2. Lọc theo ngày giao hôm nay.
3. Đối chiếu đơn đã giao, đơn chưa giao, đơn còn chờ thu tiền.
4. Báo admin nếu có đơn cần duyệt gấp hoặc đơn bất thường.

## 8. SOP hằng ngày cho Admin

1. Mở `Dashboard` để xem.
- Tổng doanh thu/lãi.
- Seller performance overview.
2. Vào `/orders`, lọc `PENDING_APPROVAL`.
3. Với đơn xin discount, so sánh.
- Giá gốc.
- Giá xin giảm.
- Biên lợi nhuận dự kiến.
4. Quyết định.
- Approve discount.
- Approve without discount.
- Reject order.
5. Cập nhật trạng thái vận hành sau khi đơn chạy.
- fulfillment
- supplier payment
- collection
6. Cuối ngày kiểm tra.
- đơn chưa thu tiền
- đơn chưa thanh toán NCC
- seller hiệu suất bất thường

## 9. Quy tắc thay đổi giá (rất quan trọng)

- Không sửa lịch sử đơn cũ. Đơn cũ đã snapshot.
- Khi thay đổi giá:
- Clone profile cũ.
- Đổi giá cần thay (1 hoặc nhiều món).
- Lưu profile mới.
- Bật active profile mới.
- Với `COST`: active profile mới sẽ tắt profile cost cũ.
- Với `SALE`: có thể có nhiều profile active, nhưng phải có quy ước đặt tên rõ ràng.

### 9.1 Quy ước đặt tên profile đề xuất

- `SALE - Default - 2026-02`
- `SALE - Weekend Promo - 2026-02`
- `SALE - Seller Minh - VIP - 2026-02`
- `COST - Wholesale Batch A - 2026-02-15`

## 10. Tình huống thường gặp và cách xử lý

### 10.1 Seller không đăng nhập được

- Admin kiểm tra seller có bị disable không tại `/customers` tab Sellers.
- Nếu quên mật khẩu, admin reset password cho seller.

### 10.2 Không thấy profile trong màn hình lên đơn

- Kiểm tra profile có đang active không.
- Seller chỉ thấy profile hệ thống + profile của chính seller.

### 10.3 Không xin được discount

- Discount chỉ hợp lệ khi seller đang dùng profile SALE hệ thống.
- Bắt buộc nhập lý do discount.

### 10.4 Đơn bị kẹt ở Pending approval

- Chưa được admin duyệt.
- Admin cần vào `/orders` để review và approve/reject.

## 11. Checklist đánh giá seller mới (sau buổi training)

Seller được xem là đạt khi tự làm được:

1. Đăng nhập và đổi mật khẩu.
2. Tạo customer mới hoặc chọn customer sẵn có.
3. Lên 1 đơn đầy đủ (nhiều sản phẩm, đúng kg).
4. Chọn đúng sale profile theo yêu cầu.
5. Tạo đúng 1 discount request có lý do.
6. Theo dõi trạng thái đơn trên trang Orders.
7. Giải thích được vì sao đơn phải chờ admin duyệt.

## 12. Checklist kiểm soát vận hành cho quản lý

1. Mỗi đầu ngày phải có đúng 1 cost profile active.
2. Tất cả seller account mới phải:
- Được enable đúng role.
- Đã đổi password sau lần đăng nhập đầu.
3. Tỷ lệ đơn pending approval cuối ngày không vượt ngưỡng nội bộ.
4. Không để đơn `UNPAID` tồn đọng quá lâu (theo SLA nội bộ).
5. Mọi discount đều có lý do và dấu vết review của admin.

## 13. Gợi ý quy trình đào tạo nhân sự mới

### Buổi 1 (30-45 phút)

1. Giới thiệu hệ thống và quy tắc giá.
2. Thực hành tạo 2 đơn mẫu.
3. Thực hành 1 case discount.

### Buổi 2 (20-30 phút, sau 1-2 ngày)

1. Review lỗi thực tế seller gặp.
2. Chuẩn hóa cách đặt profile và ghi chú đơn.
3. Đánh giá theo checklist mục 11.

## 14. Cài app trên điện thoại (PWA)

- Khi mở bằng điện thoại, hệ thống sẽ hiện popup cài app.
- Android:
- Bấm `Install`.
- Nếu không thấy nút, mở menu trình duyệt và chọn `Add to Home screen`.
- iOS (Safari):
- Bấm nút `Share`.
- Chọn `Add to Home Screen`.
- Mở app từ icon ngoài màn hình chính.

---

Nếu cần mở rộng quy trình (đa kho, đa khu vực, đa cấp duyệt), nên cập nhật tài liệu này theo version, ví dụ: `Onboarding v1.1`, `v1.2`.
