/* eslint-disable prettier/prettier */
// 库
import { useEffect, useState, useRef, FC, WheelEvent, useMemo } from 'react';
import { Card, Space, Upload, Button, Tooltip } from 'antd';
import { FolderOpenOutlined, StepForwardOutlined, StepBackwardOutlined, PauseOutlined, CaretRightOutlined } from '@ant-design/icons';
import SVGA from 'svgaplayerweb';
// 私有
// 其它
import './Home.scss';

const { ipcRenderer }: { ipcRenderer: Electron.IpcRenderer } = window.electron

let player: SVGA.Player;
let parser: SVGA.Parser;

const Previewer: FC = () => {
  // ------------- data -------------
  const [scale, setScale] = useState(1);
  const [videoItem, setVideoItem] = useState({} as SVGA.VideoEntity);
  const { sprites, images } = videoItem;
  const [currFrame, setCurrFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const canvasEl = useRef({} as HTMLCanvasElement);
  // ------------- methods -------------
  // 加载并播放动画
  const loadAndPlay = (base64: string) => {
    parser.load(base64, (v) => {
      // console.log(v);
      setVideoItem(v);
      // reset size
      canvasEl.current.width = v.videoSize.width;
      canvasEl.current.height = v.videoSize.height;
      // play
      player.setVideoItem(v);
      player.startAnimation();
      setPlaying(true);
    });
  };
  // 【事件处理】播放/暂停
  const playOrPause = useMemo(() => () => {
    if (playing) {
      player.pauseAnimation();
      setPlaying(false);
    } else {
      player.stepToFrame(currFrame, true);
      setPlaying(true);
    }
  }, [playing, currFrame]);
  // 【事件处理】打开文件并播放
  const beforeUploadHandler = useMemo(() => (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      loadAndPlay(e.target?.result);
    };
    reader.readAsDataURL(file);
  }, []);
  // 【事件处理】缩放
  const zoomHandlerMemo = (e: WheelEvent) => {
    if (e.ctrlKey) {
      const temp = scale + e.deltaY * -0.001;
      setScale(Math.min(Math.max(0.125, temp), 4));
    }
  };
  // 【事件处理】横向滚动
  const verticalScrollHandler = (e: WheelEvent) => {
    const framesEl = document.querySelector('.frames');
    framesEl.scrollLeft += e.deltaY;
  };
  // 【事件处理】横向滚动
  enum ToNeighboringFrameType { next, prev };
  const toNeighboringFrame = useMemo(() => (type: ToNeighboringFrameType) => {
    const temp = type ? Math.max(currFrame - 1, 0) : Math.min(currFrame + 1, sprites.length - 1)
    setCurrFrame(temp);
    player.stepToFrame(temp);
    player.pauseAnimation();
    setPlaying(false);
    // 滚动到当前帧数
    const framesEl = document.querySelector('.frames');
    const currFrameEl = document.querySelector(`.frames .ant-space-item:nth-child(${currFrame + 1})`);
    framesEl.scrollLeft = Math.max(currFrameEl?.offsetLeft - document.documentElement.clientWidth / 2, 0);
  }, [currFrame, sprites]);
  // 【事件处理】全局 keyup
  const globalKeyUpHandler = useMemo(() => (e: KeyboardEvent) => {
    // console.log(e.code);
    switch (e.code) {
      case 'Space': playOrPause(); break;
      default: ;
    };
  }, [playOrPause]);
  // 【事件处理】全局 keydown
  const globalKeyDownHandler = useMemo(() => (e: KeyboardEvent) => {
    // console.log(e.code);
    switch (e.code) {
      case 'ArrowLeft':
        toNeighboringFrame(ToNeighboringFrameType.prev);
        break;
      case 'ArrowRight':
        toNeighboringFrame(ToNeighboringFrameType.next);
        break;
      default: ;
    };
  }, [toNeighboringFrame, ToNeighboringFrameType.prev, ToNeighboringFrameType.next]);
  // 【事件处理】ipc 打开文件
  const ipcFileOpenedHandler = useMemo(() => (bit: Uint8Array) => {
    if (bit instanceof Uint8Array) {
      const file = new File([bit], '');
      beforeUploadHandler(file);
    } else {
      console.log(bit);
    }
  }, [beforeUploadHandler]);
  // ------------- cycle life -------------
  useEffect(() => {
    document.addEventListener('keyup', globalKeyUpHandler);
    return () => {
      document.removeEventListener('keyup', globalKeyUpHandler);
    }
  }, [globalKeyUpHandler]);
  useEffect(() => {
    document.addEventListener('keydown', globalKeyDownHandler);
    return () => {
      document.removeEventListener('keydown', globalKeyDownHandler);
    }
  }, [globalKeyDownHandler]);
  useEffect(() => {
    ipcRenderer.on('file-opened', ipcFileOpenedHandler);
    ipcRenderer.send('file-opened-monitored');
    return () => {
      ipcRenderer.removeListener('file-opened', ipcFileOpenedHandler);
    }
  }, [ipcFileOpenedHandler]);
  // 初始化播放器
  useEffect(() => {
    player = new SVGA.Player('.canvas');
    parser = new SVGA.Parser();

    player.onFrame((frame) => {
      // 记录当前帧数
      setCurrFrame(frame);
      // 滚动到当前播放的帧数
      const framesEl = document.querySelector('.frames');
      const currFrameEl = document.querySelector(`.frames .ant-space-item:nth-child(${frame + 1})`);
      framesEl.scrollLeft = Math.max(currFrameEl?.offsetLeft - document.documentElement.clientWidth / 2, 0);
    });
  }, []);
  // ------------- render -------------
  return (
    <div className="home">
      {/* toolbar */}
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
      {/* preview */}
      <div className="preview"
        onWheel={zoomHandlerMemo}>
        <canvas ref={canvasEl} style={{ transform: `scale(${scale})` }} className="canvas" />
      </div>
      {/* frames */}
      <Space className="frames"
        onWheel={verticalScrollHandler}>
        {sprites && sprites.map((v: any, k: number) => (
          <Card cover={<img src={`data:image/;base64,${images[v.imageKey]}`} alt="" className="frame_img" />}
            bordered={false}
            key={v.imageKey}
            size="small"
            className={`frame_wrapper ${currFrame === k ? 'frame_wrapper--active' : null}`}
            onClick={() => {
              setCurrFrame(k);
              player.stepToFrame(k);
              player.pauseAnimation();
              setPlaying(false);
            }}>
            <div className="frame_info">{k}</div>
          </Card>
        ))}
      </Space>
      {/* toolbar-bottom */}
      {sprites && (
        <div className="toolbar-bottom">
          <Space>
            <Tooltip title="上一帧（方向键左）" mouseEnterDelay={.3}>
              <Button type="dashed" shape="circle" icon={<StepBackwardOutlined />} onClick={() => { toNeighboringFrame(ToNeighboringFrameType.prev); }} />
            </Tooltip>
            <Tooltip title="播放/暂停（空格）" mouseEnterDelay={.3}>
              <Button type="dashed" shape="circle" icon={playing ? <PauseOutlined /> : <CaretRightOutlined />} onClick={playOrPause} />
            </Tooltip>
            <Tooltip title="下一帧（方向键右）" mouseEnterDelay={.3}>
              <Button type="dashed" shape="circle" icon={<StepForwardOutlined />} onClick={() => { toNeighboringFrame(ToNeighboringFrameType.next); }} />
            </Tooltip>
          </Space>
        </div>
      )}
    </div>
  );
};

export default Previewer;
