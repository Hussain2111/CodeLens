import * as vscode from 'vscode';
import * as qrcode from 'qrcode';

let currentPanel: vscode.WebviewPanel | undefined;

// The QR encodes the plain https:// URL (not wss://) so it can double as
// the one-time link the phone opens to accept the self-signed certificate,
// as well as the address the app derives its wss:// connection from.
export async function showPairingPanel(context: vscode.ExtensionContext, ip: string, port: number) {
  const url = `https://${ip}:${port}`;
  const qrDataUrl = await qrcode.toDataURL(url, { margin: 1, width: 240 });

  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Beside);
  } else {
    currentPanel = vscode.window.createWebviewPanel(
      'codesnapPairing',
      'CodeSnap: Pair Device',
      vscode.ViewColumn.Beside,
      { enableScripts: false },
    );
    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
    }, null, context.subscriptions);
  }

  currentPanel.webview.html = getHtml(url, qrDataUrl);
}

function getHtml(url: string, qrDataUrl: string): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; padding: 24px; text-align: center;">
  <h1>Pair your phone</h1>
  <img src="${qrDataUrl}" width="240" height="240" alt="Pairing QR code" />
  <p style="font-family: monospace;">${url}</p>
  <ol style="text-align: left; max-width: 420px; margin: 24px auto;">
    <li>Open the CodeSnap app on your phone, on the same Wi-Fi network as this computer.</li>
    <li>Go to "Pair with VS Code" and scan this code.</li>
    <li>The first time, your phone will warn that the connection isn't private &mdash; this is expected for a locally-generated certificate. Accept it to continue.</li>
    <li>Capture code in the app, then tap "Send to VS Code" &mdash; it opens here in a new tab.</li>
  </ol>
</body>
</html>`;
}
