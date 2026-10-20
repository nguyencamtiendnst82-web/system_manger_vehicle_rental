// demo.js - Chạy thử CRUD (thư mục crud/) và nghiệp vụ (chucnang.js).
// Chạy bằng: node demo.js
// Mặc định chỉ ĐỌC dữ liệu. Các thao tác ghi để trong phần chú thích bên dưới.

import { prisma } from "./prismaClient.js";
import { xe, khachHang, hopDong, thanhToan } from "./crud/index.js";
import * as cn from "./chucnang.js";

async function main() {
  console.log("== Xe sẵn sàng ==");
  console.table(
    (await xe.danhSach("SAN_SANG")).map((x) => ({
      maXe: x.maXe,
      bienSo: x.bienSoXe,
      loai: x.loai_xe?.tenLoaiXe,
      hang: x.loai_xe?.hangXe,
    }))
  );

  console.log("== Tìm khách hàng theo tên 'Nguyen' ==");
  console.table(await khachHang.timTheoTen("Nguyen"));

  console.log("== Thanh toán của hợp đồng số 1 ==");
  console.log(JSON.stringify(await thanhToan.layTheoHopDong(1), null, 2));

  console.log("== Chi tiết hợp đồng số 1 ==");
  console.log(JSON.stringify(await hopDong.chiTiet(1), null, 2));

  console.log("== Thống kê xe theo trạng thái ==");
  console.table(await cn.thongKeXeTheoTrangThai());

  console.log("== Doanh thu theo tháng năm 2026 ==");
  console.table(await cn.doanhThuTheoThang(2026));

  console.log("== Công nợ hợp đồng số 6 ==");
  console.log(await cn.congNoHopDong(6));
}

main()
  .catch((e) => {
    console.error("Lỗi:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());