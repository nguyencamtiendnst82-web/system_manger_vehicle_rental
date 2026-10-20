// crud/khachHang.js - CRUD cho bảng khach_hang (khóa chính: maKH)
import { prisma } from "../prismaClient.js";

// Create: thêm khách hàng.
// data = { hoTen, SDT, email, CCCD, bangLai, diaChi }
export function tao(data) {
  return prisma.khach_hang.create({ data });
}

// Read: lấy tất cả khách hàng
export function layTatCa(tuyChon = {}) {
  return prisma.khach_hang.findMany({ orderBy: { maKH: "asc" }, ...tuyChon });
}

// Read: lấy một khách hàng theo mã
export function layTheoMa(maKH, tuyChon = {}) {
  return prisma.khach_hang.findUnique({ where: { maKH }, ...tuyChon });
}

// Read: tìm khách hàng theo số CCCD
export function timTheoCCCD(CCCD) {
  return prisma.khach_hang.findUnique({ where: { CCCD } });
}

// Read: tìm khách hàng theo một phần họ tên
export function timTheoTen(tuKhoa) {
  return prisma.khach_hang.findMany({
    where: { hoTen: { contains: tuKhoa } },
    orderBy: { maKH: "asc" },
  });
}

// Update: sửa thông tin khách hàng
export function capNhat(maKH, data) {
  return prisma.khach_hang.update({ where: { maKH }, data });
}

// Delete: xóa khách hàng (bị chặn nếu khách đã có hợp đồng)
export function xoa(maKH) {
  return prisma.khach_hang.delete({ where: { maKH } });
}