import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import type { RefObject } from 'react'

// Polls the video element via a hidden canvas and runs jsQR on each frame
// until a code is found, then stops. videoRef must already have an active
// stream attached (see useCamera).
export function useQrScanner(videoRef: RefObject<HTMLVideoElement | null>, isReady: boolean) {
  const [result, setResult] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!isReady || result) return

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    let frameId: number
    let stopped = false

    function scan() {
      const video = videoRef.current
      if (video && video.videoWidth > 0 && ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code?.data) {
          stopped = true
          setResult(code.data)
          return
        }
      }
      if (!stopped) frameId = requestAnimationFrame(scan)
    }

    frameId = requestAnimationFrame(scan)
    return () => {
      stopped = true
      cancelAnimationFrame(frameId)
    }
  }, [videoRef, isReady, result])

  return result
}
