// crud/khachHang.js - CRUD cho bảng khach_hang
// Khóa chính: maKH
// Trường: hoTen, SDT, email, CCCD, bangLai, diaChi
import { prisma } from "../prismaClient.js";

// ===== Create =====

// Thêm khách hàng.
// data = { hoTen, SDT, email, CCCD, bangLai, diaChi }
export function create(data) {
  return prisma.khach_hang.create({ data });
}

// ===== Read =====

// Lấy tất cả khách hàng
export function getAll(options = {}) {
  return prisma.khach_hang.findMany({ orderBy: { maKH: "asc" }, ...options });
}

// Lấy một khách hàng theo mã
export function getById(maKH, options = {}) {
  return prisma.khach_hang.findUnique({ where: { maKH }, ...options });
}

// Lấy một khách hàng theo số CCCD
export function getByCCCD(CCCD) {
  return prisma.khach_hang.findUnique({ where: { CCCD } });
}

// Tìm khách hàng theo một phần họ tên
export function searchByName(keyword) {
  return prisma.khach_hang.findMany({
    where: { hoTen: { contains: keyword } },
    orderBy: { maKH: "asc" },
  });
}

// ===== Update =====

// Sửa thông tin khách hàng. data chỉ cần chứa các trường muốn đổi
export function update(maKH, data) {
  return prisma.khach_hang.update({ where: { maKH }, data });
}

// ===== Delete =====

// Xóa khách hàng (bị chặn nếu khách đã có hợp đồng)
export function remove(maKH) {
  return prisma.khach_hang.delete({ where: { maKH } });
}