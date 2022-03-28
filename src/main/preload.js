const { contextBridge, ipcRenderer } = require('electron');

const validChannels = ['ipc-example', 'file-opened', 'file-opened-monitored'];

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send(channel, ...args) {
      ipcRenderer.send(channel, ...args);
    },
    sendSync(channel, ...args) {
      ipcRenderer.sendSync(channel, ...args);
    },
    myPing() {
      ipcRenderer.send('ipc-example', 'ping');
    },
    on(channel, func) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once(channel, func) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
    removeListener(channel, func) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.removeListener(channel, func);
      }
    },
    removeAllListeners(channel) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.removeAllListeners(channel);
      }
    },
  },
});
