// crud/index.js - Gom CRUD của 8 bảng về một chỗ.
//
// Cách dùng:
//   import { xe, khachHang, hopDong } from "./crud/index.js";
//   await xe.layTatCa();
//   await khachHang.tao({ hoTen: "Nguyen Van A", CCCD: "201234567899" });
//   await hopDong.chiTiet(1);
import * as loaiXe from "./loaiXe.js";
import * as xe from "./xe.js";
import * as nhanVien from "./nhanVien.js";
import * as khachHang from "./khachHang.js";
import * as hopDong from "./hopDong.js";
import * as thanhToan from "./thanhToan.js";
import * as baoTri from "./baoTri.js";
import * as tinhTrangTraXe from "./tinhTrangTraXe.js";

export { loaiXe, xe, nhanVien, khachHang, hopDong, thanhToan, baoTri, tinhTrangTraXe };