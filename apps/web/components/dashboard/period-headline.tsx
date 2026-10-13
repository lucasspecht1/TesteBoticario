import type { Metrics, Range } from '@wifi/shared';
import { CountUp } from '@/components/ui/count-up';
import { Delta } from '@/components/ui/delta';
import { RangeTabs } from '@/components/ui/range-tabs';
import { DELTA_UNIT } from '@/lib/kpis';
import { RANGE_LABEL } from '@/lib/ranges';
import { getRiseStyle } from '@/lib/rise';

type PeriodHeadlineProps = {
  metrics: Metrics;
  range: Range;
  riseIndex?: number;
};

/** Manchete do período: o número de visitantes dentro da frase, a variação e o seletor de período. */
export function PeriodHeadline({
  metrics,
  range,
  riseIndex = 0,
}: PeriodHeadlineProps): React.JSX.Element {
  const uniqueVisitors = metrics.kpis.uniqueVisitors;
  return (
    <header
      className="rise grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start"
      style={getRiseStyle(riseIndex)}
    >
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl leading-[1.1] text-balance text-ink sm:text-6xl">
          <span className="text-brand">
            <CountUp value={uniqueVisitors.value ?? 0} format="integer" />
          </span>{' '}
          visitantes passaram pela loja nos últimos {RANGE_LABEL[range]}.
        </h1>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-3">
          <Delta delta={uniqueVisitors.delta} unit={DELTA_UNIT.percent} /> comparado ao período
          anterior até o mesmo horário.
        </p>
      </div>
      <RangeTabs current={range} />
    </header>
  );
}
