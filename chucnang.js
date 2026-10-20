// chucnang.js - Nghiệp vụ và thống kê của hệ thống quản lý cho thuê xe.
// CRUD của từng bảng đã được tách ra thư mục crud/ (xem crud/index.js).
//
// Phần 1: Nghiệp vụ (đặt xe, giao xe, trả xe, thanh toán, bảo trì)
// Phần 2: Thống kê
//
// Lưu ý: tên model (xe, hop_dong, khach_hang...) và tên quan hệ trong include
// phải khớp với prisma/schema.prisma sau khi chạy `npx prisma db pull`.

import { prisma } from "./prismaClient.js";

// Các trạng thái hợp đồng đang "giữ" xe (xe không được cho thuê trùng)
const HD_DANG_GIU_XE = ["CHO_XAC_NHAN", "DA_XAC_NHAN", "DANG_THUE"];

// =====================================================
// PHẦN 1: NGHIỆP VỤ
// =====================================================

// Kiểm tra xe có bị trùng lịch trong khoảng [tu, den) không
async function xeBiTrungLich(tx, maXe, tu, den, boQuaMaHD) {
  const trung = await tx.hop_dong.findFirst({
    where: {
      maXe,
      trangThai: { in: HD_DANG_GIU_XE },
      ...(boQuaMaHD ? { maHD: { not: boQuaMaHD } } : {}),
      ngayThue: { lt: den },
      ngayTra: { gt: tu },
    },
  });
  return trung !== null;
}

// Tìm các xe có thể thuê trong khoảng thời gian (không bảo trì và không trùng lịch)
export async function timXeCoTheThue(ngayThue, ngayTra) {
  const tu = new Date(ngayThue);
  const den = new Date(ngayTra);
  const xeBan = await prisma.hop_dong.findMany({
    where: {
      trangThai: { in: HD_DANG_GIU_XE },
      ngayThue: { lt: den },
      ngayTra: { gt: tu },
    },
    select: { maXe: true },
  });
  const dsXeBan = xeBan.map((h) => h.maXe);
  return prisma.xe.findMany({
    where: {
      trangThai: { in: ["SAN_SANG", "DANG_THUE"] },
      maXe: { notIn: dsXeBan },
    },
    include: { loai_xe: true },
  });
}

// Đặt xe: tạo hợp đồng ở trạng thái CHO_XAC_NHAN
export async function taoHopDong({ maKH, maXe, maNV, ngayThue, ngayTra, tienThue }) {
  const tu = new Date(ngayThue);
  const den = new Date(ngayTra);
  if (!(den > tu)) throw new Error("Ngày trả phải sau ngày thuê");

  return prisma.$transaction(async (tx) => {
    const x = await tx.xe.findUnique({ where: { maXe } });
    if (!x) throw new Error("Không tìm thấy xe");
    if (["DANG_BAO_TRI", "NGUNG_HOAT_DONG"].includes(x.trangThai)) {
      throw new Error("Xe đang bảo trì hoặc ngừng hoạt động");
    }
    if (await xeBiTrungLich(tx, maXe, tu, den)) {
      throw new Error("Xe đã có hợp đồng khác trong khoảng thời gian này");
    }
    return tx.hop_dong.create({
      data: {
        maKH,
        maXe,
        maNV,
        ngayThue: tu,
        ngayTra: den,
        tienThue,
        trangThai: "CHO_XAC_NHAN",
      },
    });
  });
}

// Xác nhận hợp đồng: CHO_XAC_NHAN -> DA_XAC_NHAN
export async function xacNhanHopDong(maHD) {
  const hd = await prisma.hop_dong.findUnique({ where: { maHD } });
  if (!hd) throw new Error("Không tìm thấy hợp đồng");
  if (hd.trangThai !== "CHO_XAC_NHAN") {
    throw new Error("Chỉ xác nhận được hợp đồng đang chờ xác nhận");
  }
  return prisma.hop_dong.update({ where: { maHD }, data: { trangThai: "DA_XAC_NHAN" } });
}

// Giao xe cho khách: hợp đồng -> DANG_THUE, xe -> DANG_THUE
export async function giaoXe(maHD) {
  return prisma.$transaction(async (tx) => {
    const hd = await tx.hop_dong.findUnique({ where: { maHD }, include: { xe: true } });
    if (!hd) throw new Error("Không tìm thấy hợp đồng");
    if (hd.trangThai !== "DA_XAC_NHAN") {
      throw new Error("Hợp đồng phải ở trạng thái đã xác nhận mới giao xe được");
    }
    if (["DANG_BAO_TRI", "NGUNG_HOAT_DONG"].includes(hd.xe.trangThai)) {
      throw new Error("Xe đang bảo trì hoặc ngừng hoạt động");
    }
    await tx.xe.update({ where: { maXe: hd.maXe }, data: { trangThai: "DANG_THUE" } });
    return tx.hop_dong.update({ where: { maHD }, data: { trangThai: "DANG_THUE" } });
  });
}

// Nhận xe trả: ghi tình trạng, cập nhật km, đưa xe về SAN_SANG
// thongTin = { tinhTrangXe, mucNhienLieu, soKmThucTe, ghiChu }
export async function traXe(maHD, thongTin = {}) {
  return prisma.$transaction(async (tx) => {
    const hd = await tx.hop_dong.findUnique({ where: { maHD } });
    if (!hd) throw new Error("Không tìm thấy hợp đồng");
    if (hd.trangThai !== "DANG_THUE") {
      throw new Error("Chỉ trả được xe của hợp đồng đang thuê");
    }
    const bayGio = new Date();

    await tx.tinh_trang_tra_xe.create({
      data: {
        maHD,
        ngayTra: bayGio,
        tinhTrangXe: thongTin.tinhTrangXe ?? null,
        mucNhienLieu: thongTin.mucNhienLieu ?? null,
        soKmThucTe: thongTin.soKmThucTe ?? null,
        ghiChu: thongTin.ghiChu ?? null,
      },
    });

    await tx.xe.update({
      where: { maXe: hd.maXe },
      data: {
        trangThai: "SAN_SANG",
        ...(thongTin.soKmThucTe != null ? { soKmDaChay: thongTin.soKmThucTe } : {}),
      },
    });

    return tx.hop_dong.update({
      where: { maHD },
      data: { trangThai: "DA_TRA", ngayTraThucTe: bayGio },
    });
  });
}

// Hủy hợp đồng (chỉ khi chưa giao xe)
export async function huyHopDong(maHD) {
  const hd = await prisma.hop_dong.findUnique({ where: { maHD } });
  if (!hd) throw new Error("Không tìm thấy hợp đồng");
  if (!["CHO_XAC_NHAN", "DA_XAC_NHAN"].includes(hd.trangThai)) {
    throw new Error("Chỉ hủy được hợp đồng chưa giao xe");
  }
  return prisma.hop_dong.update({ where: { maHD }, data: { trangThai: "DA_HUY" } });
}

// Tổng đã thanh toán và số tiền còn nợ của một hợp đồng
export async function congNoHopDong(maHD) {
  const hd = await prisma.hop_dong.findUnique({ where: { maHD } });
  if (!hd) throw new Error("Không tìm thấy hợp đồng");
  const tong = await prisma.thanh_toan.aggregate({
    where: { maHD },
    _sum: { soTien: true },
  });
  const daTra = Number(tong._sum.soTien ?? 0);
  const tienThue = Number(hd.tienThue);
  return { maHD, tienThue, daThanhToan: daTra, conNo: tienThue - daTra };
}

// Ghi nhận thanh toán (không cho trả vượt quá tiền thuê)
export async function themThanhToan(maHD, soTien, phuongThuc) {
  if (!(soTien > 0)) throw new Error("Số tiền phải lớn hơn 0");
  const { conNo } = await congNoHopDong(maHD);
  if (soTien > conNo) {
    throw new Error(`Số tiền vượt quá số còn nợ (${conNo})`);
  }
  return prisma.thanh_toan.create({
    data: { maHD, soTien, phuongThuc, ngayTT: new Date() },
  });
}

// Bắt đầu bảo trì xe: xe -> DANG_BAO_TRI
export async function batDauBaoTri(maXe, noiDung, chiPhi = 0) {
  return prisma.$transaction(async (tx) => {
    const x = await tx.xe.findUnique({ where: { maXe } });
    if (!x) throw new Error("Không tìm thấy xe");
    if (x.trangThai === "DANG_THUE") {
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
export async function hoanThanhBaoTri(maBT, chiPhi) {
  return prisma.$transaction(async (tx) => {
    const bt = await tx.bao_tri.findUnique({ where: { maBT } });
    if (!bt) throw new Error("Không tìm thấy phiếu bảo trì");
    if (bt.trangThai === "DA_HOAN_THANH") throw new Error("Phiếu này đã hoàn thành");
    await tx.xe.update({ where: { maXe: bt.maXe }, data: { trangThai: "SAN_SANG" } });
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
export async function thongKeXeTheoTrangThai() {
  const kq = await prisma.xe.groupBy({
    by: ["trangThai"],
    _count: { _all: true },
  });
  return kq.map((r) => ({ trangThai: r.trangThai, soLuong: r._count._all }));
}

// Doanh thu (tổng tiền đã thanh toán) theo 12 tháng của một năm
export async function doanhThuTheoThang(nam) {
  const dsThanhToan = await prisma.thanh_toan.findMany({
    where: {
      ngayTT: { gte: new Date(nam, 0, 1), lt: new Date(nam + 1, 0, 1) },
    },
  });
  const thang = Array.from({ length: 12 }, (_, i) => ({ thang: i + 1, doanhThu: 0 }));
  for (const tt of dsThanhToan) {
    thang[new Date(tt.ngayTT).getMonth()].doanhThu += Number(tt.soTien);
  }
  return thang;
}

// Chi phí bảo trì theo từng xe
export async function chiPhiBaoTriTheoXe() {
  const kq = await prisma.bao_tri.groupBy({
    by: ["maXe"],
    _sum: { chiPhi: true },
    _count: { _all: true },
  });
  return kq.map((r) => ({
    maXe: r.maXe,
    soLanBaoTri: r._count._all,
    tongChiPhi: Number(r._sum.chiPhi ?? 0),
  }));
}

// Các xe được thuê nhiều nhất
export async function xeThueNhieuNhat(top = 5) {
  const kq = await prisma.hop_dong.groupBy({
    by: ["maXe"],
    where: { trangThai: { not: "DA_HUY" } },
    _count: { _all: true },
    orderBy: { _count: { maXe: "desc" } },
    take: top,
  });
  return kq.map((r) => ({ maXe: r.maXe, soLanThue: r._count._all }));
}

// Hợp đồng quá hạn: đang thuê nhưng đã quá ngày trả dự kiến
export function hopDongQuaHan() {
  return prisma.hop_dong.findMany({
    where: { trangThai: "DANG_THUE", ngayTra: { lt: new Date() } },
    include: { khach_hang: true, xe: true },
  });
}