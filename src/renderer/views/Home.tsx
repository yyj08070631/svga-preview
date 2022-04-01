/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable prettier/prettier */
// 库
import { useEffect, useState, useRef, FC, WheelEvent, useCallback, MutableRefObject, LegacyRef } from 'react';
import { Card, Space, Upload, Button, Tooltip, Slider } from 'antd';
import { FolderOpenOutlined, StepForwardOutlined, StepBackwardOutlined, PauseOutlined, CaretRightOutlined, CompressOutlined } from '@ant-design/icons';
import SVGA from 'svgaplayerweb';
// 私有
// 其它
import './Home.scss';

const { ipcRenderer }: { ipcRenderer: Electron.IpcRenderer } = window.electron

const COLOR_PICKER_LIST: [string, string?][] = [['#000'], ['#fff', '#bfbfbf'], ['#3498DB'], ['#30CC71'], ['#F1C40D'], ['#C0392B']]

let player: SVGA.Player;
let parser: SVGA.Parser;

const Previewer: FC = () => {
  // ------------- data -------------
  const [scale, setScale] = useState(1);
  const [bgColor, setBgColor] = useState('transparent');
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
      player.clearDynamicObjects();
      player.setVideoItem(v);
      player.startAnimation();
      setPlaying(true);
      setBgColor('#fff');
    });
  };
  // 生成颜色选择器样式
  const genColorPickerStyle = (_bgColor: string, _borderColor?: string) => ({
    backgroundColor: _bgColor,
    border: `1px solid ${_borderColor || _bgColor}`,
  });
  // 适配窗口大小
  const suitWindow = () => {
    const previewEl = document.querySelector('.preview');
    const canvasWidth = canvasEl.current.width;
    const canvasHeight = canvasEl.current.height;
    if (canvasWidth > canvasHeight) {
      setScale(Math.min(Math.max(0.125, previewEl.offsetWidth / canvasWidth), 4));
    } else {
      setScale(Math.min(Math.max(0.125, previewEl.offsetHeight / canvasHeight), 4));
    }
  };
  // 【事件处理】播放/暂停
  const playOrPause = useCallback(() => {
    if (playing) {
      player.pauseAnimation();
      setPlaying(false);
    } else {
      player.stepToFrame(currFrame, true);
      setPlaying(true);
    }
  }, [playing, currFrame]);
  // 【事件处理】打开文件并播放
  const beforeUploadHandler = useCallback((file: File) => {
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
  const toNeighboringFrame = useCallback((type: ToNeighboringFrameType) => {
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
  const globalKeyUpHandler = useCallback((e: KeyboardEvent) => {
    // console.log(e.code);
    switch (e.code) {
      case 'Space': playOrPause(); break;
      default: ;
    };
  }, [playOrPause]);
  // 【事件处理】全局 keydown
  const globalKeyDownHandler = useCallback((e: KeyboardEvent) => {
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
  const ipcFileOpenedHandler = useCallback((bit: Uint8Array) => {
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
      {/* start page */}
      {!sprites && (
        <Space className="start">
          <Upload showUploadList={false}
            name="files"
            beforeUpload={beforeUploadHandler}>
            <Button type="primary" icon={<FolderOpenOutlined />}>打开</Button>
          </Upload>
        </Space>
      )}
      {/* preview */}
      <div className="preview"
        onWheel={zoomHandlerMemo}>
        <canvas ref={canvasEl}
          style={{ backgroundColor: bgColor, transform: `scale(${scale})` }}
          className="canvas" />
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
        <div className="toolbar_bottom">
          <Space className="toolbar_bottom_lf">
            <div className="toolbar_bottom_colors">
              {COLOR_PICKER_LIST.map((v) => (
                <div style={genColorPickerStyle(...v)}
                  role="button"
                  className="toolbar_bottom_color"
                  key={v[0]}
                  onClick={() => { setBgColor(v[0]) }} />
              ))}
            </div>
          </Space>
          <Space className="toolbar_bottom_center">
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
          <Space className="toolbar_bottom_rt">
            <Tooltip title="适应窗口大小" mouseEnterDelay={.3}>
              <CompressOutlined className="toolbar_bottom_rt_suit" onClick={suitWindow} />
            </Tooltip>
            <Tooltip title={(
              <div>
                <Slider value={(scale - .125) / 3.875 * 100}
                  max={100}
                  min={0}
                  tipFormatter={(v) => `${Math.round((.125 + 3.875 * (v ?? 0) / 100) * 100)}%`}
                  style={{ width: '90%' }}
                  onChange={(v) => { setScale(.125 + 3.875 * v / 100); }} />
                <div>拖动调整动画元素大小</div>
                <div>快捷键：Ctrl + 滚轮滚动</div>
              </div>
            )} mouseEnterDelay={.3} mouseLeaveDelay={.3}>
              <div className="toolbar_bottom_rt_scale">缩放：{Math.round(scale * 100)}%</div>
            </Tooltip>
            <Upload showUploadList={false}
              name="files"
              beforeUpload={beforeUploadHandler}>
              <Button type="dashed" shape="circle" icon={<FolderOpenOutlined />} />
            </Upload>
          </Space>
        </div>
      )}
    </div>
  );
};

export default Previewer;
