// crud/loaiXe.js - CRUD cho bảng loai_xe (khóa chính: maLoaiXe)
import { prisma } from "../prismaClient.js";

// Create: thêm loại xe. data = { tenLoaiXe, hangXe }
export function tao(data) {
  return prisma.loai_xe.create({ data });
}

// Read: lấy tất cả loại xe
export function layTatCa(tuyChon = {}) {
  return prisma.loai_xe.findMany({ orderBy: { maLoaiXe: "asc" }, ...tuyChon });
}

// Read: lấy một loại xe theo mã
export function layTheoMa(maLoaiXe, tuyChon = {}) {
  return prisma.loai_xe.findUnique({ where: { maLoaiXe }, ...tuyChon });
}

// Update: sửa loại xe. data chỉ cần chứa các trường muốn đổi
export function capNhat(maLoaiXe, data) {
  return prisma.loai_xe.update({ where: { maLoaiXe }, data });
}

// Delete: xóa loại xe (bị chặn nếu đã có xe thuộc loại này)
export function xoa(maLoaiXe) {
  return prisma.loai_xe.delete({ where: { maLoaiXe } });
}