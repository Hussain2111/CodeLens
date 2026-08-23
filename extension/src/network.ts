import * as os from 'os';

// Picks the first non-internal IPv4 address, which is the address other
// devices on the same LAN can use to reach this machine.
export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (!entry.internal && entry.family === 'IPv4') {
        return entry.address;
      }
    }
  }
  return 'localhost';
}
