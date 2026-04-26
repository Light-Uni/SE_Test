-- =============================
-- DATABASE CONFIG
-- =============================
CREATE DATABASE IF NOT EXISTS pharmacy_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE pharmacy_db;

-- =============================
-- USERS
-- =============================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- has_logged_in BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('REQUESTER', 'STOREKEEPER', 'MANAGER') NOT NULL,
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================
-- DRUGS (THUỐC)
-- =============================
CREATE TABLE medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    img_path VARCHAR(255),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_deleted BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================
-- WAREHOUSES (KHO)
-- =============================
CREATE TABLE warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    floor INT,
    temperature FLOAT,
    type ENUM('NORMAL', 'COOL', 'COLD', 'SPECIAL') DEFAULT 'NORMAL'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================
-- BATCHES (LÔ THUỐC)
-- =============================
CREATE TABLE batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    batch_code VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    import_date DATE,
    expiry_date DATE,
    warehouse_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================
-- IMPORT REQUEST (YÊU CẦU NHẬP)
-- =============================
CREATE TABLE import_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    batch_code VARCHAR(100),
    quantity INT NOT NULL,
    status ENUM('PENDING', 'RECEIVED') DEFAULT 'PENDING',
    received_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================
-- EXPORT REQUEST (YÊU CẦU XUẤT)
-- =============================
CREATE TABLE export_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,

    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',

    storekeeper_confirm BOOLEAN DEFAULT NULL,
    requester_confirm BOOLEAN DEFAULT NULL,

    handle_result ENUM('SENT', 'OUT_OF_STOCK'),
    feedback_note TEXT,

    processed_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (requester_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================
-- EXPORT REQUEST ITEMS
-- =============================
CREATE TABLE export_request_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    export_request_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL,

    FOREIGN KEY (export_request_id) REFERENCES export_requests(id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================
-- INVENTORY LOG
-- =============================
CREATE TABLE inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT,
    batch_id INT,

    change_amount INT NOT NULL,
    type ENUM('IMPORT', 'EXPORT', 'ADJUST') NOT NULL,

    ref_id INT,
    ref_type ENUM('IMPORT_REQUEST', 'EXPORT_REQUEST'),

    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (batch_id) REFERENCES batches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (username, password, name, email, role)
VALUES
(
  'manager',
  '$2b$10$2Bj.HDGwWK7hxmXs1iSZke9sEdLH5Sn7d.bqc4EWVIhGi3mxbJkFW',
  'Manager One',
  'manager@gmail.com',
  'MANAGER'
),
(
  'request',
  '$2b$10$2Bj.HDGwWK7hxmXs1iSZke9sEdLH5Sn7d.bqc4EWVIhGi3mxbJkFW',
  'REQUESTER One',
  'request@gmail.com',
  'REQUESTER'
),
(
  'store',
  '$2b$10$2Bj.HDGwWK7hxmXs1iSZke9sEdLH5Sn7d.bqc4EWVIhGi3mxbJkFW',
  'Store Keeper One',
  'store@gmail.com',
  'STOREKEEPER'
);

INSERT INTO medicines (name, description, img_path) VALUES
('Panadol 500mg', 'Giảm đau, hạ sốt', '/uploads/panadol_500mg.webp'),
('Amoxicillin 500mg', 'Kháng sinh điều trị nhiễm khuẩn', '/uploads/amoxicillin_500mg.png'),
('Ibuprofen 200mg', 'Chống viêm, giảm đau', '/uploads/ibuprofen_200mg.jpg'),
('Vitamin C 1000mg', 'Tăng đề kháng', '/uploads/vitaminC_1000mg.webp'),
('Omeprazole 20mg', 'Điều trị đau dạ dày', '/uploads/omeprazol_200mg.jpg');

INSERT INTO warehouses (name, floor, temperature, type) VALUES
('Kho A', 1, 25, 'NORMAL'),
('Kho B', 2, 18, 'COOL'),
('Kho C', 1, 5, 'COLD'),
('Kho D', 3, 15, 'SPECIAL');

INSERT INTO batches (medicine_id, batch_code, quantity, import_date, expiry_date, warehouse_id) VALUES
(1, 'PARA-2026-01', 1000, '2026-01-01', '2027-01-01', 1),
(2, 'AMOX-2026-02', 500, '2026-02-10', '2027-02-10', 2),
(3, 'IBU-2026-03', 800, '2026-03-05', '2027-03-05', 1),
(4, 'VITC-2026-01', 1200, '2026-01-15', '2028-01-15', 3),
(5, 'OME-2026-02', 600, '2026-02-20', '2027-02-20', 4);

INSERT INTO import_requests (medicine_id, batch_code, quantity, status, received_date) VALUES
(1, 'PARA-2026-01', 1000, 'RECEIVED', '2026-01-02'),
(2, 'AMOX-2026-02', 500, 'PENDING', NULL),
(3, 'IBU-2026-03', 800, 'RECEIVED', '2026-03-06');

INSERT INTO export_requests (requester_id, status, storekeeper_confirm, requester_confirm, handle_result, feedback_note, processed_date) VALUES
(2, 'APPROVED', TRUE, TRUE, 'SENT', 'Xuất hàng thành công', '2026-04-10'),
(2, 'PENDING', NULL, NULL, NULL, NULL, NULL);

INSERT INTO export_request_items (export_request_id, medicine_id, quantity) VALUES
(1, 1, 100),
(1, 2, 50),
(2, 3, 200);

INSERT INTO inventory_logs (medicine_id, batch_id, change_amount, type, ref_id, ref_type, note) VALUES
(1, 1, -100, 'EXPORT', 1, 'EXPORT_REQUEST', 'Xuất cho đơn 1'),
(2, 2, -50, 'EXPORT', 1, 'EXPORT_REQUEST', 'Xuất cho đơn 1'),
(3, 3, 800, 'IMPORT', 1, 'IMPORT_REQUEST', 'Nhập kho đợt 1');