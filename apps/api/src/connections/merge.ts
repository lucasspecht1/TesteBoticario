export const MERGE_GAP_MS = 30 * 60_000;
export const MAX_OPEN_VISIT_MS = 12 * 60 * 60_000;

export type VisitWindow = { startedAt: Date; endedAt: Date | null };

/** A nova conexão pertence à última visita do aparelho? */
export function shouldMerge(last: VisitWindow | null, connectedAt: Date): boolean {
  if (!last) return false;
  if (last.endedAt === null) return connectedAt.getTime() - last.startedAt.getTime() <= MAX_OPEN_VISIT_MS;
  return connectedAt.getTime() - last.endedAt.getTime() <= MERGE_GAP_MS;
}

/** Fim da visita depois de somar a conexão. null = aparelho ainda conectado. */
export function mergedEnd(lastEnd: Date | null, connectedAt: Date, disconnectedAt: Date | null): Date | null {
  if (disconnectedAt) return lastEnd && lastEnd > disconnectedAt ? lastEnd : disconnectedAt;
  return lastEnd && lastEnd >= connectedAt ? lastEnd : null;
}
