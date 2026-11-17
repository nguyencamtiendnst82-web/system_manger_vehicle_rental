// chucnang.integration.js - TEST TICH HOP chay tren MySQL THAT (khong mock)
//
// Kiem tra nhung thu unit test (mock) khong bat duoc: khoa dong chong dat trung /
// thanh toan vuot khi nhieu nguoi thao tac cung luc, rang buoc CHECK/UNIQUE cua DB,
// va tinh nhat quan cua du lieu mau (prisma/seed.js).
//
// CANH BAO: file nay XOA SACH du lieu trong 9 bang. Chi chay tren DATABASE TEST rieng.
//
// Cach chay (Windows CMD):
//   1) Tao DB:  CREATE DATABASE manager_vehicle_rent_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
//   2) set TEST_DATABASE_URL=mysql://root:<mat_khau>@localhost:3306/manager_vehicle_rent_test
//   3) Chay migrate deploy trong terminal rieng voi DATABASE_URL=TEST_DATABASE_URL.
//   4) Mo terminal moi, chi dat TEST_DATABASE_URL va ALLOW_DESTRUCTIVE_TEST_DB=YES.
//   5) npm run test:integration (DATABASE_URL phai tro toi DB ung dung khac).
// (Khong dat TEST_DATABASE_URL thi toan bo test nay tu dong bi bo qua.)
import "dotenv/config";
import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getIsolatedTestDatabaseUrl } from "../../testDatabaseSafety.js";

const TEST_URL = process.env.TEST_DATABASE_URL;
const APPLICATION_URL = process.env.DATABASE_URL;
const skip = TEST_URL ? false : "Chưa đặt TEST_DATABASE_URL, bỏ qua test tích hợp";

let prisma;
let cn;
if (TEST_URL) {
  process.env.DATABASE_URL = getIsolatedTestDatabaseUrl({
    testUrl: TEST_URL,
    applicationUrl: APPLICATION_URL,
  });
  ({ prisma } = await import("../../prismaClient.js"));
  cn = await import("../../chucnang.js");
}

// ----- Tiện ích -----
const HOUR = 3600 * 1000;
const at = (hours) => new Date(Date.now() + hours * HOUR);
const num = (decimal) => Number(decimal);

async function wipe() {
  await prisma.tinh_trang_tra_xe.deleteMany();
  await prisma.hoan_tien.deleteMany();
  await prisma.thanh_toan.deleteMany();
  await prisma.bao_tri.deleteMany();
  await prisma.hop_dong.deleteMany();
  await prisma.xe.deleteMany();
  await prisma.loai_xe.deleteMany();
  await prisma.khach_hang.deleteMany();
  await prisma.nhan_vien.deleteMany();
}

// Dữ liệu nền: 1 nhân viên, 2 khách, 1 loại xe (500.000đ/ngày), 3 xe 4 chỗ
async function baseline() {
  await prisma.nhan_vien.create({ data: { maNV: 1, hoTen: "NV Test" } });
  await prisma.khach_hang.createMany({
    data: [
      { maKH: 1, hoTen: "KH 1", CCCD: "T001" },
      { maKH: 2, hoTen: "KH 2", CCCD: "T002" },
    ],
  });
  await prisma.loai_xe.create({ data: { maLoaiXe: 1, tenLoaiXe: "Xe 4 cho", hangXe: "Toyota", giaThueNgay: 500000 } });
  await prisma.xe.createMany({
    data: [1, 2, 3].map((maXe) => ({
      maXe, maLoaiXe: 1, bienSoXe: `T-${maXe}`, soCho: 4, soKmDaChay: 1000, trangThai: "SAN_SANG",
    })),
  });
}

// Tạo thẳng hợp đồng trong DB (bỏ qua nghiệp vụ) để dựng tình huống
const makeContract = (data) =>
  prisma.hop_dong.create({ data: { maKH: 1, maXe: 1, maNV: 1, tienThue: 1000000, ...data } });

const xeOf = (maXe) => prisma.xe.findUnique({ where: { maXe } });
const contractOf = (maHD) => prisma.hop_dong.findUnique({ where: { maHD } });

describe("Tích hợp MySQL", { skip }, () => {
  before(async () => { await wipe(); });
  after(async () => { await wipe(); await prisma.$disconnect(); });
  beforeEach(async () => { await wipe(); await baseline(); });

  // =====================================================
  // Vòng đời hợp đồng
  // =====================================================
  test("IT01 - Vòng đời đầy đủ: đặt -> xác nhận -> giao -> thanh toán -> trả (đúng hạn)", async () => {
    const hd = await cn.createContract({
      maKH: 1, maXe: 1, maNV: 1, ngayThue: "2030-03-01T08:00:00Z", ngayTra: "2030-03-03T08:00:00Z",
    });
    assert.equal(num(hd.tienThue), 1000000); // 2 ngày x 500.000, tự tính
    assert.equal(hd.trangThai, "CHO_XAC_NHAN");

    await cn.confirmContract(hd.maHD);
    await cn.handOverVehicle(hd.maHD);
    assert.equal((await xeOf(1)).trangThai, "DANG_THUE");

    await cn.addPayment(hd.maHD, 1000000, "TIEN_MAT");
    const done = await cn.returnVehicle(hd.maHD, { tinhTrangXe: "Tot", mucNhienLieu: 80, soKmThucTe: 1300 });

    assert.equal(done.trangThai, "DA_TRA");
    assert.equal(num(done.phiTraTre), 0);
    const xe = await xeOf(1);
    assert.equal(xe.trangThai, "SAN_SANG");
    assert.equal(xe.soKmDaChay, 1300);
    assert.equal((await cn.getContractBalance(hd.maHD)).conNo, 0);
  });

  test("IT02 - Trả trễ 5,5 giờ: phí = 6 giờ x (500000/24) x 1,5 = 187.500", async () => {
    const hd = await makeContract({ ngayThue: at(-48), ngayTra: at(-5.5), trangThai: "DANG_THUE" });
    await prisma.xe.update({ where: { maXe: 1 }, data: { trangThai: "DANG_THUE" } });

    const done = await cn.returnVehicle(hd.maHD, { soKmThucTe: 1100 });
    assert.equal(num(done.phiTraTre), 187500);
    const balance = await cn.getContractBalance(hd.maHD);
    assert.equal(balance.conNo, 1000000 + 187500); // chưa thanh toán gì
  });

  test("IT03 - Không trả được hợp đồng hai lần (UNIQUE tinh_trang_tra_xe.maHD + trạng thái)", async () => {
    const hd = await makeContract({ ngayThue: at(-48), ngayTra: at(24), trangThai: "DANG_THUE" });
    await cn.returnVehicle(hd.maHD, {});
    await assert.rejects(() => cn.returnVehicle(hd.maHD, {}), /Chỉ trả được xe của hợp đồng đang thuê/);
    assert.equal(await prisma.tinh_trang_tra_xe.count({ where: { maHD: hd.maHD } }), 1);
  });

  test("IT28 - Rollback cập nhật hợp đồng khi ghi tình trạng trả xe bị lỗi", async () => {
    const hd = await makeContract({
      ngayThue: at(-24),
      ngayTra: at(24),
      trangThai: "DANG_THUE",
    });
    await prisma.xe.update({ where: { maXe: 1 }, data: { trangThai: "DANG_THUE" } });
    await prisma.tinh_trang_tra_xe.create({ data: { maHD: hd.maHD } });

    await assert.rejects(() => cn.returnVehicle(hd.maHD, {}));

    const contractAfterFailure = await contractOf(hd.maHD);
    assert.equal(contractAfterFailure.trangThai, "DANG_THUE");
    assert.equal(contractAfterFailure.ngayTraThucTe, null);
    assert.equal(num(contractAfterFailure.phiTraTre), 0);
    assert.equal((await xeOf(1)).trangThai, "DANG_THUE");
    assert.equal(await prisma.tinh_trang_tra_xe.count({ where: { maHD: hd.maHD } }), 1);
  });

  // =====================================================
  // Đồng thời (khóa dòng FOR UPDATE)
  // =====================================================
  test("IT04 - 4 người đặt cùng một xe cùng lúc: chỉ 1 người thành công", async () => {
    const dat = (maKH) =>
      cn.createContract({ maKH, maXe: 1, maNV: 1, ngayThue: "2030-04-01T08:00:00Z", ngayTra: "2030-04-03T08:00:00Z" });
    const results = await Promise.allSettled([dat(1), dat(2), dat(1), dat(2)]);

    const ok = results.filter((r) => r.status === "fulfilled");
    const loi = results.filter((r) => r.status === "rejected");
    assert.equal(ok.length, 1, JSON.stringify(results.map((r) => r.reason?.message)));
    for (const r of loi) assert.match(r.reason.message, /đã có hợp đồng khác/);
    assert.equal(await prisma.hop_dong.count({ where: { maXe: 1 } }), 1);
  });

  test("IT05 - 3 khoản thanh toán 600.000 cùng lúc cho hợp đồng 1.000.000: chỉ 1 khoản thành công", async () => {
    const hd = await makeContract({ ngayThue: at(48), ngayTra: at(72), trangThai: "CHO_XAC_NHAN" });
    const results = await Promise.allSettled([1, 2, 3].map(() => cn.addPayment(hd.maHD, 600000, "CHUYEN_KHOAN")));

    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const balance = await cn.getContractBalance(hd.maHD);
    assert.equal(balance.daThanhToan, 600000);
    assert.ok(balance.conNo >= 0);
  });

  test("IT06 - Hủy và thanh toán cùng lúc: không để lại khoản thanh toán chưa được hoàn", async () => {
    const hd = await makeContract({ ngayThue: at(100), ngayTra: at(150), trangThai: "DA_XAC_NHAN" });
    await Promise.allSettled([cn.addPayment(hd.maHD, 400000, "TIEN_MAT"), cn.cancelContract(hd.maHD)]);

    const balance = await cn.getContractBalance(hd.maHD);
    const status = (await contractOf(hd.maHD)).trangThai;
    assert.equal(status, "DA_HUY");
    // Đã trả bao nhiêu thì (hủy sớm, hoàn 100%) phải hoàn đủ bấy nhiêu
    assert.equal(balance.daThanhToan, balance.daHoan);
  });

  // =====================================================
  // Thời gian đệm 4 giờ
  // =====================================================
  test("IT07 - Đệm 4 giờ: sau 2 giờ bị từ chối, đúng 4 giờ được chấp nhận", async () => {
    await cn.createContract({ maKH: 1, maXe: 1, maNV: 1, ngayThue: "2030-05-01T08:00:00Z", ngayTra: "2030-05-03T08:00:00Z" });

    await assert.rejects(
      () => cn.createContract({ maKH: 2, maXe: 1, maNV: 1, ngayThue: "2030-05-03T10:00:00Z", ngayTra: "2030-05-04T10:00:00Z" }),
      /đã có hợp đồng khác/
    );
    const ok = await cn.createContract({
      maKH: 2, maXe: 1, maNV: 1, ngayThue: "2030-05-03T12:00:00Z", ngayTra: "2030-05-04T12:00:00Z",
    });
    assert.equal(ok.trangThai, "CHO_XAC_NHAN");
  });

  test("IT08 - findAvailableVehicles loại xe có lịch (kể cả đệm), giữ xe khác và lọc theo loại", async () => {
    await cn.createContract({ maKH: 1, maXe: 1, maNV: 1, ngayThue: "2030-06-01T08:00:00Z", ngayTra: "2030-06-03T08:00:00Z" });
    const list = await cn.findAvailableVehicles("2030-06-03T09:00:00Z", "2030-06-04T09:00:00Z");
    assert.deepEqual(list.map((x) => x.maXe).sort(), [2, 3]); // xe 1 còn trong thời gian đệm
    const khongCoLoai = await cn.findAvailableVehicles("2030-06-10T00:00:00Z", "2030-06-11T00:00:00Z", 999);
    assert.equal(khongCoLoai.length, 0);
  });

  // =====================================================
  // Hủy và hoàn tiền
  // =====================================================
  test("IT09 - Hủy sớm (>= 24h): hoàn 100%, công nợ về 0, có dòng hoan_tien", async () => {
    const hd = await makeContract({ ngayThue: at(100), ngayTra: at(150), trangThai: "DA_XAC_NHAN" });
    await cn.addPayment(hd.maHD, 600000, "TIEN_MAT");

    const { hopDong, hoanTien } = await cn.cancelContract(hd.maHD);
    assert.equal(hopDong.trangThai, "DA_HUY");
    assert.equal(num(hoanTien.soTien), 600000);
    assert.equal(await prisma.hoan_tien.count({ where: { maHD: hd.maHD } }), 1);
    assert.equal((await cn.getContractBalance(hd.maHD)).conNo, 0);
  });

  test("IT10 - Hủy muộn (< 24h): hoàn 70%; hủy do lỗi công ty: hoàn 100%", async () => {
    const muon = await makeContract({ ngayThue: at(2), ngayTra: at(48), trangThai: "DA_XAC_NHAN" });
    await cn.addPayment(muon.maHD, 600000, "TIEN_MAT");
    assert.equal(num((await cn.cancelContract(muon.maHD)).hoanTien.soTien), 420000);

    const loiCongTy = await makeContract({ ngayThue: at(2), ngayTra: at(48), trangThai: "DA_XAC_NHAN" });
    await cn.addPayment(loiCongTy.maHD, 600000, "TIEN_MAT");
    assert.equal(num((await cn.cancelContract(loiCongTy.maHD, { loiCongTy: true })).hoanTien.soTien), 600000);
  });

  test("IT11 - Doanh thu tháng = thu - hoàn", async () => {
    const hd = await makeContract({ ngayThue: at(100), ngayTra: at(150), trangThai: "DA_XAC_NHAN" });
    await cn.addPayment(hd.maHD, 600000, "TIEN_MAT");
    await cn.cancelContract(hd.maHD);
    const year = new Date().getFullYear();
    const total = (await cn.getMonthlyRevenue(year)).reduce((sum, m) => sum + m.doanhThu, 0);
    assert.equal(total, 0); // thu 600.000, hoàn 600.000
  });

  // =====================================================
  // Đổi xe và cảnh báo trả trễ
  // =====================================================
  test("IT12 - Đổi xe: thành công khi xe mới trống; bị từ chối khi xe mới có lịch trùng", async () => {
    const a = await cn.createContract({ maKH: 1, maXe: 1, maNV: 1, ngayThue: "2030-07-01T08:00:00Z", ngayTra: "2030-07-03T08:00:00Z" });
    await cn.createContract({ maKH: 2, maXe: 2, maNV: 1, ngayThue: "2030-07-02T08:00:00Z", ngayTra: "2030-07-04T08:00:00Z" });

    await assert.rejects(() => cn.reassignVehicle(a.maHD, 2), /đã có hợp đồng khác/);
    assert.equal((await contractOf(a.maHD)).maXe, 1);

    const moved = await cn.reassignVehicle(a.maHD, 3);
    assert.equal(moved.maXe, 3);
    assert.equal(num(moved.tienThue), 1000000); // giữ nguyên tiền thuê
  });

  test("IT13 - getAtRiskContracts: xe quá hạn 3 giờ + hợp đồng sắp tới sau 2 giờ -> cảnh báo", async () => {
    const dangThue = await makeContract({ ngayThue: at(-30), ngayTra: at(-3), trangThai: "DANG_THUE" });
    await prisma.xe.update({ where: { maXe: 1 }, data: { trangThai: "DANG_THUE" } });
    const sapToi = await makeContract({ maKH: 2, ngayThue: at(2), ngayTra: at(50), trangThai: "DA_XAC_NHAN" });

    const rows = await cn.getAtRiskContracts();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].hopDongSapToi.maHD, sapToi.maHD);
    assert.equal(rows[0].hopDongDangThue.maHD, dangThue.maHD);
    assert.equal(rows[0].quaHan, true);
    assert.equal(rows[0].soGioTre, 3);
  });

  test("IT14 - Giao xe bị chặn khi xe chưa được khách trước trả", async () => {
    await makeContract({ ngayThue: at(-30), ngayTra: at(-3), trangThai: "DANG_THUE" });
    await prisma.xe.update({ where: { maXe: 1 }, data: { trangThai: "DANG_THUE" } });
    const sapToi = await makeContract({ maKH: 2, ngayThue: at(2), ngayTra: at(50), trangThai: "DA_XAC_NHAN" });

    await assert.rejects(() => cn.handOverVehicle(sapToi.maHD), /chưa được trả/);
    assert.equal((await contractOf(sapToi.maHD)).trangThai, "DA_XAC_NHAN");
  });

  // =====================================================
  // Bảo trì
  // =====================================================
  test("IT15 - Bảo trì: chặn khi có hợp đồng sắp tới; không tạo phiếu thứ hai; hoàn thành trả xe về SAN_SANG", async () => {
    await cn.createContract({ maKH: 1, maXe: 1, maNV: 1, ngayThue: "2030-08-01T08:00:00Z", ngayTra: "2030-08-03T08:00:00Z" });
    await assert.rejects(() => cn.startMaintenance(1, "Thay nhớt"), /hợp đồng sắp tới/);

    const phieu = await cn.startMaintenance(2, "Thay nhớt", 300000);
    assert.equal((await xeOf(2)).trangThai, "DANG_BAO_TRI");
    await assert.rejects(() => cn.startMaintenance(2, "Lần hai"), /đang trong quá trình bảo trì/);

    await cn.completeMaintenance(phieu.maBT, 350000);
    assert.equal((await xeOf(2)).trangThai, "SAN_SANG");
    const costs = await cn.getMaintenanceCostByVehicle();
    assert.equal(costs.find((c) => c.maXe === 2).tongChiPhi, 350000);
  });

  // =====================================================
  // Ràng buộc của DB (CHECK / UNIQUE)
  // =====================================================
  test("IT16 - DB từ chối: ngày trả <= ngày thuê, số tiền <= 0, nhiên liệu > 100, trả xe trùng hợp đồng", async () => {
    await assert.rejects(() => makeContract({ ngayThue: at(10), ngayTra: at(5) }));
    const hd = await makeContract({ ngayThue: at(1), ngayTra: at(2) });
    await assert.rejects(() => prisma.thanh_toan.create({ data: { maHD: hd.maHD, soTien: 0, phuongThuc: "TIEN_MAT" } }));
    await assert.rejects(() => prisma.hoan_tien.create({ data: { maHD: hd.maHD, soTien: -5 } }));
    await assert.rejects(() => prisma.tinh_trang_tra_xe.create({ data: { maHD: hd.maHD, mucNhienLieu: 150 } }));

    await prisma.tinh_trang_tra_xe.create({ data: { maHD: hd.maHD, mucNhienLieu: 50 } });
    await assert.rejects(() => prisma.tinh_trang_tra_xe.create({ data: { maHD: hd.maHD, mucNhienLieu: 60 } }));
  });

  test("IT17 - DB từ chối xóa khi còn dữ liệu liên quan (RESTRICT) và biển số/CCCD trùng (UNIQUE)", async () => {
    await makeContract({ ngayThue: at(1), ngayTra: at(2) });
    await assert.rejects(() => prisma.xe.delete({ where: { maXe: 1 } }));
    await assert.rejects(() => prisma.khach_hang.delete({ where: { maKH: 1 } }));
    await assert.rejects(() => prisma.xe.create({ data: { maLoaiXe: 1, bienSoXe: "T-1", soCho: 4 } }));
    await assert.rejects(() => prisma.khach_hang.create({ data: { hoTen: "Trùng", CCCD: "T001" } }));
  });
});

// =====================================================
// Dữ liệu mẫu (prisma/seed.js) phải tự nhất quán
// =====================================================
describe("Tích hợp MySQL - Dữ liệu mẫu", { skip }, () => {
  const projectRoot = fileURLToPath(new URL("../../../", import.meta.url));
  let xe, hopDong, baoTri, thanhToan, hoanTien, traXe, loaiXe;

  before(async () => {
    await wipe();
    execFileSync(process.execPath, ["prisma/seed.js"], {
      cwd: projectRoot,
      env: {
        ...process.env,
        DATABASE_URL: APPLICATION_URL,
        TEST_DATABASE_URL: TEST_URL,
      },
      stdio: "pipe",
    });
    [xe, hopDong, baoTri, thanhToan, hoanTien, traXe, loaiXe] = await Promise.all([
      prisma.xe.findMany(), prisma.hop_dong.findMany(), prisma.bao_tri.findMany(),
      prisma.thanh_toan.findMany(), prisma.hoan_tien.findMany(), prisma.tinh_trang_tra_xe.findMany(), prisma.loai_xe.findMany(),
    ]);
  });
  after(async () => { await wipe(); });

  test("IT20 - Xe DANG_THUE <=> có đúng 1 hợp đồng DANG_THUE", () => {
    for (const x of xe) {
      const dangThue = hopDong.filter((h) => h.maXe === x.maXe && h.trangThai === "DANG_THUE").length;
      assert.equal(x.trangThai === "DANG_THUE", dangThue > 0, `xe ${x.maXe}`);
      assert.ok(dangThue <= 1, `xe ${x.maXe} có ${dangThue} hợp đồng đang thuê`);
    }
  });

  test("IT21 - Xe DANG_BAO_TRI <=> có phiếu bảo trì chưa hoàn thành", () => {
    for (const x of xe) {
      const moPhieu = baoTri.some((b) => b.maXe === x.maXe && b.trangThai !== "DA_HOAN_THANH");
      assert.equal(x.trangThai === "DANG_BAO_TRI", moPhieu, `xe ${x.maXe}`);
    }
  });

  test("IT22 - Hợp đồng DA_TRA có ngày trả thực tế + 1 bản ghi trả xe; hợp đồng khác thì không", () => {
    for (const h of hopDong) {
      const soBanGhi = traXe.filter((t) => t.maHD === h.maHD).length;
      if (h.trangThai === "DA_TRA") {
        assert.ok(h.ngayTraThucTe, `HD${h.maHD} thiếu ngayTraThucTe`);
        assert.equal(soBanGhi, 1, `HD${h.maHD}`);
      } else {
        assert.equal(h.ngayTraThucTe, null, `HD${h.maHD}`);
        assert.equal(soBanGhi, 0, `HD${h.maHD}`);
      }
    }
  });

  test("IT23 - Km của xe >= km thực tế đã ghi khi trả", () => {
    for (const x of xe) {
      const hdIds = hopDong.filter((h) => h.maXe === x.maXe).map((h) => h.maHD);
      for (const t of traXe.filter((r) => hdIds.includes(r.maHD) && r.soKmThucTe != null)) {
        assert.ok(x.soKmDaChay >= t.soKmThucTe, `xe ${x.maXe}: ${x.soKmDaChay} < ${t.soKmThucTe}`);
      }
    }
  });

  test("IT24 - Thanh toán: hợp đồng đã trả đủ (thuê + phí trễ); không vượt; hoàn <= đã thu", () => {
    for (const h of hopDong) {
      const thu = thanhToan.filter((t) => t.maHD === h.maHD).reduce((s, t) => s + num(t.soTien), 0);
      const hoan = hoanTien.filter((t) => t.maHD === h.maHD).reduce((s, t) => s + num(t.soTien), 0);
      assert.ok(hoan <= thu, `HD${h.maHD}: hoàn ${hoan} > thu ${thu}`);
      if (h.trangThai !== "DA_HUY") {
        const phaiTra = num(h.tienThue) + num(h.phiTraTre);
        assert.ok(thu - hoan <= phaiTra, `HD${h.maHD}: thu vượt`);
        if (h.trangThai === "DA_TRA") assert.equal(thu - hoan, phaiTra, `HD${h.maHD} chưa trả đủ`);
      }
    }
  });

  test("IT25 - Không có hai hợp đồng đang hiệu lực của cùng một xe chồng lịch (kể cả đệm 4 giờ)", () => {
    const hieuLuc = hopDong.filter((h) => ["CHO_XAC_NHAN", "DA_XAC_NHAN", "DANG_THUE"].includes(h.trangThai));
    for (const a of hieuLuc) {
      for (const b of hieuLuc) {
        if (a.maHD >= b.maHD || a.maXe !== b.maXe) continue;
        const chong = a.ngayThue < new Date(b.ngayTra.getTime() + 4 * HOUR) && b.ngayThue < new Date(a.ngayTra.getTime() + 4 * HOUR);
        assert.equal(chong, false, `HD${a.maHD} và HD${b.maHD} chồng lịch`);
      }
    }
  });

  test("IT26 - Tiền thuê = số ngày (làm tròn lên) x giá thuê ngày của loại xe", () => {
    for (const h of hopDong) {
      const xeCuaHD = xe.find((x) => x.maXe === h.maXe);
      const gia = num(loaiXe.find((l) => l.maLoaiXe === xeCuaHD.maLoaiXe).giaThueNgay);
      const soNgay = Math.max(1, Math.ceil((h.ngayTra - h.ngayThue) / (24 * HOUR)));
      assert.equal(num(h.tienThue), soNgay * gia, `HD${h.maHD}`);
    }
  });

  test("IT27 - Có hợp đồng đã hủy kèm hoàn tiền, và có hợp đồng trả trễ kèm phí", () => {
    const huy = hopDong.filter((h) => h.trangThai === "DA_HUY");
    assert.ok(huy.length >= 1);
    for (const h of huy) assert.ok(hoanTien.some((t) => t.maHD === h.maHD), `HD${h.maHD} chưa có hoàn tiền`);
    assert.ok(hopDong.some((h) => num(h.phiTraTre) > 0));
  });
});
