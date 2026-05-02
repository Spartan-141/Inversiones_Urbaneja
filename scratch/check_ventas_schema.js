const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const os = require('os');

async function check() {
  const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'inversiones-urbaneja-pos', 'urbaneja_pos.db');
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    
    console.log('\n--- ventas ---');
    let info = await db.all(`PRAGMA table_info(ventas)`);
    console.log(JSON.stringify(info, null, 2));

    console.log('\n--- detalle_venta ---');
    info = await db.all(`PRAGMA table_info(detalle_venta)`);
    console.log(JSON.stringify(info, null, 2));

    await db.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
