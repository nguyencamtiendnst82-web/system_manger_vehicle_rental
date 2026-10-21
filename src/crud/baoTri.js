// crud/baoTri.js - CRUD cho bảng bao_tri
// Khóa chính: maBT
// Trường: maXe, noiDung, ngayBatDau, ngayKetThuc, chiPhi, trangThai
//
// Lưu ý: nên dùng startMaintenance() / completeMaintenance() trong chucnang.js
// để trạng thái của xe được cập nhật theo. File này là CRUD thô.
import { prisma } from "../prismaClient.js";

// ===== Create =====

// Thêm phiếu bảo trì.
// data = { maXe, noiDung, ngayBatDau, ngayKetThuc, chiPhi, trangThai }
export function create(data) {
  return prisma.bao_tri.create({ data });
}

// ===== Read =====

// Lấy tất cả phiếu bảo trì
export function getAll(options = {}) {
  return prisma.bao_tri.findMany({ orderBy: { maBT: "asc" }, ...options });
}

// Lấy một phiếu bảo trì theo mã
export function getById(maBT, options = {}) {
  return prisma.bao_tri.findUnique({ where: { maBT }, ...options });
}

// Lấy lịch sử bảo trì của một xe (mới nhất trước)
export function getByVehicle(maXe) {
  return prisma.bao_tri.findMany({
    where: { maXe },
    orderBy: { maBT: "desc" },
  });
}

// ===== Update =====

// Sửa phiếu bảo trì. data chỉ cần chứa các trường muốn đổi
export function update(maBT, data) {
  return prisma.bao_tri.update({ where: { maBT }, data });
}

// ===== Delete =====

// Xóa phiếu bảo trì
export function remove(maBT) {
  return prisma.bao_tri.delete({ where: { maBT } });
}