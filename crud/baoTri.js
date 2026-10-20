// crud/baoTri.js - CRUD cho bảng bao_tri (khóa chính: maBT)
//
// Lưu ý: nên dùng batDauBaoTri() / hoanThanhBaoTri() trong chucnang.js để
// trạng thái của xe được cập nhật theo. File này là CRUD thô.
import { prisma } from "../prismaClient.js";

// Create: thêm phiếu bảo trì.
// data = { maXe, noiDung, ngayBatDau, ngayKetThuc, chiPhi, trangThai }
export function tao(data) {
  return prisma.bao_tri.create({ data });
}

// Read: lấy tất cả phiếu bảo trì
export function layTatCa(tuyChon = {}) {
  return prisma.bao_tri.findMany({ orderBy: { maBT: "asc" }, ...tuyChon });
}

// Read: lấy một phiếu bảo trì theo mã
export function layTheoMa(maBT, tuyChon = {}) {
  return prisma.bao_tri.findUnique({ where: { maBT }, ...tuyChon });
}

// Read: lịch sử bảo trì của một xe (mới nhất trước)
export function layTheoXe(maXe) {
  return prisma.bao_tri.findMany({
    where: { maXe },
    orderBy: { maBT: "desc" },
  });
}

// Update: sửa phiếu bảo trì
export function capNhat(maBT, data) {
  return prisma.bao_tri.update({ where: { maBT }, data });
}

// Delete: xóa phiếu bảo trì
export function xoa(maBT) {
  return prisma.bao_tri.delete({ where: { maBT } });
}