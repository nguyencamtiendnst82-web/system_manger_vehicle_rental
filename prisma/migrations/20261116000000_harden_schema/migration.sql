-- Siết schema: giá thuê theo ngày, NOT NULL cho trạng thái, CHECK, index trùng lịch,
-- mỗi hợp đồng chỉ có 1 bản ghi tình trạng trả xe.
-- Yêu cầu MySQL 8.0.16+ / MariaDB 10.2.1+ để CHECK có hiệu lực.

-- 1. Giá thuê theo ngày của loại xe
ALTER TABLE `loai_xe` ADD COLUMN `giaThueNgay` DECIMAL(15, 2) NOT NULL DEFAULT 0.00;

-- 2. Dữ liệu NULL cũ (nếu có) -> giá trị mặc định, rồi đặt NOT NULL
UPDATE `xe` SET `trangThai` = 'SAN_SANG' WHERE `trangThai` IS NULL;
UPDATE `hop_dong` SET `trangThai` = 'CHO_XAC_NHAN' WHERE `trangThai` IS NULL;
UPDATE `hop_dong` SET `tienThue` = 0 WHERE `tienThue` IS NULL;
UPDATE `bao_tri` SET `trangThai` = 'CHO_BAO_TRI' WHERE `trangThai` IS NULL;

ALTER TABLE `xe` MODIFY `trangThai` ENUM('SAN_SANG', 'DANG_THUE', 'DANG_BAO_TRI', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'SAN_SANG';
ALTER TABLE `hop_dong` MODIFY `trangThai` ENUM('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_THUE', 'DA_TRA', 'DA_HUY') NOT NULL DEFAULT 'CHO_XAC_NHAN';
ALTER TABLE `hop_dong` MODIFY `tienThue` DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE `bao_tri` MODIFY `trangThai` ENUM('CHO_BAO_TRI', 'DANG_BAO_TRI', 'DA_HOAN_THANH') NOT NULL DEFAULT 'CHO_BAO_TRI';

-- 3. Index trùng lịch (thay cho index khóa ngoại cũ fk_hd_xe)
CREATE INDEX `hop_dong_maXe_ngayThue_ngayTra_idx` ON `hop_dong`(`maXe`, `ngayThue`, `ngayTra`);
DROP INDEX `fk_hd_xe` ON `hop_dong`;

-- 4. Mỗi hợp đồng chỉ có 1 lần trả xe (UNIQUE thay cho index khóa ngoại cũ fk_tttx_hopdong)
CREATE UNIQUE INDEX `maHD` ON `tinh_trang_tra_xe`(`maHD`);
DROP INDEX `fk_tttx_hopdong` ON `tinh_trang_tra_xe`;

-- 5. Ràng buộc CHECK
ALTER TABLE `loai_xe` ADD CONSTRAINT `chk_lx_gia` CHECK (`giaThueNgay` >= 0);
ALTER TABLE `hop_dong` ADD CONSTRAINT `chk_hd_ngay` CHECK (`ngayTra` > `ngayThue`);
ALTER TABLE `hop_dong` ADD CONSTRAINT `chk_hd_tien` CHECK (`tienThue` >= 0);
ALTER TABLE `thanh_toan` ADD CONSTRAINT `chk_tt_sotien` CHECK (`soTien` > 0);
ALTER TABLE `bao_tri` ADD CONSTRAINT `chk_bt_chiphi` CHECK (`chiPhi` IS NULL OR `chiPhi` >= 0);
ALTER TABLE `tinh_trang_tra_xe` ADD CONSTRAINT `chk_tttx_nhienlieu` CHECK (`mucNhienLieu` IS NULL OR `mucNhienLieu` BETWEEN 0 AND 100);
