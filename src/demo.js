// demo.js - Chạy thử CRUD (thư mục crud/) và nghiệp vụ (chucnang.js)
// Chạy bằng: node demo.js
//
// Phần 1: Đọc dữ liệu từ CRUD
// Phần 2: Nghiệp vụ và thống kê
// Phần 3: Ví dụ thao tác GHI (đang để trong chú thích, bỏ chú thích khi cần)
import { prisma } from "./prismaClient.js";
import { xe, khachHang, hopDong, thanhToan } from "./crud/index.js";
import * as cn from "./chucnang.js";

// In tiêu đề cho từng mục
function section(title) {
  console.log(`\n== ${title} ==`);
}

// =====================================================
// PHẦN 1: ĐỌC DỮ LIỆU TỪ CRUD
// =====================================================

async function demoCrud() {
  section("Xe sẵn sàng");
  const readyVehicles = await xe.getByStatus("SAN_SANG");
  console.table(
    readyVehicles.map((vehicle) => ({
      maXe: vehicle.maXe,
      bienSo: vehicle.bienSoXe,
      loai: vehicle.loai_xe?.tenLoaiXe,
      hang: vehicle.loai_xe?.hangXe,
    }))
  );

  section("Tìm khách hàng theo tên 'Nguyen'");
  console.table(await khachHang.searchByName("Nguyen"));

  section("Thanh toán của hợp đồng số 1");
  console.log(JSON.stringify(await thanhToan.getByContract(1), null, 2));

  section("Chi tiết hợp đồng số 1");
  console.log(JSON.stringify(await hopDong.getDetail(1), null, 2));
}

// =====================================================
// PHẦN 2: NGHIỆP VỤ VÀ THỐNG KÊ
// =====================================================

async function demoBusiness() {
  section("Thống kê xe theo trạng thái");
  console.table(await cn.countVehiclesByStatus());

  section("Doanh thu theo tháng năm 2026");
  console.table(await cn.getMonthlyRevenue(2026));

  section("Công nợ hợp đồng số 6");
  console.log(await cn.getContractBalance(6));
}

// =====================================================
// PHẦN 3: THAO TÁC GHI (bỏ chú thích khi cần chạy)
// =====================================================

// async function demoWrite() {
//   section("Thêm khách hàng");
//   const customer = await khachHang.create({ hoTen: "Nguyen Van A", CCCD: "201234567899" });
//
//   section("Đặt xe, xác nhận, giao xe, trả xe");
//   const contract = await cn.createContract({
//     maKH: customer.maKH,
//     maXe: 1,
//     maNV: 1,
//     ngayThue: "2026-11-01",
//     ngayTra: "2026-11-05",
//     tienThue: 2000000,
//   });
//   await cn.confirmContract(contract.maHD);
//   await cn.handOverVehicle(contract.maHD);
//   await cn.addPayment(contract.maHD, 2000000, "TIEN_MAT");
//   await cn.returnVehicle(contract.maHD, { tinhTrangXe: "Tốt", soKmThucTe: 12000 });
// }

// =====================================================
// CHẠY
// =====================================================

async function main() {
  await demoCrud();
  await demoBusiness();
  // await demoWrite();
}

main()
  .catch((e) => {
    console.error("Lỗi:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());