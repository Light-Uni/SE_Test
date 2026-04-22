const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/inventory  ← tất cả batches JOIN medicines JOIN warehouses, kèm computed status
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        b.id,
        b.batch_code   AS batchName,
        m.name         AS productName,
        b.quantity,
        b.expiry_date  AS expiryDate,
        w.name         AS warehouse,
        b.position,
        b.medicine_id,
        b.warehouse_id,
        CASE
          WHEN b.expiry_date < NOW() THEN 'expired'
          WHEN b.expiry_date <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'near'
          ELSE 'safe'
        END AS status
      FROM batches b
      JOIN medicines m ON m.id = b.medicine_id
      LEFT JOIN warehouses w ON w.id = b.warehouse_id
      WHERE b.quantity > 0
      ORDER BY b.expiry_date ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
