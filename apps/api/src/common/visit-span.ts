import { HOUR_MS, MINUTE_MS } from './time';
import { IN_STORE_MAX_HOURS } from '@wifi/shared';

/** Visita aberta há mais que isto não conta como "na loja" (a saída não foi registrada). */
export const IN_STORE_MAX_MS = IN_STORE_MAX_HOURS * HOUR_MS;

/** Intervalo de uma visita; `endedAt` nulo significa que a saída não foi registrada. */
export type VisitSpan = { startedAt: Date; endedAt: Date | null };

/** Permanência da visita em minutos (com fração); nulo se a saída não foi registrada. */
export const computeDwellMinutes = (visit: VisitSpan): number | null =>
  visit.endedAt
    ? (visit.endedAt.getTime() - visit.startedAt.getTime()) / MINUTE_MS
    : null;

/** Permanência em minutos inteiros; nulo enquanto não há saída registrada. */
export function computeDurationMinutes(visit: VisitSpan): number | null {
  const dwellMinutes = computeDwellMinutes(visit);
  return dwellMinutes === null ? null : Math.round(dwellMinutes);
}

/** Visita sem saída e com menos de `IN_STORE_MAX_MS`: o cliente ainda está na loja. */
export const isInStore = (visit: VisitSpan, now: Date): boolean =>
  visit.endedAt === null &&
  now.getTime() - visit.startedAt.getTime() < IN_STORE_MAX_MS;
