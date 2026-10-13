import { ALIAS_LENGTH } from '@wifi/shared';

/** Apelido estável do cliente: começo do HMAC do MAC (não revela o aparelho). */
export const toAlias = (macHash: string): string =>
  macHash.slice(0, ALIAS_LENGTH).toUpperCase();

/** Primeiro nome só de quem aceitou contato; nunca o nome completo. */
export function getFirstName(
  name: string | null,
  hasOptedIn: boolean,
): string | null {
  if (!name || !hasOptedIn) return null;
  return name.trim().split(/\s+/)[0] || null;
}
