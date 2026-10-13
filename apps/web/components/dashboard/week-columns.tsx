import type { Metrics, Range } from '@wifi/shared';
import { summarizeToday } from '@/lib/today';
import { findWeekMaxVisits, getDayEmphasis, listVisibleHours, summarizeWeek } from '@/lib/week';
import { DayColumn } from './day-column';

type WeekColumnsProps = {
  metrics: Metrics;
  range: Range;
  /** Posição de entrada da primeira coluna; as demais seguem em sequência. */
  riseIndex?: number;
};

/** Semana típica: uma coluna por dia. Mais cheio em verde, mais fraco em rosado, hoje contornado. */
export function WeekColumns({
  metrics,
  range,
  riseIndex = 0,
}: WeekColumnsProps): React.JSX.Element {
  const week = summarizeWeek(metrics);
  const today = summarizeToday(metrics);
  const hours = listVisibleHours(week);
  const maxVisits = findWeekMaxVisits(week, hours);

  return (
    <section
      aria-labelledby="dias"
      className="grid grid-cols-2 gap-3 lg:grid-cols-7 [&>a:last-child]:col-span-2 lg:[&>a:last-child]:col-span-1"
    >
      <h2 id="dias" className="sr-only">
        Média por dia da semana
      </h2>
      {week.days.map((day, index) => (
        <DayColumn
          key={day.weekday}
          day={day}
          emphasis={getDayEmphasis(week, day.weekday)}
          range={range}
          today={day.weekday === today.weekday ? today : null}
          hours={hours}
          maxVisits={maxVisits}
          riseIndex={riseIndex + index}
        />
      ))}
    </section>
  );
}
