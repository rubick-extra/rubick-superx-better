const path = require('path');
const fs = require('fs');
const execa = require('execa');

let pined = false;

module.exports = (ctx) => {
  const { BrowserWindow, ipcMain, mainWindow, dialog, nativeImage } = ctx;
  
  let win;
  
  let init = () => {
    if (win === null || win === undefined) {
      createWindow();
      ipcMain.on("superPanel-hidden", () => {
        win.hide();
      });
      ipcMain.on("superPanel-setSize", (e, height) => {
        win.setSize(240, height);
      });
      ipcMain.on("superPanel-openPlugin", (e, args) => {
        mainWindow.webContents.send("superPanel-openPlugin", args);
      });
      ipcMain.on("create-file", (e, args) => {
        dialog.showSaveDialog(args).then(result => {
          fs.writeFileSync(result.filePath, '');
        });
      });
      ipcMain.on("get-file-base64", (event, args) => {
        const data = nativeImage.createFromPath(args).toDataURL()
        event.returnValue = data;
      });
      
      ipcMain.on("get-path", async (event) => {
        const data = await execa(path.join(__dirname, './modules/cdwhere.exe'));
        event.returnValue = data;
      });
      ipcMain.on("trigger-pin", (event, pin) => {
        pined = pin;
      });
    }
  };
  
  let createWindow = () => {
    win = new BrowserWindow({
      frame: false,
      autoHideMenuBar: true,
      width: 240,
      height: 50,
      show: false,
      alwaysOnTop: true,
      webPreferences: {
        contextIsolation: false,
        webviewTag: true,
        webSecurity: false,
        backgroundThrottling: false,
        nodeIntegration: true,
        preload: path.join(__dirname, 'panel-preload.js'),
      },
    });
    win.loadURL(`file://${__dirname}/main.html`);
    // win.loadURL(`http://localhost:8003/main`);
    win.on("closed", () => {
      win = undefined;
    });
    // 打包后，失焦隐藏
    win.on("blur", () => {
      !pined && win.hide();
    });
  };
  
  let getWindow = () => win;
  
  return {
    init,
    getWindow,
  };
};
