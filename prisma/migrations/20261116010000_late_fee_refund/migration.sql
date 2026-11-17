-- Phí trả trễ (hop_dong.phiTraTre) và bảng hoàn tiền (hoan_tien)

ALTER TABLE `hop_dong` ADD COLUMN `phiTraTre` DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE `hop_dong` ADD CONSTRAINT `chk_hd_phitre` CHECK (`phiTraTre` >= 0);

CREATE TABLE `hoan_tien` (
    `maHT` INTEGER NOT NULL AUTO_INCREMENT,
    `maHD` INTEGER NOT NULL,
    `soTien` DECIMAL(15, 2) NOT NULL,
    `lyDo` VARCHAR(255) NULL,
    `ngayHT` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `hoan_tien_maHD_idx`(`maHD`),
    PRIMARY KEY (`maHT`),
    CONSTRAINT `chk_ht_sotien` CHECK (`soTien` > 0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `hoan_tien` ADD CONSTRAINT `fk_ht_hopdong` FOREIGN KEY (`maHD`) REFERENCES `hop_dong`(`maHD`) ON DELETE RESTRICT ON UPDATE CASCADE;
