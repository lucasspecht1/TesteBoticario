import { createHmac } from 'node:crypto';

export function normalizeMac(mac: string): string {
  return mac.toLowerCase().replace(/-/g, ':');
}

/** HMAC em vez de hash simples: o espaço de MACs é pequeno o bastante para força bruta. */
export function hashMac(mac: string, secret: string): string {
  return createHmac('sha256', secret).update(normalizeMac(mac)).digest('hex');
}
