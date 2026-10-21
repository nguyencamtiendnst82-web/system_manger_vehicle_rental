// crud/loaiXe.js - CRUD cho bảng loai_xe
// Khóa chính: maLoaiXe
// Trường: tenLoaiXe, hangXe
import { prisma } from "../prismaClient.js";

// ===== Create =====

// Thêm loại xe. data = { tenLoaiXe, hangXe }
export function create(data) {
  return prisma.loai_xe.create({ data });
}

// ===== Read =====

// Lấy tất cả loại xe
export function getAll(options = {}) {
  return prisma.loai_xe.findMany({ orderBy: { maLoaiXe: "asc" }, ...options });
}

// Lấy một loại xe theo mã
export function getById(maLoaiXe, options = {}) {
  return prisma.loai_xe.findUnique({ where: { maLoaiXe }, ...options });
}

// ===== Update =====

// Sửa loại xe. data chỉ cần chứa các trường muốn đổi
export function update(maLoaiXe, data) {
  return prisma.loai_xe.update({ where: { maLoaiXe }, data });
}

// ===== Delete =====

// Xóa loại xe (bị chặn nếu đã có xe thuộc loại này)
export function remove(maLoaiXe) {
  return prisma.loai_xe.delete({ where: { maLoaiXe } });
}