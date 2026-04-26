require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const db      = require("./config/db");

const auth = require("./middlewares/authMiddleware");

const authRoutes          = require("./routes/auth.routes");
const medicineRoutes      = require("./routes/medicines.routes");
const userRoutes          = require("./routes/users.routes");
const auditRoutes         = require("./routes/audits.routes");
const exportRequestRoutes = require("./routes/export_requests.routes");
const importRequestRoutes = require("./routes/import_requests.routes");
const dashboardRoutes     = require("./routes/dashboard.routes");
const batchesRoutes       = require("./routes/batches.routes");
const inventoryRoutes     = require("./routes/inventory.routes");
const inventoryLogsRoutes = require("./routes/inventory_logs.routes");
const reportRoutes        = require("./routes/reports.routes");

// ── Migration: tự động thêm các cột/bảng còn thiếu khi server khởi động ──
async function runMigrations() {
  const migrations = [
    {
      label: "CREATE audit_sessions",
      sql: `CREATE TABLE IF NOT EXISTS audit_sessions (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        created_by INT,
        status     ENUM('OPEN','CONFIRMED') DEFAULT 'OPEN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`,
    },
    {
      label: "CREATE audit_items",
      sql: `CREATE TABLE IF NOT EXISTS audit_items (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        session_id  INT NOT NULL,
        medicine_id INT NOT NULL,
        batch_id    INT NOT NULL,
        system_qty  INT NOT NULL,
        actual_qty  INT,
        FOREIGN KEY (session_id)  REFERENCES audit_sessions(id),
        FOREIGN KEY (medicine_id) REFERENCES medicines(id),
        FOREIGN KEY (batch_id)    REFERENCES batches(id)
      )`,
    },
    { label: "ADD batches.position",              sql: `ALTER TABLE batches          ADD COLUMN position          VARCHAR(50)` },
    { label: "ADD medicines.storage_type",        sql: `ALTER TABLE medicines         ADD COLUMN storage_type      ENUM('NORMAL','COOL','COLD','SPECIAL') DEFAULT 'NORMAL'` },
    { label: "ADD medicines.min_stock",           sql: `ALTER TABLE medicines         ADD COLUMN min_stock         INT DEFAULT 0` },
    { label: "ADD medicines.max_stock",           sql: `ALTER TABLE medicines         ADD COLUMN max_stock         INT DEFAULT 0` },
    { label: "ADD medicines.near_expiry_days",    sql: `ALTER TABLE medicines         ADD COLUMN near_expiry_days  INT DEFAULT 180` },
    { label: "ADD import_requests.created_by",   sql: `ALTER TABLE import_requests   ADD COLUMN created_by        INT` },
    { label: "ADD import_requests.note",         sql: `ALTER TABLE import_requests   ADD COLUMN note              TEXT` },
    { label: "ADD medicines.unit_price",         sql: `ALTER TABLE medicines         ADD COLUMN unit_price        DECIMAL(12,2) DEFAULT 0` },
    { label: "ADD medicines.import_price",       sql: `ALTER TABLE medicines         ADD COLUMN import_price      DECIMAL(12,2) DEFAULT 0` },
    { label: "ADD batches.cabinet_is_full",      sql: `ALTER TABLE batches           ADD COLUMN cabinet_is_full   TINYINT(1)    DEFAULT 0` },
  ];

  for (const { label, sql } of migrations) {
    try {
      await db.query(sql);
      console.log(`✅ Migration: ${label}`);
    } catch (err) {
      // Bỏ qua lỗi "đã tồn tại" — hoàn toàn bình thường khi chạy lại
      if (
        err.code === "ER_DUP_FIELDNAME" ||
        err.code === "ER_TABLE_EXISTS_ERROR" ||
        err.message.includes("Duplicate column")
      ) {
        // Cột/bảng đã tồn tại, không cần làm gì
      } else {
        console.error(`❌ Migration failed [${label}]:`, err.message);
      }
    }
  }
}

const app = express();

app.use(cors());
app.use(express.json());

// ── Public routes (không cần auth) ──
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("assets/uploads"));

// ── Protected routes (cần auth) ──
app.use("/api/medicines",       auth, medicineRoutes);
app.use("/api/users",           auth, userRoutes);
app.use("/api/audits",          auth, auditRoutes);
app.use("/api/export-requests", auth, exportRequestRoutes);
app.use("/api/import-requests", auth, importRequestRoutes);
app.use("/api/dashboard",       auth, dashboardRoutes);
app.use("/api/batches",         auth, batchesRoutes);
app.use("/api/inventory",       auth, inventoryRoutes);
app.use("/api/inventory-logs",  auth, inventoryLogsRoutes);
app.use("/api/reports",         auth, reportRoutes);

// ── Cronjob: email cảnh báo cận date ──
require("./jobs/expiryAlertJob");

const PORT = process.env.PORT || 3000;

// Chạy migration trước, sau đó mới start server
runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
