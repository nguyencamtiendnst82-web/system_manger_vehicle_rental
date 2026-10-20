// crud/hopDong.js - CRUD cho bảng hop_dong (khóa chính: maHD)
//
// Lưu ý: muốn đặt xe, giao xe, trả xe... hãy dùng các hàm nghiệp vụ trong
// chucnang.js (chúng kiểm tra trạng thái và trùng lịch). File này chỉ là CRUD thô.
import { prisma } from "../prismaClient.js";

// Create: thêm hợp đồng.
// data = { maKH, maXe, maNV, ngayThue, ngayTra, tienThue, trangThai }
export function tao(data) {
  return prisma.hop_dong.create({ data });
}

// Read: lấy tất cả hợp đồng
export function layTatCa(tuyChon = {}) {
  return prisma.hop_dong.findMany({ orderBy: { maHD: "asc" }, ...tuyChon });
}

// Read: lấy một hợp đồng theo mã
export function layTheoMa(maHD, tuyChon = {}) {
  return prisma.hop_dong.findUnique({ where: { maHD }, ...tuyChon });
}

// Read: chi tiết hợp đồng kèm khách hàng, xe, nhân viên, thanh toán, tình trạng trả xe
export function chiTiet(maHD) {
  return prisma.hop_dong.findUnique({
    where: { maHD },
    include: {
      khach_hang: true,
      xe: true,
      nhan_vien: true,
      thanh_toan: true,
      tinh_trang_tra_xe: true,
    },
  });
}

// Read: các hợp đồng của một khách hàng (mới nhất trước)
export function layTheoKhach(maKH) {
  return prisma.hop_dong.findMany({
    where: { maKH },
    include: { xe: true },
    orderBy: { ngayThue: "desc" },
  });
}

// Read: các hợp đồng theo trạng thái
// trangThai: CHO_XAC_NHAN | DA_XAC_NHAN | DANG_THUE | DA_TRA | DA_HUY
export function layTheoTrangThai(trangThai) {
  return prisma.hop_dong.findMany({
    where: { trangThai },
    include: { khach_hang: true, xe: true },
    orderBy: { maHD: "asc" },
  });
}

// Update: sửa hợp đồng
export function capNhat(maHD, data) {
  return prisma.hop_dong.update({ where: { maHD }, data });
}

// Delete: xóa hợp đồng (bị chặn nếu đã có thanh toán hoặc tình trạng trả xe)
export function xoa(maHD) {
  return prisma.hop_dong.delete({ where: { maHD } });
}