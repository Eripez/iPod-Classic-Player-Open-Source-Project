const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const mm = require("music-metadata");
const RPC = require("discord-rpc");
const chokidar = require("chokidar");
const Store = require("electron-store");

let mainWindow;
let rpc;
let watcher = null;
let currentFolder = null;

let store;
try {
  store = new Store();
} catch (err) {
  console.log("Error inicializando store:", err);
  store = {
    data: {},
    get(key, defaultValue) { return this.data[key] !== undefined ? this.data[key] : defaultValue; },
    set(key, value) { this.data[key] = value; }
  };
}

const clientId = "1474130506428715028";

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 390,
    height: 700,
    minWidth: 390,
    minHeight: 700,
    maxWidth: 390,
    maxHeight: 700,
    resizable: false,
    frame: false,
    transparent: false, // Cambiar a false para fondo sólido
    backgroundColor: '#f0f0f0', // Fondo sólido del color del iPod
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false,
    titleBarStyle: 'hidden'
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const savedFolder = store.get("musicFolder");
  if (savedFolder && fs.existsSync(savedFolder)) {
    currentFolder = savedFolder;
    setupWatcher(savedFolder);
  }
}

app.whenReady().then(() => {
  createWindow();
  setupDiscord();
  
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (watcher) watcher.close();
  if (rpc) rpc.destroy();
  app.quit();
});

ipcMain.on("window-minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on("window-close", () => {
  if (mainWindow) mainWindow.close();
});

function setupDiscord() {
  try {
    rpc = new RPC.Client({ transport: "ipc" });
    rpc.on("ready", () => {
      console.log("Discord Rich Presence conectado");
      rpc.setActivity({
        details: "Navegando biblioteca",
        state: "iPod Classic",
        largeImageKey: "ipod_classic",
        largeImageText: "Reproduciendo en iPod Classic",
        startTimestamp: Date.now(),
        instance: false
      }).catch(() => {});
    });
    rpc.login({ clientId }).catch(() => {});
  } catch (err) {
    console.log("Error al conectar Discord:", err.message);
  }
}

function setupWatcher(folderPath) {
  if (watcher) watcher.close().catch(() => {});
  try {
    watcher = chokidar.watch(folderPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      depth: 1,
      ignoreInitial: true
    });
    watcher
      .on("add", (path) => {
        if (path.match(/\.(mp3|m4a|flac|wav)$/i)) {
          scanFolder(folderPath).then(songs => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("music-updated", songs);
            }
          });
        }
      })
      .on("unlink", (path) => {
        if (path.match(/\.(mp3|m4a|flac|wav)$/i)) {
          scanFolder(folderPath).then(songs => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("music-updated", songs);
            }
          });
        }
      });
  } catch (err) {
    console.log("Error setting up watcher:", err.message);
  }
}

async function scanFolder(folderPath) {
  try {
    const files = fs.readdirSync(folderPath)
      .filter(f => f.match(/\.(mp3|m4a|flac|wav)$/i));
    const songs = [];
    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      try {
        const metadata = await mm.parseFile(fullPath);
        songs.push({
          path: fullPath,
          title: metadata.common.title || file.replace(/\.[^/.]+$/, ""),
          artist: metadata.common.artist || "Artista Desconocido",
          album: metadata.common.album || "Álbum Desconocido",
          duration: metadata.format.duration || 0,
          picture: metadata.common.picture?.[0] || null,
          year: metadata.common.year || null,
          genre: metadata.common.genre?.[0] || null
        });
      } catch (err) {
        console.log("Error leyendo metadata de:", file, err.message);
      }
    }
    return songs.sort((a, b) => a.title.localeCompare(b.title));
  } catch (err) {
    console.log("Error scanning folder:", err.message);
    return [];
  }
}

ipcMain.handle("select-music-folder", async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Selecciona tu carpeta de música"
    });
    if (result.canceled) return [];
    const folder = result.filePaths[0];
    currentFolder = folder;
    store.set("musicFolder", folder);
    setupWatcher(folder);
    return await scanFolder(folder);
  } catch (err) {
    console.log("Error selecting folder:", err.message);
    return [];
  }
});

ipcMain.handle("get-saved-folder", () => {
  return store.get("musicFolder") || null;
});

ipcMain.handle("scan-folder", async (_, folder) => {
  try {
    if (!folder && currentFolder) folder = currentFolder;
    if (!folder || !fs.existsSync(folder)) return [];
    return await scanFolder(folder);
  } catch (err) {
    console.log("Error scanning folder:", err.message);
    return [];
  }
});

ipcMain.handle("get-config", () => {
  try {
    return {
      musicFolder: store.get("musicFolder"),
      volume: store.get("volume", 70),
      shuffle: store.get("shuffle", false),
      repeat: store.get("repeat", "off"),
      theme: store.get("theme", "classic")
    };
  } catch (err) {
    console.log("Error getting config:", err.message);
    return {
      musicFolder: null,
      volume: 70,
      shuffle: false,
      repeat: "off",
      theme: "classic"
    };
  }
});

ipcMain.handle("save-config", (_, config) => {
  try {
    Object.keys(config).forEach(key => {
      store.set(key, config[key]);
    });
    return true;
  } catch (err) {
    console.log("Error saving config:", err.message);
    return false;
  }
});

ipcMain.on("update-discord", (_, song) => {
  if (!rpc) return;
  try {
    rpc.setActivity({
      details: song.title || "Sin título",
      state: song.artist || "Artista desconocido",
      largeImageKey: "ipod_classic",
      largeImageText: "Reproduciendo en iPod Classic",
      smallImageKey: "play",
      smallImageText: "Reproduciendo",
      startTimestamp: Date.now(),
      instance: false
    }).catch(() => {});
  } catch (err) {
    console.log("Error updating Discord:", err.message);
  }
});

ipcMain.on("discord-idle", () => {
  if (!rpc) return;
  try {
    rpc.setActivity({
      details: "Navegando biblioteca",
      state: "iPod Classic",
      largeImageKey: "ipod_classic",
      largeImageText: "iPod Classic Player",
      startTimestamp: Date.now(),
      instance: false
    }).catch(() => {});
  } catch (err) {
    console.log("Error updating Discord:", err.message);
  }
});

// Añadir esta función después de createWindow()
ipcMain.handle("get-data-path", () => {
  return app.getPath('userData');
});

// También puedes crear un archivo de datos por defecto al iniciar
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');

// Verificar si existe el archivo de settings, si no, crearlo
if (!fs.existsSync(settingsPath)) {
  fs.writeFileSync(settingsPath, JSON.stringify({
    firstRun: true,
    version: "2.0.0",
    installDate: new Date().toISOString()
  }, null, 2));
}