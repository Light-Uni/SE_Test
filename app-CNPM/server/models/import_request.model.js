const db = require("../config/db");

const ImportRequest = {
  // Lấy tất cả yêu cầu nhập kho
  async getAll() {
    const [rows] = await db.query(
      `SELECT ir.*, m.name AS medicine_name, u.name AS created_by_name
       FROM import_requests ir
       LEFT JOIN medicines m ON m.id = ir.medicine_id
       LEFT JOIN users u ON u.id = ir.created_by
       ORDER BY ir.id DESC`
    );
    return rows;
  },

  // Tạo yêu cầu nhập kho (manager)
  async create(data) {
    const { medicine_id, batch_code, expiry_date, quantity, created_by, note, type } = data;
    const [result] = await db.query(
      `INSERT INTO import_requests (medicine_id, batch_code, expiry_date, quantity, status, created_by, note, type)
       VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?)`,
      [medicine_id, batch_code || "", expiry_date || null, quantity, created_by, note || "", type || 'IMPORT']
    );
    return result.insertId;
  },

  // Xác nhận nhận hàng (storekeeper): INSERT batches + UPDATE status + ghi log
  async receive(id, receiveData) {
    const { batch_code, quantity, warehouse_id, expiry_date, note, position, status } = receiveData;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Lấy thông tin import request
      const [[req]] = await conn.query(
        `SELECT * FROM import_requests WHERE id = ?`,
        [id]
      );
      if (!req) throw { status: 404, message: "Không tìm thấy yêu cầu nhập" };

      // ── UC3: Kiểm tra điều kiện bảo quản ──────────────────────────
      // Lấy storage_type của thuốc
      const [[medicine]] = await conn.query(
        `SELECT storage_type FROM medicines WHERE id = ?`,
        [req.medicine_id]
      );
      const requiredType = medicine?.storage_type || "NORMAL";

      // Lấy storage_type của kho được chỉ định
      const assignedWarehouseId = warehouse_id || 1;
      const [[warehouse]] = await conn.query(
        `SELECT storage_type, name FROM warehouses WHERE id = ?`,
        [assignedWarehouseId]
      );

      if (!warehouse) {
        throw { status: 400, message: "Kho không tồn tại" };
      }

      if (warehouse.storage_type !== requiredType) {
        throw {
          status: 400,
          message: `Thuốc yêu cầu điều kiện bảo quản "${requiredType}" nhưng kho "${warehouse.name}" là "${warehouse.storage_type}". Vui lòng chọn đúng kho.`,
        };
      }

      // Kiểm tra vị trí có bị full không
      if (position) {
        const [[cabinetCheck]] = await conn.query(
          `SELECT cabinet_is_full FROM batches
           WHERE warehouse_id = ? AND position = ? AND cabinet_is_full = 1
           LIMIT 1`,
          [assignedWarehouseId, position]
        );
        if (cabinetCheck) {
          throw {
            status: 400,
            message: "Khu vực bảo quản đầy, vui lòng sắp xếp lại",
          };
        }
      }
      // ─────────────────────────────────────────────────────────────

      // INSERT batch mới
      const [batchResult] = await conn.query(
        `INSERT INTO batches (medicine_id, batch_code, quantity, import_date, expiry_date, warehouse_id, position)
         VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
        [req.medicine_id, batch_code, quantity, expiry_date, assignedWarehouseId, position]
      );
      const batchId = batchResult.insertId;

      // UPDATE import_requests.status
      await conn.query(
        `UPDATE import_requests SET status = 'RECEIVED', received_date = NOW() WHERE id = ?`,
        [id]
      );

      // Ghi inventory_log
      await conn.query(
        `INSERT INTO inventory_logs
           (medicine_id, batch_id, change_amount, type, ref_id, ref_type, note)
         VALUES (?, ?, ?, 'IMPORT', ?, 'IMPORT_REQUEST', ?)`,
        [
          req.medicine_id,
          batchId,
          quantity,
          id,
          (status === 'partial' ? '[Thiếu thuốc] ' : status === 'excess' ? '[Dư số lượng] ' : '') +
          (note || `Nhập kho theo yêu cầu #${id}`),
        ]
      );

      await conn.commit();

      // ── UC6: Kiểm tra tồn kho vượt max_stock ──
      let overStockWarning = null;
      try {
        const [[stockRow]] = await conn.query(
          `SELECT m.max_stock,
                  COALESCE(SUM(b.quantity), 0) AS current_stock
           FROM medicines m
           LEFT JOIN batches b ON b.medicine_id = m.id AND b.quantity > 0
           WHERE m.id = ?
           GROUP BY m.max_stock`,
          [req.medicine_id]
        );
        if (stockRow && stockRow.max_stock > 0) {
          const currentStock = Number(stockRow.current_stock);
          if (currentStock > stockRow.max_stock) {
            overStockWarning = `Tồn kho vượt mức tối đa (max_stock = ${stockRow.max_stock}, hiện tại = ${currentStock})`;
          }
        }
      } catch (_) { /* không block response */ }
      // ─────────────────────────────────────────

      return { batchId, warning: overStockWarning };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },


  // Từ chối yêu cầu nhập kho
  async reject(id, note) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [[req]] = await conn.query("SELECT * FROM import_requests WHERE id = ?", [id]);
      if (!req) throw { status: 404, message: "Không tìm thấy yêu cầu" };

      await conn.query(
        "UPDATE import_requests SET status = 'REJECTED', note = CONCAT(IFNULL(note, ''), ' | Từ chối: ', ?) WHERE id = ?",
        [note, id]
      );

      // Ghi log từ chối vào inventory_logs (change_amount = 0)
      await conn.query(
        `INSERT INTO inventory_logs (medicine_id, change_amount, type, ref_id, ref_type, note)
         VALUES (?, 0, 'IMPORT', ?, 'IMPORT_REQUEST', ?)`,
        [req.medicine_id, id, `Từ chối nhập kho yêu cầu #${id}: ${note}`]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = ImportRequest;
