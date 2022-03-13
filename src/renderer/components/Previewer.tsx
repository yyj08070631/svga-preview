/* eslint-disable prettier/prettier */
// 组件
import { Button } from 'antd'
// 工具
import { IpcRenderer } from 'electron'
import { useEffect, FC } from 'react'
import SVGA from 'svgaplayerweb'
// 自定义

const Previewer: FC = () => {
  // static data
  const ctx: CanvasRenderingContext2D | null = null
  // let loop = true
  // reactive data
  // methods
  // const initPlayer = () => {}
  const drawImage = (bitmap: string): void => {
    const image = new Image()
    image.src = `data:image;base64,${bitmap}`
    ctx?.clearRect(0, 0, 750, 1200)
    ctx?.drawImage(image, 0, 0, image.width / 2, image.height / 2)
  }
  const startAnimation = (bitmapList: string[]): void => {
    let count = 0
    const traverse = () => {
      if (count >= bitmapList.length) return

      drawImage(bitmapList[count])
      count += 1
      requestAnimationFrame(traverse)
    }
    traverse()
  }
  // cycle life
  useEffect(() => {
    // const canvas: HTMLCanvasElement = document.getElementById('demoCanvas')
    // ctx = canvas.getContext('2d')
    // const player = new SVGA.Player('#demoCanvas')
    const parser = new SVGA.Parser() // Must Provide same selector eg:#demoCanvas IF support IE6+

    const { ipcRenderer }: { ipcRenderer: IpcRenderer } = window.electron
    ipcRenderer.on('file-loaded', (message) => {
      const base64 = `data:svga/2.0;base64,${message}`

      parser.load(
        // 'http://cc.fp.ps.netease.com/file/61e0e15f00722e51091e44820sS6GbCv04',
        base64,
        (videoItem) => {
          // console.log(Object.values(videoItem.images))
          // startAnimation(Object.values(videoItem.images))
          
          // player.setVideoItem(videoItem)
          // player.startAnimation()
        }
      )
    })
  }, [])
  return (
    <div>
      <canvas id="demoCanvas" width="750" height="1200" />
      <Button type="primary">Button</Button>
    </div>
  )
}

export default Previewer
