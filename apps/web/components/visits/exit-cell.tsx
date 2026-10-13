import type { VisitListItem } from '@wifi/shared';
import { formatTime, NO_EXIT_RECORDED } from '@/lib/format';
import { InStoreBadge } from './in-store-badge';

/** Saída da visita: "Na loja há…" se ainda está lá, a hora de saída ou o aviso de que não houve. */
export function ExitCell({ visit, now }: { visit: VisitListItem; now: number }): React.JSX.Element {
  if (visit.inStore) return <InStoreBadge startedAt={visit.startedAt} now={now} />;
  if (!visit.endedAt) return <span className="text-xs text-ink-3">{NO_EXIT_RECORDED}</span>;
  return <span className="tabular-nums">{formatTime(visit.endedAt)}</span>;
}
