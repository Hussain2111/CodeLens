import './App.css'
import {useEffect, useState } from "react";

type Health = {
  status: string;
  message: string;
}

function App() {
  
  const [health, setHealth] = useState<Health | null>();
  const [error, setError] = useState<string | null>();

  const url = "http://localhost:8000/health";
  useEffect(() => {
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <>
      { health ? (
          <div>
            {health.status}
            {health.message}
          </div>
        ) : error ? (
          <p style={{ color: "crimson" }}>Error: {error}</p>
        ) : (
           <p>Checking backend health…</p>
        )
      }
    </>
  )
}

export default App
