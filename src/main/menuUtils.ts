import { BrowserWindow, dialog } from 'electron';
import fs from 'fs';

export const openFile = (window: BrowserWindow) => {
  dialog
    .showOpenDialog({
      title: '选择发送的文件',
      properties: ['openFile'],
    })
    .then(async (result) => {
      if (result.filePaths && result.filePaths[0]) {
        const file = fs.readFileSync(result.filePaths[0], 'base64');
        // ipcMain.on('load-file', async (event, arg) => {
        //   event.reply('load-file', result.filePaths[0]);
        //   console.log(arg);
        //   console.log(result.filePaths[0]);
        // });
        window.webContents.send('file-loaded', file);
      }
      return true;
    })
    // eslint-disable-next-line no-console
    .catch(console.log);
};

export default '';
