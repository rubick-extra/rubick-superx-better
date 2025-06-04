const os = window.require('os');
const {ipcRenderer} = window.require('electron');
const {exec} = window.require('child_process');

export function formatReg(regStr) {
  const flags = regStr.replace(/.*\/([gimy]*)$/, "$1");
  const pattern = flags.replace(new RegExp("^/(.*?)/" + flags + "$"), "$1");
  return new RegExp(pattern, flags);
}

window.openPlugin = ({plugin, feature, cmd, data}) => {
  ipcRenderer.send('msg-trigger', {
    type: 'openPlugin',
    data: {
      ...plugin,
      cmd: feature.code,
      ext: {
        code: feature.code,
        type: cmd.type || "text",
        payload: data,
      },
    },
  })
}

export const ipcSendSync = (type, data) => {
  const returnValue = ipcRenderer.sendSync("msg-trigger", {
    type,
    data
  });
  if (returnValue instanceof Error) throw returnValue;
  return returnValue;
};

export const db = {
  put: data => ipcSendSync("dbPut", { data }),
  get: id => ipcSendSync("dbGet", { id }),
  remove: doc => ipcSendSync("dbRemove", { doc }),
  bulkDocs: docs => ipcSendSync("dbBulkDocs", { docs }),
  allDocs: key => ipcSendSync("dbAllDocs", { key })
}

export const openSettings = () => {
  window.openPlugin({
    plugin: {
      name: "rubick-system-feature",
      main: "index.html",
      preload: "preload.js",
    },
    cmd: '已安装插件',
    feature: {
      code: "已安装插件",
      payload: "rubick 插件市场",
      type: 'text'
    },
  });
}
export const showMainWindow = () => {
  ipcRenderer.send('msg-trigger', {
    type: 'showMainWindow',
  });
}

export const finders = ["explorer.exe", "SearchApp.exe", "SearchHost.exe", "FESearchHost.exe", "Finder.app"];

export const getFinderPath = (cb) => {
  if (os.type() === 'Darwin') {
    exec("osascript -e 'tell application \"Finder\" to get the POSIX path of (target of front window as alias)'",
      {encoding: "utf8"},
      ((err, result) => {
        if (err) {
          return
        }
        cb(result.trim().replace(/\/$/, ""))
      }));
  } else if (os.type() === 'Windows_NT') {
    const {stdout} = ipcRenderer.sendSync("get-path");
    cb(stdout);
  }
}
