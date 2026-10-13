import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import type { Metrics, Range } from '@wifi/shared';
import Link from 'next/link';
import { formatInteger } from '@/lib/format';
import { weekdayHref } from '@/lib/routes';
import { forecastTomorrow } from '@/lib/today';
import { WEEKDAY_NAMES } from '@/lib/weekdays';
import { TEXT_LINK_UNDERLINE } from '@/components/ui/styles';
import { cx } from '@/lib/cx';

const SCHEDULE_LINK = cx(
  'inline-flex items-center gap-1 font-semibold text-brand-strong',
  TEXT_LINK_UNDERLINE,
);

/** "Amanhã": visitas esperadas e pico pela semana típica, com o caminho para a escala sugerida. */
export function TomorrowNote({
  metrics,
  range,
}: {
  metrics: Metrics;
  range: Range;
}): React.JSX.Element | null {
  const forecast = forecastTomorrow(metrics);
  if (!forecast) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
      <span>
        <strong className="font-semibold text-ink">
          Amanhã, {WEEKDAY_NAMES[forecast.weekday]}:
        </strong>{' '}
        cerca de {formatInteger(Math.round(forecast.expectedVisits))} visitas, pico às{' '}
        {forecast.peakHour}h.
      </span>
      <Link href={weekdayHref(forecast.weekday, range)} className={SCHEDULE_LINK}>
        Ver a escala sugerida <ArrowRight size={14} weight="bold" aria-hidden />
      </Link>
    </p>
  );
}
