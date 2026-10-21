// crud/hopDong.js - CRUD cho bảng hop_dong
// Khóa chính: maHD
// Trường: maKH, maXe, maNV, ngayThue, ngayTra, tienThue, trangThai
// trangThai: CHO_XAC_NHAN | DA_XAC_NHAN | DANG_THUE | DA_TRA | DA_HUY
//
// Lưu ý: muốn đặt xe, giao xe, trả xe... hãy dùng các hàm nghiệp vụ trong
// chucnang.js (createContract, confirmContract, handOverVehicle, returnVehicle,
// cancelContract). Chúng kiểm tra trạng thái và trùng lịch. File này là CRUD thô.
import { prisma } from "../prismaClient.js";

// ===== Create =====

// Thêm hợp đồng.
// data = { maKH, maXe, maNV, ngayThue, ngayTra, tienThue, trangThai }
export function create(data) {
  return prisma.hop_dong.create({ data });
}

// ===== Read =====

// Lấy tất cả hợp đồng
export function getAll(options = {}) {
  return prisma.hop_dong.findMany({ orderBy: { maHD: "asc" }, ...options });
}

// Lấy một hợp đồng theo mã
export function getById(maHD, options = {}) {
  return prisma.hop_dong.findUnique({ where: { maHD }, ...options });
}

// Lấy chi tiết hợp đồng kèm khách hàng, xe, nhân viên, thanh toán, tình trạng trả xe
export function getDetail(maHD) {
  return prisma.hop_dong.findUnique({
    where: { maHD },
    include: {
      khach_hang: true,
      xe: true,
      nhan_vien: true,
      thanh_toan: true,
      tinh_trang_tra_xe: true,
    },
  });
}

// Lấy các hợp đồng của một khách hàng (mới nhất trước)
export function getByCustomer(maKH) {
  return prisma.hop_dong.findMany({
    where: { maKH },
    include: { xe: true },
    orderBy: { ngayThue: "desc" },
  });
}

// Lấy các hợp đồng theo trạng thái (kèm khách hàng và xe)
export function getByStatus(trangThai) {
  return prisma.hop_dong.findMany({
    where: { trangThai },
    include: { khach_hang: true, xe: true },
    orderBy: { maHD: "asc" },
  });
}

// ===== Update =====

// Sửa hợp đồng. data chỉ cần chứa các trường muốn đổi
export function update(maHD, data) {
  return prisma.hop_dong.update({ where: { maHD }, data });
}

// ===== Delete =====

// Xóa hợp đồng (bị chặn nếu đã có thanh toán hoặc tình trạng trả xe)
export function remove(maHD) {
  return prisma.hop_dong.delete({ where: { maHD } });
}