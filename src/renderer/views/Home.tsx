/* eslint-disable prettier/prettier */
// 库
import { useEffect, useState, useMemo, FC } from 'react';
import { Card, Space, Upload } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import SVGA from 'svgaplayerweb';
// 私有
// 其它
import './Home.scss';

let player: SVGA.Player;
let parser: SVGA.Parser;

const Previewer: FC = () => {
  // ------------- data -------------
  const [scale, setScale] = useState(1);
  const [videoItem, setVideoItem] = useState();
  const { sprites, images, frames } = videoItem || {};
  const [currFrame, setCurrFrame] = useState(0);
  // ------------- methods -------------
  // 播放动画
  const play = () => {
    // console.log(currFrame, frames - 1);
    player.stepToFrame(currFrame);
    if (currFrame === frames - 1) {
      setCurrFrame(0);
    } else {
      setCurrFrame(currFrame + 1);
    };
    window.requestAnimationFrame(play);
  };
  // 加载并播放动画
  const loadAndPlay = (base64: string) => {
    parser.load(base64, (v) => {
      // console.log(v);
      setVideoItem(v);
      // reset size
      const canvas = document.querySelector('.canvas');
      canvas.width = v.videoSize.width;
      canvas.height = v.videoSize.height;
      // play
      player.setVideoItem(v);
      play();
    });
  };
  // 打开文件处理函数
  const beforeUploadHandler = async (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      loadAndPlay(e.target?.result);
    };
  };
  // 缩放
  const zoomHandlerMemo = useMemo(
    () => (e: WheelEvent) => {
      if (e.ctrlKey) {
        const temp = scale + e.deltaY * -0.001;
        setScale(Math.min(Math.max(0.125, temp), 4));
      }
    },
    [scale]
  );
  // ------------- cycle life -------------
  useEffect(() => {
    window.addEventListener('wheel', zoomHandlerMemo);
    return () => {
      window.removeEventListener('wheel', zoomHandlerMemo);
    };
  }, [zoomHandlerMemo]);
  // 初始化播放器
  useEffect(() => {
    player = new SVGA.Player('.canvas');
    parser = new SVGA.Parser(); // Must Provide same selector eg:#canvas IF support IE6+
  }, []);
  // 横向滚动
  useEffect(() => {
    const framesEl = document.querySelector('.frames');
    const verticalScrollHandler = (e: WheelEvent) => {
      framesEl.scrollLeft += e.deltaY;
    };
    framesEl?.addEventListener('wheel', verticalScrollHandler);
    return () => {
      framesEl?.removeEventListener('wheel', verticalScrollHandler);
    };
  }, [videoItem]);
  // ------------- render -------------
  return (
    <div className="home">
      <Space wrap className="toolbar">
        <Upload showUploadList={false}
          name="files"
          beforeUpload={beforeUploadHandler}>
          <Card cover={<FolderOpenOutlined style={{ fontSize: '24px', color: '#08c', padding: '12px 12px 0' }} />}
            bordered={false}
            hoverable
            size="small"
            bodyStyle={{ textAlign: 'center' }}
            style={{ width: '80px' }}>打开</Card>
        </Upload>
      </Space>
      <div className="preview">
        <canvas style={{ transform: `scale(${scale})` }} className="canvas" />
      </div>
      <Space className="frames">
        {sprites && sprites.map((v: any, k: number) => (
          <Card cover={<img src={`data:image/;base64,${images[v.imageKey]}`} alt="" className="frame_img" />}
            bordered={false}
            key={v.imageKey}
            size="small"
            className={`frame_wrapper ${currFrame === k ? 'frame_wrapper--active' : null}`}>
            <div className="frame_info">{k}</div>
          </Card>
        ))}
      </Space>
    </div>
  );
};

export default Previewer;
