// crud/xe.js - CRUD cho bảng xe (khóa chính: maXe)
import { prisma } from "../prismaClient.js";

// Create: thêm xe.
// data = { maLoaiXe, bienSoXe, mauXe, soKmDaChay, trangThai, soCho }
export function tao(data) {
  return prisma.xe.create({ data });
}

// Read: lấy tất cả xe
export function layTatCa(tuyChon = {}) {
  return prisma.xe.findMany({ orderBy: { maXe: "asc" }, ...tuyChon });
}

// Read: lấy một xe theo mã
export function layTheoMa(maXe, tuyChon = {}) {
  return prisma.xe.findUnique({ where: { maXe }, ...tuyChon });
}

// Read: tìm xe theo biển số (kèm loại xe)
export function timTheoBienSo(bienSoXe) {
  return prisma.xe.findUnique({
    where: { bienSoXe },
    include: { loai_xe: true },
  });
}

// Read: danh sách xe kèm loại xe, có thể lọc theo trạng thái
// trangThai: SAN_SANG | DANG_THUE | DANG_BAO_TRI | NGUNG_HOAT_DONG
export function danhSach(trangThai) {
  return prisma.xe.findMany({
    where: trangThai ? { trangThai } : undefined,
    include: { loai_xe: true },
    orderBy: { maXe: "asc" },
  });
}

// Update: sửa thông tin xe
export function capNhat(maXe, data) {
  return prisma.xe.update({ where: { maXe }, data });
}

// Update: đổi riêng trạng thái xe
export function doiTrangThai(maXe, trangThai) {
  return prisma.xe.update({ where: { maXe }, data: { trangThai } });
}

// Delete: xóa xe (bị chặn nếu xe đã có hợp đồng hoặc phiếu bảo trì)
export function xoa(maXe) {
  return prisma.xe.delete({ where: { maXe } });
}