import { CaretRight } from '@phosphor-icons/react/dist/ssr';
import type { Range } from '@wifi/shared';
import Link from 'next/link';
import { Chip } from '@/components/ui/chip';
import { cx } from '@/lib/cx';
import { capitalize, formatDecimal, formatHourRange } from '@/lib/format';
import { getRiseStyle } from '@/lib/rise';
import { weekdayHref } from '@/lib/routes';
import type { TodaySummary } from '@/lib/today';
import type { DayEmphasis, WeekdayStats } from '@/lib/week';
import { WEEKDAY_NAMES } from '@/lib/weekdays';
import { HourBars } from './hour-bars';
import { TodayNote } from './today-note';

const EMPHASIS_STYLES: Record<
  DayEmphasis,
  {
    card: string;
    muted: string;
    bar: string;
    peakBar: string;
    peakText: string;
    badge: string;
  }
> = {
  busiest: {
    card: 'bg-brand text-white',
    muted: 'text-white/90',
    bar: 'bg-white/35',
    peakBar: 'bg-white',
    peakText: 'text-white',
    badge: 'text-white',
  },
  weakest: {
    card: 'bg-rose-soft text-ink',
    muted: 'text-mauve',
    bar: 'bg-rose',
    peakBar: 'bg-mauve',
    peakText: 'text-ink',
    badge: 'text-mauve',
  },
  regular: {
    card: 'bg-card text-ink',
    muted: 'text-ink-3',
    bar: 'bg-quartzo/45',
    peakBar: 'bg-brand',
    peakText: 'text-ink',
    badge: '',
  },
};

const EMPHASIS_LABEL: Record<DayEmphasis, string | null> = {
  busiest: 'Dia mais cheio',
  weakest: 'Dia mais fraco',
  regular: null,
};

const COLUMN_BASE = cx(
  'rise group flex min-w-0 flex-col rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-card)]',
  'transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-expo)] active:translate-y-0',
);
const COLUMN_HOVER_LIFT = cx(
  'hover:-translate-y-0.5',
  'hover:shadow-[0_2px_4px_rgb(73_81_65/0.06),0_16px_32px_-14px_rgb(73_81_65/0.28)]',
);
const TODAY_RING = 'ring-2 ring-primavera ring-offset-2 ring-offset-paper';

type DayColumnProps = {
  day: WeekdayStats;
  emphasis: DayEmphasis;
  range: Range;
  /** Hoje, quando esta coluna é o dia da semana de hoje; null nas demais. */
  today: TodaySummary | null;
  /** Horas mostradas, da primeira à última com movimento na semana. */
  hours: number[];
  maxVisits: number;
  riseIndex: number;
};

/** Coluna de um dia da semana: média de visitas, barras por hora, pico e link para a análise do dia. */
export function DayColumn({
  day,
  emphasis,
  range,
  today,
  hours,
  maxVisits,
  riseIndex,
}: DayColumnProps): React.JSX.Element {
  const styles = EMPHASIS_STYLES[emphasis];
  const emphasisLabel = EMPHASIS_LABEL[emphasis];
  const dayName = capitalize(WEEKDAY_NAMES[day.weekday]);
  return (
    <Link
      href={weekdayHref(day.weekday, range)}
      style={getRiseStyle(riseIndex)}
      aria-label={`${dayName}: ver a análise do dia`}
      className={cx(COLUMN_BASE, COLUMN_HOVER_LIFT, styles.card, today && TODAY_RING)}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{dayName}</h3>
        {today ? (
          <Chip tone="highlight">Hoje</Chip>
        ) : (
          <CaretRight
            size={14}
            weight="bold"
            className={cx(
              'opacity-50 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-100',
              styles.muted,
            )}
            aria-hidden
          />
        )}
      </div>
      <p className="mt-4 font-display text-4xl leading-none tabular-nums">
        {formatDecimal(day.total)}
      </p>
      <p className={cx('mt-1 text-xs', styles.muted)}>visitas num dia típico</p>
      <HourBars
        day={day}
        hours={hours}
        maxVisits={maxVisits}
        barClassName={styles.bar}
        peakBarClassName={styles.peakBar}
      />
      <div
        className={cx('mt-1 flex justify-between text-xs tabular-nums', styles.muted)}
        aria-hidden
      >
        <span>{hours[0]}h</span>
        <span>{hours[hours.length - 1]}h</span>
      </div>
      <p className={cx('mt-3 text-xs', styles.muted)}>
        Pico das{' '}
        <strong className={styles.peakText}>{formatHourRange(day.peakFrom, day.peakTo)}</strong>
      </p>
      {today && <TodayNote summary={today} isOnBrand={emphasis === 'busiest'} />}
      {emphasisLabel && (
        <p className={cx('mt-auto pt-3 text-xs font-semibold', styles.badge)}>{emphasisLabel}</p>
      )}
    </Link>
  );
}
