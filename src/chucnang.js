// chucnang.js - Nghiệp vụ và thống kê của hệ thống quản lý cho thuê xe
//
// Phần 1: Nghiệp vụ
//   1.1 Hợp đồng : findAvailableVehicles, createContract, confirmContract,
//                  handOverVehicle, returnVehicle, cancelContract,
//                  reassignVehicle (đổi xe), getAtRiskContracts (cảnh báo xe trả trễ)
//   1.2 Thanh toán: getContractBalance, addPayment (+ phí trả trễ khi trả xe,
//                  hoàn tiền khi hủy hợp đồng: calcLateFee, calcRefundRate)
//   1.3 Bảo trì  : startMaintenance, completeMaintenance
// Phần 2: Thống kê
//   countVehiclesByStatus, getMonthlyRevenue, getMaintenanceCostByVehicle,
//   getMostRentedVehicles, getOverdueContracts
//
// Lưu ý:
// - Các thao tác ghi đều chạy trong transaction và khóa dòng (SELECT ... FOR UPDATE)
//   trên xe/hợp đồng liên quan để tránh đặt trùng xe hoặc thanh toán vượt khi
//   nhiều người thao tác cùng lúc. Chuyển trạng thái dùng updateMany có điều kiện.
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

// Phương thức thanh toán hợp lệ (khớp enum thanh_toan_phuongThuc)
const PAYMENT_METHODS = ["TIEN_MAT", "CHUYEN_KHOAN", "THE"];

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// ----- Thời gian đệm giữa hai hợp đồng liên tiếp của cùng một xe -----
// Dành cho vệ sinh/kiểm tra xe và chống rủi ro trả trễ nhẹ: hợp đồng sau chỉ được
// bắt đầu sau khi hợp đồng trước kết thúc ít nhất TURNAROUND_BUFFER_HOURS giờ.
const TURNAROUND_BUFFER_HOURS = 4;
const BUFFER_MS = TURNAROUND_BUFFER_HOURS * HOUR_MS;

// ----- Chính sách phí trả trễ -----
// Trả trễ quá LATE_GRACE_MINUTES phút so với ngày trả dự kiến thì tính phí:
//   số giờ trễ (làm tròn lên) x (giá thuê ngày / 24) x LATE_FEE_RATE
const LATE_GRACE_MINUTES = 60;
const LATE_FEE_RATE = 1.5;

// ----- Chính sách hoàn tiền khi hủy hợp đồng -----
// - Hợp đồng chưa xác nhận, hoặc hủy trước giờ thuê >= FULL_REFUND_HOURS giờ: hoàn 100%
// - Hủy muộn hơn: hoàn LATE_CANCEL_REFUND_RATE (giữ lại phần còn lại làm phí hủy)
const FULL_REFUND_HOURS = 24;
const LATE_CANCEL_REFUND_RATE = 0.7;

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
async function getVehicleOrThrow(db, maXe, options = {}) {
  const vehicle = await db.xe.findUnique({ where: { maXe }, ...options });
  if (!vehicle) throw new Error("Không tìm thấy xe");
  return vehicle;
}

// Lấy phiếu bảo trì theo mã, ném lỗi nếu không tồn tại
async function getMaintenanceOrThrow(db, maBT) {
  const maintenance = await db.bao_tri.findUnique({ where: { maBT } });
  if (!maintenance) throw new Error("Không tìm thấy phiếu bảo trì");
  return maintenance;
}

// Khóa dòng xe đến hết transaction: các thao tác trên cùng một xe sẽ chạy lần lượt.
// Chỉ có tác dụng khi db là tx (trong $transaction).
async function lockVehicle(db, maXe) {
  await db.$queryRaw`SELECT maXe FROM xe WHERE maXe = ${maXe} FOR UPDATE`;
}

// Khóa dòng hợp đồng đến hết transaction (dùng cho thanh toán)
async function lockContract(db, maHD) {
  await db.$queryRaw`SELECT maHD FROM hop_dong WHERE maHD = ${maHD} FOR UPDATE`;
}

// Chuyển chuỗi/Date thành Date, ném lỗi nếu không hợp lệ
function parseDate(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} không hợp lệ`);
  return date;
}

// Kiểm tra khoảng thời gian thuê hợp lệ, trả về { from, to }
function parseRange(rentDate, returnDate) {
  const from = parseDate(rentDate, "Ngày thuê");
  const to = parseDate(returnDate, "Ngày trả");
  if (!(to > from)) throw new Error("Ngày trả phải sau ngày thuê");
  return { from, to };
}

// Tiền thuê = số ngày (làm tròn lên, tối thiểu 1) x giá thuê theo ngày của loại xe
function calcRentalFee(from, to, giaThueNgay) {
  const days = Math.max(1, Math.ceil((to - from) / DAY_MS));
  return days * Number(giaThueNgay ?? 0);
}

// Phí trả trễ (đồng, làm tròn). Trả trong thời gian ân hạn hoặc đúng hạn thì = 0.
export function calcLateFee(ngayTra, ngayTraThucTe, giaThueNgay) {
  const lateMs = new Date(ngayTraThucTe) - new Date(ngayTra);
  if (!(lateMs > LATE_GRACE_MINUTES * 60 * 1000)) return 0;
  const lateHours = Math.ceil(lateMs / HOUR_MS);
  return Math.round(lateHours * (Number(giaThueNgay ?? 0) / 24) * LATE_FEE_RATE);
}

// Tỷ lệ hoàn tiền (0-1) khi hủy hợp đồng ở thời điểm `now`
export function calcRefundRate(trangThai, ngayThue, now = new Date()) {
  if (trangThai === "CHO_XAC_NHAN") return 1;
  return new Date(ngayThue) - now >= FULL_REFUND_HOURS * HOUR_MS ? 1 : LATE_CANCEL_REFUND_RATE;
}

// Tổng số tiền của một aggregate _sum.soTien (null -> 0)
const sumOf = (aggregate) => Number(aggregate?._sum?.soTien ?? 0);

// Khoảng thời gian cần kiểm tra trùng lịch: [from, to) mở rộng thêm thời gian đệm hai đầu
function bufferedRange(from, to) {
  return {
    ngayThue: { lt: new Date(to.getTime() + BUFFER_MS) },
    ngayTra: { gt: new Date(from.getTime() - BUFFER_MS) },
  };
}

// Kiểm tra xe có bị trùng lịch (kể cả thời gian đệm) trong khoảng [from, to) không
async function hasScheduleConflict(db, maXe, from, to, excludeMaHD) {
  const conflict = await db.hop_dong.findFirst({
    where: {
      maXe,
      trangThai: { in: ACTIVE_CONTRACT_STATUSES },
      ...(excludeMaHD ? { maHD: { not: excludeMaHD } } : {}),
      ...bufferedRange(from, to),
    },
  });
  return Boolean(conflict);
}

// =====================================================
// PHẦN 1: NGHIỆP VỤ
// =====================================================

// ----- 1.1 Hợp đồng -----

// Tìm các xe có thể thuê trong khoảng thời gian (không bảo trì/ngừng hoạt động
// và không trùng lịch, tính cả thời gian đệm). Có thể lọc thêm theo loại xe (maLoaiXe).
export async function findAvailableVehicles(rentDate, returnDate, maLoaiXe) {
  const { from, to } = parseRange(rentDate, returnDate);
  const busyContracts = await prisma.hop_dong.findMany({
    where: {
      trangThai: { in: ACTIVE_CONTRACT_STATUSES },
      ...bufferedRange(from, to),
    },
    select: { maXe: true },
  });
  const busyVehicleIds = busyContracts.map((c) => c.maXe);
  return prisma.xe.findMany({
    where: {
      trangThai: { in: ["SAN_SANG", "DANG_THUE"] },
      maXe: { notIn: busyVehicleIds },
      ...(maLoaiXe != null ? { maLoaiXe } : {}),
    },
    include: { loai_xe: true },
  });
}

// Đặt xe: tạo hợp đồng ở trạng thái CHO_XAC_NHAN.
// Nếu không truyền tienThue, hệ thống tự tính theo giá thuê ngày của loại xe.
export async function createContract({ maKH, maXe, maNV, ngayThue, ngayTra, tienThue }) {
  const { from, to } = parseRange(ngayThue, ngayTra);
  if (tienThue != null && !(Number.isFinite(Number(tienThue)) && Number(tienThue) >= 0)) {
    throw new Error("Tiền thuê không hợp lệ");
  }

  return prisma.$transaction(async (tx) => {
    await lockVehicle(tx, maXe);
    const vehicle = await getVehicleOrThrow(tx, maXe, { include: { loai_xe: true } });
    if (UNAVAILABLE_VEHICLE_STATUSES.includes(vehicle.trangThai)) {
      throw new Error("Xe đang bảo trì hoặc ngừng hoạt động");
    }
    if (!(await tx.khach_hang.findUnique({ where: { maKH } }))) {
      throw new Error("Không tìm thấy khách hàng");
    }
    if (!(await tx.nhan_vien.findUnique({ where: { maNV } }))) {
      throw new Error("Không tìm thấy nhân viên");
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
        tienThue: tienThue ?? calcRentalFee(from, to, vehicle.loai_xe?.giaThueNgay),
        trangThai: "CHO_XAC_NHAN",
      },
    });
  });
}

// Xác nhận hợp đồng: CHO_XAC_NHAN -> DA_XAC_NHAN (đổi trạng thái nguyên tử)
export async function confirmContract(maHD) {
  const { count } = await prisma.hop_dong.updateMany({
    where: { maHD, trangThai: "CHO_XAC_NHAN" },
    data: { trangThai: "DA_XAC_NHAN" },
  });
  if (count === 0) {
    await getContractOrThrow(prisma, maHD); // báo "không tìm thấy" nếu mã sai
    throw new Error("Chỉ xác nhận được hợp đồng đang chờ xác nhận");
  }
  return getContractOrThrow(prisma, maHD);
}

// Giao xe cho khách: hợp đồng -> DANG_THUE, xe -> DANG_THUE
export async function handOverVehicle(maHD) {
  return prisma.$transaction(async (tx) => {
    const contract = await getContractOrThrow(tx, maHD);
    if (contract.trangThai !== "DA_XAC_NHAN") {
      throw new Error("Hợp đồng phải ở trạng thái đã xác nhận mới giao xe được");
    }
    await lockVehicle(tx, contract.maXe);
    const vehicle = await getVehicleOrThrow(tx, contract.maXe);
    if (UNAVAILABLE_VEHICLE_STATUSES.includes(vehicle.trangThai)) {
      throw new Error("Xe đang bảo trì hoặc ngừng hoạt động");
    }
    if (vehicle.trangThai === "DANG_THUE") {
      throw new Error("Xe đang được khách khác thuê, chưa được trả (dùng reassignVehicle để đổi xe khác cho khách mới)");
    }
    const { count } = await tx.hop_dong.updateMany({
      where: { maHD, trangThai: "DA_XAC_NHAN" },
      data: { trangThai: "DANG_THUE" },
    });
    if (count === 0) throw new Error("Hợp đồng vừa bị thay đổi, vui lòng thử lại");
    await tx.xe.update({ where: { maXe: contract.maXe }, data: { trangThai: "DANG_THUE" } });
    return getContractOrThrow(tx, maHD);
  });
}

// Nhận xe trả: ghi tình trạng, cập nhật km, đưa xe về SAN_SANG, tính phí trả trễ (nếu có)
// info = { tinhTrangXe, mucNhienLieu (0-100), soKmThucTe (>= km hiện tại), ghiChu }
export async function returnVehicle(maHD, info = {}) {
  const { mucNhienLieu = null, soKmThucTe = null } = info;
  if (mucNhienLieu != null && !(Number.isInteger(mucNhienLieu) && mucNhienLieu >= 0 && mucNhienLieu <= 100)) {
    throw new Error("Mức nhiên liệu phải là số nguyên từ 0 đến 100");
  }
  if (soKmThucTe != null && !(Number.isInteger(soKmThucTe) && soKmThucTe >= 0)) {
    throw new Error("Số km thực tế không hợp lệ");
  }

  return prisma.$transaction(async (tx) => {
    const contract = await getContractOrThrow(tx, maHD);
    if (contract.trangThai !== "DANG_THUE") {
      throw new Error("Chỉ trả được xe của hợp đồng đang thuê");
    }
    await lockVehicle(tx, contract.maXe);
    const vehicle = await getVehicleOrThrow(tx, contract.maXe, { include: { loai_xe: true } });
    if (soKmThucTe != null && vehicle.soKmDaChay != null && soKmThucTe < vehicle.soKmDaChay) {
      throw new Error(`Số km thực tế không được nhỏ hơn số km hiện tại của xe (${vehicle.soKmDaChay})`);
    }

    const now = new Date();
    const phiTraTre = calcLateFee(contract.ngayTra, now, vehicle.loai_xe?.giaThueNgay);
    const { count } = await tx.hop_dong.updateMany({
      where: { maHD, trangThai: "DANG_THUE" },
      data: { trangThai: "DA_TRA", ngayTraThucTe: now, phiTraTre },
    });
    if (count === 0) throw new Error("Hợp đồng vừa bị thay đổi, vui lòng thử lại");

    await tx.tinh_trang_tra_xe.create({
      data: {
        maHD,
        ngayTra: now,
        tinhTrangXe: info.tinhTrangXe ?? null,
        mucNhienLieu,
        soKmThucTe,
        ghiChu: info.ghiChu ?? null,
      },
    });

    await tx.xe.update({
      where: { maXe: contract.maXe },
      data: {
        trangThai: "SAN_SANG",
        ...(soKmThucTe != null ? { soKmDaChay: soKmThucTe } : {}),
      },
    });

    return getContractOrThrow(tx, maHD);
  });
}

// Hủy hợp đồng (chỉ khi chưa giao xe) và hoàn tiền cho khách theo chính sách.
// Trả về { hopDong, hoanTien } (hoanTien = null nếu khách chưa thanh toán gì).
// options.loiCongTy = true: hủy do lỗi phía công ty (không có xe giao, xe trả trễ...)
// -> luôn hoàn 100%, không áp dụng phí hủy muộn.
export async function cancelContract(maHD, options = {}) {
  return prisma.$transaction(async (tx) => {
    await lockContract(tx, maHD);
    const contract = await getContractOrThrow(tx, maHD);
    if (!CANCELLABLE_CONTRACT_STATUSES.includes(contract.trangThai)) {
      throw new Error("Chỉ hủy được hợp đồng chưa giao xe");
    }
    const { count } = await tx.hop_dong.updateMany({
      where: { maHD, trangThai: { in: CANCELLABLE_CONTRACT_STATUSES } },
      data: { trangThai: "DA_HUY" },
    });
    if (count === 0) throw new Error("Hợp đồng vừa bị thay đổi, vui lòng thử lại");

    const now = new Date();
    const paid = sumOf(await tx.thanh_toan.aggregate({ where: { maHD }, _sum: { soTien: true } }));
    const refunded = sumOf(await tx.hoan_tien.aggregate({ where: { maHD }, _sum: { soTien: true } }));
    const rate = options.loiCongTy ? 1 : calcRefundRate(contract.trangThai, contract.ngayThue, now);
    const amount = Math.round((paid - refunded) * rate);

    let hoanTien = null;
    if (amount > 0) {
      hoanTien = await tx.hoan_tien.create({
        data: {
          maHD,
          soTien: amount,
          lyDo: options.loiCongTy
            ? "Hủy do lỗi phía công ty - hoàn 100%"
            : rate === 1
              ? "Hủy hợp đồng - hoàn 100%"
              : `Hủy hợp đồng muộn - hoàn ${Math.round(rate * 100)}%`,
          ngayHT: now,
        },
      });
    }
    return { hopDong: await getContractOrThrow(tx, maHD), hoanTien };
  });
}

// Đổi xe cho hợp đồng chưa giao (vd xe cũ trả trễ, hỏng): giữ nguyên tiền thuê.
// Điều kiện: xe mới sẵn sàng, không trùng lịch (kể cả đệm), số chỗ không ít hơn xe cũ,
// và không thuộc hạng đắt hơn trừ khi options.nangCapMienPhi = true (nâng hạng miễn phí).
export async function reassignVehicle(maHD, maXeMoi, options = {}) {
  return prisma.$transaction(async (tx) => {
    const contract = await getContractOrThrow(tx, maHD);
    if (!CANCELLABLE_CONTRACT_STATUSES.includes(contract.trangThai)) {
      throw new Error("Chỉ đổi xe được cho hợp đồng chưa giao xe");
    }
    if (contract.maXe === maXeMoi) throw new Error("Xe mới trùng với xe hiện tại");

    // Khóa theo thứ tự mã xe để hai thao tác đổi xe chéo nhau không bị deadlock
    for (const maXe of [contract.maXe, maXeMoi].sort((a, b) => a - b)) {
      await lockVehicle(tx, maXe);
    }
    const oldVehicle = await getVehicleOrThrow(tx, contract.maXe, { include: { loai_xe: true } });
    const newVehicle = await getVehicleOrThrow(tx, maXeMoi, { include: { loai_xe: true } });

    if (UNAVAILABLE_VEHICLE_STATUSES.includes(newVehicle.trangThai)) {
      throw new Error("Xe mới đang bảo trì hoặc ngừng hoạt động");
    }
    if (newVehicle.soCho < oldVehicle.soCho) {
      throw new Error("Xe mới có ít chỗ ngồi hơn xe cũ");
    }
    const oldPrice = Number(oldVehicle.loai_xe?.giaThueNgay ?? 0);
    const newPrice = Number(newVehicle.loai_xe?.giaThueNgay ?? 0);
    if (newPrice > oldPrice && !options.nangCapMienPhi) {
      throw new Error("Xe mới thuộc hạng đắt hơn, cần nangCapMienPhi = true để nâng hạng miễn phí");
    }
    const from = new Date(contract.ngayThue);
    const to = new Date(contract.ngayTra);
    if (await hasScheduleConflict(tx, maXeMoi, from, to, maHD)) {
      throw new Error("Xe mới đã có hợp đồng khác trong khoảng thời gian này");
    }

    const { count } = await tx.hop_dong.updateMany({
      where: { maHD, trangThai: { in: CANCELLABLE_CONTRACT_STATUSES } },
      data: { maXe: maXeMoi },
    });
    if (count === 0) throw new Error("Hợp đồng vừa bị thay đổi, vui lòng thử lại");
    return getContractOrThrow(tx, maHD);
  });
}

// Cảnh báo sớm: các hợp đồng sắp tới (chưa giao) mà xe có thể chưa kịp sẵn sàng vì
// hợp đồng đang thuê của xe đó sắp/đã quá hạn trả (tính cả thời gian đệm).
// Mỗi phần tử: { hopDongSapToi, hopDongDangThue, quaHan, soGioTre, xeSanSangDuKien }
// -> nhân viên xử lý bằng reassignVehicle (đổi xe), dời lịch hoặc cancelContract({ loiCongTy: true }).
export async function getAtRiskContracts() {
  const now = new Date();
  const renting = await prisma.hop_dong.findMany({
    where: { trangThai: "DANG_THUE" },
    include: { khach_hang: true, xe: true },
  });
  const atRisk = [];
  for (const current of renting) {
    const due = new Date(current.ngayTra);
    const overdue = now > due;
    // Dự kiến xe sẵn sàng: max(hạn trả, hiện tại) + thời gian đệm
    const readyAt = new Date(Math.max(due.getTime(), now.getTime()) + BUFFER_MS);
    const upcoming = await prisma.hop_dong.findMany({
      where: {
        maXe: current.maXe,
        trangThai: { in: ["CHO_XAC_NHAN", "DA_XAC_NHAN"] },
        ngayThue: { lt: readyAt },
      },
      include: { khach_hang: true },
      orderBy: { ngayThue: "asc" },
    });
    for (const next of upcoming) {
      atRisk.push({
        hopDongSapToi: next,
        hopDongDangThue: current,
        quaHan: overdue,
        soGioTre: overdue ? Math.ceil((now - due) / HOUR_MS) : 0,
        xeSanSangDuKien: readyAt,
      });
    }
  }
  return atRisk;
}

// ----- 1.2 Thanh toán -----

// Công nợ của một hợp đồng: tiền thuê + phí trả trễ - (đã thanh toán - đã hoàn).
// Hợp đồng đã hủy không còn nợ (conNo = 0).
// db: prisma (mặc định) hoặc tx khi gọi trong transaction.
export async function getContractBalance(maHD, db = prisma) {
  const contract = await getContractOrThrow(db, maHD);
  const paid = sumOf(await db.thanh_toan.aggregate({ where: { maHD }, _sum: { soTien: true } }));
  const refunded = sumOf(await db.hoan_tien.aggregate({ where: { maHD }, _sum: { soTien: true } }));
  const tienThue = Number(contract.tienThue ?? 0);
  const phiTraTre = Number(contract.phiTraTre ?? 0);
  const conNo = contract.trangThai === "DA_HUY" ? 0 : tienThue + phiTraTre - (paid - refunded);
  return { maHD, tienThue, phiTraTre, daThanhToan: paid, daHoan: refunded, conNo };
}

// Ghi nhận thanh toán (không cho trả vượt quá tiền thuê, không nhận cho hợp đồng đã hủy)
export async function addPayment(maHD, soTien, phuongThuc) {
  if (!(typeof soTien === "number" && Number.isFinite(soTien) && soTien > 0)) {
    throw new Error("Số tiền phải lớn hơn 0");
  }
  if (!PAYMENT_METHODS.includes(phuongThuc)) {
    throw new Error("Phương thức thanh toán không hợp lệ");
  }
  return prisma.$transaction(async (tx) => {
    await lockContract(tx, maHD);
    const contract = await getContractOrThrow(tx, maHD);
    if (contract.trangThai === "DA_HUY") {
      throw new Error("Hợp đồng đã hủy, không nhận thanh toán");
    }
    const { conNo } = await getContractBalance(maHD, tx);
    // so sánh theo đồng để tránh sai số số thực
    if (Math.round(soTien * 100) > Math.round(conNo * 100)) {
      throw new Error(`Số tiền vượt quá số còn nợ (${conNo})`);
    }
    return tx.thanh_toan.create({
      data: { maHD, soTien, phuongThuc, ngayTT: new Date() },
    });
  });
}

// ----- 1.3 Bảo trì -----

// Bắt đầu bảo trì xe: xe -> DANG_BAO_TRI
export async function startMaintenance(maXe, noiDung, chiPhi = 0) {
  if (!(Number.isFinite(Number(chiPhi)) && Number(chiPhi) >= 0)) {
    throw new Error("Chi phí bảo trì không hợp lệ");
  }
  return prisma.$transaction(async (tx) => {
    await lockVehicle(tx, maXe);
    const vehicle = await getVehicleOrThrow(tx, maXe);
    if (vehicle.trangThai === "DANG_THUE") {
      throw new Error("Xe đang được thuê, không thể bảo trì lúc này");
    }
    if (vehicle.trangThai === "DANG_BAO_TRI") {
      throw new Error("Xe đang trong quá trình bảo trì");
    }
    if (vehicle.trangThai === "NGUNG_HOAT_DONG") {
      throw new Error("Xe đã ngừng hoạt động, không thể bảo trì");
    }
    const upcoming = await tx.hop_dong.findFirst({
      where: {
        maXe,
        trangThai: { in: ACTIVE_CONTRACT_STATUSES },
        ngayTra: { gt: new Date() },
      },
    });
    if (upcoming) {
      throw new Error("Xe đã có hợp đồng sắp tới, không thể bảo trì lúc này");
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

// Hoàn thành bảo trì: xe -> SAN_SANG (chỉ khi xe đang bảo trì và không còn phiếu mở khác)
export async function completeMaintenance(maBT, chiPhi) {
  if (chiPhi != null && !(Number.isFinite(Number(chiPhi)) && Number(chiPhi) >= 0)) {
    throw new Error("Chi phí bảo trì không hợp lệ");
  }
  return prisma.$transaction(async (tx) => {
    const maintenance = await getMaintenanceOrThrow(tx, maBT);
    if (maintenance.trangThai === "DA_HOAN_THANH") {
      throw new Error("Phiếu này đã hoàn thành");
    }
    await lockVehicle(tx, maintenance.maXe);
    const { count } = await tx.bao_tri.updateMany({
      where: { maBT, trangThai: { not: "DA_HOAN_THANH" } },
      data: {
        trangThai: "DA_HOAN_THANH",
        ngayKetThuc: new Date(),
        ...(chiPhi != null ? { chiPhi } : {}),
      },
    });
    if (count === 0) throw new Error("Phiếu này đã hoàn thành");

    const stillOpen = await tx.bao_tri.count({
      where: { maXe: maintenance.maXe, trangThai: { not: "DA_HOAN_THANH" } },
    });
    if (stillOpen === 0) {
      const vehicle = await getVehicleOrThrow(tx, maintenance.maXe);
      if (vehicle.trangThai === "DANG_BAO_TRI") {
        await tx.xe.update({ where: { maXe: maintenance.maXe }, data: { trangThai: "SAN_SANG" } });
      }
    }
    return getMaintenanceOrThrow(tx, maBT);
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

// Doanh thu thực thu (tiền đã thanh toán - tiền đã hoàn) theo 12 tháng của một năm
export async function getMonthlyRevenue(year) {
  const range = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
  const payments = await prisma.thanh_toan.findMany({ where: { ngayTT: range } });
  const refunds = await prisma.hoan_tien.findMany({ where: { ngayHT: range } });
  const months = Array.from({ length: 12 }, (_, i) => ({ thang: i + 1, doanhThu: 0 }));
  for (const payment of payments) {
    months[new Date(payment.ngayTT).getMonth()].doanhThu += Number(payment.soTien);
  }
  for (const refund of refunds) {
    months[new Date(refund.ngayHT).getMonth()].doanhThu -= Number(refund.soTien);
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