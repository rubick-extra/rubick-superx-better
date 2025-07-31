const superPanel = require("./panel-window");
const { keyboard, Key } = require("@nut-tree/nut-js");
const os = require("os");
const { v4: uuid } = require('uuid');
const activeWin = require('rubick-active-win');
const { chmodSync } = require("fs");
const path = require('path');
require('@rubick-extra/io-tools/use-io-events');

keyboard.config.autoDelayMs = 10;

const list = [
  path.join(__dirname, './node_modules/rubick-active-win/main'),
  path.join(__dirname, '../rubick-active-win/main'),
  path.join(__dirname, '../../../node_modules/rubick-active-win/main'),
]
list.forEach(item => {
  try {
    chmodSync(item, 0o755);
  } catch {}
})

const isMacOS = os.type() === "Darwin";

const modifier = isMacOS ? Key.LeftSuper : Key.LeftControl;

async function simulateCopy() {
  await keyboard.pressKey(modifier, Key.C);
  await keyboard.releaseKey(modifier, Key.C);
}

const getFilePathFromClipboard = (clipboard) => {
  let filePath = [];
  if (process.platform === 'darwin') {
    if (clipboard.has('NSFilenamesPboardType')) {
      filePath =
        clipboard
          .read('NSFilenamesPboardType')
          .match(/<string>.*<\/string>/g)
          ?.map(item => item.replace(/<string>|<\/string>/g, '')) || [];
    } else {
      const clipboardImage = clipboard.readImage('clipboard');
      if (!clipboardImage.isEmpty()) {
        const png = clipboardImage.toPNG();
        const fileInfo = {
          buffer: png,
          mimetype: 'image/png',
          originalname: uuid() + '.png'
        };
        filePath = [fileInfo];
      } else {
        filePath = [clipboard.read('public.file-url').replace('file://', '')].filter(item => item);
      }
    }
  } else {
    if (clipboard.has('CF_HDROP')) {
      const rawFilePathStr = clipboard.read('CF_HDROP') || '';
      let formatFilePathStr = [...rawFilePathStr]
        .filter((_, index) => rawFilePathStr.charCodeAt(index) !== 0)
        .join('')
        .replace(/\\/g, '\\');

      const drivePrefix = formatFilePathStr.match(/[a-zA-Z]:\\/);

      if (drivePrefix) {
        const drivePrefixIndex = formatFilePathStr.indexOf(drivePrefix[0]);
        if (drivePrefixIndex !== 0) {
          formatFilePathStr = formatFilePathStr.substring(drivePrefixIndex);
        }
        filePath = formatFilePathStr
          .split(drivePrefix[0])
          .filter(item => item)
          .map(item => drivePrefix + item);
      }
    } else {
      const clipboardImage = clipboard.readImage('clipboard');
      if (!clipboardImage.isEmpty()) {
        const png = clipboardImage.toPNG();
        const fileInfo = {
          buffer: png,
          mimetype: 'image/png',
          originalname: uuid() + '.png'
        };
        filePath = [fileInfo];
      } else {
        filePath = [
          clipboard
            .readBuffer('FileNameW')
            .toString('ucs2')
            .replace(RegExp(String.fromCharCode(0), 'g'), '')
        ].filter(item => item);
      }
    }
  }
  return filePath;
}

function getSelectedContent(clipboard) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    // todo 缓存文件
    clipboard.clear();
    await simulateCopy();

    setTimeout(() => {
      // 延时一定时间才能从剪切板内读取到内容
      const text = clipboard.readText('clipboard') || ''
      const fileUrl = getFilePathFromClipboard(clipboard)[0] || '';
      // if (this.isWin) {
      //   // todo https://github.com/njzydark/Aragorn/blob/afe4a60972b4255dd417480ca6aca2af1fd8e637/packages/aragorn-app-main/src/uploaderManager.ts#L88
      // }

      resolve({
        text: fileUrl ? '' : text,
        fileUrl
      })
    }, 50);
  })
}

const getPos = (screen, point) => {
  return isMacOS ? point : screen.screenToDipPoint({ x: point.x, y: point.y });
}

const getPermission = () => {
  // if (isMacOS) {
  //   const macPermissions = require('node-mac-permissions');
  //   const access = macPermissions.getAuthStatus('accessibility');
  //   const input = macPermissions.getAuthStatus('input-monitoring');
  //   if (access !== 'authorized') {
  //     macPermissions.askForAccessibilityAccess()
  //     return false;
  //   }
  //   if (input !== 'authorized') {
  //     macPermissions.askForInputMonitoringAccess();
  //     return false;
  //   }
  // }
  return true;
}
const id = 'rubick-system-super-panel-store'

module.exports = () => {
  return {
    async onReady(ctx) {
      const { clipboard, screen, globalShortcut, API, ipcMain } = ctx;
      const permission = getPermission();
      if (!permission) return;

      // 初始化超级面板 window
      const panelInstance = superPanel(ctx);
      panelInstance.init();

      // 生成键盘监听事件
      const dbStore = await API.dbGet({ data: { id } }) || {};
      const superPanelHotKey = dbStore.value;

      const handler = async () => {
        const { x, y } = screen.getCursorScreenPoint()
        const copyResult = await getSelectedContent(clipboard);
        if (!copyResult.text && !copyResult.fileUrl) {
          const nativeWinInfo = await activeWin({ screenRecordingPermission: false });
          copyResult.fileUrl = nativeWinInfo && nativeWinInfo.owner && nativeWinInfo.owner.path;
        }
        let win = panelInstance.getWindow();

        const localPlugins = global.LOCAL_PLUGINS.getLocalPlugins();

        win.webContents.send('trigger-super-panel', {
          ...copyResult,
          optionPlugin: localPlugins,
        });
        const pos = getPos(screen, { x, y });
        win.setPosition(parseInt(pos.x), parseInt(pos.y));
        win.setAlwaysOnTop(true);
        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        win.focus();
        win.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true });
        win.show();
      }

      const recorder = globalThis.useIOShortcutRecorder(shortcut => {
        if (shortcut.status === 'finished') {
          const { label } = shortcut;
          if (label === superPanelHotKey) {
            handler();
          }
        }
      })
      ipcMain.on('iohook', (data) => recorder.handleIO(data))
    },
  }
}
