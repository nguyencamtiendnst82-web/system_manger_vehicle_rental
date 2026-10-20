// crud/thanhToan.js - CRUD cho bảng thanh_toan (khóa chính: maTT)
//
// Lưu ý: nên dùng themThanhToan() trong chucnang.js để được kiểm tra
// không trả vượt quá tiền thuê. File này là CRUD thô.
import { prisma } from "../prismaClient.js";

// Create: thêm khoản thanh toán.
// data = { maHD, soTien, phuongThuc, ngayTT }  (phuongThuc: TIEN_MAT | CHUYEN_KHOAN | THE)
export function tao(data) {
  return prisma.thanh_toan.create({ data });
}

// Read: lấy tất cả khoản thanh toán
export function layTatCa(tuyChon = {}) {
  return prisma.thanh_toan.findMany({ orderBy: { maTT: "asc" }, ...tuyChon });
}

// Read: lấy một khoản thanh toán theo mã
export function layTheoMa(maTT, tuyChon = {}) {
  return prisma.thanh_toan.findUnique({ where: { maTT }, ...tuyChon });
}

// Read: các khoản thanh toán của một hợp đồng
export function layTheoHopDong(maHD) {
  return prisma.thanh_toan.findMany({
    where: { maHD },
    orderBy: { ngayTT: "asc" },
  });
}

// Update: sửa khoản thanh toán
export function capNhat(maTT, data) {
  return prisma.thanh_toan.update({ where: { maTT }, data });
}

// Delete: xóa khoản thanh toán
export function xoa(maTT) {
  return prisma.thanh_toan.delete({ where: { maTT } });
}