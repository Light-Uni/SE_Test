/**
 * fixColumns.js — Thêm các cột còn thiếu vào batches và import_requests
 * Chạy: node fixColumns.js
 */
require("dotenv").config();
const mysql = require("mysql2/promise");

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pharmacy_db",
  });
  console.log("✅ Kết nối DB thành công.");

  const steps = [
    // ── audit_sessions ──
    {
      label: "CREATE audit_sessions",
      sql: `CREATE TABLE IF NOT EXISTS audit_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_by INT,
        status ENUM('OPEN','CONFIRMED') DEFAULT 'OPEN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`,
    },
    // ── audit_items ──
    {
      label: "CREATE audit_items",
      sql: `CREATE TABLE IF NOT EXISTS audit_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        medicine_id INT NOT NULL,
        batch_id INT NOT NULL,
        system_qty INT NOT NULL,
        actual_qty INT,
        FOREIGN KEY (session_id) REFERENCES audit_sessions(id),
        FOREIGN KEY (medicine_id) REFERENCES medicines(id),
        FOREIGN KEY (batch_id) REFERENCES batches(id)
      )`,
    },
    // ── batches.position ──
    {
      label: "ADD batches.position",
      sql: `ALTER TABLE batches ADD COLUMN position VARCHAR(50)`,
    },
    // ── medicines columns ──
    {
      label: "ADD medicines.storage_type",
      sql: `ALTER TABLE medicines ADD COLUMN storage_type ENUM('NORMAL','COOL','COLD','SPECIAL') DEFAULT 'NORMAL'`,
    },
    {
      label: "ADD medicines.min_stock",
      sql: `ALTER TABLE medicines ADD COLUMN min_stock INT DEFAULT 0`,
    },
    {
      label: "ADD medicines.max_stock",
      sql: `ALTER TABLE medicines ADD COLUMN max_stock INT DEFAULT 0`,
    },
    {
      label: "ADD medicines.near_expiry_days",
      sql: `ALTER TABLE medicines ADD COLUMN near_expiry_days INT DEFAULT 180`,
    },
    // ── import_requests columns ──
    {
      label: "ADD import_requests.created_by",
      sql: `ALTER TABLE import_requests ADD COLUMN created_by INT`,
    },
    {
      label: "ADD import_requests.note",
      sql: `ALTER TABLE import_requests ADD COLUMN note TEXT`,
    },
  ];

  for (const step of steps) {
    try {
      await conn.query(step.sql);
      console.log(`✅ ${step.label}`);
    } catch (err) {
      if (
        err.code === "ER_DUP_FIELDNAME" ||
        err.code === "ER_TABLE_EXISTS_ERROR" ||
        err.message.includes("Duplicate column")
      ) {
        console.log(`⚠️  Bỏ qua (đã tồn tại): ${step.label}`);
      } else {
        console.error(`❌ ${step.label}:`, err.message);
      }
    }
  }

  await conn.end();
  console.log("\n✅ Xong!");
}

run().catch((err) => {
  console.error("❌ Lỗi kết nối:", err.message);
  process.exit(1);
});
