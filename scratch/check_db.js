const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const os = require('os');

async function check() {
  const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'inversiones-urbaneja-pos', 'urbaneja_pos.db');
  console.log('Checking DB at:', dbPath);
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const prods = await db.all('SELECT * FROM productos LIMIT 5');
    console.log('First 5 products:');
    console.log(JSON.stringify(prods, null, 2));
    
    const tableInfo = await db.all('PRAGMA table_info(productos)');
    console.log('Table info:');
    console.log(JSON.stringify(tableInfo, null, 2));
    
    await db.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
