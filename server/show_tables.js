const mysql = require('mysql2/promise');

async function clearData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '3237',
    database: 'pharmacy_db'
  });
  
  try {
    const [tables] = await connection.query('SHOW TABLES');
    console.log(tables.map(t => Object.values(t)[0]));
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}
clearData();
