# Hệ Thống Quản Lý Cho Thuê Xe (Vehicle Rental Management)

Dự án quản lý cho thuê xe được xây dựng bằng **Node.js** (ES Modules), kết nối **MySQL/MariaDB** qua **Prisma ORM 7**. Mã nguồn hiện gồm các module CRUD, nghiệp vụ cho thuê xe, chương trình demo chạy trên terminal và bộ kiểm thử tự động.

> **Phạm vi hiện tại:** đây là dự án Node.js chạy bằng dòng lệnh; chưa có giao diện web, API HTTP hay phân quyền người dùng.

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

Các chức năng đã triển khai hỗ trợ những phần chính của quy trình cho thuê xe:
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
├── .env                  # Tạo cục bộ; cấu hình kết nối (không đưa lên Git)
├── .env.example          # Tệp mẫu hướng dẫn cấu hình môi trường
├── package.json          # Quản lý thư viện phụ thuộc và script chạy
├── prisma.config.ts      # Cấu hình Prisma 7 (Prisma CLI tự nhận)
├── .gitignore            # Bỏ qua .env, generated/, node_modules/
├── cauLenhSQL.txt        # Toàn bộ câu lệnh SQL thuần (DDL & DML)
├── README.md             # Tài liệu hướng dẫn sử dụng dự án
│
├── prisma/               # Cấu hình cơ sở dữ liệu Prisma
│   ├── schema.prisma     # Định nghĩa các bảng, cột và quan hệ
│   ├── seed.js           # Nạp dữ liệu mẫu vào database test riêng
│   └── migrations/       # Lịch sử cập nhật cấu trúc database
│
├── docs/
│   └── test-cases.md     # Danh sách/mô tả ca kiểm thử
│
├── generated/            # Mã nguồn Prisma Client tự động sinh ra
│
└── src/                  # Mã nguồn chính của ứng dụng
    ├── prismaClient.js   # Khởi tạo kết nối Prisma tới MySQL
    ├── db.js             # Kiểm tra kết nối cơ sở dữ liệu
    ├── chucnang.js       # Toàn bộ logic nghiệp vụ cốt lõi
    ├── demo.js           # Chương trình chạy thử nghiệm các chức năng
    ├── testDatabaseSafety.js # Kiểm tra URL trước khi seed/xóa dữ liệu test
    │
    ├── crud/             # Tầng CRUD Thêm - Đọc - Sửa - Xóa 9 bảng
    │   ├── index.js      # Gom toàn bộ module CRUD
    │   ├── xe.js         # Thao tác bảng xe
    │   ├── khachHang.js  # Thao tác bảng khách hàng
    │   ├── nhanVien.js   # Thao tác bảng nhân viên
    │   ├── loaiXe.js     # Thao tác bảng loại xe
    │   ├── hopDong.js    # Thao tác bảng hợp đồng
    │   ├── thanhToan.js  # Thao tác bảng thanh toán
    │   ├── hoanTien.js   # Thao tác bảng hoàn tiền
    │   ├── baoTri.js     # Thao tác bảng bảo trì
    │   └── tinhTrangTraXe.js # Thao tác bảng tình trạng trả xe
    │
    └── tests/            # Bộ kiểm thử tự động
        ├── chucnang.test.js # 97 test nghiệp vụ & thống kê (Jest Mock)
        ├── crud.test.js     # 23 test tầng CRUD (Jest Mock)
        ├── testDatabaseSafety.test.js # 10 test kiểm tra an toàn database
        └── integration/
            └── chucnang.integration.js # 26 test tích hợp (node:test)
```

Thư mục `generated/` được Prisma tạo ra khi chạy `npx prisma generate`; không cần tự tạo hoặc chỉnh sửa thủ công.

---

## 💻 Yêu Cầu Hệ Thống

Trước khi bắt đầu, cần có:
1. **Node.js 22.18 trở lên** và npm. Prisma Client được sinh có file TypeScript được import trực tiếp. Kiểm tra trong Command Prompt (CMD):
   ```cmd
   node --version
   npm --version
   ```
2. **MySQL 8.0.16+ hoặc MariaDB 10.2.1+** để các ràng buộc `CHECK` có hiệu lực. Có thể dùng MySQL Community Server, XAMPP hoặc Laragon.
3. **Git** (nếu clone dự án) và một trình soạn thảo như Visual Studio Code.

Các lệnh bên dưới dùng CMD trên Windows. Nếu dùng PowerShell và gặp lỗi chặn `npm.ps1`/`npx.ps1`, dùng `npm.cmd`/`npx.cmd` thay vì thay đổi Execution Policy.

---

## ⚙️ Hướng Dẫn Cài Đặt & Cấu Hình

### Bước 1: Cài thư viện
Mở CMD tại thư mục gốc dự án:
```cmd
npm install
```

### Bước 2: Tạo database và cấu hình kết nối
Khởi động dịch vụ MySQL/MariaDB, sau đó tạo database rỗng bằng MySQL Workbench, phpMyAdmin hoặc câu lệnh:
```sql
CREATE DATABASE manager_vehicle_rent
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Tạo file `.env` ở thư mục gốc (có thể sao chép `.env.example`) và cấu hình:
```env
DATABASE_URL="mysql://root:mat_khau_cua_ban@localhost:3306/manager_vehicle_rent"
```
Nếu tài khoản không có mật khẩu, dùng `mysql://root:@localhost:3306/manager_vehicle_rent`. Thay user, mật khẩu, host, port và tên database theo máy của bạn. Nếu mật khẩu chứa ký tự đặc biệt như `@`, `#`, `/` hoặc `:`, hãy URL-encode mật khẩu trước khi đưa vào URL. Không chia sẻ hoặc commit `.env`.

### Bước 3: Tạo cấu trúc database
Chọn **một** trong hai cách sau cho database vừa tạo:

**Cách A — Prisma migrations (khuyến nghị khi phát triển):**
```cmd
npx prisma generate
npx prisma migrate deploy
```
Lệnh migration tạo các bảng theo lịch sử trong `prisma/migrations/`. Cách này không tự thêm dữ liệu mẫu.

**Cách B — Tạo database kèm dữ liệu demo bằng SQL:**
Thực thi toàn bộ file `cauLenhSQL.txt` trong MySQL Workbench hoặc công cụ tương đương. File này tạo database `manager_vehicle_rent`, các bảng và dữ liệu mẫu. Chỉ chạy trên database mới/rỗng. Sau đó cấu hình `DATABASE_URL` trỏ tới database này và chạy:
```cmd
npx prisma generate
```
Không chạy `prisma migrate deploy` lên database vừa tạo bằng file SQL: database đó chưa có lịch sử migration của Prisma. Không chạy cả hai cách trên cùng một database.

### Bước 4: Kiểm tra kết nối và chạy demo
```cmd
node src/db.js
npm run demo
```
Nếu chọn Cách A, database có schema nhưng chưa có dữ liệu; demo vẫn chạy nhưng một số danh sách/kết quả sẽ trống. Nếu muốn xem dữ liệu mẫu, chọn Cách B. Lệnh `npm run seed` **chỉ dành cho database kiểm thử riêng** theo hướng dẫn ở phần kiểm thử tích hợp, không dùng để nạp dữ liệu vào database ứng dụng.

---

## 🚀 Hướng Dẫn Sử Dụng & Chạy Dự Án

### 1. Kiểm tra kết nối cơ sở dữ liệu
Lệnh này kiểm tra Node.js có kết nối tới database trong `.env` hay không:
```cmd
node src/db.js
```
* **Thành công:** Chương trình thông báo kết nối thành công và đọc dữ liệu bảng `bao_tri`.
* **Thất bại:** Kiểm tra MySQL đang chạy, database đã được tạo, và `DATABASE_URL` trong `.env` chính xác.

### 2. Chạy thử nghiệm các chức năng (Demo)
Chạy demo trên terminal:
```cmd
npm run demo
```
Demo hiển thị xe sẵn sàng, tìm khách hàng, chi tiết hợp đồng/thanh toán, thống kê trạng thái xe, doanh thu theo tháng, công nợ và cảnh báo xe có nguy cơ trễ. Đây là chương trình đọc dữ liệu mẫu, không phải giao diện ứng dụng.

### 3. Các lệnh thường dùng
| Mục đích | Lệnh |
|---|---|
| Sinh Prisma Client sau khi cài dependencies hoặc thay đổi schema | `npx prisma generate` |
| Áp dụng migration chưa chạy lên database trong `DATABASE_URL` | `npx prisma migrate deploy` |
| Kiểm tra kết nối database | `node src/db.js` |
| Chạy demo terminal | `npm run demo` |
| Chạy unit test | `npm test` |
| Chạy unit test và tạo báo cáo coverage | `npm run test:coverage` |
| Chạy test tích hợp trên database test riêng | `npm run test:integration` |

---

## 🔄 Quy Trình Nghiệp Vụ Cốt Lõi

Toàn bộ logic nghiệp vụ được viết trong tệp `src/chucnang.js`:

```mermaid
flowchart LR
    A["1. Đặt xe (createContract)"] --> B["2. Xác nhận (confirmContract)"]
    B --> C["3. Giao xe (handOverVehicle)"]
    C --> D["4. Trả xe (returnVehicle)"]
    B -.-> E["Hủy (cancelContract)"]
    C --> F["Thanh toán & Công nợ (addPayment)"]
```

1. **Tìm xe trống (`findAvailableVehicles`)**: Lọc những xe không bị trùng lịch với hợp đồng khác trong khoảng thời gian khách chọn.
2. **Đặt xe (`createContract`)**: Kiểm tra ngày hợp lệ và ngày trả sau ngày thuê, khách hàng/nhân viên tồn tại, xe không bảo trì/ngừng hoạt động và không trùng lịch (khóa dòng xe khi kiểm tra). Nếu không truyền `tienThue` thì tự tính = số ngày (làm tròn lên) × `loai_xe.giaThueNgay`. Hợp đồng khởi tạo ở `CHO_XAC_NHAN`.
   *Quy tắc đặt xe: xe `DANG_THUE` vẫn đặt được cho khoảng thời gian không trùng lịch (đặt trước); chỉ xe bảo trì/ngừng hoạt động bị chặn.*
3. **Xác nhận (`confirmContract`)**: Chuyển hợp đồng từ `CHO_XAC_NHAN` sang `DA_XAC_NHAN`.
4. **Giao xe (`handOverVehicle`)**: Chuyển trạng thái xe và hợp đồng sang `DANG_THUE`; từ chối nếu xe đang bảo trì hoặc đang được khách khác thuê chưa trả.
5. **Trả xe (`returnVehicle`)**: Tính **phí trả trễ** lưu vào `hop_dong.phiTraTre` (trễ quá 60 phút ân hạn: số giờ trễ làm tròn lên × giá thuê ngày/24 × 1,5). Kiểm tra nhiên liệu 0–100 và số km không nhỏ hơn km hiện tại của xe; ghi `tinh_trang_tra_xe` (mỗi hợp đồng chỉ 1 bản ghi), cập nhật xe về `SAN_SANG` và hợp đồng thành `DA_TRA`.
6. **Hủy hợp đồng (`cancelContract`)**: Chỉ cho phép hủy khi xe chưa được bàn giao. Nếu khách đã thanh toán thì tự tạo khoản **hoàn tiền** (bảng `hoan_tien`): hợp đồng chưa xác nhận hoặc hủy trước giờ thuê ≥ 24h hoàn 100%; hủy muộn hơn hoàn 70% (giữ 30% phí hủy). Trả về `{ hopDong, hoanTien }`.
7. **Thanh toán (`addPayment`, `getContractBalance`)**: Công nợ = tiền thuê + phí trả trễ − (đã thanh toán − đã hoàn); hợp đồng đã hủy không còn nợ. Khóa hợp đồng khi tính công nợ; từ chối số tiền `<= 0`, phương thức không hợp lệ, hợp đồng đã hủy, hoặc số tiền vượt quá số còn nợ.
8. **Bảo trì (`startMaintenance`, `completeMaintenance`)**: Chuyển xe sang `DANG_BAO_TRI` (từ chối nếu xe đang thuê/đang bảo trì/ngừng hoạt động hoặc có hợp đồng sắp tới); khi hoàn thành, chỉ trả xe về `SAN_SANG` nếu không còn phiếu bảo trì mở khác.

### Xe trả trễ và hợp đồng kế tiếp

- **Thời gian đệm 4 giờ** (`TURNAROUND_BUFFER_HOURS`): hai hợp đồng liên tiếp của một xe phải cách nhau ≥ 4 giờ (vệ sinh/kiểm tra xe). Áp dụng cho `findAvailableVehicles`, `createContract`, `reassignVehicle`.
- **Cảnh báo sớm — `getAtRiskContracts()`**: liệt kê hợp đồng sắp tới (chờ xác nhận/đã xác nhận) mà xe chưa kịp sẵn sàng vì hợp đồng đang thuê đã/sắp quá hạn (tính cả đệm). Mỗi dòng có `quaHan`, `soGioTre`, `xeSanSangDuKien`.
- **Đổi xe — `reassignVehicle(maHD, maXeMoi, { nangCapMienPhi })`**: chỉ cho hợp đồng chưa giao; xe mới phải sẵn sàng, không trùng lịch (kể cả đệm), số chỗ không ít hơn xe cũ; xe hạng đắt hơn chỉ được đổi khi `nangCapMienPhi = true`. Tiền thuê giữ nguyên.
- **Hủy do lỗi công ty — `cancelContract(maHD, { loiCongTy: true })`**: luôn hoàn 100%, không áp dụng phí hủy muộn.
- Xe quá hạn vẫn bị chặn giao cho khách mới (`handOverVehicle`); nhân viên xử lý theo thứ tự: đổi xe cùng loại → dời lịch (thỏa thuận với khách) → hủy hoàn 100%. Phí trả trễ của khách trước vẫn được thu khi `returnVehicle`.

> Các tỷ lệ/thời hạn phí trả trễ và hoàn tiền nằm ở hằng số đầu `src/chucnang.js` (`LATE_GRACE_MINUTES`, `LATE_FEE_RATE`, `FULL_REFUND_HOURS`, `LATE_CANCEL_REFUND_RATE`, `TURNAROUND_BUFFER_HOURS`), cần xác nhận lại với yêu cầu thực tế.
>
> **Chưa triển khai:** hoàn tiền thủ công ngoài luồng hủy, hoàn khi trả xe sớm, phân quyền, giao diện người dùng và API HTTP.

---

## 🧪 Bộ Kiểm Thử Tự Động (Unit Test)

Dự án có bộ Unit Test viết bằng **Jest**, sử dụng kỹ thuật **Mock Prisma** (kiểm thử hoàn toàn tách biệt, không phụ thuộc và không làm thay đổi dữ liệu trong MySQL thật).

### 1. Unit test (Jest + Mock Prisma, không cần MySQL)
```cmd
npm test
```
*   `src/tests/chucnang.test.js`: **97** ca cho nghiệp vụ và thống kê.
*   `src/tests/crud.test.js`: **23** ca cho tầng CRUD của 9 bảng.
*   `src/tests/testDatabaseSafety.test.js`: **10** ca kiểm tra rào an toàn trước thao tác xóa dữ liệu.
*   Tổng unit test hiện tại: **130** ca.
*   **Bao phủ:** kiểm tra hợp lệ dữ liệu, ràng buộc trạng thái, giao dịch và cập nhật liên bảng, phí trả trễ, hoàn tiền, thời gian đệm, đổi xe, cảnh báo xe trả trễ, các hàm lọc/tìm kiếm của CRUD.
*   Vì chạy trên mock nên **không bắt được** lỗi SQL thật hay tranh chấp dữ liệu thật; việc khóa dòng chỉ được kiểm tra là *có gọi*. Phần đó do test tích hợp bên dưới đảm nhận.

### 2. Test tích hợp trên MySQL thật (`node:test`, 26 ca)
Kiểm tra những thứ mock không làm được: nhiều người đặt cùng một xe / thanh toán cùng lúc, ràng buộc CHECK/UNIQUE/RESTRICT của DB, vòng đời hợp đồng end-to-end, và **tính nhất quán của dữ liệu mẫu** (`prisma/seed.js`).

> ⚠️ File này **xóa sạch dữ liệu 9 bảng** trong database kiểm thử. Bắt buộc dùng database riêng có token `test` trong tên; nếu không, test sẽ dừng ngay.
> Cần đặt `ALLOW_DESTRUCTIVE_TEST_DB=YES`; test cũng từ chối nếu `TEST_DATABASE_URL` trỏ cùng host, port và database với `DATABASE_URL`.

Tạo database test riêng (không dùng database có dữ liệu cần giữ) bằng MySQL Workbench hoặc CMD:
```cmd
mysql -u root -p -e "CREATE DATABASE manager_vehicle_rent_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Mở **CMD thứ nhất** để áp dụng migrations lên database test. URL trong lệnh này chỉ có hiệu lực trong cửa sổ CMD đó:
```cmd
set TEST_DATABASE_URL=mysql://root:<mat_khau>@localhost:3306/manager_vehicle_rent_test
set DATABASE_URL=%TEST_DATABASE_URL%
npx prisma migrate deploy
```

Mở **CMD thứ hai** tại thư mục dự án. Không đặt `DATABASE_URL` thành URL test ở cửa sổ này: integration test phải đối chiếu database test với database ứng dụng trong `.env`.
```cmd
set TEST_DATABASE_URL=mysql://root:<mat_khau>@localhost:3306/manager_vehicle_rent_test
set ALLOW_DESTRUCTIVE_TEST_DB=YES
npm run test:integration
```
Nếu không đặt `TEST_DATABASE_URL`, test tích hợp sẽ tự động bị bỏ qua. Có thể dùng cùng các biến môi trường để chạy `npm run seed` trên database test; thao tác seed xóa dữ liệu hiện có trong 9 bảng trước khi nạp lại dữ liệu mẫu. Không chạy seed/test tích hợp trên database cần giữ dữ liệu.

Danh sách và mô tả test case được lưu trong [`docs/test-cases.md`](docs/test-cases.md).

### 3. Hướng dẫn chạy Integration Test bằng CMD

Integration Test kết nối tới database kiểm thử riêng `manager_vehicle_rent_test`; không dùng database chính `manager_vehicle_rent`. Bộ test xóa dữ liệu trong các bảng của database đích, vì vậy **không chạy trên database chính hoặc database có dữ liệu cần giữ**.

#### Bước 1: Tạo database kiểm thử

Nếu chưa có, mở MySQL Workbench, kết nối tới MySQL và chạy:
```sql
CREATE DATABASE manager_vehicle_rent_test
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

#### Bước 2: Áp dụng migration lần đầu

Mở **CMD thứ nhất** tại thư mục dự án:
```cmd
cd /d <thư mục dự án>
set "TEST_DATABASE_URL=mysql://root:<MAT_KHAU_MYSQL>@localhost:3306/manager_vehicle_rent_test"
set "ALLOW_DESTRUCTIVE_TEST_DB=YES"
set "DATABASE_URL=%TEST_DATABASE_URL%"
npx prisma migrate deploy
```
Thay `<MAT_KHAU_MYSQL>` bằng mật khẩu MySQL thực tế; không ghi mật khẩu thật vào README hoặc chia sẻ công khai. Lệnh migration phải chạy sau khi đã đặt `TEST_DATABASE_URL`. Do cấu hình Prisma CLI đọc `DATABASE_URL`, hai biến cần được đặt như trên để migration áp dụng vào database kiểm thử, không phải database chính. Chỉ cần áp dụng migration khi database test chưa có cấu trúc hoặc cần cập nhật schema.

#### Bước 3: Chạy Integration Test

Mở **CMD thứ hai** tại thư mục dự án. Thiết lập lại hai biến trong cửa sổ này; không đặt `DATABASE_URL` thành URL kiểm thử. Ứng dụng sẽ đọc `DATABASE_URL` chính từ `.env`, còn Integration Test sử dụng `TEST_DATABASE_URL`:
```cmd
cd /d <thư mục dự án>
set "TEST_DATABASE_URL=mysql://root:<MAT_KHAU_MYSQL>@localhost:3306/manager_vehicle_rent_test"
set "ALLOW_DESTRUCTIVE_TEST_DB=YES"
npm run test:integration
```
Thay `<MAT_KHAU_MYSQL>` bằng mật khẩu MySQL thực tế. Các biến môi trường chỉ có hiệu lực trong cửa sổ CMD nơi đã thiết lập chúng.

#### Bước 4: Chạy Unit Test

Unit Test dùng mock Prisma, không cần MySQL và không xóa dữ liệu:
```cmd
npm test
```

#### Kết quả kiểm thử

- **Unit Test:** 130/130 PASS theo bộ test hiện tại (97 test nghiệp vụ, 23 test CRUD và 10 test an toàn database).
- **Integration Test:** 26/26 PASS theo kết quả được cung cấp cho dự án. Có thể chạy lại theo các bước trên để xác nhận trên database kiểm thử.

> Nếu gặp thông báo `Chưa đặt TEST_DATABASE_URL, bỏ qua test tích hợp`, hãy thiết lập lại cả `TEST_DATABASE_URL` và `ALLOW_DESTRUCTIVE_TEST_DB=YES` trong **chính cửa sổ CMD hiện tại**, sau đó chạy lại lệnh test. Không chạy Integration Test trên `manager_vehicle_rent` hoặc database chính khác.

---

## ❓ Xử Lý Một Số Lỗi Thường Gặp

### 1. PowerShell báo `PSSecurityException` khi chạy `npm` hoặc `npx`
Windows có thể chặn các script `.ps1`. Không cần thay đổi Execution Policy; dùng CMD hoặc gọi trực tiếp:
```powershell
npm.cmd test
npx.cmd prisma generate
```

### 2. Lỗi kết nối CSDL `Access denied for user...` hoặc `ECONNREFUSED`
*   Đảm bảo dịch vụ MySQL đang được bật.
*   Kiểm tra kỹ lại mật khẩu trong file `.env`. Nếu bạn dùng XAMPP mặc định không có mật khẩu, hãy để:
    ```env
    DATABASE_URL="mysql://root:@localhost:3306/manager_vehicle_rent"
    ```

### 3. Lỗi không tìm thấy Prisma Client (`Cannot find module .../client.ts`) hoặc lỗi import `.ts`
*   Kiểm tra `node -v` ≥ 22.18.
*   Chạy lại lệnh sinh mã của Prisma:
    ```cmd
    npx prisma generate
    ```

### 4. Lỗi database chưa có bảng hoặc migration thất bại
* Kiểm tra `DATABASE_URL` đang trỏ đúng database.
* Với database tạo theo Prisma, chạy `npx prisma migrate deploy`.
* Với database đã khởi tạo từ `cauLenhSQL.txt`, không chạy migration Prisma lên database đó; hãy tạo database mới nếu muốn chuyển sang luồng migration.

---

*Chúc bạn học tập và phát triển dự án thành công!*

