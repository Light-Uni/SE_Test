-- ============================================================
-- CLINICAL CURATOR – Pharmaceutical Warehouse Database
-- Schema + Seed Data
-- Chạy trong phpMyAdmin hoặc MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS `pharma_warehouse` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pharma_warehouse`;

-- ── 1. Danh mục thuốc ──
CREATE TABLE IF NOT EXISTS `tblDrugs` (
  `drug_id`       VARCHAR(20)  NOT NULL PRIMARY KEY,
  `drug_code`     VARCHAR(20)  NOT NULL UNIQUE,
  `drug_name`     VARCHAR(200) NOT NULL,
  `category`      VARCHAR(100) NOT NULL,
  `form`          VARCHAR(100),
  `unit`          VARCHAR(50)  DEFAULT 'Viên',
  `min_stock`     INT          DEFAULT 100,
  `near_date_days` INT         DEFAULT 90,
  `created_at`    DATETIME     DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 2. Vị trí kho ──
CREATE TABLE IF NOT EXISTS `tblLocations` (
  `location_id`   VARCHAR(20)  NOT NULL PRIMARY KEY,
  `location_name` VARCHAR(100) NOT NULL,
  `zone`          VARCHAR(100) NOT NULL,
  `shelf`         VARCHAR(50),
  `row_no`        VARCHAR(50),
  `condition_temp` VARCHAR(50),
  `max_qty`       INT          DEFAULT 1000,
  `current_qty`   INT          DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. Lô hàng (Batches) ──
CREATE TABLE IF NOT EXISTS `tblBatches` (
  `batch_id`    INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `batch_no`    VARCHAR(50)  NOT NULL,
  `drug_id`     VARCHAR(20)  NOT NULL,
  `location_id` VARCHAR(20),
  `qty`         INT          DEFAULT 0,
  `mfg_date`    DATE,
  `expiry_date` DATE         NOT NULL,
  `status`      ENUM('safe','near','expired') DEFAULT 'safe',
  `created_at`  DATETIME     DEFAULT NOW(),
  FOREIGN KEY (`drug_id`)     REFERENCES `tblDrugs`(`drug_id`)     ON DELETE CASCADE,
  FOREIGN KEY (`location_id`) REFERENCES `tblLocations`(`location_id`) ON DELETE SET NULL,
  INDEX `idx_drug_expiry` (`drug_id`, `expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 4. Phiếu xuất kho ──
CREATE TABLE IF NOT EXISTS `tblExportOrders` (
  `export_id`   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `export_no`   VARCHAR(50)  NOT NULL UNIQUE,
  `drug_id`     VARCHAR(20)  NOT NULL,
  `total_qty`   INT          NOT NULL DEFAULT 0,
  `note`        TEXT,
  `created_by`  VARCHAR(100),
  `created_at`  DATETIME     DEFAULT NOW(),
  FOREIGN KEY (`drug_id`) REFERENCES `tblDrugs`(`drug_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 5. Chi tiết xuất kho (FEFO detail) ──
CREATE TABLE IF NOT EXISTS `tblExportDetails` (
  `detail_id`   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `export_id`   INT          NOT NULL,
  `batch_id`    INT          NOT NULL,
  `batch_no`    VARCHAR(50),
  `qty_taken`   INT          NOT NULL DEFAULT 0,
  FOREIGN KEY (`export_id`) REFERENCES `tblExportOrders`(`export_id`) ON DELETE CASCADE,
  FOREIGN KEY (`batch_id`)  REFERENCES `tblBatches`(`batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 6. Phiếu nhập kho ──
CREATE TABLE IF NOT EXISTS `tblImportOrders` (
  `import_id`   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `import_no`   VARCHAR(50)  NOT NULL UNIQUE,
  `drug_id`     VARCHAR(20)  NOT NULL,
  `batch_no`    VARCHAR(50)  NOT NULL,
  `qty`         INT          NOT NULL DEFAULT 0,
  `price_unit`  DECIMAL(15,2) DEFAULT 0,
  `supplier`    VARCHAR(200),
  `note`        TEXT,
  `created_by`  VARCHAR(100),
  `created_at`  DATETIME     DEFAULT NOW(),
  FOREIGN KEY (`drug_id`) REFERENCES `tblDrugs`(`drug_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 7. Lịch sử giao dịch ──
CREATE TABLE IF NOT EXISTS `tblTransactions` (
  `txn_id`      INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `type`        ENUM('import','export','transfer','return') NOT NULL,
  `drug_id`     VARCHAR(20)  NOT NULL,
  `batch_id`    INT,
  `qty`         INT          NOT NULL DEFAULT 0,
  `note`        TEXT,
  `created_by`  VARCHAR(100),
  `created_at`  DATETIME     DEFAULT NOW(),
  FOREIGN KEY (`drug_id`)  REFERENCES `tblDrugs`(`drug_id`),
  FOREIGN KEY (`batch_id`) REFERENCES `tblBatches`(`batch_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 8. Cảnh báo ──
CREATE TABLE IF NOT EXISTS `tblAlerts` (
  `alert_id`    INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `type`        ENUM('near_date','expired','low_stock','temp_violation') NOT NULL,
  `drug_id`     VARCHAR(20),
  `batch_id`    INT,
  `message`     TEXT,
  `is_read`     TINYINT(1)   DEFAULT 0,
  `created_at`  DATETIME     DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- SEED DATA
-- ================================================================

INSERT INTO `tblDrugs` VALUES
('DRG001','AMX-500','Amoxicillin 500mg','Kháng sinh','Viên nén','Viên',500,90,NOW()),
('DRG002','PAR-650','Paracetamol 650mg','Giảm đau','Hộp 10 vỉ x 10 viên','Hộp',200,60,NOW()),
('DRG003','VAC-AZ','Vắc-xin AstraZeneca','Vắc-xin','Lọ 10 liều','Lọ',50,120,NOW()),
('DRG004','INS-HUM','Insulin Human Inj','Nội tiết','Bút tiêm 3ml','Bút',100,90,NOW()),
('DRG005','AUG-625','Augmentin 625mg','Kháng sinh','Hộp lẻ','Viên',300,90,NOW()),
('DRG006','VIT-C','Vitamin C 1000mg','Vitamin','Chai','Chai',100,60,NOW()),
('DRG007','INS-GLG','Insulin Glargine','Nội tiết','Bút tiêm','Bút',30,90,NOW());

INSERT INTO `tblLocations` VALUES
('LOC001','Kệ A1 – Tầng 3','Kho thường (15–35°C)','A1','Tầng 3','15–35°C',2000,1500),
('LOC002','Kho Lạnh – Kệ C','Kho lạnh (2–8°C)','Kệ C','–','2–8°C',500,420),
('LOC003','Kệ B2 – Tầng 1','Kho mát (≤30°C)','B2','Tầng 1','≤30°C',1500,850),
('LOC004','Kho Lạnh – Kệ A','Kho lạnh (2–8°C)','Kệ A','–','2–8°C',600,240),
('LOC005','KHU-A | KẾ-02 | Ô-14','Kho thường','KẾ-02','Ô-14','15–35°C',1000,350),
('LOC006','KHU-B | KẾ-05 | Ô-02','Kho thường','KẾ-05','Ô-02','15–35°C',1200,800);

INSERT INTO `tblBatches` (`batch_no`,`drug_id`,`location_id`,`qty`,`mfg_date`,`expiry_date`,`status`) VALUES
('AMX-2023-005','DRG001','LOC001',5000,'2023-12-10','2026-10-12','safe'),
('AZ-AT-AZ-4',  'DRG003','LOC002',120, '2024-01-01','2024-05-15','near'),
('PARA-1-809',  'DRG002','LOC003',850, '2021-08-15','2024-02-15','expired'),
('INS-H-21-13', 'DRG004','LOC004',2400,'2024-01-20','2026-01-20','safe'),
('#PARA-2401',  'DRG002','LOC005',350, '2024-01-01','2024-06-15','near'),
('#PARA-2405',  'DRG002','LOC006',800, '2024-05-01','2024-12-20','near'),
('#PARA-2502',  'DRG002','LOC001',270, '2025-02-01','2025-09-02','safe'),
('LOT-248195A', 'DRG005','LOC001',142, '2024-04-01','2024-10-30','near'),
('LOT-231139C', 'DRG002','LOC003',2150,'2023-11-01','2024-09-11','near'),
('LOT-248212X', 'DRG001','LOC001',85,  '2024-06-01','2024-11-12','near'),
('LOT-2485908', 'DRG007','LOC002',24,  '2024-05-01','2024-11-15','near'),
('VRC22105',    'DRG003','LOC002',40,  '2024-03-01','2024-05-08','near');

INSERT INTO `tblTransactions` (`type`,`drug_id`,`batch_id`,`qty`,`note`,`created_by`) VALUES
('import','DRG004',4,2400,'Nhập từ nhà cung cấp XYZ','Nguyễn Văn A'),
('export','DRG001',1,200, 'Xuất cho khoa Nội','Trần Thị B'),
('export','DRG002',3,150, 'Xuất cho khoa Ngoại','Nguyễn Văn A'),
('import','DRG005',8,500, 'Nhập bổ sung','Lê Minh C'),
('export','DRG003',2,30,  'Xuất tiêm chủng','Trần Thị B');

-- ── Views ──
CREATE OR REPLACE VIEW vw_drug_stock AS
  SELECT d.drug_id, d.drug_code, d.drug_name, d.category,
    COALESCE(SUM(b.qty),0) AS total_qty,
    COUNT(b.batch_id) AS batch_count,
    MIN(b.expiry_date) AS nearest_expiry
  FROM tblDrugs d
  LEFT JOIN tblBatches b ON d.drug_id = b.drug_id AND b.qty > 0
  GROUP BY d.drug_id;

CREATE OR REPLACE VIEW vw_fefo_queue AS
  SELECT b.batch_id, b.batch_no, b.drug_id, d.drug_name,
    b.qty, b.expiry_date, b.status,
    l.location_name, l.zone,
    DATEDIFF(b.expiry_date, CURDATE()) AS days_left
  FROM tblBatches b
  JOIN tblDrugs d ON b.drug_id = d.drug_id
  LEFT JOIN tblLocations l ON b.location_id = l.location_id
  WHERE b.qty > 0
  ORDER BY b.expiry_date ASC;

-- ── Stored Procedure: Get_FEFO_Queue ──
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS Get_FEFO_Queue(IN p_drug_id VARCHAR(20))
BEGIN
    SELECT b.batch_id, b.batch_no, b.qty, b.expiry_date, b.status,
           l.location_name, l.zone,
           DATEDIFF(b.expiry_date, CURDATE()) AS days_left,
           ROW_NUMBER() OVER (ORDER BY b.expiry_date ASC) AS priority
    FROM tblBatches b
    LEFT JOIN tblLocations l ON b.location_id = l.location_id
    WHERE b.drug_id = p_drug_id AND b.qty > 0 AND b.status != 'expired'
    ORDER BY b.expiry_date ASC;
END //

-- ── Stored Procedure: Check_Threshold_Alert ──
CREATE PROCEDURE IF NOT EXISTS Check_Threshold_Alert()
BEGIN
    SELECT d.drug_id, d.drug_name, d.min_stock,
           COALESCE(SUM(b.qty),0) AS current_qty,
           (d.min_stock - COALESCE(SUM(b.qty),0)) AS deficit
    FROM tblDrugs d
    LEFT JOIN tblBatches b ON d.drug_id = b.drug_id AND b.qty > 0
    GROUP BY d.drug_id
    HAVING current_qty < d.min_stock;
END //

-- ── Stored Procedure: Get_Inventory_Report ──
CREATE PROCEDURE IF NOT EXISTS Get_Inventory_Report(IN p_view_type VARCHAR(20))
BEGIN
    IF p_view_type = 'drug' THEN
        SELECT * FROM vw_drug_stock ORDER BY total_qty DESC;
    ELSE
        SELECT * FROM vw_fefo_queue;
    END IF;
END //
DELIMITER ;

SELECT 'Database setup complete!' AS message;
