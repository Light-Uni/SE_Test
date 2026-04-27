const db     = require("../config/db");
const bcrypt = require("bcryptjs");

// GET /api/users/me/profile
exports.get = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, name, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/me/profile
exports.update = async (req, res) => {
  try {
    const { name, email } = req.body;
    await db.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [name, email, req.user.id]
    );
    res.json({ message: "Cập nhật hồ sơ thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/me/change-password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
