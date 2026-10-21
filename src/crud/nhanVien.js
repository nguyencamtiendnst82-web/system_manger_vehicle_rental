// crud/nhanVien.js - CRUD cho bảng nhan_vien
// Khóa chính: maNV
// Trường: hoTen, SDT, email
import { prisma } from "../prismaClient.js";

// ===== Create =====

// Thêm nhân viên. data = { hoTen, SDT, email }
export function create(data) {
  return prisma.nhan_vien.create({ data });
}

// ===== Read =====

// Lấy tất cả nhân viên
export function getAll(options = {}) {
  return prisma.nhan_vien.findMany({ orderBy: { maNV: "asc" }, ...options });
}

// Lấy một nhân viên theo mã
export function getById(maNV, options = {}) {
  return prisma.nhan_vien.findUnique({ where: { maNV }, ...options });
}

// ===== Update =====

// Sửa thông tin nhân viên. data chỉ cần chứa các trường muốn đổi
export function update(maNV, data) {
  return prisma.nhan_vien.update({ where: { maNV }, data });
}

// ===== Delete =====

// Xóa nhân viên (bị chặn nếu nhân viên đã lập hợp đồng)
export function remove(maNV) {
  return prisma.nhan_vien.delete({ where: { maNV } });
}