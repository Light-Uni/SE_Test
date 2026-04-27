const db = require("../config/db");

/**
 * checkAuditLock — middleware kiểm tra khoá kiểm kê.
 *
 * Kiểm tra xem các medicine_id trong request có đang bị khoá bởi
 * một phiên kiểm kê đang MỞ (status = 'OPEN') hay không.
 *
 * Dùng cho:
 *  - POST /api/export-requests  → body.items[].medicine_id
 *  - POST /api/import-requests  → body.medicine_id
 *
 * Nếu bị khoá → trả 423 Locked với thông báo tiếng Việt.
 */
async function checkAuditLock(req, res, next) {
  try {
    // Gom tất cả medicine_id cần kiểm tra
    let medicineIds = [];

    // Trường hợp 1: POST /api/import-requests (một thuốc)
    if (req.body.medicine_id) {
      medicineIds.push(Number(req.body.medicine_id));
    }

    // Trường hợp 2: POST /api/export-requests (nhiều thuốc)
    if (Array.isArray(req.body.items)) {
      for (const item of req.body.items) {
        if (item.medicine_id) medicineIds.push(Number(item.medicine_id));
      }
    }

    // Không có medicine_id nào → bỏ qua kiểm tra
    if (medicineIds.length === 0) return next();

    // Lấy tất cả phiên kiểm kê OPEN có locked_medicine_ids
    const [openSessions] = await db.query(
      `SELECT id, locked_medicine_ids
       FROM audit_sessions
       WHERE status = 'OPEN'
         AND locked_medicine_ids IS NOT NULL
         AND locked_medicine_ids != '[]'`
    );

    if (openSessions.length === 0) return next();

    // Tập hợp tất cả medicine_id đang bị khoá
    const lockedSet = new Set();
    for (const session of openSessions) {
      let ids = [];
      try {
        ids = typeof session.locked_medicine_ids === "string"
          ? JSON.parse(session.locked_medicine_ids)
          : session.locked_medicine_ids; // mysql2 tự parse JSON
      } catch (_) { ids = []; }

      for (const id of ids) lockedSet.add(Number(id));
    }

    // Tìm thuốc nào trong request bị khoá
    const blocked = medicineIds.filter((id) => lockedSet.has(id));
    if (blocked.length === 0) return next();

    return res.status(423).json({
      message: "Thuốc đang trong kỳ kiểm kê, không thể xuất/nhập",
      locked_medicine_ids: blocked,
    });
  } catch (err) {
    console.error("[checkAuditLock]", err.message);
    // Lỗi không nên chặn nghiệp vụ → cho qua nhưng log lại
    next();
  }
}

module.exports = checkAuditLock;
