const mysql = require('mysql2/promise');
async function showCreate() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '3237', database: 'pharmacy_db' });
  try {
    const [rows] = await conn.query('SHOW CREATE TABLE import_requests');
    console.log(rows[0]['Create Table']);
  } catch(e) { console.error(e); }
  finally { await conn.end(); }
}
showCreate();
