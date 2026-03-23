const electron = require('electron');
console.log('--- TEST ---');
console.log('Type of electron:', typeof electron);
console.log('Keys:', Object.keys(electron));
if (electron.app) {
  console.log('App found! Version:', electron.app.getVersion());
  electron.app.quit();
} else {
  console.log('App NOT found.');
  process.exit(1);
}
