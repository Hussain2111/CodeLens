const STORAGE_KEY = 'codesnap:pairedExtension'

// The extension's QR encodes its own https:// URL (also used as the
// one-time certificate-trust link); the WebSocket connection is the same
// host and port, just over wss:// instead.
export function parsePairingUrl(text: string): string | null {
  try {
    const url = new URL(text)
    if (url.protocol !== 'https:') return null
    return `wss://${url.host}`
  } catch {
    return null
  }
}

export function getPairedAddress(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setPairedAddress(wsUrl: string): void {
  localStorage.setItem(STORAGE_KEY, wsUrl)
}

export function sendToExtension(wsUrl: string, code: string, language: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl)

    const timeout = setTimeout(() => {
      socket.close()
      reject(new Error('Connection to VS Code timed out'))
    }, 8000)

    socket.onopen = () => {
      socket.send(JSON.stringify({ code, language }))
      clearTimeout(timeout)
      socket.close()
      resolve()
    }

    socket.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('Could not connect to VS Code. Make sure the extension is running and paired.'))
    }
  })
}
