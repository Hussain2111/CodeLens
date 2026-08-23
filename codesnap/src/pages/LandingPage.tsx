import { Link } from 'react-router'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <main className="landing">
      <h1>codesnap</h1>
      <p>Point your camera at some code and get it back as text, instantly.</p>
      <Link className="cta" to="/camera">
        Open camera
      </Link>
    </main>
  )
}
