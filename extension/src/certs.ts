import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import selfsigned from 'selfsigned';

export type Cert = { key: string; cert: string };

// A self-signed cert is regenerated once per machine and cached in the
// extension's global storage, so re-pairing on the same network doesn't
// force the phone to re-accept a new certificate every time.
export async function getOrCreateCert(context: vscode.ExtensionContext, ip: string): Promise<Cert> {
  const dir = context.globalStorageUri.fsPath;
  fs.mkdirSync(dir, { recursive: true });

  const keyPath = path.join(dir, 'cert-key.pem');
  const certPath = path.join(dir, 'cert.pem');
  const ipPath = path.join(dir, 'cert-ip.txt');

  const cached =
    fs.existsSync(keyPath) &&
    fs.existsSync(certPath) &&
    fs.existsSync(ipPath) &&
    fs.readFileSync(ipPath, 'utf8').trim() === ip;

  if (cached) {
    return { key: fs.readFileSync(keyPath, 'utf8'), cert: fs.readFileSync(certPath, 'utf8') };
  }

  const notBefore = new Date();
  const notAfter = new Date(notBefore);
  notAfter.setFullYear(notAfter.getFullYear() + 2);

  const pems = await selfsigned.generate([{ name: 'commonName', value: ip }], {
    notBeforeDate: notBefore,
    notAfterDate: notAfter,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      { name: 'basicConstraints', cA: false, critical: true },
      { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true },
      { name: 'extKeyUsage', serverAuth: true },
      {
        name: 'subjectAltName',
        altNames: [
          { type: 7, ip },
          { type: 7, ip: '127.0.0.1' },
        ],
      },
    ],
  });

  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);
  fs.writeFileSync(ipPath, ip);

  return { key: pems.private, cert: pems.cert };
}
