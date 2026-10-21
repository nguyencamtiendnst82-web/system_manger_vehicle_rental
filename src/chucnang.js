// chucnang.js - Nghiệp vụ và thống kê của hệ thống quản lý cho thuê xe
//
// Phần 1: Nghiệp vụ
//   1.1 Hợp đồng : findAvailableVehicles, createContract, confirmContract,
//                  handOverVehicle, returnVehicle, cancelContract
//   1.2 Thanh toán: getContractBalance, addPayment
//   1.3 Bảo trì  : startMaintenance, completeMaintenance
// Phần 2: Thống kê
//   countVehiclesByStatus, getMonthlyRevenue, getMaintenanceCostByVehicle,
//   getMostRentedVehicles, getOverdueContracts
//
// Lưu ý:
// - CRUD thô của từng bảng nằm trong thư mục crud/ (xem crud/index.js).
// - Tên model (xe, hop_dong, khach_hang...) và tên quan hệ trong include
//   phải khớp với prisma/schema.prisma sau khi chạy `npx prisma db pull`.
// - Các hàm nhận tham số `db` có thể truyền prisma hoặc tx (trong transaction).
import { prisma } from "./prismaClient.js";

// =====================================================
// HẰNG SỐ
// =====================================================

// Các trạng thái hợp đồng đang "giữ" xe (xe không được cho thuê trùng)
const ACTIVE_CONTRACT_STATUSES = ["CHO_XAC_NHAN", "DA_XAC_NHAN", "DANG_THUE"];

// Các trạng thái hợp đồng còn được phép hủy (chưa giao xe)
const CANCELLABLE_CONTRACT_STATUSES = ["CHO_XAC_NHAN", "DA_XAC_NHAN"];

// Các trạng thái xe không thể cho thuê
const UNAVAILABLE_VEHICLE_STATUSES = ["DANG_BAO_TRI", "NGUNG_HOAT_DONG"];

// =====================================================
// HÀM TIỆN ÍCH (dùng nội bộ)
// =====================================================

// Lấy hợp đồng theo mã, ném lỗi nếu không tồn tại
async function getContractOrThrow(db, maHD, options = {}) {
  const contract = await db.hop_dong.findUnique({ where: { maHD }, ...options });
  if (!contract) throw new Error("Không tìm thấy hợp đồng");
  return contract;
}

// Lấy xe theo mã, ném lỗi nếu không tồn tại
async function getVehicleOrThrow(db, maXe) {
  const vehicle = await db.xe.findUnique({ where: { maXe } });
  if (!vehicle) throw new Error("Không tìm thấy xe");
  return vehicle;
}

// Lấy phiếu bảo trì theo mã, ném lỗi nếu không tồn tại
async function getMaintenanceOrThrow(db, maBT) {
  const maintenance = await db.bao_tri.findUnique({ where: { maBT } });
  if (!maintenance) throw new Error("Không tìm thấy phiếu bảo trì");
  return maintenance;
}

// Kiểm tra xe có bị trùng lịch trong khoảng [from, to) không
async function hasScheduleConflict(db, maXe, from, to, excludeMaHD) {
  const conflict = await db.hop_dong.findFirst({
    where: {
      maXe,
      trangThai: { in: ACTIVE_CONTRACT_STATUSES },
      ...(excludeMaHD ? { maHD: { not: excludeMaHD } } : {}),
      ngayThue: { lt: to },
      ngayTra: { gt: from },
    },
  });
  return conflict !== null;
}

// =====================================================
// PHẦN 1: NGHIỆP VỤ
// =====================================================

// ----- 1.1 Hợp đồng -----

// Tìm các xe có thể thuê trong khoảng thời gian (không bảo trì và không trùng lịch)
export async function findAvailableVehicles(rentDate, returnDate) {
  const from = new Date(rentDate);
  const to = new Date(returnDate);
  const busyContracts = await prisma.hop_dong.findMany({
    where: {
      trangThai: { in: ACTIVE_CONTRACT_STATUSES },
      ngayThue: { lt: to },
      ngayTra: { gt: from },
    },
    select: { maXe: true },
  });
  const busyVehicleIds = busyContracts.map((c) => c.maXe);
  return prisma.xe.findMany({
    where: {
      trangThai: { in: ["SAN_SANG", "DANG_THUE"] },
      maXe: { notIn: busyVehicleIds },
    },
    include: { loai_xe: true },
  });
}

// Đặt xe: tạo hợp đồng ở trạng thái CHO_XAC_NHAN
export async function createContract({ maKH, maXe, maNV, ngayThue, ngayTra, tienThue }) {
  const from = new Date(ngayThue);
  const to = new Date(ngayTra);
  if (!(to > from)) throw new Error("Ngày trả phải sau ngày thuê");

  return prisma.$transaction(async (tx) => {
    const vehicle = await getVehicleOrThrow(tx, maXe);
    if (UNAVAILABLE_VEHICLE_STATUSES.includes(vehicle.trangThai)) {
      throw new Error("Xe đang bảo trì hoặc ngừng hoạt động");
    }
    if (await hasScheduleConflict(tx, maXe, from, to)) {
      throw new Error("Xe đã có hợp đồng khác trong khoảng thời gian này");
    }
    return tx.hop_dong.create({
      data: {
        maKH,
        maXe,
        maNV,
        ngayThue: from,
        ngayTra: to,
        tienThue,
        trangThai: "CHO_XAC_NHAN",
      },
    });
  });
}

// Xác nhận hợp đồng: CHO_XAC_NHAN -> DA_XAC_NHAN
export async function confirmContract(maHD) {
  const contract = await getContractOrThrow(prisma, maHD);
  if (contract.trangThai !== "CHO_XAC_NHAN") {
    throw new Error("Chỉ xác nhận được hợp đồng đang chờ xác nhận");
  }
  return prisma.hop_dong.update({ where: { maHD }, data: { trangThai: "DA_XAC_NHAN" } });
}

// Giao xe cho khách: hợp đồng -> DANG_THUE, xe -> DANG_THUE
export async function handOverVehicle(maHD) {
  return prisma.$transaction(async (tx) => {
    const contract = await getContractOrThrow(tx, maHD, { include: { xe: true } });
    if (contract.trangThai !== "DA_XAC_NHAN") {
      throw new Error("Hợp đồng phải ở trạng thái đã xác nhận mới giao xe được");
    }
    if (UNAVAILABLE_VEHICLE_STATUSES.includes(contract.xe.trangThai)) {
      throw new Error("Xe đang bảo trì hoặc ngừng hoạt động");
    }
    await tx.xe.update({ where: { maXe: contract.maXe }, data: { trangThai: "DANG_THUE" } });
    return tx.hop_dong.update({ where: { maHD }, data: { trangThai: "DANG_THUE" } });
  });
}

// Nhận xe trả: ghi tình trạng, cập nhật km, đưa xe về SAN_SANG
// info = { tinhTrangXe, mucNhienLieu, soKmThucTe, ghiChu }
export async function returnVehicle(maHD, info = {}) {
  return prisma.$transaction(async (tx) => {
    const contract = await getContractOrThrow(tx, maHD);
    if (contract.trangThai !== "DANG_THUE") {
      throw new Error("Chỉ trả được xe của hợp đồng đang thuê");
    }
    const now = new Date();

    await tx.tinh_trang_tra_xe.create({
      data: {
        maHD,
        ngayTra: now,
        tinhTrangXe: info.tinhTrangXe ?? null,
        mucNhienLieu: info.mucNhienLieu ?? null,
        soKmThucTe: info.soKmThucTe ?? null,
        ghiChu: info.ghiChu ?? null,
      },
    });

    await tx.xe.update({
      where: { maXe: contract.maXe },
      data: {
        trangThai: "SAN_SANG",
        ...(info.soKmThucTe != null ? { soKmDaChay: info.soKmThucTe } : {}),
      },
    });

    return tx.hop_dong.update({
      where: { maHD },
      data: { trangThai: "DA_TRA", ngayTraThucTe: now },
    });
  });
}

// Hủy hợp đồng (chỉ khi chưa giao xe)
export async function cancelContract(maHD) {
  const contract = await getContractOrThrow(prisma, maHD);
  if (!CANCELLABLE_CONTRACT_STATUSES.includes(contract.trangThai)) {
    throw new Error("Chỉ hủy được hợp đồng chưa giao xe");
  }
  return prisma.hop_dong.update({ where: { maHD }, data: { trangThai: "DA_HUY" } });
}

// ----- 1.2 Thanh toán -----

// Tổng đã thanh toán và số tiền còn nợ của một hợp đồng
export async function getContractBalance(maHD) {
  const contract = await getContractOrThrow(prisma, maHD);
  const total = await prisma.thanh_toan.aggregate({
    where: { maHD },
    _sum: { soTien: true },
  });
  const paid = Number(total._sum.soTien ?? 0);
  const tienThue = Number(contract.tienThue);
  return { maHD, tienThue, daThanhToan: paid, conNo: tienThue - paid };
}

// Ghi nhận thanh toán (không cho trả vượt quá tiền thuê)
export async function addPayment(maHD, soTien, phuongThuc) {
  if (!(soTien > 0)) throw new Error("Số tiền phải lớn hơn 0");
  const { conNo } = await getContractBalance(maHD);
  if (soTien > conNo) {
    throw new Error(`Số tiền vượt quá số còn nợ (${conNo})`);
  }
  return prisma.thanh_toan.create({
    data: { maHD, soTien, phuongThuc, ngayTT: new Date() },
  });
}

// ----- 1.3 Bảo trì -----

// Bắt đầu bảo trì xe: xe -> DANG_BAO_TRI
export async function startMaintenance(maXe, noiDung, chiPhi = 0) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await getVehicleOrThrow(tx, maXe);
    if (vehicle.trangThai === "DANG_THUE") {
      throw new Error("Xe đang được thuê, không thể bảo trì lúc này");
    }
    await tx.xe.update({ where: { maXe }, data: { trangThai: "DANG_BAO_TRI" } });
    return tx.bao_tri.create({
      data: {
        maXe,
        noiDung,
        chiPhi,
        ngayBatDau: new Date(),
        trangThai: "DANG_BAO_TRI",
      },
    });
  });
}

// Hoàn thành bảo trì: xe -> SAN_SANG
export async function completeMaintenance(maBT, chiPhi) {
  return prisma.$transaction(async (tx) => {
    const maintenance = await getMaintenanceOrThrow(tx, maBT);
    if (maintenance.trangThai === "DA_HOAN_THANH") {
      throw new Error("Phiếu này đã hoàn thành");
    }
    await tx.xe.update({ where: { maXe: maintenance.maXe }, data: { trangThai: "SAN_SANG" } });
    return tx.bao_tri.update({
      where: { maBT },
      data: {
        trangThai: "DA_HOAN_THANH",
        ngayKetThuc: new Date(),
        ...(chiPhi != null ? { chiPhi } : {}),
      },
    });
  });
}

// =====================================================
// PHẦN 2: THỐNG KÊ
// =====================================================

// Số xe theo từng trạng thái
export async function countVehiclesByStatus() {
  const result = await prisma.xe.groupBy({
    by: ["trangThai"],
    _count: { _all: true },
  });
  return result.map((r) => ({ trangThai: r.trangThai, soLuong: r._count._all }));
}

// Doanh thu (tổng tiền đã thanh toán) theo 12 tháng của một năm
export async function getMonthlyRevenue(year) {
  const payments = await prisma.thanh_toan.findMany({
    where: {
      ngayTT: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    },
  });
  const months = Array.from({ length: 12 }, (_, i) => ({ thang: i + 1, doanhThu: 0 }));
  for (const payment of payments) {
    months[new Date(payment.ngayTT).getMonth()].doanhThu += Number(payment.soTien);
  }
  return months;
}

// Chi phí bảo trì theo từng xe
export async function getMaintenanceCostByVehicle() {
  const result = await prisma.bao_tri.groupBy({
    by: ["maXe"],
    _sum: { chiPhi: true },
    _count: { _all: true },
  });
  return result.map((r) => ({
    maXe: r.maXe,
    soLanBaoTri: r._count._all,
    tongChiPhi: Number(r._sum.chiPhi ?? 0),
  }));
}

// Các xe được thuê nhiều nhất
export async function getMostRentedVehicles(top = 5) {
  const result = await prisma.hop_dong.groupBy({
    by: ["maXe"],
    where: { trangThai: { not: "DA_HUY" } },
    _count: { _all: true },
    orderBy: { _count: { maXe: "desc" } },
    take: top,
  });
  return result.map((r) => ({ maXe: r.maXe, soLanThue: r._count._all }));
}

// Hợp đồng quá hạn: đang thuê nhưng đã quá ngày trả dự kiến
export function getOverdueContracts() {
  return prisma.hop_dong.findMany({
    where: { trangThai: "DANG_THUE", ngayTra: { lt: new Date() } },
    include: { khach_hang: true, xe: true },
  });
}