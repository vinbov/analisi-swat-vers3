
// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const TARGET_URL = 'http://localhost:9002';

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // contextIsolation: true, // Default and recommended
      // nodeIntegration: false, // Default and recommended for loading remote content
    }
  })

  // Attempt to load the Next.js app URL
  mainWindow.loadURL(TARGET_URL)
    .catch(err => {
      console.error(`Failed to load URL ${TARGET_URL} (Error: ${err.message || err.code}). This usually means the Next.js server is not running or not accessible at this address. Falling back to local index.html.`);
      // If loading the URL fails (e.g., connection refused), load the local index.html
      // and pass error information via query parameters.
      mainWindow.loadFile(path.join(__dirname, 'index.html'), {
        query: { error: err.code || 'UNKNOWN_ERROR', message: err.message || `Could not connect to ${TARGET_URL}`, targetUrl: TARGET_URL }
      });
    });

  // Open the DevTools (optional, uncomment for debugging).
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
