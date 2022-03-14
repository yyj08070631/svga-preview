// 组件
import { Button } from 'antd';
// 工具
import { IpcRenderer } from 'electron';
import { useEffect, FC, WheelEvent, useRef } from 'react';
import SVGA from 'svgaplayerweb';
// 其他
import './Previewer.css';

const Previewer: FC = () => {
  // static data
  let ctx: CanvasRenderingContext2D | null;
  // let canvas: HTMLCanvasElement | null
  let scale = 1;
  // let loop = true
  // reactive data
  // refs
  const canvas = useRef(null);
  // methods
  // const initPlayer = () => {}
  const drawImage = (bitmap: string): void => {
    const image = new Image();
    image.src = `data:image;base64,${bitmap}`;
    ctx?.clearRect(0, 0, 750, 1200);
    ctx?.drawImage(image, 0, 0, image.width / 2, image.height / 2);
  };
  const startAnimation = (bitmapList: string[]): void => {
    let count = 0;
    const traverse = () => {
      if (count >= bitmapList.length) return;

      drawImage(bitmapList[count]);
      count += 1;
      requestAnimationFrame(traverse);
    };
    traverse();
  };
  const zoomHandler = (e: WheelEvent) => {
    // e.preventDefault();
    scale += e.deltaY * -0.01;
    // Restrict scale
    scale = Math.min(Math.max(0.125, scale), 4);
    // Apply scale transform
    canvas.current.style.transform = `scale(${scale})`;
  };
  // cycle life
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ctx = canvas.current.getContext('2d');
    const player = new SVGA.Player('.canvas');
    const parser = new SVGA.Parser(); // Must Provide same selector eg:#canvas IF support IE6+

    const { ipcRenderer }: { ipcRenderer: IpcRenderer } = window.electron;
    ipcRenderer.on('file-loaded', (message) => {
      const base64 = `data:svga/2.0;base64,${message}`;

      parser.load(
        // 'http://cc.fp.ps.netease.com/file/61e0e15f00722e51091e44820sS6GbCv04',
        base64,
        (videoItem) => {
          // console.log(Object.values(videoItem.images))
          // startAnimation(Object.values(videoItem.images))
          player.setVideoItem(videoItem);
          player.startAnimation();
        }
      );
    });

    window.addEventListener('wheel', zoomHandler);
    return () => {
      window.removeEventListener('wheel', zoomHandler);
    };
  }, []);
  // render
  return (
    <div className="previewer">
      <canvas className="canvas" ref={canvas} />
      {/* <Button type="primary">Button</Button> */}
    </div>
  );
};

export default Previewer;
