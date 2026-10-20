// demo.js - Chạy thử các chức năng. Chạy bằng: node demo.js
// Mặc định chỉ ĐỌC dữ liệu. Các thao tác ghi để trong phần chú thích bên dưới.

import { prisma } from "./prismaClient.js";
import * as cn from "./chucnang.js";

async function main() {
  console.log("== Xe sẵn sàng ==");
  console.table(
    (await cn.danhSachXe("SAN_SANG")).map((x) => ({
      maXe: x.maXe,
      bienSo: x.bienSoXe,
      loai: x.loai_xe?.tenLoaiXe,
      hang: x.loai_xe?.hangXe,
    }))
  );

  console.log("== Thống kê xe theo trạng thái ==");
  console.table(await cn.thongKeXeTheoTrangThai());

  console.log("== Doanh thu theo tháng năm 2026 ==");
  console.table(await cn.doanhThuTheoThang(2026));

  console.log("== Chi tiết hợp đồng số 1 ==");
  console.dir(await cn.chiTietHopDong(1), { depth: 2 });

  console.log("== Công nợ hợp đồng số 6 ==");
  console.log(await cn.congNoHopDong(6));

  // ---------- Các thao tác GHI (bỏ // để thử, nhớ đổi mã cho hợp lý) ----------
  //
  // 1) Thêm khách hàng mới
  // const kh = await cn.khachHang.tao({
  //   hoTen: "Nguyen Van A", SDT: "0900000000", CCCD: "201234567899", bangLai: "B2",
  // });
  //
  // 2) Đặt xe -> xác nhận -> giao xe -> thanh toán -> trả xe
  // const hd = await cn.taoHopDong({
  //   maKH: 3, maXe: 5, maNV: 1,
  //   ngayThue: "2026-11-01", ngayTra: "2026-11-04", tienThue: 2000000,
  // });
  // await cn.xacNhanHopDong(hd.maHD);
  // await cn.giaoXe(hd.maHD);
  // await cn.themThanhToan(hd.maHD, 2000000, "TIEN_MAT");
  // await cn.traXe(hd.maHD, {
  //   tinhTrangXe: "Tot", mucNhienLieu: 70, soKmThucTe: 22400, ghiChu: "Binh thuong",
  // });
  //
  // 3) Bảo trì xe
  // const bt = await cn.batDauBaoTri(1, "Thay dau", 500000);
  // await cn.hoanThanhBaoTri(bt.maBT, 520000);
}

main()
  .catch((e) => {
    console.error("Lỗi:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());