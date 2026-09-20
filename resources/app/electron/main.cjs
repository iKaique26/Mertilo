const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const fs = require('fs');

const isDev = !app.isPackaged;

let backendProcess = null;
let backendStarting = false;
let backendSpawned = false;
let backendStartAttempts = 0;
const MAX_BACKEND_START_ATTEMPTS = 3;

function checkBackendReady(timeout = 2000) {
  return new Promise((resolve) => {
    const req = http.request({
      method: 'GET',
      host: '127.0.0.1',
      port: 5000,
      path: '/api/health',
      timeout
    }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 600;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function ensureBackend() {
  if (process.env.MERTILO_BACKEND_CHILD === '1') {
    console.log('Process running as backend child, skipping ensureBackend.');
    return;
  }

  if (backendStartAttempts >= MAX_BACKEND_START_ATTEMPTS) {
    console.warn('Máximo de tentativas de iniciar backend atingido; não tentarei mais automaticamente.');
    return;
  }

  const ready = await checkBackendReady(800);
  if (ready) return;

  const portInUse = await isPortInUse(5000);
  if (portInUse) {
    console.warn('Porta 5000 já está em uso; o backend do Mertilo não será reiniciado automaticamente.');
    backendStarting = false;
    return;
  }

  try {
    if (backendProcess && !backendProcess.killed) return;
    if (backendStarting) return;

    backendStarting = true;
    backendStartAttempts += 1;

    const appPath = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..');
    const candidatePaths = [
      path.join(appPath, 'api'),
      path.join(process.resourcesPath || '', 'api'),
      path.join(process.resourcesPath || '', 'app.asar.unpacked', 'api'),
      path.join(process.resourcesPath || '', 'app.asar.unpacked', 'dist', 'api')
    ];

    let apiDir = null;
    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p)) {
          apiDir = p;
          break;
        }
      } catch (e) {
        // ignora diretórios inválidos
      }
    }

    if (!apiDir) {
      console.warn('API não encontrada em recursos empacotados; o backend não será iniciado automaticamente.');
      return;
    }

    let entry = null;
    const distIndex = path.join(apiDir, 'dist', 'index.js');
    const srcIndex = path.join(apiDir, 'src', 'index.ts');

    if (fs.existsSync(distIndex)) entry = distIndex;
    else if (fs.existsSync(srcIndex)) entry = srcIndex;

    if (!entry) {
      console.warn('Nenhum entry point encontrado na pasta api (procure por dist/index.js)');
      backendStarting = false;
      return;
    }

    if (!entry.endsWith('.js')) {
      console.warn('Entry não é um .js – inicialização automática do backend foi ignorada:', entry);
      backendStarting = false;
      return;
    }

    // Use explicit system `node` when possible to avoid N-API/native module
    // incompatibilities when Electron's execPath is the Electron binary.
    // Prefer an env-provided NODE path, otherwise fall back to `node` on PATH.
    const nodeExec = process.env.NODE || 'node';
    const userDataDir = path.join(app.getPath('userData'), 'backend-data');
    const legacyDataFile = path.join(apiDir, 'data', 'data.json');
    const childEnv = Object.assign({}, process.env, {
      MERTILO_BACKEND_CHILD: '1',
      ELECTRON_RUN_AS_NODE: '1',
      MERTILO_DATA_DIR: userDataDir,
      MERTILO_LEGACY_DATA_FILE: legacyDataFile,
    });

    backendProcess = spawn(nodeExec, [entry], { cwd: apiDir, detached: false, stdio: 'pipe', env: childEnv });
    backendSpawned = true;

    backendProcess.stdout && backendProcess.stdout.on('data', (d) => console.log('[backend]', d.toString()));
    backendProcess.stderr && backendProcess.stderr.on('data', (d) => console.error('[backend][err]', d.toString()));
    backendProcess.on('exit', (code, sig) => {
      console.log('Backend process exited', code, sig);
      backendSpawned = false;
    });

    for (let i = 0; i < 10; i++) {
      const ok = await checkBackendReady(500);
      if (ok) {
        backendStarting = false;
        console.log('Backend pronto.');
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    console.warn('Backend iniciado, mas não respondeu no tempo esperado.');
    backendStarting = false;
    if (!backendSpawned && backendStartAttempts < MAX_BACKEND_START_ATTEMPTS) {
      setTimeout(() => {
        backendStarting = false;
        ensureBackend();
      }, 2000);
    }
  } catch (err) {
    console.error('Falha ao iniciar backend automaticamente:', err);
    backendStarting = false;
  }
}

function createWindow() {
  console.log('[Electron] creating BrowserWindow with explicit config');

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    x: 100,
    y: 100,
    show: true,
    backgroundColor: '#111827',
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  console.log('[Electron] BrowserWindow instance created', {
    isDestroyed: win.isDestroyed(),
    isVisible: win.isVisible(),
    bounds: win.getBounds(),
    webContentsId: win.webContents.id
  });

  const appRoot = path.resolve(__dirname, '..');
  const distIndexPath = path.resolve(appRoot, '..', 'dist', 'index.html');
  const productionUrl = `file://${distIndexPath.replace(/\\/g, '/')}`;
  const startUrl = process.env.ELECTRON_START_URL || productionUrl;

  console.log('[Electron] loading frontend URL', startUrl);

  win.webContents.on('did-start-loading', () => {
    console.log('[Electron] webContents did-start-loading');
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('[Electron] did-fail-load', { errorCode, errorDescription, validatedURL, isMainFrame });
  });

  win.webContents.on('did-finish-load', () => {
    console.log('[Electron] did-finish-load');
    console.log('[Electron] window visible?', win.isVisible(), 'destroyed?', win.isDestroyed());
  });

  win.webContents.on('dom-ready', () => {
    console.log('[Electron] dom-ready');
  });

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log('[Electron] console-message', { level, message, line, sourceId });
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Electron] render-process-gone', details);
  });

  win.webContents.on('unresponsive', () => {
    console.warn('[Electron] webContents unresponsive');
  });

  win.webContents.on('did-create-window', (childWindow) => {
    console.log('[Electron] child window created', childWindow && childWindow.id);
  });

  win.webContents.on('crashed', () => {
    console.error('[Electron] renderer crashed');
  });

  win.loadURL(startUrl).then(() => {
    console.log('[Electron] loadURL resolved');
  }).catch((err) => {
    console.error('[Electron] loadURL rejected', err);
  });

  win.once('ready-to-show', () => {
    console.log('[Electron] ready-to-show fired');
    win.show();
    console.log('[Electron] window shown after ready-to-show', { visible: win.isVisible(), bounds: win.getBounds() });
  });

  win.on('show', () => {
    console.log('[Electron] window show event fired', { visible: win.isVisible(), bounds: win.getBounds() });
  });

  win.on('closed', () => {
    console.log('[Electron] window closed event');
  });

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  return win;
}

function createMenu(mainWindow) {
  const template = [
    {
      label: 'Exibir',
      submenu: [
        { label: 'Recarregar', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'Forçar Recarregar', accelerator: 'Shift+CmdOrCtrl+R', click: () => mainWindow.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'Alternar Ferramentas de Desenvolvedor', accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I', click: () => mainWindow.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: 'Aumentar Zoom', accelerator: 'CmdOrCtrl+=', click: () => mainWindow.webContents.setZoomFactor(Math.min(mainWindow.webContents.getZoomFactor() + 0.1, 3)) },
        { label: 'Diminuir Zoom', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.setZoomFactor(Math.max(mainWindow.webContents.getZoomFactor() - 0.1, 0.3)) },
        { label: 'Resetar Zoom', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.setZoomFactor(1) },
        { type: 'separator' },
        { label: 'Tela Cheia', accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre Mertilo',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre Mertilo',
              message: 'Mertilo - Gerenciador de Finanças Pessoais',
              detail: 'Versão 1.0.0\nUm aplicativo desktop para controle de finanças pessoais, Built with Electron, React and Node.js.',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Documentação',
          click: () => {
            require('electron').shell.openExternal('https://github.com/iKaique26/Mertilo/blob/main/README.md');
          }
        },
        {
          label: 'Relatar Problema',
          click: () => {
            require('electron').shell.openExternal('https://github.com/iKaique26/Mertilo/issues');
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: `Sobre ${app.getName()}`, role: 'about' },
        { type: 'separator' },
        { label: 'Serviços', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Ocultar Mertilo', accelerator: 'Command+H', role: 'hide' },
        { label: 'Ocultar Outros', accelerator: 'Command+Alt+H', role: 'hideothers' },
        { label: 'Mostrar Todos', role: 'unhide' },
        { type: 'separator' },
        { label: 'Sair', accelerator: 'Command+Q', role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('before-quit', () => {
  console.log('[Electron] before-quit received');
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill('SIGTERM');
  }
});

app.on('ready', () => {
  console.log('[Electron] app ready event fired');
});

app.whenReady().then(async () => {
  console.log('[Electron] app.whenReady() resolved');

  const gotLock = app.requestSingleInstanceLock && app.requestSingleInstanceLock();
  if (!gotLock) {
    console.warn('[Electron] another instance is already running; quitting this instance');
    app.quit();
    return;
  }

  app.on('second-instance', () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins && wins.length) {
      wins[0].focus();
    }
  });

  try {
    console.log('[Electron] bootstrap backend start');
    const backendReady = await ensureBackend();
    console.log('[Electron] backendReady result', backendReady);

    console.log('[Electron] createWindow started');
    const mainWindow = createWindow();
    console.log('[Electron] createWindow returned', {
      exists: !!mainWindow,
      destroyed: mainWindow && mainWindow.isDestroyed && mainWindow.isDestroyed(),
      visible: mainWindow && mainWindow.isVisible && mainWindow.isVisible(),
      bounds: mainWindow && mainWindow.getBounds ? mainWindow.getBounds() : null,
      id: mainWindow && mainWindow.webContents ? mainWindow.webContents.id : null
    });

    createMenu(mainWindow);

    if (!backendReady && !(await checkBackendReady(4000))) {
      console.warn('Backend não respondeu ao health check; o frontend foi carregado mesmo assim para manter o app disponível.');
    }
  } catch (error) {
    console.error('[Electron] fatal error during startup bootstrap', error);
    app.quit();
  }
});

app.on('activate', function () {
  console.log('[Electron] app activate');
  if (BrowserWindow.getAllWindows().length === 0) {
    const win = createWindow();
    createMenu(win);
  }
});

app.on('window-all-closed', function () {
  console.log('[Electron] window-all-closed fired');
  if (backendProcess && !backendProcess.killed) {
    try {
      backendProcess.kill();
    } catch (e) {
      console.warn('Erro ao matar backend process', e);
    }
  }
  if (process.platform !== 'darwin') app.quit();
});
