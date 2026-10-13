import type { CustomerDetail } from '@wifi/shared';
import { InStoreBadge } from '@/components/visits/in-store-badge';
import { Card } from '@/components/ui/card';
import {
  formatDayMonth,
  formatInteger,
  formatDuration,
  formatVisitSchedule,
  NO_EXIT_RECORDED,
} from '@/lib/format';
import { getRiseStyle } from '@/lib/rise';

const VISIT_HISTORY_RISE_INDEX = 2;

type HistoryVisit = CustomerDetail['visits'][number];

/** Quanto durou a visita, ou o aviso de que a saída não foi registrada. */
const describeDuration = (visit: HistoryVisit): string =>
  visit.durationMinutes === null ? NO_EXIT_RECORDED : formatDuration(visit.durationMinutes);

/** Subtítulo do histórico: quantas visitas aparecem da quantidade total. */
function describeHistory(customer: CustomerDetail): string {
  return customer.totalVisits > customer.visits.length
    ? `As ${customer.visits.length} mais recentes de ${formatInteger(customer.totalVisits)}.`
    : 'Da mais recente para a mais antiga.';
}

/** Histórico das visitas do cliente, da mais recente para a mais antiga. */
export function VisitHistory({ customer }: { customer: CustomerDetail }): React.JSX.Element {
  const now = Date.now();
  return (
    <Card
      className="rise"
      style={getRiseStyle(VISIT_HISTORY_RISE_INDEX)}
      title="Histórico de visitas"
      subtitle={describeHistory(customer)}
    >
      <ol className="divide-y divide-line">
        {customer.visits.map((visit) => (
          <li
            key={visit.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
          >
            <span className="tabular-nums text-ink">
              <span className="mr-2 text-ink-3">{formatDayMonth(visit.startedAt)}</span>
              {formatVisitSchedule(visit)}
            </span>
            {visit.inStore ? (
              <InStoreBadge startedAt={visit.startedAt} now={now} />
            ) : (
              <span className="font-medium tabular-nums text-ink-2">{describeDuration(visit)}</span>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
