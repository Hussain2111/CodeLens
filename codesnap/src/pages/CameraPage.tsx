import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useCamera } from '../hooks/useCamera'
import { extractCode, ExtractError } from '../lib/api'
import type { ExtractResult } from '../lib/types'
import './CameraPage.css'

// Phone cameras can produce multi-thousand-pixel photos; downscale before
// sending so the request stays fast and under the API's payload limits.
const MAX_DIMENSION = 1600

type CaptureState = 'streaming' | 'captured' | 'extracting' | 'result'

function captureFrame(video: HTMLVideoElement): string {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight))
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth * scale
  canvas.height = video.videoHeight * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported in this browser')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/jpeg', 0.9)
}

export default function CameraPage() {
  const navigate = useNavigate()
  const { videoRef, isReady, error: cameraError, start } = useCamera()

  const [captureState, setCaptureState] = useState<CaptureState>('streaming')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [extractError, setExtractError] = useState<string | null>(null)
  const resultRef = useRef<ExtractResult | null>(null)

  useEffect(() => {
    start()
  }, [start])

  // Once extraction succeeds, hand the result off to the result route rather
  // than rendering it here, keeping the camera flow and the result view separate.
  useEffect(() => {
    if (captureState === 'result' && resultRef.current) {
      navigate('/result', { state: resultRef.current })
    }
  }, [captureState, navigate])

  function handleCapture() {
    if (!videoRef.current) return
    setCapturedImage(captureFrame(videoRef.current))
    setCaptureState('captured')
  }

  function handleRetake() {
    setCapturedImage(null)
    setExtractError(null)
    setCaptureState('streaming')
  }

  async function handleExtract() {
    if (!capturedImage) return
    setExtractError(null)
    setCaptureState('extracting')
    try {
      resultRef.current = await extractCode(capturedImage)
      setCaptureState('result')
    } catch (err) {
      const message = err instanceof ExtractError ? err.message : 'Something went wrong, try again'
      setExtractError(message)
      setCaptureState('captured')
    }
  }

  return (
    <main className="camera-page">
      {cameraError && <p className="camera-error">{cameraError}</p>}

      <div className="camera-viewport">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: captureState === 'streaming' ? 'block' : 'none' }}
        />
        {capturedImage && captureState !== 'streaming' && (
          <img src={capturedImage} alt="Captured frame" />
        )}
      </div>

      {extractError && <p className="camera-error">{extractError}</p>}

      <div className="camera-controls">
        {captureState === 'streaming' && (
          <button type="button" onClick={handleCapture} disabled={!isReady}>
            Capture
          </button>
        )}
        {captureState === 'captured' && (
          <>
            <button type="button" onClick={handleRetake}>
              Retake
            </button>
            <button type="button" onClick={handleExtract}>
              Extract code
            </button>
          </>
        )}
        {captureState === 'extracting' && <p>Extracting code…</p>}
      </div>
    </main>
  )
}
