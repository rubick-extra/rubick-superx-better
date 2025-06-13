const remote = require('@electron/remote');
const { ipcRenderer } = require('electron');

const ipcSendSync = (type, data) => {
  const returnValue = ipcRenderer.sendSync('msg-trigger', {
    type,
    data,
  });
  if (returnValue instanceof Error) throw returnValue;
  return returnValue;
};

const ipcSend = (type, data) => {
  ipcRenderer.send('msg-trigger', {
    type,
    data,
  });
};

window.io = {
  startRecordEvent() {
    ipcRenderer.send('stop-record-event');
    ipcRenderer.send('start-record-event');
  },
  stopRecordEvent() {
    ipcRenderer.send('stop-record-event');
  },
  onRecordEventChange(callback) {
    ipcRenderer.on('record-event-change', (e, data) => {
      callback(data);
    });
  },
}

window.market = {
  getLocalPlugins() {
    return remote.getGlobal('LOCAL_PLUGINS').getLocalPlugins();
  },
  downloadPlugin(plugin) {
    return remote.getGlobal('LOCAL_PLUGINS').downloadPlugin(plugin);
  },
  deletePlugin(plugin) {
    return remote.getGlobal('LOCAL_PLUGINS').deletePlugin(plugin);
  },
  refreshPlugin(plugin) {
    return remote.getGlobal('LOCAL_PLUGINS').refreshPlugin(plugin);
  },
  addLocalStartPlugin(plugin) {
    ipcSend('addLocalStartPlugin', { plugin });
  },
  removeLocalStartPlugin(plugin) {
    ipcSend('removeLocalStartPlugin', { plugin });
  },
  dbDump(target) {
    ipcSend('dbDump', { target });
  },

  dbImport(target) {
    ipcSend('dbImport', { target });
  },
};
