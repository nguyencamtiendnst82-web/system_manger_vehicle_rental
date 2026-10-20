import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";

const url = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

const d = (s) => new Date(s);

async function main() {
  // Xóa theo thứ tự ngược của khóa ngoại
  await prisma.tinh_trang_tra_xe.deleteMany();
  await prisma.thanh_toan.deleteMany();
  await prisma.bao_tri.deleteMany();
  await prisma.hop_dong.deleteMany();
  await prisma.xe.deleteMany();
  await prisma.loai_xe.deleteMany();
  await prisma.khach_hang.deleteMany();
  await prisma.nhan_vien.deleteMany();

  await prisma.nhan_vien.createMany({
    data: [
      { maNV: 1, hoTen: "Nguyen Van An", SDT: "0905123456", email: "an@gmail.com" },
      { maNV: 2, hoTen: "Tran Thi Binh", SDT: "0915234567", email: "binh@gmail.com" },
      { maNV: 3, hoTen: "Le Van Cuong", SDT: "0925345678", email: "cuong@gmail.com" },
      { maNV: 4, hoTen: "Pham Thi Dung", SDT: "0935456789", email: "dung@gmail.com" },
      { maNV: 5, hoTen: "Hoang Van Nam", SDT: "0945567890", email: "nam@gmail.com" },
    ],
  });

  await prisma.khach_hang.createMany({
    data: [
      { maKH: 1, hoTen: "Nguyen Minh Anh", SDT: "0901111111", email: "anh@gmail.com", CCCD: "201234567890", bangLai: "B2", diaChi: "Da Nang" },
      { maKH: 2, hoTen: "Tran Van Binh", SDT: "0902222222", email: "binhkh@gmail.com", CCCD: "201234567891", bangLai: "B2", diaChi: "Quang Nam" },
      { maKH: 3, hoTen: "Le Thi Hoa", SDT: "0903333333", email: "hoa@gmail.com", CCCD: "201234567892", bangLai: "B1", diaChi: "Hue" },
      { maKH: 4, hoTen: "Pham Van Long", SDT: "0904444444", email: "long@gmail.com", CCCD: "201234567893", bangLai: "B2", diaChi: "Da Nang" },
      { maKH: 5, hoTen: "Hoang Thi Mai", SDT: "0905555555", email: "mai@gmail.com", CCCD: "201234567894", bangLai: "B1", diaChi: "Quang Ngai" },
    ],
  });

  await prisma.loai_xe.createMany({
    data: [
      { maLoaiXe: 1, tenLoaiXe: "Xe 4 cho", hangXe: "Toyota" },
      { maLoaiXe: 2, tenLoaiXe: "Xe 5 cho", hangXe: "Honda" },
      { maLoaiXe: 3, tenLoaiXe: "Xe 7 cho", hangXe: "Mitsubishi" },
      { maLoaiXe: 4, tenLoaiXe: "Xe SUV", hangXe: "Hyundai" },
      { maLoaiXe: 5, tenLoaiXe: "Xe Sedan", hangXe: "Mazda" },
    ],
  });

  await prisma.xe.createMany({
    data: [
      { maXe: 1, maLoaiXe: 1, bienSoXe: "43A-12345", mauXe: "Trang", soKmDaChay: 25000, trangThai: "SAN_SANG", soCho: 4 },
      { maXe: 2, maLoaiXe: 2, bienSoXe: "43A-23456", mauXe: "Den", soKmDaChay: 18000, trangThai: "DANG_THUE", soCho: 5 },
      { maXe: 3, maLoaiXe: 3, bienSoXe: "43A-34567", mauXe: "Xam", soKmDaChay: 32000, trangThai: "SAN_SANG", soCho: 7 },
      { maXe: 4, maLoaiXe: 4, bienSoXe: "43A-45678", mauXe: "Do", soKmDaChay: 15000, trangThai: "DANG_BAO_TRI", soCho: 7 },
      { maXe: 5, maLoaiXe: 5, bienSoXe: "43A-56789", mauXe: "Xanh", soKmDaChay: 22000, trangThai: "SAN_SANG", soCho: 5 },
      { maXe: 6, maLoaiXe: 1, bienSoXe: "43A-67890", mauXe: "Bac", soKmDaChay: 28000, trangThai: "SAN_SANG", soCho: 4 },
      { maXe: 7, maLoaiXe: 2, bienSoXe: "43A-78901", mauXe: "Trang", soKmDaChay: 12000, trangThai: "DANG_THUE", soCho: 5 },
      { maXe: 8, maLoaiXe: 3, bienSoXe: "43A-89012", mauXe: "Den", soKmDaChay: 35000, trangThai: "SAN_SANG", soCho: 7 },
    ],
  });

  await prisma.hop_dong.createMany({
    data: [
      { maHD: 1, maKH: 1, maXe: 2, maNV: 1, ngayThue: d("2026-09-01"), ngayTra: d("2026-09-05"), ngayTraThucTe: d("2026-09-05"), tienThue: 2000000, trangThai: "DA_TRA" },
      { maHD: 2, maKH: 2, maXe: 3, maNV: 2, ngayThue: d("2026-09-03"), ngayTra: d("2026-09-07"), ngayTraThucTe: d("2026-09-07"), tienThue: 2800000, trangThai: "DA_TRA" },
      { maHD: 3, maKH: 3, maXe: 1, maNV: 3, ngayThue: d("2026-09-05"), ngayTra: d("2026-09-08"), ngayTraThucTe: d("2026-09-08"), tienThue: 1500000, trangThai: "DA_TRA" },
      { maHD: 4, maKH: 4, maXe: 5, maNV: 4, ngayThue: d("2026-09-08"), ngayTra: d("2026-09-12"), ngayTraThucTe: d("2026-09-12"), tienThue: 2200000, trangThai: "DA_TRA" },
      { maHD: 5, maKH: 5, maXe: 7, maNV: 5, ngayThue: d("2026-09-10"), ngayTra: d("2026-09-15"), ngayTraThucTe: d("2026-09-15"), tienThue: 2500000, trangThai: "DA_TRA" },
      { maHD: 6, maKH: 1, maXe: 6, maNV: 1, ngayThue: d("2026-09-15"), ngayTra: d("2026-09-18"), ngayTraThucTe: null, tienThue: 1800000, trangThai: "DANG_THUE" },
      { maHD: 7, maKH: 2, maXe: 3, maNV: 2, ngayThue: d("2026-09-20"), ngayTra: d("2026-09-25"), ngayTraThucTe: null, tienThue: 3500000, trangThai: "DANG_THUE" },
      { maHD: 8, maKH: 4, maXe: 8, maNV: 3, ngayThue: d("2026-09-22"), ngayTra: d("2026-09-27"), ngayTraThucTe: null, tienThue: 3200000, trangThai: "DANG_THUE" },
    ],
  });

  await prisma.thanh_toan.createMany({
    data: [
      { maTT: 1, maHD: 1, soTien: 2000000, phuongThuc: "TIEN_MAT", ngayTT: d("2026-09-05") },
      { maTT: 2, maHD: 2, soTien: 2800000, phuongThuc: "CHUYEN_KHOAN", ngayTT: d("2026-09-07") },
      { maTT: 3, maHD: 3, soTien: 1500000, phuongThuc: "TIEN_MAT", ngayTT: d("2026-09-08") },
      { maTT: 4, maHD: 4, soTien: 2200000, phuongThuc: "CHUYEN_KHOAN", ngayTT: d("2026-09-12") },
      { maTT: 5, maHD: 5, soTien: 2500000, phuongThuc: "CHUYEN_KHOAN", ngayTT: d("2026-09-15") },
      { maTT: 6, maHD: 6, soTien: 1800000, phuongThuc: "CHUYEN_KHOAN", ngayTT: d("2026-09-15") },
      { maTT: 7, maHD: 7, soTien: 3500000, phuongThuc: "TIEN_MAT", ngayTT: d("2026-09-20") },
      { maTT: 8, maHD: 8, soTien: 3200000, phuongThuc: "CHUYEN_KHOAN", ngayTT: d("2026-09-22") },
    ],
  });

  await prisma.tinh_trang_tra_xe.createMany({
    data: [
      { maTinhTrang: 1, maHD: 1, ngayTra: d("2026-09-05"), tinhTrangXe: "Tot", mucNhienLieu: 80, soKmThucTe: 25300, ghiChu: "Xe hoat dong binh thuong" },
      { maTinhTrang: 2, maHD: 2, ngayTra: d("2026-09-07"), tinhTrangXe: "Tot", mucNhienLieu: 70, soKmThucTe: 32600, ghiChu: "Khong co hu hong" },
      { maTinhTrang: 3, maHD: 3, ngayTra: d("2026-09-08"), tinhTrangXe: "Tot", mucNhienLieu: 75, soKmThucTe: 25400, ghiChu: "Xe sach se" },
      { maTinhTrang: 4, maHD: 4, ngayTra: d("2026-09-12"), tinhTrangXe: "Tot", mucNhienLieu: 60, soKmThucTe: 22500, ghiChu: "Khong co van de" },
      { maTinhTrang: 5, maHD: 5, ngayTra: d("2026-09-15"), tinhTrangXe: "Kha", mucNhienLieu: 50, soKmThucTe: 12800, ghiChu: "Xuat hien vet xuoc nho" },
      { maTinhTrang: 6, maHD: 6, ngayTra: d("2026-09-18"), tinhTrangXe: "Tot", mucNhienLieu: 70, soKmThucTe: 28600, ghiChu: "Xe binh thuong" },
      { maTinhTrang: 7, maHD: 7, ngayTra: d("2026-09-25"), tinhTrangXe: "Tot", mucNhienLieu: 65, soKmThucTe: 33800, ghiChu: "Khong co hu hong" },
      { maTinhTrang: 8, maHD: 8, ngayTra: d("2026-09-27"), tinhTrangXe: "Kha", mucNhienLieu: 55, soKmThucTe: 36200, ghiChu: "Can kiem tra lop xe" },
    ],
  });

  await prisma.bao_tri.createMany({
    data: [
      { maBT: 1, maXe: 4, noiDung: "Thay dau dong co", ngayBatDau: d("2026-09-02"), ngayKetThuc: d("2026-09-03"), chiPhi: 800000, trangThai: "DA_HOAN_THANH" },
      { maBT: 2, maXe: 1, noiDung: "Kiem tra phanh", ngayBatDau: d("2026-08-20"), ngayKetThuc: d("2026-08-21"), chiPhi: 500000, trangThai: "DA_HOAN_THANH" },
      { maBT: 3, maXe: 3, noiDung: "Thay lop xe", ngayBatDau: d("2026-08-25"), ngayKetThuc: d("2026-08-26"), chiPhi: 2500000, trangThai: "DA_HOAN_THANH" },
      { maBT: 4, maXe: 5, noiDung: "Bao duong dinh ky", ngayBatDau: d("2026-09-16"), ngayKetThuc: d("2026-09-17"), chiPhi: 1200000, trangThai: "DA_HOAN_THANH" },
      { maBT: 5, maXe: 7, noiDung: "Kiem tra dong co", ngayBatDau: d("2026-09-18"), ngayKetThuc: d("2026-09-19"), chiPhi: 600000, trangThai: "DA_HOAN_THANH" },
      { maBT: 6, maXe: 2, noiDung: "Thay loc gio", ngayBatDau: d("2026-08-28"), ngayKetThuc: d("2026-08-28"), chiPhi: 350000, trangThai: "DA_HOAN_THANH" },
      { maBT: 7, maXe: 6, noiDung: "Kiem tra ac quy", ngayBatDau: d("2026-09-10"), ngayKetThuc: d("2026-09-10"), chiPhi: 400000, trangThai: "DA_HOAN_THANH" },
      { maBT: 8, maXe: 8, noiDung: "Bao duong tong quat", ngayBatDau: d("2026-09-28"), ngayKetThuc: null, chiPhi: 1000000, trangThai: "DANG_BAO_TRI" },
    ],
  });

  console.log("Đã nạp dữ liệu mẫu xong.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());