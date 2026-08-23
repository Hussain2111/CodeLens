import { Route, Routes } from 'react-router'
import LandingPage from './pages/LandingPage'
import CameraPage from './pages/CameraPage'
import ResultPage from './pages/ResultPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/camera" element={<CameraPage />} />
      <Route path="/result" element={<ResultPage />} />
    </Routes>
  )
}

export default App
