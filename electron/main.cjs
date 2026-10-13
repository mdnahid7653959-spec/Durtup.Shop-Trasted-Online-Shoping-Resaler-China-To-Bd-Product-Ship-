const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow;
let localServer = null;

// Determine if running in development or packaged production
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function startStaticServer(distDir) {
  return new Promise((resolve) => {
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.webp': 'image/webp',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    };

    const server = http.createServer((req, res) => {
      let cleanUrl = req.url.split('?')[0].split('#')[0];
      let filePath = path.join(distDir, cleanUrl);

      // SPA fallback: If file doesn't exist, serve index.html
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          filePath = path.join(distDir, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        fs.readFile(filePath, (readErr, content) => {
          if (readErr) {
            res.writeHead(500);
            res.end('Server Error');
            return;
          }
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        });
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      localServer = server;
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

async function createWindow() {
  const iconPath = path.join(__dirname, '../public/favicon.ico');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: 'Durtup Shop - Enterprise Admin Panel',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
  });

  // Stamp custom userAgent for Durtup Desktop App detection
  const currentUA = mainWindow.webContents.getUserAgent();
  mainWindow.webContents.setUserAgent(`${currentUA} DurtupDesktopApp/2.0 ElectronApp`);

  let activeBaseUrl = 'http://localhost:8080';

  // Customize standard window menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'Hard Reload', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'Quit Durtup Admin', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Full Screen', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.setZoomLevel(0) },
        { type: 'separator' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
      ],
    },
    {
      label: 'Navigation',
      submenu: [
        { label: 'Orders & Fulfillment', click: () => mainWindow.loadURL(activeBaseUrl + '/admin/orders') },
        { label: 'Dashboard Overview', click: () => mainWindow.loadURL(activeBaseUrl + '/admin') },
        { label: 'Products Management', click: () => mainWindow.loadURL(activeBaseUrl + '/admin/products') },
        { label: 'Customers & Users', click: () => mainWindow.loadURL(activeBaseUrl + '/admin/users') },
        { label: 'Store Settings', click: () => mainWindow.loadURL(activeBaseUrl + '/admin/settings') },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  if (isDev) {
    activeBaseUrl = 'http://localhost:8080';
    mainWindow.loadURL(`${activeBaseUrl}/admin`);
  } else {
    const distPath = path.join(__dirname, '../dist');
    activeBaseUrl = await startStaticServer(distPath);
    mainWindow.loadURL(`${activeBaseUrl}/admin`);
  }

  // Open external links (like customer phones, whatsapp, tracking links) in the default desktop browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (localServer) {
    try {
      localServer.close();
    } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
