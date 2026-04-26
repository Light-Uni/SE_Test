const mysql = require('mysql2/promise');

async function clearData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '3237',
    database: 'pharmacy_db'
  });
  
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const tablesToClear = [
      'import_requests',
      'export_request_items',
      'export_requests',
      'batches',
      'inventory_logs',
      'audit_items',
      'audit_sessions'
    ];
    
    for (const table of tablesToClear) {
      await connection.query(`TRUNCATE TABLE ${table}`);
      console.log(`Truncated ${table}`);
    }
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log("All transactional data cleared successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}
clearData();
