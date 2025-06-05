// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('node:path')

// NOTA: TARGET_URL e il tentativo di loadURL sono stati rimossi
// per evitare ERR_CONNECTION_REFUSED se il server Next.js non è in esecuzione.
// Electron caricherà direttamente index.html.

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // contextIsolation: true, // Default and recommended
      // nodeIntegration: false, // Default and recommended
    }
  })

  // Load the local index.html file.
  // Il file index.html ora contiene istruzioni su come visualizzare
  // l'app Next.js se lo si desidera (che richiederebbe npm run dev e loadURL).
  mainWindow.loadFile(path.join(__dirname, 'index.html'))
    .catch(err => {
      // Questo catch è per errori nel caricamento di index.html stesso,
      // che dovrebbe essere raro.
      console.error(`Failed to load local index.html: ${err.message || err.code}`);
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