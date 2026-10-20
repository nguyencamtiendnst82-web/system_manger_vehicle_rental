-- CreateTable
CREATE TABLE `bao_tri` (
    `maBT` INTEGER NOT NULL AUTO_INCREMENT,
    `maXe` INTEGER NOT NULL,
    `noiDung` TEXT NULL,
    `ngayBatDau` DATE NULL,
    `ngayKetThuc` DATE NULL,
    `chiPhi` DECIMAL(15, 2) NULL DEFAULT 0.00,
    `trangThai` ENUM('CHO_BAO_TRI', 'DANG_BAO_TRI', 'DA_HOAN_THANH') NULL DEFAULT 'CHO_BAO_TRI',

    INDEX `fk_bt_xe`(`maXe`),
    PRIMARY KEY (`maBT`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hop_dong` (
    `maHD` INTEGER NOT NULL AUTO_INCREMENT,
    `maKH` INTEGER NOT NULL,
    `maXe` INTEGER NOT NULL,
    `maNV` INTEGER NOT NULL,
    `ngayThue` DATETIME(0) NOT NULL,
    `ngayTra` DATETIME(0) NOT NULL,
    `ngayTraThucTe` DATETIME(0) NULL,
    `tienThue` DECIMAL(15, 2) NULL DEFAULT 0.00,
    `trangThai` ENUM('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_THUE', 'DA_TRA', 'DA_HUY') NULL DEFAULT 'CHO_XAC_NHAN',

    INDEX `fk_hd_khachhang`(`maKH`),
    INDEX `fk_hd_nhanvien`(`maNV`),
    INDEX `fk_hd_xe`(`maXe`),
    PRIMARY KEY (`maHD`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `khach_hang` (
    `maKH` INTEGER NOT NULL AUTO_INCREMENT,
    `hoTen` VARCHAR(100) NOT NULL,
    `SDT` VARCHAR(15) NULL,
    `email` VARCHAR(100) NULL,
    `CCCD` VARCHAR(20) NULL,
    `bangLai` VARCHAR(20) NULL,
    `diaChi` VARCHAR(255) NULL,

    UNIQUE INDEX `CCCD`(`CCCD`),
    PRIMARY KEY (`maKH`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loai_xe` (
    `maLoaiXe` INTEGER NOT NULL AUTO_INCREMENT,
    `tenLoaiXe` VARCHAR(100) NOT NULL,
    `hangXe` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`maLoaiXe`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nhan_vien` (
    `maNV` INTEGER NOT NULL AUTO_INCREMENT,
    `hoTen` VARCHAR(100) NOT NULL,
    `SDT` VARCHAR(15) NULL,
    `email` VARCHAR(100) NULL,

    PRIMARY KEY (`maNV`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thanh_toan` (
    `maTT` INTEGER NOT NULL AUTO_INCREMENT,
    `maHD` INTEGER NOT NULL,
    `soTien` DECIMAL(15, 2) NOT NULL,
    `phuongThuc` ENUM('TIEN_MAT', 'CHUYEN_KHOAN', 'THE') NOT NULL,
    `ngayTT` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_tt_hopdong`(`maHD`),
    PRIMARY KEY (`maTT`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tinh_trang_tra_xe` (
    `maTinhTrang` INTEGER NOT NULL AUTO_INCREMENT,
    `maHD` INTEGER NOT NULL,
    `ngayTra` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `tinhTrangXe` TEXT NULL,
    `mucNhienLieu` INTEGER NULL,
    `soKmThucTe` INTEGER NULL,
    `ghiChu` TEXT NULL,

    INDEX `fk_tttx_hopdong`(`maHD`),
    PRIMARY KEY (`maTinhTrang`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xe` (
    `maXe` INTEGER NOT NULL AUTO_INCREMENT,
    `maLoaiXe` INTEGER NOT NULL,
    `bienSoXe` VARCHAR(20) NOT NULL,
    `mauXe` VARCHAR(50) NULL,
    `soKmDaChay` INTEGER NULL DEFAULT 0,
    `trangThai` ENUM('SAN_SANG', 'DANG_THUE', 'DANG_BAO_TRI', 'NGUNG_HOAT_DONG') NULL DEFAULT 'SAN_SANG',
    `soCho` INTEGER NOT NULL,

    UNIQUE INDEX `bienSoXe`(`bienSoXe`),
    INDEX `fk_xe_loaixe`(`maLoaiXe`),
    PRIMARY KEY (`maXe`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bao_tri` ADD CONSTRAINT `fk_bt_xe` FOREIGN KEY (`maXe`) REFERENCES `xe`(`maXe`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hop_dong` ADD CONSTRAINT `fk_hd_khachhang` FOREIGN KEY (`maKH`) REFERENCES `khach_hang`(`maKH`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hop_dong` ADD CONSTRAINT `fk_hd_nhanvien` FOREIGN KEY (`maNV`) REFERENCES `nhan_vien`(`maNV`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hop_dong` ADD CONSTRAINT `fk_hd_xe` FOREIGN KEY (`maXe`) REFERENCES `xe`(`maXe`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thanh_toan` ADD CONSTRAINT `fk_tt_hopdong` FOREIGN KEY (`maHD`) REFERENCES `hop_dong`(`maHD`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tinh_trang_tra_xe` ADD CONSTRAINT `fk_tttx_hopdong` FOREIGN KEY (`maHD`) REFERENCES `hop_dong`(`maHD`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xe` ADD CONSTRAINT `fk_xe_loaixe` FOREIGN KEY (`maLoaiXe`) REFERENCES `loai_xe`(`maLoaiXe`) ON DELETE RESTRICT ON UPDATE CASCADE;
