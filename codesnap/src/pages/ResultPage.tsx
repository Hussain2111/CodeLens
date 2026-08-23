import { Navigate, Link, useLocation } from 'react-router'
import CodeBlock from '../components/CodeBlock'
import type { ExtractResult } from '../lib/types'
import './ResultPage.css'

export default function ResultPage() {
  const location = useLocation()
  const result = location.state as ExtractResult | null

  // location.state is empty on a direct visit or page refresh, since it
  // isn't part of the URL — bounce back to the camera to capture again.
  if (!result) {
    return <Navigate to="/camera" replace />
  }

  return (
    <main className="result-page">
      <CodeBlock code={result.code} language={result.language} />
      <Link className="cta" to="/camera">
        Scan another
      </Link>
    </main>
  )
}
