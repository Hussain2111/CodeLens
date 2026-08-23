import * as https from 'https';
import * as vscode from 'vscode';
import { WebSocketServer, WebSocket } from 'ws';
import type { Cert } from './certs';
import { toVscodeLanguageId } from './languageIds';

type IncomingSnippet = {
  code: string;
  language: string;
};

function isIncomingSnippet(value: unknown): value is IncomingSnippet {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.code === 'string' && typeof v.language === 'string';
}

const TRUST_PAGE = `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CodeSnap</title></head>
<body style="font-family: system-ui, sans-serif; text-align: center; padding: 48px 24px;">
  <h1>Paired with VS Code</h1>
  <p>This certificate is now trusted on this device. You can return to the CodeSnap app.</p>
</body>
</html>`;

export type PairingServer = {
  close: () => void;
};

export function startPairingServer(cert: Cert, port: number): PairingServer {
  const httpsServer = https.createServer({ key: cert.key, cert: cert.cert }, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(TRUST_PAGE);
  });

  const wss = new WebSocketServer({ server: httpsServer });

  wss.on('connection', (ws: WebSocket) => {
    vscode.window.showInformationMessage('CodeSnap: device connected');

    ws.on('message', (raw: Buffer) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw.toString('utf8'));
      } catch {
        vscode.window.showErrorMessage('CodeSnap: received malformed message from device');
        return;
      }

      if (!isIncomingSnippet(parsed)) {
        vscode.window.showErrorMessage('CodeSnap: received unexpected message shape from device');
        return;
      }

      vscode.workspace
        .openTextDocument({ content: parsed.code, language: toVscodeLanguageId(parsed.language) })
        .then((doc) => vscode.window.showTextDocument(doc));
    });

    ws.on('close', () => {
      vscode.window.showInformationMessage('CodeSnap: device disconnected');
    });
  });

  httpsServer.listen(port);

  return {
    close: () => {
      wss.close();
      httpsServer.close();
    },
  };
}
