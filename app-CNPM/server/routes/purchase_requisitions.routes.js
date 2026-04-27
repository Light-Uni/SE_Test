const express = require("express");
const router  = express.Router();
const db      = require("../config/db");
const requireRole = require('../middlewares/roleMiddleware');

/**
 * GET /api/purchase-requisitions
 * Lấy tất cả đề xuất mua hàng (manager only).
 */
router.get("/", requireRole('MANAGER', 'STOREKEEPER'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pr.*, m.storage_type, m.max_stock
       FROM purchase_requisitions pr
       JOIN medicines m ON m.id = pr.medicine_id
       ORDER BY pr.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/purchase-requisitions/count
 * Đếm số PENDING — dùng cho Dashboard MetricCard.
 */
router.get("/count", async (req, res) => {
  try {
    const [[{ cnt }]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM purchase_requisitions WHERE status = 'PENDING'`
    );
    res.json({ count: Number(cnt) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/purchase-requisitions/:id/approve
 */
router.patch("/:id/approve", requireRole('MANAGER'), async (req, res) => {
  try {
    await db.query(
      `UPDATE purchase_requisitions SET status = 'APPROVED' WHERE id = ?`,
      [req.params.id]
    );
    res.json({ message: "Đã duyệt đề xuất mua hàng" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/purchase-requisitions/:id/reject
 */
router.patch("/:id/reject", requireRole('MANAGER'), async (req, res) => {
  try {
    await db.query(
      `UPDATE purchase_requisitions SET status = 'REJECTED' WHERE id = ?`,
      [req.params.id]
    );
    res.json({ message: "Đã từ chối đề xuất mua hàng" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
