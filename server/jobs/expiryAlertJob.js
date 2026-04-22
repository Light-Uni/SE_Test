const cron = require("node-cron");
const db = require("../config/db");
const { sendNearExpiryAlert } = require("../services/emailService");

// Chạy mỗi ngày lúc 8:00 sáng
cron.schedule("0 8 * * *", async () => {
  try {
    console.log("[ExpiryAlertJob] Đang kiểm tra lô thuốc cận date...");

    // 1. Lấy các lô thuốc cận date (trong 6 tháng tới)
    const [items] = await db.query(`
      SELECT
        m.name,
        b.batch_code,
        b.expiry_date,
        b.quantity,
        w.name AS warehouse_name
      FROM batches b
      JOIN medicines m ON m.id = b.medicine_id
      LEFT JOIN warehouses w ON w.id = b.warehouse_id
      WHERE b.expiry_date <= DATE_ADD(NOW(), INTERVAL 6 MONTH)
        AND b.quantity > 0
      ORDER BY b.expiry_date ASC
    `);

    if (items.length === 0) {
      console.log("[ExpiryAlertJob] Không có lô nào cần cảnh báo.");
      return;
    }

    // 2. Lấy danh sách email của MANAGER
    const [managers] = await db.query(
      `SELECT email, name FROM users WHERE role = 'MANAGER' AND email IS NOT NULL`
    );

    if (managers.length === 0) {
      console.log("[ExpiryAlertJob] Không có manager nào để gửi email.");
      return;
    }

    // 3. Gửi email cho từng manager
    for (const manager of managers) {
      try {
        await sendNearExpiryAlert(manager.email, items);
        console.log(`[ExpiryAlertJob] Đã gửi email cảnh báo đến ${manager.email}`);
      } catch (emailErr) {
        console.error(`[ExpiryAlertJob] Lỗi gửi email đến ${manager.email}:`, emailErr.message);
      }
    }

    console.log(`[ExpiryAlertJob] Hoàn thành. ${items.length} lô cần chú ý, gửi cho ${managers.length} manager.`);
  } catch (err) {
    console.error("[ExpiryAlertJob] Lỗi:", err.message);
  }
});

console.log("[ExpiryAlertJob] Đã đăng ký cron job (mỗi ngày 8:00 sáng).");
