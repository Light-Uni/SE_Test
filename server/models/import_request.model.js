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
    const { medicine_id, batch_code, quantity, created_by, note } = data;
    const [result] = await db.query(
      `INSERT INTO import_requests (medicine_id, batch_code, quantity, status, created_by, note)
       VALUES (?, ?, ?, 'PENDING', ?, ?)`,
      [medicine_id, batch_code || "", quantity, created_by, note || ""]
    );
    return result.insertId;
  },

  // Xác nhận nhận hàng (storekeeper): INSERT batches + UPDATE status + ghi log
  async receive(id, receiveData) {
    const { batch_code, quantity, warehouse_id, expiry_date, note } = receiveData;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Lấy thông tin import request
      const [[req]] = await conn.query(
        `SELECT * FROM import_requests WHERE id = ?`,
        [id]
      );
      if (!req) throw { status: 404, message: "Không tìm thấy yêu cầu nhập" };

      // INSERT batch mới
      const [batchResult] = await conn.query(
        `INSERT INTO batches (medicine_id, batch_code, quantity, import_date, expiry_date, warehouse_id)
         VALUES (?, ?, ?, NOW(), ?, ?)`,
        [req.medicine_id, batch_code, quantity, expiry_date, warehouse_id]
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
          note || `Nhập kho theo yêu cầu #${id}`,
        ]
      );

      await conn.commit();
      return batchId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = ImportRequest;
