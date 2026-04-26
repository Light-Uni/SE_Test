const mysql = require('mysql2/promise');
async function alter() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '3237', database: 'pharmacy_db' });
  try {
    console.log('Altering import_requests table...');
    await conn.query(`ALTER TABLE import_requests MODIFY COLUMN status ENUM('PENDING','RECEIVED','REJECTED') DEFAULT 'PENDING'`);
    console.log('Altering export_requests table (just in case)...');
    await conn.query(`ALTER TABLE export_requests MODIFY COLUMN status ENUM('PENDING','APPROVED','COMPLETED','REJECTED') DEFAULT 'PENDING'`);
    console.log('Success!');
  } catch(e) { console.error(e); }
  finally { await conn.end(); }
}
alter();
