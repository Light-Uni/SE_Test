/**
 * runMigration.js
 * Chạy: node runMigration.js
 * Dùng để apply file 001_add_missing_columns.sql vào DB
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pharmacy_db",
    multipleStatements: true,          // <-- bắt buộc để chạy nhiều câu SQL 1 lần
  });

  console.log("✅ Kết nối DB thành công.");

  const sqlPath = path.join(__dirname, "migrations", "001_add_missing_columns.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  // Tách từng statement theo dấu ";"
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      console.log("✅", stmt.split("\n")[0].slice(0, 80));
    } catch (err) {
      // Bỏ qua lỗi "Duplicate column name" hoặc "already exists"
      if (
        err.code === "ER_DUP_FIELDNAME" ||
        err.code === "ER_TABLE_EXISTS_ERROR" ||
        err.code === "ER_DUP_KEY" ||
        err.message.includes("Duplicate") ||
        err.message.includes("already exists")
      ) {
        console.warn("⚠️  Bỏ qua (đã tồn tại):", stmt.split("\n")[0].slice(0, 60));
      } else {
        console.error("❌ Lỗi:", err.message);
        console.error("   Statement:", stmt.slice(0, 120));
      }
    }
  }

  await conn.end();
  console.log("\n✅ Migration hoàn tất!");
}

run().catch((err) => {
  console.error("❌ Kết nối DB thất bại:", err.message);
  process.exit(1);
});
