/* eslint-disable prettier/prettier */
// 组件
import { Button } from 'antd';
// 工具
import { IpcRenderer } from 'electron';
import { useEffect, FC } from 'react';
import SVGA from 'svgaplayerweb';
// 自定义

const Previewer: FC = () => {
  useEffect(() => {
    const player = new SVGA.Player('#demoCanvas');
    const parser = new SVGA.Parser(); // Must Provide same selector eg:#demoCanvas IF support IE6+

    const { ipcRenderer }: { ipcRenderer: IpcRenderer } = window.electron;
    ipcRenderer.on('ping', (message) => {
      const base64 = `data:svga/2.0;base64,${message}`;

      parser.load(
        // 'http://cc.fp.ps.netease.com/file/61e0e15f00722e51091e44820sS6GbCv04',
        base64,
        (videoItem) => {
          // const $canvas: HTMLCanvasElement =
          //   document.getElementById('demoCanvas');
          // const ctx = $canvas.getContext('2d');
          // const image = new Image();
          // image.src = `data:image;base64,${videoItem.images.Bitmap21}`;
          // ctx?.clearRect(0, 0, 750, 1200);
          // ctx?.drawImage(image, 0, 0, image.width / 2, image.height / 2);
          player.setVideoItem(videoItem);
          player.startAnimation();
        }
      );
    })
  }, []);
  return (
    <div>
      <canvas id="demoCanvas" width="750" height="1200" />
      <Button type="primary">Button</Button>
    </div>
  );
};

export default Previewer;
