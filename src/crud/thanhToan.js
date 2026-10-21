// crud/thanhToan.js - CRUD cho bảng thanh_toan
// Khóa chính: maTT
// Trường: maHD, soTien, phuongThuc, ngayTT
// phuongThuc: TIEN_MAT | CHUYEN_KHOAN | THE
//
// Lưu ý: nên dùng addPayment() trong chucnang.js để được kiểm tra
// không trả vượt quá tiền thuê. File này là CRUD thô.
import { prisma } from "../prismaClient.js";

// ===== Create =====

// Thêm khoản thanh toán. data = { maHD, soTien, phuongThuc, ngayTT }
export function create(data) {
  return prisma.thanh_toan.create({ data });
}

// ===== Read =====

// Lấy tất cả khoản thanh toán
export function getAll(options = {}) {
  return prisma.thanh_toan.findMany({ orderBy: { maTT: "asc" }, ...options });
}

// Lấy một khoản thanh toán theo mã
export function getById(maTT, options = {}) {
  return prisma.thanh_toan.findUnique({ where: { maTT }, ...options });
}

// Lấy các khoản thanh toán của một hợp đồng (cũ nhất trước)
export function getByContract(maHD) {
  return prisma.thanh_toan.findMany({
    where: { maHD },
    orderBy: { ngayTT: "asc" },
  });
}

// ===== Update =====

// Sửa khoản thanh toán. data chỉ cần chứa các trường muốn đổi
export function update(maTT, data) {
  return prisma.thanh_toan.update({ where: { maTT }, data });
}

// ===== Delete =====

// Xóa khoản thanh toán
export function remove(maTT) {
  return prisma.thanh_toan.delete({ where: { maTT } });
}