/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { BrowserWindow, dialog } from 'electron';
import { URL } from 'url';
import path from 'path';
import fs from 'fs';

export let resolveHtmlPath: (htmlFileName: string) => string;

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 1212;
  resolveHtmlPath = (htmlFileName: string) => {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  };
} else {
  resolveHtmlPath = (htmlFileName: string) => {
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
  };
}

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
