const express = require("express");
const router  = express.Router();
const db      = require("../config/db");

/**
 * GET /api/warehouses/suggest-position?medicine_id=X
 *
 * Trả về kho phù hợp với storage_type của thuốc,
 * cùng với vị trí đề xuất đầu tiên chưa bị đánh dấu full.
 *
 * Response:
 *   { suggested_warehouse_id, suggested_position, storage_type_required, warehouse_name }
 *   hoặc { error: "..." } nếu không có chỗ trống.
 */
router.get("/suggest-position", async (req, res) => {
  const { medicine_id } = req.query;
  if (!medicine_id) {
    return res.status(400).json({ message: "Thiếu medicine_id" });
  }

  try {
    // 1. Lấy storage_type của thuốc
    const [[medicine]] = await db.query(
      "SELECT id, name, storage_type FROM medicines WHERE id = ? AND is_deleted = 0",
      [medicine_id]
    );
    if (!medicine) {
      return res.status(404).json({ message: "Không tìm thấy thuốc" });
    }

    const storageType = medicine.storage_type || "NORMAL";

    // 2. Tìm kho phù hợp với storage_type
    const [warehouses] = await db.query(
      "SELECT id, name, capacity FROM warehouses WHERE storage_type = ? ORDER BY id ASC",
      [storageType]
    );
    if (warehouses.length === 0) {
      return res.json({
        suggested_warehouse_id: null,
        suggested_position:     null,
        storage_type_required:  storageType,
        warehouse_name:         null,
        error: `Không có kho nào phù hợp với điều kiện bảo quản: ${storageType}`,
      });
    }

    // 3. Với mỗi kho phù hợp, tìm vị trí chưa full (cabinet_is_full = 0)
    //    Format vị trí: F{floor}-{room}-M{cabinet}
    const FLOORS = [1, 2, 3];
    const ROOMS  = ["A", "B", "C"];
    const CABINETS = Array.from({ length: 10 }, (_, i) => `M${i + 1}`);

    for (const wh of warehouses) {
      // Lấy danh sách vị trí đã full trong kho này
      const [fullBatches] = await db.query(
        `SELECT DISTINCT position FROM batches
         WHERE warehouse_id = ? AND cabinet_is_full = 1 AND position IS NOT NULL`,
        [wh.id]
      );
      const fullSet = new Set(fullBatches.map((b) => b.position));

      // Tìm vị trí đầu tiên chưa full
      let found = null;
      outer: for (const floor of FLOORS) {
        for (const room of ROOMS) {
          for (const cab of CABINETS) {
            const pos = `F${floor}-${room}-${cab}`;
            if (!fullSet.has(pos)) {
              found = { warehouse_id: wh.id, warehouse_name: wh.name, position: pos };
              break outer;
            }
          }
        }
      }

      if (found) {
        return res.json({
          suggested_warehouse_id: found.warehouse_id,
          warehouse_name:         found.warehouse_name,
          suggested_position:     found.position,
          storage_type_required:  storageType,
          error: null,
        });
      }
    }

    // 4. Tất cả kho phù hợp đều đầy
    return res.json({
      suggested_warehouse_id: null,
      warehouse_name:         null,
      suggested_position:     null,
      storage_type_required:  storageType,
      error:                  "Khu vực bảo quản đầy, vui lòng sắp xếp lại",
    });
  } catch (err) {
    console.error("[warehouses/suggest-position]", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
