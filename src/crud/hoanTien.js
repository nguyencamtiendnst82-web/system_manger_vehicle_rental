// crud/hoanTien.js - CRUD cho bảng hoan_tien
// Khóa chính: maHT
// Trường: maHD, soTien, lyDo, ngayHT
//
// Lưu ý: khoản hoàn tiền thường được tạo tự động khi hủy hợp đồng bằng
// cancelContract() trong chucnang.js. File này là CRUD thô.
import { prisma } from "../prismaClient.js";

// ===== Create =====

// Thêm khoản hoàn tiền. data = { maHD, soTien, lyDo, ngayHT }
export function create(data) {
  return prisma.hoan_tien.create({ data });
}

// ===== Read =====

// Lấy tất cả khoản hoàn tiền
export function getAll(options = {}) {
  return prisma.hoan_tien.findMany({ orderBy: { maHT: "asc" }, ...options });
}

// Lấy một khoản hoàn tiền theo mã
export function getById(maHT, options = {}) {
  return prisma.hoan_tien.findUnique({ where: { maHT }, ...options });
}

// Lấy các khoản hoàn tiền của một hợp đồng
export function getByContract(maHD) {
  return prisma.hoan_tien.findMany({ where: { maHD }, orderBy: { maHT: "asc" } });
}

// ===== Update =====

// Sửa khoản hoàn tiền. data chỉ cần chứa các trường muốn đổi
export function update(maHT, data) {
  return prisma.hoan_tien.update({ where: { maHT }, data });
}

// ===== Delete =====

// Xóa khoản hoàn tiền
export function remove(maHT) {
  return prisma.hoan_tien.delete({ where: { maHT } });
}
