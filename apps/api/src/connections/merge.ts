import { MAX_OPEN_VISIT_HOURS, MERGE_GAP_MINUTES } from '@wifi/shared';
import { HOUR_MS, MINUTE_MS } from '../common/time';
import type { VisitSpan } from '../common/visit-span';

/** Nova conexão até `MERGE_GAP_MINUTES` depois da saída continua na mesma visita. */
const MERGE_GAP_MS = MERGE_GAP_MINUTES * MINUTE_MS;
/** Visita sem saída registrada aceita novas conexões por até `MAX_OPEN_VISIT_HOURS`; depois abre outra. */
const MAX_OPEN_VISIT_MS = MAX_OPEN_VISIT_HOURS * HOUR_MS;

/** A nova conexão pertence à última visita do aparelho? */
export function shouldMerge(
  lastVisit: VisitSpan | null,
  connectedAt: Date,
): boolean {
  if (!lastVisit) return false;
  if (lastVisit.endedAt === null)
    return (
      connectedAt.getTime() - lastVisit.startedAt.getTime() <= MAX_OPEN_VISIT_MS
    );
  return connectedAt.getTime() - lastVisit.endedAt.getTime() <= MERGE_GAP_MS;
}

/** Fim da visita depois de somar a conexão. null = aparelho ainda conectado. */
export function computeMergedEnd(
  lastEndedAt: Date | null,
  connectedAt: Date,
  disconnectedAt: Date | null,
): Date | null {
  if (disconnectedAt)
    return lastEndedAt && lastEndedAt > disconnectedAt
      ? lastEndedAt
      : disconnectedAt;
  return lastEndedAt && lastEndedAt >= connectedAt ? lastEndedAt : null;
}
