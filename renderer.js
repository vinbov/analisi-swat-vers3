
// This file is required by the index.html file and will
// be executed in the renderer process for that window.

window.addEventListener('DOMContentLoaded', () => {
  const setVersion = (id, version) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerText = version;
    }
  };

  // In modern Electron apps (contextIsolation=true, nodeIntegration=false),
  // 'process.versions' is not directly available in the renderer.
  // It needs to be exposed from preload.js using contextBridge.
  // Example preload.js:
  // const { contextBridge } = require('electron');
  // contextBridge.exposeInMainWorld('electronVersions', process.versions);

  if (typeof window.electronVersions !== 'undefined') {
    setVersion('node-version', window.electronVersions.node);
    setVersion('chrome-version', window.electronVersions.chrome);
    setVersion('electron-version', window.electronVersions.electron);
  } else if (typeof process !== 'undefined' && typeof process.versions !== 'undefined') {
    // This block would typically run if nodeIntegration was true (not recommended for security).
    // Or if a less secure preload script directly attached process to window.
    console.warn("Renderer.js: Accessing process.versions directly. Consider using contextBridge in preload.js for better security.");
    setVersion('node-version', process.versions.node);
    setVersion('chrome-version', process.versions.chrome);
    setVersion('electron-version', process.versions.electron);
  } else {
    console.warn('Renderer.js: Version information not found. Ensure preload.js exposes it via contextBridge (e.g., window.electronVersions = process.versions).');
    // Spans in index.html will retain their default '-' if versions are not found.
  }
});
