import type { Metrics } from '@wifi/shared';
import { DailyChart } from '@/components/charts/daily-chart';
import { DwellBars } from '@/components/charts/dwell-bars';
import { Card } from '@/components/ui/card';
import { getRiseStyle } from '@/lib/rise';

/** Série diária de visitantes ao lado da distribuição de permanência. */
export function DailyAndDwell({
  metrics,
  riseIndex = 0,
}: {
  metrics: Metrics;
  riseIndex?: number;
}): React.JSX.Element {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card
        title="Visitantes por dia"
        subtitle="Novos e recorrentes"
        className="rise lg:col-span-2"
        style={getRiseStyle(riseIndex)}
      >
        <DailyChart data={metrics.daily} />
      </Card>
      <Card
        className="rise"
        style={getRiseStyle(riseIndex + 1)}
        title="Quanto tempo ficam"
        subtitle="Visitas encerradas, por faixa"
      >
        <DwellBars buckets={metrics.dwellBuckets} />
      </Card>
    </div>
  );
}
