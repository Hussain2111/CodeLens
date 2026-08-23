import { useState } from 'react'
import { Navigate, Link, useLocation } from 'react-router'
import CodeBlock from '../components/CodeBlock'
import type { ExtractResult } from '../lib/types'
import { getPairedAddress, sendToExtension } from '../lib/pairing'
import './ResultPage.css'

type SendState = 'idle' | 'sending' | 'sent' | 'error'

export default function ResultPage() {
  const location = useLocation()
  const result = location.state as ExtractResult | null
  const [sendState, setSendState] = useState<SendState>('idle')
  const [sendError, setSendError] = useState<string | null>(null)

  // location.state is empty on a direct visit or page refresh, since it
  // isn't part of the URL — bounce back to the camera to capture again.
  if (!result) {
    return <Navigate to="/camera" replace />
  }

  const pairedAddress = getPairedAddress()

  async function handleSend() {
    if (!pairedAddress || !result) return
    setSendState('sending')
    setSendError(null)
    try {
      await sendToExtension(pairedAddress, result.code, result.language)
      setSendState('sent')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send')
      setSendState('error')
    }
  }

  return (
    <main className="result-page">
      <CodeBlock code={result.code} language={result.language} />

      {pairedAddress ? (
        <button type="button" onClick={handleSend} disabled={sendState === 'sending'}>
          {sendState === 'sent' ? 'Sent to VS Code' : sendState === 'sending' ? 'Sending…' : 'Send to VS Code'}
        </button>
      ) : (
        <Link className="cta secondary" to="/pair">
          Pair with VS Code to send code
        </Link>
      )}
      {sendError && <p className="send-error">{sendError}</p>}

      <Link className="cta" to="/camera">
        Scan another
      </Link>
    </main>
  )
}
