# Hệ Thống Quản Lý Cho Thuê Xe (Vehicle Rental Management)

Dự án quản lý cho thuê xe được xây dựng bằng **Node.js** (chuẩn ES Modules), kết nối cơ sở dữ liệu **MySQL** thông qua **Prisma ORM 7**, cùng bộ kiểm thử tự động toàn diện bằng **Jest**.

---

## 📌 Mục Lục
1. [Giới Thiệu](#-giới-thiệu)
2. [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
3. [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
4. [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
5. [Hướng Dẫn Cài Đặt & Cấu Hình](#-hướng-dẫn-cài-đặt--cấu-hình)
6. [Hướng Dẫn Sử Dụng & Chạy Dự Án](#-hướng-dẫn-sử-dụng--chạy-dự-án)
7. [Quy Trình Nghiệp Vụ Cốt Lõi](#-quy-trình-nghiệp-vụ-cốt-lõi)
8. [Bộ Kiểm Thử Tự Động (Unit Test)](#-bộ-kiểm-thử-tự-động-unit-test)
9. [Xử Lý Một Số Lỗi Thường Gặp](#-xử-lý-một-số-lỗi-thường-gặp)

---

## 📖 Giới Thiệu

Hệ thống cung cấp giải pháp quản lý toàn diện quy trình cho thuê xe:
- Quản lý thông tin xe, tình trạng sẵn sàng, bảo dưỡng.
- Quản lý hồ sơ khách hàng và nhân viên.
- Quản lý vòng đời hợp đồng thuê xe: từ lúc đặt lịch, xác nhận, bàn giao xe cho đến khi trả xe.
- Quản lý thanh toán, theo dõi công nợ hợp đồng.
- Báo cáo và thống kê: Doanh thu theo tháng, thống kê trạng thái xe, chi phí bảo trì.

---

## 🛠 Công Nghệ Sử Dụng

- **Ngôn ngữ & Nền tảng:** Node.js (hỗ trợ chuẩn `import / export` - ES Modules).
- **Cơ sở dữ liệu:** MySQL / MariaDB (Port mặc định: `3306`).
- **ORM (Object Relational Mapping):** Prisma ORM 7 (`@prisma/client`, `@prisma/adapter-mariadb`).
- **Kiểm thử tự động (Unit Test):** Jest (sử dụng kỹ thuật Mock, kiểm thử độc lập không cần MySQL thật).
- **Thư viện hỗ trợ:** `dotenv` (quản lý biến môi trường).

---

## 📂 Cấu Trúc Thư Mục

```text
cong_nghe_phan_mem/
├── .env                  # Tệp cấu hình chuỗi kết nối MySQL bí mật
├── .env.example          # Tệp mẫu hướng dẫn cấu hình môi trường
├── package.json          # Quản lý thư viện phụ thuộc và script chạy
├── prisma7.config.ts     # Cấu hình riêng cho Prisma 7
├── cauLenhSQL.txt        # Toàn bộ câu lệnh SQL thuần (DDL & DML)
├── README.md             # Tài liệu hướng dẫn sử dụng dự án
│
├── prisma/               # Cấu hình cơ sở dữ liệu Prisma
│   ├── schema.prisma     # Định nghĩa các bảng, cột và quan hệ
│   ├── seed.js           # Kịch bản nạp dữ liệu mẫu ban đầu
│   └── migrations/       # Lịch sử cập nhật cấu trúc database
│
├── generated/            # Mã nguồn Prisma Client tự động sinh ra
│
└── src/                  # Mã nguồn chính của ứng dụng
    ├── prismaClient.js   # Khởi tạo kết nối Prisma tới MySQL
    ├── db.js             # Kiểm tra kết nối cơ sở dữ liệu
    ├── chucnang.js       # Toàn bộ logic nghiệp vụ cốt lõi
    ├── demo.js           # Chương trình chạy thử nghiệm các chức năng
    │
    ├── crud/             # Tầng CRUD Thêm - Đọc - Sửa - Xóa 8 bảng
    │   ├── index.js      # Gom toàn bộ module CRUD
    │   ├── xe.js         # Thao tác bảng xe
    │   ├── khachHang.js  # Thao tác bảng khách hàng
    │   ├── nhanVien.js   # Thao tác bảng nhân viên
    │   ├── loaiXe.js     # Thao tác bảng loại xe
    │   ├── hopDong.js    # Thao tác bảng hợp đồng
    │   ├── thanhToan.js  # Thao tác bảng thanh toán
    │   ├── baoTri.js     # Thao tác bảng bảo trì
    │   └── tinhTrangTraXe.js # Thao tác bảng tình trạng trả xe
    │
    └── tests/            # Bộ kiểm thử tự động
        ├── chucnang.test.js # 27 ca test nghiệp vụ với Jest Mock
        └── vehicle.test.js  # Test logic tính toán cơ bản
```

---

## 💻 Yêu Cầu Hệ Thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
1. **Node.js**: Phiên bản 18.x trở lên (Kiểm tra bằng lệnh: `node -v`).
2. **Hệ quản trị CSDL MySQL**: Cài đặt thông qua XAMPP, Laragon hoặc MySQL Community Server.
3. **Trình soạn thảo mã nguồn**: Visual Studio Code, Cursor, Windsurf,...

---

## ⚙️ Hướng Dẫn Cài Đặt & Cấu Hình

### Bước 1: Cài đặt các thư viện phụ thuộc
Mở terminal tại thư mục gốc của dự án và chạy:
```bash
npm install
```

### Bước 2: Tạo cơ sở dữ liệu trong MySQL
Khởi động MySQL (ví dụ: nhấn **Start** MySQL trong bảng điều khiển XAMPP).
Mở phần mềm quản lý (như phpMyAdmin, MySQL Workbench, DBeaver) và chạy lệnh tạo database:
```sql
CREATE DATABASE IF NOT EXISTS manager_vehicle_rent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
*(Nếu muốn tạo bảng và dữ liệu mẫu bằng SQL thuần, bạn có thể copy nội dung trong tệp `cauLenhSQL.txt` để thực thi).*

### Bước 3: Cấu hình tệp `.env`
Tạo hoặc mở tệp `.env` tại thư mục gốc và điền chuỗi kết nối MySQL của bạn theo mẫu:
```env
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<ten_database>"
```
**Ví dụ thực tế:**
```env
DATABASE_URL="mysql://root:camtien08@localhost:3306/manager_vehicle_rent"
```
*   `root`: Tên tài khoản MySQL.
*   `camtien08`: Mật khẩu tài khoản MySQL (đổi thành mật khẩu máy của bạn, nếu không có mật khẩu thì để trống: `root:@localhost...`).
*   `3306`: Cổng kết nối MySQL.
*   `manager_vehicle_rent`: Tên database vừa tạo ở Bước 2.

### Bước 4: Đồng bộ Prisma và nạp dữ liệu mẫu
1. Sinh mã nguồn Prisma Client:
```bash
npx prisma generate
```
2. Nạp dữ liệu mẫu (xe, nhân viên, khách hàng, hợp đồng mẫu) vào MySQL:
```bash
node prisma/seed.js
```
*(Lưu ý: Tệp seed sẽ xóa dữ liệu cũ trong 8 bảng và tạo lại dữ liệu mẫu sạch để thử nghiệm).*

---

## 🚀 Hướng Dẫn Sử Dụng & Chạy Dự Án

### 1. Kiểm tra kết nối cơ sở dữ liệu
Chạy tệp `src/db.js` để kiểm tra Node.js đã kết nối được tới MySQL chưa:
```bash
node src/db.js
```
*   **Thành công:** Màn hình sẽ thông báo `Kết nối MySQL thành công!` và in ra danh sách dữ liệu bảng `bao_tri`.
*   **Thất bại:** Kiểm tra lại tài khoản, mật khẩu hoặc cổng port trong file `.env`.

### 2. Chạy thử nghiệm các chức năng (Demo)
Chạy tệp `src/demo.js` để xem chương trình mô phỏng các hoạt động thực tế:
```bash
node src/demo.js
```
Chương trình sẽ tự động truy vấn và in ra các bảng kết quả:
*   Danh sách các xe đang ở trạng thái sẵn sàng cho thuê (`SAN_SANG`).
*   Tìm kiếm khách hàng theo tên.
*   Xem chi tiết hợp đồng và các lần thanh toán.
*   Thống kê số lượng xe theo trạng thái.
*   Báo cáo doanh thu theo 12 tháng trong năm.
*   Kiểm tra số dư/công nợ của hợp đồng.

---

## 🔄 Quy Trình Nghiệp Vụ Cốt Lõi

Toàn bộ logic nghiệp vụ được viết trong tệp [src/chucnang.js](file:///e:/cong_nghe_phan_mem/src/chucnang.js):

```mermaid
flowchart LR
    A["1. Đặt xe (createContract)"] --> B["2. Xác nhận (confirmContract)"]
    B --> C["3. Giao xe (handOverVehicle)"]
    C --> D["4. Trả xe (returnVehicle)"]
    B -.-> E["Hủy (cancelContract)"]
    C --> F["Thanh toán & Công nợ (addPayment)"]
```

1. **Tìm xe trống (`findAvailableVehicles`)**: Lọc những xe không bị trùng lịch với hợp đồng khác trong khoảng thời gian khách chọn.
2. **Đặt xe (`createContract`)**: Kiểm tra ngày trả phải sau ngày thuê, xe không ở trạng thái bảo trì/ngừng hoạt động, khởi tạo hợp đồng ở trạng thái `CHO_XAC_NHAN`.
3. **Xác nhận (`confirmContract`)**: Chuyển hợp đồng từ `CHO_XAC_NHAN` sang `DA_XAC_NHAN`.
4. **Giao xe (`handOverVehicle`)**: Chuyển trạng thái xe và hợp đồng sang `DANG_THUE`.
5. **Trả xe (`returnVehicle`)**: Ghi nhận số km thực tế và tình trạng xe vào bảng `tinh_trang_tra_xe`, cập nhật xe về `SAN_SANG` và hợp đồng chuyển thành `DA_TRA`.
6. **Hủy hợp đồng (`cancelContract`)**: Chỉ cho phép hủy khi xe chưa được bàn giao.
7. **Thanh toán (`addPayment`, `getContractBalance`)**: Kiểm tra công nợ còn lại, từ chối số tiền trả `<= 0` hoặc số tiền vượt quá số còn nợ.
8. **Bảo trì (`startMaintenance`, `completeMaintenance`)**: Chuyển xe sang `DANG_BAO_TRI` và cập nhật lại `SAN_SANG` khi hoàn thành bảo trì.

---

## 🧪 Bộ Kiểm Thử Tự Động (Unit Test)

Dự án trang bị bộ Unit Test chuẩn chỉ với **Jest**, sử dụng kỹ thuật **Mock Prisma** (kiểm thử hoàn toàn tách biệt, không phụ thuộc và không làm thay đổi dữ liệu trong MySQL thật).

### Chạy kiểm thử:
```bash
npm test
```

### Kết quả kiểm thử:
*   **Tổng số ca kiểm thử:** `29` test (27 test nghiệp vụ + 2 test tính toán).
*   **Trạng thái:** `29/29 PASS` (Tỷ lệ đạt 100%).
*   **Bao phủ:**
    *   Kiểm tra tính hợp lệ dữ liệu (Validate ngày tháng, số tiền thanh toán âm hoặc bằng 0).
    *   Kiểm tra ràng buộc trạng thái (Không giao xe khi chưa xác nhận, không hủy khi đã giao).
    *   Kiểm tra logic giao dịch (Transaction) và cập nhật trạng thái liên bảng.

---

## ❓ Xử Lý Một Số Lỗi Thường Gặp

### 1. Lỗi PowerShell `PSSecurityException` khi chạy `npm`
*   **Hiện tượng:** `File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled...`
*   **Nguyên nhân:** Windows chặn thực thi script trong PowerShell.
*   **Cách xử lý 1:** Chạy lệnh thông qua CMD:
    ```bash
    cmd /c npm test
    ```
*   **Cách xử lý 2 (Khuyến nghị):** Mở PowerShell với quyền Administrator và chạy lệnh mở khóa:
    ```powershell
    Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
    ```

### 2. Lỗi kết nối CSDL `Access denied for user...` hoặc `ECONNREFUSED`
*   Đảm bảo dịch vụ MySQL đang được bật.
*   Kiểm tra kỹ lại mật khẩu trong file `.env`. Nếu bạn dùng XAMPP mặc định không có mật khẩu, hãy để:
    ```env
    DATABASE_URL="mysql://root:@localhost:3306/manager_vehicle_rent"
    ```

### 3. Lỗi không tìm thấy Prisma Client (`Cannot find module .../client.ts`)
*   Chạy lại lệnh sinh mã của Prisma:
    ```bash
    npx prisma generate
    ```

---

*Chúc bạn học tập và phát triển dự án thành công!*

