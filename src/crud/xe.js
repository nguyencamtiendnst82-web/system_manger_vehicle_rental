// crud/xe.js - CRUD cho bảng xe
// Khóa chính: maXe
// Trường: maLoaiXe, bienSoXe, mauXe, soKmDaChay, trangThai, soCho
// trangThai: SAN_SANG | DANG_THUE | DANG_BAO_TRI | NGUNG_HOAT_DONG
import { prisma } from "../prismaClient.js";

// ===== Create =====

// Thêm xe.
// data = { maLoaiXe, bienSoXe, mauXe, soKmDaChay, trangThai, soCho }
export function create(data) {
  return prisma.xe.create({ data });
}

// ===== Read =====

// Lấy tất cả xe
export function getAll(options = {}) {
  return prisma.xe.findMany({ orderBy: { maXe: "asc" }, ...options });
}

// Lấy một xe theo mã
export function getById(maXe, options = {}) {
  return prisma.xe.findUnique({ where: { maXe }, ...options });
}

// Lấy một xe theo biển số (kèm loại xe)
export function getByLicensePlate(bienSoXe) {
  return prisma.xe.findUnique({
    where: { bienSoXe },
    include: { loai_xe: true },
  });
}

// Lấy các xe theo trạng thái (kèm loại xe)
export function getByStatus(trangThai) {
  return prisma.xe.findMany({
    where: { trangThai },
    include: { loai_xe: true },
    orderBy: { maXe: "asc" },
  });
}

// ===== Update =====

// Sửa thông tin xe. data chỉ cần chứa các trường muốn đổi
export function update(maXe, data) {
  return prisma.xe.update({ where: { maXe }, data });
}

// Đổi riêng trạng thái xe
export function updateStatus(maXe, trangThai) {
  return prisma.xe.update({ where: { maXe }, data: { trangThai } });
}

// ===== Delete =====

// Xóa xe (bị chặn nếu xe đã có hợp đồng hoặc phiếu bảo trì)
export function remove(maXe) {
  return prisma.xe.delete({ where: { maXe } });
}