// crud/tinhTrangTraXe.js - CRUD cho bảng tinh_trang_tra_xe
// Khóa chính: maTinhTrang
// Trường: maHD, ngayTra, tinhTrangXe, mucNhienLieu, soKmThucTe, ghiChu
//
// Lưu ý: nên dùng returnVehicle() trong chucnang.js để ghi tình trạng, cập nhật
// hợp đồng và trạng thái xe cùng lúc. File này là CRUD thô.
import { prisma } from "../prismaClient.js";

// ===== Create =====

// Thêm bản ghi tình trạng khi trả xe.
// data = { maHD, ngayTra, tinhTrangXe, mucNhienLieu, soKmThucTe, ghiChu }
export function create(data) {
  return prisma.tinh_trang_tra_xe.create({ data });
}

// ===== Read =====

// Lấy tất cả bản ghi
export function getAll(options = {}) {
  return prisma.tinh_trang_tra_xe.findMany({
    orderBy: { maTinhTrang: "asc" },
    ...options,
  });
}

// Lấy một bản ghi theo mã
export function getById(maTinhTrang, options = {}) {
  return prisma.tinh_trang_tra_xe.findUnique({ where: { maTinhTrang }, ...options });
}

// Lấy tình trạng trả xe của một hợp đồng
export function getByContract(maHD) {
  return prisma.tinh_trang_tra_xe.findMany({
    where: { maHD },
    orderBy: { maTinhTrang: "asc" },
  });
}

// ===== Update =====

// Sửa bản ghi. data chỉ cần chứa các trường muốn đổi
export function update(maTinhTrang, data) {
  return prisma.tinh_trang_tra_xe.update({ where: { maTinhTrang }, data });
}

// ===== Delete =====

// Xóa bản ghi
export function remove(maTinhTrang) {
  return prisma.tinh_trang_tra_xe.delete({ where: { maTinhTrang } });
}