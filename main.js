import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// BLOQUEO DE INSTANCIA UNICA
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // Importamos el servidor. Al ser un import dinámico, se ejecuta en el proceso principal.
    try {
      await import('./server.js');
    } catch (e) {
      console.error("Error fatal iniciando servidor interno:", e);
    }

    createWindow();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "SGI PRO - ESTADO ANZOÁTEGUI",
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'venezuela.ico'), 
    webPreferences: { 
      nodeIntegration: false, 
      contextIsolation: true 
    }
  });

  const startUrl = 'http://localhost:3001';
  
  const loadWithRetry = (retries = 0) => {
    mainWindow.loadURL(startUrl).catch(err => {
      if (retries < 15) { // Más reintentos para dar tiempo al servidor
        setTimeout(() => loadWithRetry(retries + 1), 1000);
      } else {
        console.error("No se pudo conectar al servidor local.");
      }
    });
  };

  setTimeout(() => loadWithRetry(), 1000);

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

app.on('window-all-closed', () => { 
  app.quit(); 
});

// MATAR TODO PROCESO NODE ASOCIADO AL SALIR
// Esto es VITAL para que el instalador pueda sobreescribir archivos
app.on('before-quit', () => {
    console.log("Cerrando aplicación y matando procesos...");
    process.exit(0); // Forzar salida inmediata del proceso Node
});
