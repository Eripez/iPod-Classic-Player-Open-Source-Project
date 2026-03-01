const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  selectMusicFolder: () => ipcRenderer.invoke("select-music-folder"),
  getSavedFolder: () => ipcRenderer.invoke("get-saved-folder"),
  scanFolder: (folder) => ipcRenderer.invoke("scan-folder", folder),
  updateDiscord: (song) => ipcRenderer.send("update-discord", song),
  discordIdle: () => ipcRenderer.send("discord-idle"),
  onMusicUpdated: (callback) => {
    ipcRenderer.on("music-updated", (_, songs) => callback(songs));
  },
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  // Controles de ventana
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  closeWindow: () => ipcRenderer.send("window-close"),
  // Datos persistentes
  getDataPath: () => ipcRenderer.invoke("get-data-path")
});