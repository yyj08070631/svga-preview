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

// 加载为二进制格式，用 ipc 通信发给 renderer
export const openAndSendFile = (
  commandLine: string[],
  mainWindow: BrowserWindow | null
) => {
  try {
    const target = commandLine[commandLine.length - 1] || '';
    if (target.endsWith('.svga')) {
      const file = fs.readFileSync(target);
      mainWindow?.webContents.send('file-opened', file);
    } else {
      mainWindow?.webContents.send('file-opened');
    }
  } catch (e) {
    mainWindow?.webContents.send('file-opened', e);
  }
};
