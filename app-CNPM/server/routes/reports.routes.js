const express = require("express");
const router  = express.Router();
const reportController = require("../controllers/report.controller");
const db = require("../config/db");
const { generateExcel, generatePDF } = require("../utils/exportReport");

// GET /api/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/revenue", reportController.getRevenue);

// GET /api/reports/profit?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/profit", reportController.getProfit);

// GET /api/reports/revenue-by-medicine?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/revenue-by-medicine", reportController.getRevenueByMedicine);

// GET /api/reports/monthly-summary?year=YYYY
router.get("/monthly-summary", reportController.getMonthlySummary);

// GET /api/reports/slow-moving?days=90&threshold=10
router.get("/slow-moving", reportController.getSlowMoving);

// GET /api/reports/fast-moving?days=30&top=10
router.get("/fast-moving", reportController.getFastMoving);

// ─────────────────────────────────────────────────────
// EXPORT ENDPOINTS
// ─────────────────────────────────────────────────────

/**
 * GET /api/reports/inventory/export?format=excel|pdf&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Xuất báo cáo tồn kho (tất cả lô có số lượng > 0)
 */
router.get("/inventory/export", async (req, res) => {
  const { format = "excel", from, to } = req.query;

  try {
    let query = `
      SELECT
        m.name              AS medicine_name,
        b.batch_code,
        b.quantity,
        DATE_FORMAT(b.expiry_date, '%d/%m/%Y')  AS expiry_date,
        DATE_FORMAT(b.import_date, '%d/%m/%Y')  AS import_date,
        b.position,
        w.name              AS warehouse_name,
        w.storage_type
      FROM batches b
      JOIN medicines m ON m.id = b.medicine_id
      LEFT JOIN warehouses w ON w.id = b.warehouse_id
      WHERE b.quantity > 0
    `;
    const params = [];
    if (from)  { query += " AND b.import_date >= ?"; params.push(from); }
    if (to)    { query += " AND b.import_date <= ?"; params.push(to); }
    query += " ORDER BY m.name, b.expiry_date ASC";

    const [rows] = await db.query(query, params);

    const columns = [
      { key: "medicine_name",  header: "Tên thuốc",       width: 30 },
      { key: "batch_code",     header: "Mã lô",           width: 18 },
      { key: "quantity",       header: "Số lượng",        width: 12 },
      { key: "expiry_date",    header: "Hạn sử dụng",     width: 16 },
      { key: "import_date",    header: "Ngày nhập",       width: 16 },
      { key: "warehouse_name", header: "Kho",             width: 20 },
      { key: "storage_type",   header: "Bảo quản",        width: 14 },
      { key: "position",       header: "Vị trí",          width: 14 },
    ];

    const title = "Báo cáo tồn kho" + (from || to ? ` (${from ?? ""} – ${to ?? ""})` : "");

    if (format === "pdf") {
      const buf = await generatePDF(rows, title, columns);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="ton-kho-${Date.now()}.pdf"`);
      return res.send(buf);
    }

    const buf = await generateExcel(rows, columns, "Tồn kho");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="ton-kho-${Date.now()}.xlsx"`);
    return res.send(buf);

  } catch (err) {
    console.error("[reports/inventory/export]", err.message);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/reports/audit/:id/export?format=excel|pdf
 * Xuất báo cáo chi tiết 1 phiên kiểm kê
 */
router.get("/audit/:id/export", async (req, res) => {
  const { format = "excel" } = req.query;
  const { id } = req.params;

  try {
    const [[session]] = await db.query(
      `SELECT s.id, u.name AS created_by_name, s.status,
              DATE_FORMAT(s.created_at, '%d/%m/%Y %H:%i') AS created_at
       FROM audit_sessions s
       LEFT JOIN users u ON u.id = s.created_by
       WHERE s.id = ?`,
      [id]
    );
    if (!session) return res.status(404).json({ message: "Không tìm thấy phiên kiểm kê" });

    const [items] = await db.query(
      `SELECT
         m.name          AS medicine_name,
         b.batch_code,
         ai.system_qty,
         IFNULL(ai.actual_qty, ai.system_qty) AS actual_qty,
         (IFNULL(ai.actual_qty, ai.system_qty) - ai.system_qty) AS diff
       FROM audit_items ai
       JOIN medicines m ON m.id = ai.medicine_id
       JOIN batches   b ON b.id = ai.batch_id
       WHERE ai.session_id = ?
       ORDER BY m.name`,
      [id]
    );

    const columns = [
      { key: "medicine_name", header: "Tên thuốc",   width: 30 },
      { key: "batch_code",    header: "Mã lô",        width: 18 },
      { key: "system_qty",    header: "SL hệ thống",  width: 14 },
      { key: "actual_qty",    header: "SL thực tế",   width: 14 },
      { key: "diff",          header: "Chênh lệch",   width: 14 },
    ];

    const title = `Báo cáo kiểm kê phiên #${id} – ${session.created_at} – ${session.status}`;

    if (format === "pdf") {
      const buf = await generatePDF(items, title, columns);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="kiem-ke-${id}-${Date.now()}.pdf"`);
      return res.send(buf);
    }

    const buf = await generateExcel(items, columns, `Kiểm kê #${id}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="kiem-ke-${id}-${Date.now()}.xlsx"`);
    return res.send(buf);

  } catch (err) {
    console.error("[reports/audit/export]", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
