const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const os = require('os');

async function check() {
  const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'inversiones-urbaneja-pos', 'urbaneja_pos.db');
  console.log('Checking DB at:', dbPath);
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    for (const table of tables) {
      console.log(`\n--- Table: ${table.name} ---`);
      const info = await db.all(`PRAGMA table_info(${table.name})`);
      console.log(JSON.stringify(info, null, 2));
    }
    
    await db.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
