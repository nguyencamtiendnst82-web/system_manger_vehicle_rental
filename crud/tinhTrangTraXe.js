// crud/tinhTrangTraXe.js - CRUD cho bảng tinh_trang_tra_xe (khóa chính: maTinhTrang)
//
// Lưu ý: nên dùng traXe() trong chucnang.js để ghi tình trạng, cập nhật
// hợp đồng và trạng thái xe cùng lúc. File này là CRUD thô.
import { prisma } from "../prismaClient.js";

// Create: thêm bản ghi tình trạng khi trả xe.
// data = { maHD, ngayTra, tinhTrangXe, mucNhienLieu, soKmThucTe, ghiChu }
export function tao(data) {
  return prisma.tinh_trang_tra_xe.create({ data });
}

// Read: lấy tất cả bản ghi
export function layTatCa(tuyChon = {}) {
  return prisma.tinh_trang_tra_xe.findMany({
    orderBy: { maTinhTrang: "asc" },
    ...tuyChon,
  });
}

// Read: lấy một bản ghi theo mã
export function layTheoMa(maTinhTrang, tuyChon = {}) {
  return prisma.tinh_trang_tra_xe.findUnique({ where: { maTinhTrang }, ...tuyChon });
}

// Read: tình trạng trả xe của một hợp đồng
export function layTheoHopDong(maHD) {
  return prisma.tinh_trang_tra_xe.findMany({ where: { maHD } });
}

// Update: sửa bản ghi
export function capNhat(maTinhTrang, data) {
  return prisma.tinh_trang_tra_xe.update({ where: { maTinhTrang }, data });
}

// Delete: xóa bản ghi
export function xoa(maTinhTrang) {
  return prisma.tinh_trang_tra_xe.delete({ where: { maTinhTrang } });
}