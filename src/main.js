import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
const ipc = require('electron').ipcMain
var path = require('path')
const MStore = require('../assets/js/mstore.js');

let iconpath = path.join(__dirname, '/icons/logo_white.png')
let tray = null

if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}


// Functionality begins here
let mainWindow, workerWindow;

const userpref = new MStore({
  configName: 'user-preferences',
  defaults: {
    // 800x600 is the default size of our window
    windowBounds: { width: 1280, height: 720 }
  }
});

const createWindow = () => {
  // Create the browser window.
  let { width, height } = userpref.get('windowBounds');

  mainWindow = new BrowserWindow({
    backgroundColor: '#333',
    width: width,
    height: height,
    minHeight: 720,
    minWidth: 1280,
    frame: false,
    show: false,
    icon: __dirname + '/icons/logo_64.png',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    }
  });
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Background Task
  workerWindow = new BrowserWindow({
    // height: 500,
    // width: 1000,
    show: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false, enableRemoteModule: true }
  });

  workerWindow.loadFile(`src/worker.html`);


  // Load when content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Storing Resize Info
  mainWindow.on('resize', () => {
    let { width, height } = mainWindow.getBounds();
    // Now that we have them, save them using the `set` method.
    userpref.set('windowBounds', { width, height });
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // mainWindow.on('close', (event) => {
  //   if (app.quitting) {
  //     mainWindow = null
  //   } else {
  //     event.preventDefault()
  //     mainWindow.hide()
  //   }
  // })
};

app.on('ready', () => {
  app.allowRendererProcessReuse = true
  createWindow()

  tray = new Tray(nativeImage.createFromPath(iconpath))
  const menu = Menu.buildFromTemplate([
    {
      label: 'Play/Pause',
      click() { workerWindow.webContents.send('toggle') }
    },
    {
      label: 'Next',
      click() { workerWindow.webContents.send('next-song') }
    },
    {
      label: 'Previous',
      click() { workerWindow.webContents.send('prev-song') }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click() { app.quit(); }
    }
  ])

  tray.setToolTip('MyApp')
  tray.setContextMenu(menu)

});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipc.on('playback-toggle', () => { workerWindow.webContents.send('toggle') })

ipc.on('id3-result', function (event, arg) {
  mainWindow.webContents.send('id3-result', arg)
})

ipc.on('play-track', function (event, arg) {
  workerWindow.webContents.send('track', arg)
})
ipc.on('toggle-shuffle', () => { workerWindow.webContents.send('toggle-shuffle') })
ipc.on('song-resume', () => { mainWindow.webContents.send('song-resume') })
ipc.on('song-pause', () => { mainWindow.webContents.send('song-pause') })
ipc.on('add-finished', () => { mainWindow.webContents.send('add-finished') })
ipc.on('skip-previous', () => { workerWindow.webContents.send('prev-song') })
ipc.on('skip-next', () => { workerWindow.webContents.send('next-song') })
ipc.on('request-sync', () => { workerWindow.webContents.send('sync-main') })
ipc.on('INACCESSIBLE', () => { mainWindow.webContents.send('INACCESSIBLE') })
ipc.on('sync-res', function (event, arg) { mainWindow.webContents.send('sync-res', arg) })
ipc.on('song-details', function (event, arg) { mainWindow.webContents.send('song-details', arg) })
ipc.on('seek-pos', function (event, arg) { workerWindow.webContents.send('seek-pos', arg) })