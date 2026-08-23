import { useCallback, useEffect, useRef, useState } from 'react'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setIsReady(false)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsReady(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not access the camera')
    }
  }, [])

  // Stop all tracks when the component using this hook unmounts, so the
  // browser's camera indicator turns off instead of staying stuck on.
  useEffect(() => {
    return () => stop()
  }, [stop])

  return { videoRef, isReady, error, start, stop }
}
