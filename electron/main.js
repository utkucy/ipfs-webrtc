const path = require("path");

const {
  app,
  BrowserWindow,
  systemPreferences,
  desktopCapturer,
  ipcMain,
} = require("electron");
const isDev = require("electron-is-dev");

// Conditionally include the dev tools installer to load React Dev Tools
let installExtension, REACT_DEVELOPER_TOOLS; // NEW!
if (isDev) {
  const devTools = require("electron-devtools-installer");
  installExtension = devTools.default;
  REACT_DEVELOPER_TOOLS = devTools.REACT_DEVELOPER_TOOLS;
} // NEW!

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require("electron-squirrel-startup")) {
  app.quit();
} // NEW!

function createWindow() {
  // Create the browser window.
  console.log("createwindowwwww " + isDev);
  const mainWindow = new BrowserWindow({
    show: true,
    width: 1260,
    height: 840,
    minWidth: 1024,
    minHeight: 800,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      nativeWindowOpen: true,
      // worldSafeExecuteJavaScript: true,
      // contextIsolation: true
    },
  });

  mainWindow.webContents.userAgent = "Chrome";

  // and load the index.html of the app.
  // mainWindow.loadFile("index.html");
  mainWindow.loadURL(
    isDev ? "http://localhost:3000" : "https://www.web3rtc.com/"
    // : `file://${path.join(__dirname, "../build/index.html")}`
  );

  // Open the DevTools.
  if (isDev) {
    // mainWindow.webContents.openDevTools({ mode: "detach" });
    mainWindow.webContents.openDevTools(); // // option + command + i opends dev tools
  }

  systemPreferences
    .askForMediaAccess("camera")
    .then((allowed) => console.log("Camera is allowed"));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app
  .whenReady()
  .then(() => {
    createWindow();
    ipcMain.handle("DESKTOP_CAPTURER_GET_SOURCES", (event, opts) =>
      desktopCapturer.getSources(opts)
    );

    if (isDev) {
      installExtension(REACT_DEVELOPER_TOOLS)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((error) => console.log(`An error occurred: , ${error}`));
    }
  })
  .catch((error) => console.log(error));

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
