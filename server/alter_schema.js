const mysql = require('mysql2/promise');
async function alterTable() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '3237', database: 'pharmacy_db' });
  try {
    await conn.query('ALTER TABLE import_requests ADD COLUMN expiry_date DATE NULL AFTER batch_code;');
    console.log("Added expiry_date column");
  } catch(e) { console.error(e); }
  finally { await conn.end(); }
}
alterTable();
