const mysql = require('mysql2/promise');

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '3237',
    database: 'pharmacy_db'
  });
  
  try {
    const [cols] = await connection.query('SHOW COLUMNS FROM import_requests');
    console.log("import_requests cols:", cols.map(c => c.Field));
    
    const [cols2] = await connection.query('SHOW COLUMNS FROM batches');
    console.log("batches cols:", cols2.map(c => c.Field));
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}
checkSchema();
