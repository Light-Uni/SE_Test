const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const db     = require("../config/db");

const User = require("../models/user.model");

const JWT_SECRET = process.env.JWT_SECRET;

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const username = email.split("@")[0];

    const existingUser = await User.findByUsername(username);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword,
      name,
      email,
    });

    res.json({ message: "Register success" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const role = (user.role || "REQUESTER").toUpperCase();

    const token = jwt.sign({ id: user.id, role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login success",
      token,
      user: {
        id: user.id,
        name: user.name,
        role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const { sendResetEmail } = require('../services/emailService');

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.json({ message: "Nếu email tồn tại, link reset mật khẩu đã được gửi." });
    }

    const user = users[0];

    const token = crypto.randomBytes(32).toString("hex");

    const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_exp = ? WHERE id = ?",
      [token, expireTime, user.id],
    );

    try {
      await sendResetEmail(user.email, token);
    } catch (emailErr) {
      console.error('[forgotPassword] Gửi email thất bại:', emailErr.message);
    }

    res.json({ message: "Nếu email tồn tại, link reset mật khẩu đã được gửi." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_exp > NOW()",
      [token]
    );
    if (users.length === 0) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_exp = NULL WHERE id = ?",
      [hashed, users[0].id]
    );
    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
