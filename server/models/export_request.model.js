const db = require("../config/db");

const ExportRequest = {
  // Lấy danh sách yêu cầu (storekeeper)
  async getAll() {
    const [rows] = await db.query(
      `SELECT er.*, u.name AS requester_name
       FROM export_requests er
       LEFT JOIN users u ON u.id = er.requester_id
       ORDER BY er.id DESC`
    );
    // Lấy items cho từng request
    for (const r of rows) {
      const [items] = await db.query(
        `SELECT eri.*, m.name AS medicine_name
         FROM export_request_items eri
         JOIN medicines m ON m.id = eri.medicine_id
         WHERE eri.export_request_id = ?`,
        [r.id]
      );
      r.items = items;
    }
    return rows;
  },

  // Lấy các request của chính người dùng (requester)
  async getMyRequests(userId) {
    const [rows] = await db.query(
      `SELECT * FROM export_requests WHERE requester_id = ? ORDER BY id DESC`,
      [userId]
    );
    for (const r of rows) {
      const [items] = await db.query(
        `SELECT eri.*, m.name AS medicine_name
         FROM export_request_items eri
         JOIN medicines m ON m.id = eri.medicine_id
         WHERE eri.export_request_id = ?`,
        [r.id]
      );
      r.items = items;
    }
    return rows;
  },

  // Tạo yêu cầu xuất kho
  async create(requesterId, items) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO export_requests (requester_id, status) VALUES (?, 'PENDING')`,
        [requesterId]
      );
      const requestId = result.insertId;

      for (const item of items) {
        await conn.query(
          `INSERT INTO export_request_items (export_request_id, medicine_id, quantity)
           VALUES (?, ?, ?)`,
          [requestId, item.medicine_id, item.quantity]
        );
      }

      await conn.commit();
      return requestId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Duyệt yêu cầu
  async approve(id) {
    await db.query(
      `UPDATE export_requests SET status = 'APPROVED' WHERE id = ?`,
      [id]
    );
  },

  // Từ chối yêu cầu
  async reject(id, note) {
    await db.query(
      `UPDATE export_requests SET status = 'REJECTED', feedback_note = ? WHERE id = ?`,
      [note, id]
    );
  },

  // Hoàn thành xuất kho: trừ batches + ghi log
  async complete(requestId, exportItems) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      for (const item of exportItems) {
        // Kiểm tra hạn sử dụng
        const [[batch]] = await conn.query(
          `SELECT id, batch_code, expiry_date, quantity FROM batches WHERE id = ?`,
          [item.batch_id]
        );
        if (!batch) throw { status: 400, message: `Không tìm thấy lô #${item.batch_id}` };

        const now = new Date();
        if (new Date(batch.expiry_date) < now) {
          throw {
            status: 400,
            message: `Lô ${batch.batch_code} đã hết hạn, không thể xuất`,
          };
        }

        if (item.quantity > batch.quantity) {
          throw {
            status: 400,
            message: `Lô ${batch.batch_code} không đủ số lượng (còn ${batch.quantity}, yêu cầu ${item.quantity})`,
          };
        }

        // Trừ số lượng
        await conn.query(
          `UPDATE batches SET quantity = quantity - ? WHERE id = ?`,
          [item.quantity, item.batch_id]
        );

        // Lấy medicine_id từ batch
        const [[batchInfo]] = await conn.query(
          `SELECT medicine_id FROM batches WHERE id = ?`,
          [item.batch_id]
        );

        // Ghi inventory_log
        await conn.query(
          `INSERT INTO inventory_logs
             (medicine_id, batch_id, change_amount, type, ref_id, ref_type, note)
           VALUES (?, ?, ?, 'EXPORT', ?, 'EXPORT_REQUEST', ?)`,
          [
            batchInfo.medicine_id,
            item.batch_id,
            -item.quantity,
            requestId,
            `Xuất kho theo yêu cầu #${requestId}`,
          ]
        );
      }

      // Cập nhật status
      await conn.query(
        `UPDATE export_requests
         SET status = 'COMPLETED', storekeeper_confirm = 1, processed_date = NOW(), handle_result = 'SENT'
         WHERE id = ?`,
        [requestId]
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

module.exports = ExportRequest;
