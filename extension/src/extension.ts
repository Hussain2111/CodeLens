import * as vscode from 'vscode';
import { getLocalIpAddress } from './network';
import { getOrCreateCert } from './certs';
import { startPairingServer, PairingServer } from './server';
import { showPairingPanel } from './pairingPanel';

let server: PairingServer | undefined;
let serverAddress: { ip: string; port: number } | undefined;

export function activate(context: vscode.ExtensionContext) {
  const pairDeviceCmd = vscode.commands.registerCommand('codesnap.pairDevice', () => pairDevice(context));
  const statusCmd = vscode.commands.registerCommand('codesnap.connectionStatus', showStatus);

  context.subscriptions.push(pairDeviceCmd, statusCmd);
}

async function pairDevice(context: vscode.ExtensionContext) {
  const port = vscode.workspace.getConfiguration('codesnap').get<number>('port', 3001);
  const ip = getLocalIpAddress();

  if (ip === 'localhost') {
    vscode.window.showWarningMessage('CodeSnap: could not find a LAN IP address. Are you connected to Wi-Fi?');
    return;
  }

  if (!server || serverAddress?.ip !== ip || serverAddress?.port !== port) {
    server?.close();
    const cert = await getOrCreateCert(context, ip);
    server = startPairingServer(cert, port);
    serverAddress = { ip, port };
  }

  await showPairingPanel(context, ip, port);
}

function showStatus() {
  if (server && serverAddress) {
    vscode.window.showInformationMessage(
      `CodeSnap: pairing server running at https://${serverAddress.ip}:${serverAddress.port}`,
    );
  } else {
    vscode.window.showInformationMessage('CodeSnap: not running. Run "CodeSnap: Pair Device" to start.');
  }
}

export function deactivate() {
  server?.close();
  server = undefined;
}
