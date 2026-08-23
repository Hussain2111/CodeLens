import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useCamera } from '../hooks/useCamera'
import { useQrScanner } from '../hooks/useQrScanner'
import { parsePairingUrl, setPairedAddress } from '../lib/pairing'
import './PairPage.css'

export default function PairPage() {
  const { videoRef, isReady, error: cameraError, start } = useCamera()
  const scanned = useQrScanner(videoRef, isReady)
  const [status, setStatus] = useState<'scanning' | 'paired' | 'invalid'>('scanning')

  useEffect(() => {
    start()
  }, [start])

  useEffect(() => {
    if (!scanned) return
    const wsUrl = parsePairingUrl(scanned)
    if (!wsUrl) {
      setStatus('invalid')
      return
    }
    setPairedAddress(wsUrl)
    setStatus('paired')
  }, [scanned])

  return (
    <main className="pair-page">
      <h1>Pair with VS Code</h1>

      {status === 'scanning' && (
        <>
          <p>
            In VS Code, run <strong>CodeSnap: Pair Device</strong> and scan the QR code it shows.
          </p>
          {cameraError && <p className="pair-error">{cameraError}</p>}
          <div className="pair-viewport">
            <video ref={videoRef} autoPlay playsInline muted />
          </div>
        </>
      )}

      {status === 'paired' && (
        <>
          <p>Paired. The first time, your phone may ask you to trust the connection — accept it if prompted.</p>
          <Link className="cta" to="/camera">
            Start scanning code
          </Link>
        </>
      )}

      {status === 'invalid' && (
        <>
          <p className="pair-error">That doesn't look like a CodeSnap pairing code.</p>
          <button type="button" onClick={() => setStatus('scanning')}>
            Try again
          </button>
        </>
      )}
    </main>
  )
}
