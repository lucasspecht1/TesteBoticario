import type { CustomerDetail } from '@wifi/shared';
import { StatRuler, StatRulerItem } from '@/components/ui/stat-ruler';
import { formatInteger, formatLongDate, formatWithUnit } from '@/lib/format';
import { getRiseStyle } from '@/lib/rise';

const CUSTOMER_STATS_RISE_INDEX = 1;

/** Régua com visitas, permanência, intervalo entre visitas e primeira visita do cliente. */
export function CustomerStats({ customer }: { customer: CustomerDetail }): React.JSX.Element {
  const stats = [
    { label: 'Visitas', value: formatInteger(customer.totalVisits) },
    {
      label: 'Permanência típica',
      value: formatWithUnit(customer.medianDwellMinutes, ' min'),
    },
    {
      label: 'Intervalo entre visitas',
      value: formatWithUnit(customer.avgDaysBetweenVisits, ' dias'),
    },
    { label: 'Primeira visita', value: formatLongDate(customer.firstSeenAt) },
  ];
  return (
    <StatRuler columns="lg:grid-cols-4" style={getRiseStyle(CUSTOMER_STATS_RISE_INDEX)}>
      {stats.map(({ label, value }) => (
        <StatRulerItem key={label} label={label}>
          <dd className="mt-2 font-display text-3xl leading-tight text-ink tabular-nums">
            {value}
          </dd>
        </StatRulerItem>
      ))}
    </StatRuler>
  );
}
