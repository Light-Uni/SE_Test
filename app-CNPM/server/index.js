require("dotenv").config();
const express = require("express");
const cors    = require("cors");

// Database connection check
require('./config/db');

// Khởi chạy Cron Jobs
require('./cron/expiryAlert');

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
const warehouseRoutes          = require("./routes/warehouses.routes");
const purchaseReqRoutes        = require("./routes/purchase_requisitions.routes");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
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
app.use("/api/warehouses",             auth, warehouseRoutes);
app.use("/api/purchase-requisitions",  auth, purchaseReqRoutes);

// ── Cronjob: email cảnh báo cận date ──
require("./jobs/expiryAlertJob");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
