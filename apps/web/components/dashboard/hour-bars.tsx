import type { WeekdayStats } from '@/lib/week';
import { cx } from '@/lib/cx';

/** Menor altura de uma barra, para a hora com movimento quase nulo continuar visível (em %). */
const MIN_BAR_HEIGHT_PERCENT = 3;

type HourBarsProps = {
  day: WeekdayStats;
  /** Horas mostradas, da primeira à última com movimento na semana. */
  hours: number[];
  /** Maior média de visitas de qualquer hora da semana: é a altura de 100%. */
  maxVisits: number;
  /** Classes de cor da barra comum e da barra da hora de pico. */
  barClassName: string;
  peakBarClassName: string;
};

/** Barras de visitas por hora de um dia; a hora de pico leva a cor de destaque. */
export function HourBars({
  day,
  hours,
  maxVisits,
  barClassName,
  peakBarClassName,
}: HourBarsProps): React.JSX.Element {
  return (
    <div className="mt-5 flex h-12 items-end gap-[2px] lg:h-16" aria-hidden>
      {hours.map((hour) => {
        const isPeak = hour >= day.peakFrom && hour < day.peakTo;
        return (
          <span
            key={hour}
            className={cx('flex-1 rounded-t-[2px]', isPeak ? peakBarClassName : barClassName)}
            style={{
              height: `${Math.max((day.hours[hour] / maxVisits) * 100, MIN_BAR_HEIGHT_PERCENT)}%`,
            }}
          />
        );
      })}
    </div>
  );
}
