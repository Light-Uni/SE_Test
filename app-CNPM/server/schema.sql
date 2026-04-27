-- ============================================================
-- full_schema.sql — Pharmacy WMS (gộp schema.sql + init.sql)
-- Cách dùng: phpMyAdmin > Nhập > chọn file này
-- ============================================================

DROP DATABASE IF EXISTS pharmacy_db;
CREATE DATABASE pharmacy_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pharmacy_db;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(100)  NOT NULL UNIQUE,
  password        VARCHAR(255)  NOT NULL,
  name            VARCHAR(150),
  phone           VARCHAR(20),
  email           VARCHAR(150),
  role            ENUM('MANAGER','STOREKEEPER','REQUESTER') DEFAULT 'REQUESTER',
  address         VARCHAR(255),
  reset_token     VARCHAR(255)  DEFAULT NULL,
  reset_token_exp DATETIME      DEFAULT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. MEDICINES
-- ============================================================
CREATE TABLE medicines (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255)  NOT NULL,
  description      TEXT,
  img_path         VARCHAR(500),
  storage_type     ENUM('NORMAL','COOL','COLD','SPECIAL') DEFAULT 'NORMAL',
  min_stock        INT           DEFAULT 0,
  max_stock        INT           DEFAULT 0,
  near_expiry_days INT           DEFAULT 180,
  unit_price       DECIMAL(12,2) DEFAULT 0,
  import_price     DECIMAL(12,2) DEFAULT 0,
  is_deleted       TINYINT(1)    DEFAULT 0,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. WAREHOUSES
-- ============================================================
CREATE TABLE warehouses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  storage_type ENUM('NORMAL','COOL','COLD','SPECIAL') NOT NULL DEFAULT 'NORMAL',
  capacity     INT           NOT NULL DEFAULT 1000,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. BATCHES
-- ============================================================
CREATE TABLE batches (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id     INT           NOT NULL,
  batch_code      VARCHAR(100)  NOT NULL,
  quantity        INT           DEFAULT 0,
  import_date     DATE,
  expiry_date     DATE,
  warehouse_id    INT           DEFAULT 1,
  position        VARCHAR(50),
  cabinet_is_full TINYINT(1)    DEFAULT 0,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id)  REFERENCES medicines(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. IMPORT REQUESTS
-- ============================================================
CREATE TABLE import_requests (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id   INT           NOT NULL,
  batch_code    VARCHAR(100)  DEFAULT '',
  expiry_date   DATE,
  quantity      INT           NOT NULL,
  status        ENUM('PENDING','RECEIVED','REJECTED') DEFAULT 'PENDING',
  created_by    INT,
  note          TEXT,
  type          ENUM('IMPORT','RETURN') DEFAULT 'IMPORT',
  received_date TIMESTAMP     NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (created_by)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. EXPORT REQUESTS
-- ============================================================
CREATE TABLE export_requests (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  requester_id        INT,
  status              ENUM('PENDING','APPROVED','COMPLETED','REJECTED','SHORTAGE') DEFAULT 'PENDING',
  storekeeper_confirm TINYINT(1)    DEFAULT 0,
  processed_date      TIMESTAMP     NULL,
  handle_result       VARCHAR(50),
  shortage_note       TEXT,
  feedback_note       TEXT,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. EXPORT REQUEST ITEMS
-- ============================================================
CREATE TABLE export_request_items (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  export_request_id INT NOT NULL,
  medicine_id       INT NOT NULL,
  quantity          INT NOT NULL,
  FOREIGN KEY (export_request_id) REFERENCES export_requests(id),
  FOREIGN KEY (medicine_id)       REFERENCES medicines(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 8. INVENTORY LOGS
-- ============================================================
CREATE TABLE inventory_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id   INT           NOT NULL,
  batch_id      INT,
  change_amount INT           NOT NULL,
  type          ENUM('IMPORT','EXPORT','ADJUST') NOT NULL,
  ref_id        INT,
  ref_type      VARCHAR(50),
  note          TEXT,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (batch_id)    REFERENCES batches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 9. AUDIT SESSIONS
-- ============================================================
CREATE TABLE audit_sessions (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  created_by          INT,
  status              ENUM('OPEN','CONFIRMED') DEFAULT 'OPEN',
  locked_medicine_ids JSON,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 10. AUDIT ITEMS
-- ============================================================
CREATE TABLE audit_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  session_id  INT NOT NULL,
  medicine_id INT NOT NULL,
  batch_id    INT NOT NULL,
  system_qty  INT NOT NULL,
  actual_qty  INT,
  FOREIGN KEY (session_id)  REFERENCES audit_sessions(id),
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (batch_id)    REFERENCES batches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 11. PURCHASE REQUISITIONS
-- ============================================================
CREATE TABLE purchase_requisitions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id   INT           NOT NULL,
  medicine_name VARCHAR(255),
  current_stock INT           NOT NULL DEFAULT 0,
  min_stock     INT           NOT NULL DEFAULT 0,
  suggested_qty INT           NOT NULL DEFAULT 0,
  status        ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DỮ LIỆU MẪU
-- ============================================================

-- Tài khoản (mật khẩu: 123)
INSERT INTO users (username, password, name, email, role) VALUES
('manager',     '$2b$10$EqliFkLc2Rp73z2PSlh3HOovq69dCf69XDZYfXPccD0tzEzw.5G4W', 'Manager One',       'manager@gmail.com',     'MANAGER'),
('store',       '$2b$10$EqliFkLc2Rp73z2PSlh3HOovq69dCf69XDZYfXPccD0tzEzw.5G4W', 'Store Keeper One',  'store@gmail.com',       'STOREKEEPER'),
('request',     '$2b$10$EqliFkLc2Rp73z2PSlh3HOovq69dCf69XDZYfXPccD0tzEzw.5G4W', 'REQUESTER One',     'request@gmail.com',     'REQUESTER');

-- Kho bảo quản
INSERT INTO warehouses (id, name, storage_type, capacity) VALUES
(1, 'Kho thường',   'NORMAL',  2000),
(2, 'Kho mát',      'COOL',     500),
(3, 'Kho lạnh',     'COLD',     200),
(4, 'Khu biệt trữ', 'SPECIAL',  100);

-- Thuốc mẫu
INSERT INTO medicines (name, description, img_path, storage_type, min_stock, max_stock, near_expiry_days, unit_price, import_price) VALUES
('Panadol 500mg',      'Giảm đau, hạ sốt',                  '/uploads/panadol_500mg.webp',      'NORMAL', 100, 2000, 180, 5000,  3000),
('Amoxicillin 500mg',  'Kháng sinh điều trị nhiễm khuẩn',   '/uploads/amoxicillin_500mg.png',   'COOL',    50,  800, 180, 15000, 10000),
('Ibuprofen 200mg',    'Chống viêm, giảm đau',               '/uploads/ibuprofen_200mg.jpg',     'NORMAL', 100, 1500, 180, 8000,  5000),
('Vitamin C 1000mg',   'Tăng đề kháng',                      '/uploads/VitaminC_1000mg.webp',    'NORMAL', 200, 3000, 180, 10000, 7000),
('Omeprazole 20mg',    'Điều trị đau dạ dày',                '/uploads/omeprazol_200mg.jpg',     'COOL',    50,  600, 180, 12000, 8000);

-- Lô thuốc mẫu
INSERT INTO batches (medicine_id, batch_code, quantity, import_date, expiry_date, warehouse_id, position) VALUES
(1, 'PARA-2026-01', 1000, '2026-01-01', '2027-01-01', 1, 'A1'),
(2, 'AMOX-2026-02',  500, '2026-02-10', '2027-02-10', 2, 'B1'),
(3, 'IBU-2026-03',   800, '2026-03-05', '2027-03-05', 1, 'A2'),
(4, 'VITC-2026-01', 1200, '2026-01-15', '2028-01-15', 1, 'A3'),
(5, 'OME-2026-02',   600, '2026-02-20', '2027-02-20', 2, 'B2');

-- Yêu cầu nhập mẫu
INSERT INTO import_requests (medicine_id, batch_code, quantity, status, created_by) VALUES
(1, 'PARA-2026-01', 1000, 'RECEIVED', 1),
(2, 'AMOX-2026-02',  500, 'PENDING',  1),
(3, 'IBU-2026-03',   800, 'RECEIVED', 1);

-- Yêu cầu xuất mẫu
INSERT INTO export_requests (requester_id, status, storekeeper_confirm, handle_result, feedback_note, processed_date) VALUES
(3, 'COMPLETED', 1, 'SENT', 'Xuất hàng thành công', '2026-04-10'),
(3, 'PENDING',   0, NULL,   NULL,                    NULL);

INSERT INTO export_request_items (export_request_id, medicine_id, quantity) VALUES
(1, 1, 100),
(1, 2,  50),
(2, 3, 200);

-- Lịch sử kho mẫu
INSERT INTO inventory_logs (medicine_id, batch_id, change_amount, type, ref_id, ref_type, note) VALUES
(1, 1, 1000, 'IMPORT', 1, 'IMPORT_REQUEST', 'Nhập kho đợt 1'),
(2, 2,  500, 'IMPORT', 2, 'IMPORT_REQUEST', 'Nhập kho đợt 1'),
(3, 3,  800, 'IMPORT', 3, 'IMPORT_REQUEST', 'Nhập kho đợt 1'),
(1, 1, -100, 'EXPORT', 1, 'EXPORT_REQUEST', 'Xuất cho đơn 1'),
(2, 2,  -50, 'EXPORT', 1, 'EXPORT_REQUEST', 'Xuất cho đơn 1');