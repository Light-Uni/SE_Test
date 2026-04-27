const cron = require('node-cron');
const db = require('../config/db');
const { sendMail } = require('../services/emailService');

// Chạy vào 8h sáng mỗi ngày: '0 8 * * *'
cron.schedule('0 8 * * *', async () => {
  console.log('[Cron] Đang chạy kiểm tra hạn sử dụng lô hàng...');
  try {
    const [[{ nearExpiryCount }]] = await db.query(
      `SELECT COUNT(*) AS nearExpiryCount 
       FROM batches b
       JOIN medicines m ON m.id = b.medicine_id
       WHERE b.expiry_date <= DATE_ADD(NOW(), INTERVAL m.near_expiry_days DAY)
         AND b.expiry_date > NOW()
         AND b.quantity > 0`
    );

    const [[{ expiredCount }]] = await db.query(
      `SELECT COUNT(*) AS expiredCount FROM batches
       WHERE expiry_date < NOW() AND quantity > 0`
    );

    if (nearExpiryCount > 0 || expiredCount > 0) {
      // Gửi email cho manager (bạn có thể lấy danh sách manager từ DB hoặc cấu hình trong .env)
      // Dưới đây là gửi cho EMAIL_FROM hoặc một email mặc định
      const toEmail = process.env.MANAGER_EMAIL || process.env.EMAIL_FROM || 'admin@yourpharma.com';
      
      const subject = `[Cảnh báo] Tồn kho: ${expiredCount} lô hết hạn, ${nearExpiryCount} lô cận date`;
      const htmlContent = `
        <h2>Cảnh báo hàng tồn kho</h2>
        <p>Hệ thống ghi nhận có:</p>
        <ul>
          <li><b>${expiredCount}</b> lô hàng đã hết hạn.</li>
          <li><b>${nearExpiryCount}</b> lô hàng cận date cần chú ý.</li>
        </ul>
        <p>Vui lòng đăng nhập vào hệ thống để lên kế hoạch khuyến mãi hoặc xuất trả nhà cung cấp.</p>
        <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard">Truy cập hệ thống</a></p>
      `;

      await sendMail(toEmail, subject, htmlContent);
      console.log('[Cron] Đã gửi email cảnh báo hàng cận/hết date.');
    } else {
      console.log('[Cron] Không có lô hàng cận date hay hết hạn. Bỏ qua gửi email.');
    }
  } catch (error) {
    console.error('[Cron] Lỗi khi chạy cảnh báo expiry:', error.message);
  }
});
