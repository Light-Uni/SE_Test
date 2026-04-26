-- ============================================================
-- Migration 001: Add missing tables and columns
-- ============================================================

-- 1. Tạo bảng audit_sessions
CREATE TABLE IF NOT EXISTS audit_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_by INT,
  status ENUM('OPEN','CONFIRMED') DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 2. Tạo bảng audit_items
CREATE TABLE IF NOT EXISTS audit_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  medicine_id INT NOT NULL,
  batch_id INT NOT NULL,
  system_qty INT NOT NULL,
  actual_qty INT,
  FOREIGN KEY (session_id) REFERENCES audit_sessions(id),
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);

-- 3. Thêm cột vào medicines
ALTER TABLE medicines
  ADD COLUMN IF NOT EXISTS storage_type ENUM('NORMAL','COOL','COLD','SPECIAL') DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS min_stock INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_stock INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS near_expiry_days INT DEFAULT 180;

-- 4. Thêm cột position vào batches
ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS position VARCHAR(50);

-- 5. Thêm cột vào import_requests
ALTER TABLE import_requests
  ADD COLUMN IF NOT EXISTS created_by INT,
  ADD COLUMN IF NOT EXISTS note TEXT;

-- Thêm FK cho import_requests.created_by (chỉ chạy nếu chưa tồn tại)
ALTER TABLE import_requests
  ADD CONSTRAINT fk_import_requests_created_by
  FOREIGN KEY (created_by) REFERENCES users(id);
