// crud/nhanVien.js - CRUD cho bảng nhan_vien (khóa chính: maNV)
import { prisma } from "../prismaClient.js";

// Create: thêm nhân viên. data = { hoTen, SDT, email }
export function tao(data) {
  return prisma.nhan_vien.create({ data });
}

// Read: lấy tất cả nhân viên
export function layTatCa(tuyChon = {}) {
  return prisma.nhan_vien.findMany({ orderBy: { maNV: "asc" }, ...tuyChon });
}

// Read: lấy một nhân viên theo mã
export function layTheoMa(maNV, tuyChon = {}) {
  return prisma.nhan_vien.findUnique({ where: { maNV }, ...tuyChon });
}

// Update: sửa thông tin nhân viên
export function capNhat(maNV, data) {
  return prisma.nhan_vien.update({ where: { maNV }, data });
}

// Delete: xóa nhân viên (bị chặn nếu nhân viên đã lập hợp đồng)
export function xoa(maNV) {
  return prisma.nhan_vien.delete({ where: { maNV } });
}