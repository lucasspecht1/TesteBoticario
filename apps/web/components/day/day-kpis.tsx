import type { WeekdayDetail } from '@wifi/shared';
import { Delta } from '@/components/ui/delta';
import { KpiStatRuler } from '@/components/ui/kpi-stat-ruler';
import { buildDayKpiList } from '@/lib/kpis';
import { getRiseStyle } from '@/lib/rise';

const DAY_KPIS_RISE_INDEX = 3;

/** Indicadores do dia numa régua, cada um com a variação contra os outros dias do período. */
export function DayKpis({ detail }: { detail: WeekdayDetail }): React.JSX.Element {
  return (
    <KpiStatRuler
      title={{ id: 'kpis-dia', text: 'Indicadores do dia contra os outros dias' }}
      columns="lg:grid-cols-4"
      style={getRiseStyle(DAY_KPIS_RISE_INDEX)}
      items={buildDayKpiList(detail)}
      renderFooter={(kpi) => (
        <dd className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
          <Delta delta={kpi.delta} unit={kpi.deltaUnit} /> vs. outros dias
        </dd>
      )}
    />
  );
}
