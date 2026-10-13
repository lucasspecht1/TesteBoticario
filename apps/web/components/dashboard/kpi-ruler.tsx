import type { Metrics } from '@wifi/shared';
import { Delta } from '@/components/ui/delta';
import { KpiStatRuler } from '@/components/ui/kpi-stat-ruler';
import { buildKpiList } from '@/lib/kpis';
import { getRiseStyle } from '@/lib/rise';

type KpiRulerProps = {
  metrics: Metrics;
  riseIndex?: number;
};

/** Indicadores do período numa régua única, sem cartões, cada um com variação e dica de leitura. */
export function KpiRuler({ metrics, riseIndex = 0 }: KpiRulerProps): React.JSX.Element {
  return (
    <KpiStatRuler
      title={{ id: 'kpis', text: 'Indicadores' }}
      columns="sm:grid-cols-3 lg:grid-cols-6"
      style={getRiseStyle(riseIndex)}
      items={buildKpiList(metrics)}
      renderFooter={(kpi) => (
        <>
          <dd className="mt-2">
            <Delta delta={kpi.delta} unit={kpi.deltaUnit} />
          </dd>
          <dd className="mt-3 text-xs leading-relaxed text-ink-3">{kpi.hint}</dd>
        </>
      )}
    />
  );
}
