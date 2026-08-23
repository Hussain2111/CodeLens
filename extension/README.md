# CodeSnap extension

Receives code snapped on your phone and opens it in a new editor tab.

## How it works

Runs a local HTTPS + WebSocket server on your machine (self-signed cert,
generated once and cached in the extension's storage). The pairing command
shows a QR code encoding `https://<your-lan-ip>:<port>`. Your phone needs to
be on the same Wi-Fi network as this machine.

## Usage

1. Run the command **CodeSnap: Pair Device** (Ctrl/Cmd+Shift+P).
2. Scan the QR code with the CodeSnap app on your phone.
3. The first time, your phone's browser will warn the connection isn't
   private — this is expected for a locally-generated certificate. Accept it.
4. Capture some code in the app and tap "Send to VS Code" — it opens here.

## Develop

```
npm install
npm run compile
```

Then press F5 in VS Code to launch an Extension Development Host.
