'use strict';
const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// ─── DB bootstrap ───────────────────────────────────────────────────────────
const { initDb } = require('./database/db');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'default',
    title: 'Inversiones Urbaneja POS',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  await initDb();

  // Register all IPC handlers
  require('./database/handlers/config');
  require('./database/handlers/categorias');
  require('./database/handlers/productos');
  require('./database/handlers/ventas');
  require('./database/handlers/cuentas');
  require('./database/handlers/cierres');
  require('./database/handlers/reportes');

  // Quick debug logger
  ipcMain.handle('log', (_, msg) => {
    console.error('--- RENDERER ERROR ---');
    console.error(msg);
  });

  createWindow();

  // Grant camera & microphone access without a prompt
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowed = ['media', 'mediaKeySystem', 'camera', 'microphone'];
    callback(allowed.includes(permission));
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    const allowed = ['media', 'mediaKeySystem', 'camera', 'microphone'];
    return allowed.includes(permission);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
