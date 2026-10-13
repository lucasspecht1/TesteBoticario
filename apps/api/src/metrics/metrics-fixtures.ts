import type { VisitRow } from './compute-metrics';

/** Fuso da loja nos testes. */
export const SAO_PAULO = 'America/Sao_Paulo';
/** "Agora" fixo dos testes: segunda-feira, 12/10/2026, 15h em São Paulo. */
export const NOW = new Date('2026-10-12T15:00:00-03:00');

/** Instante a partir de uma data ISO 8601 com fuso. */
export const atTime = (isoDate: string): Date => new Date(isoDate);

/** Visita de teste: sem saída, aparelho visto pela 1ª vez na própria visita e sem aceite de contato. */
export const buildVisitRow = (
  overrides: Partial<VisitRow> & Pick<VisitRow, 'deviceId' | 'startedAt'>,
): VisitRow => ({
  endedAt: null,
  deviceFirstSeenAt: overrides.startedAt,
  hasOptedIn: false,
  ...overrides,
});
