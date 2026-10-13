import type { Range } from '@wifi/shared';
import Link from 'next/link';
import { PILL_ACTIVE } from '@/components/ui/styles';
import { cx } from '@/lib/cx';
import { WEEK_DISPLAY_ORDER } from '@/lib/week';
import { weekdayHref } from '@/lib/routes';
import { WEEKDAY_SHORT_NAMES } from '@/lib/weekdays';

type WeekdayNavProps = {
  currentWeekday: number;
  range: Range;
};

/** Atalhos para os sete dias da semana, de segunda a domingo, mantendo o período. */
export function WeekdayNav({ currentWeekday, range }: WeekdayNavProps): React.JSX.Element {
  return (
    <nav
      aria-label="Dias da semana"
      className="grid grid-cols-7 gap-1 sm:flex sm:flex-wrap sm:gap-1.5"
    >
      {WEEK_DISPLAY_ORDER.map((weekday) => (
        <Link
          key={weekday}
          href={weekdayHref(weekday, range)}
          aria-current={weekday === currentWeekday ? 'page' : undefined}
          className={cx(
            'rounded-full py-1.5 text-center text-sm font-medium transition-colors sm:px-3.5',
            weekday === currentWeekday
              ? PILL_ACTIVE
              : 'bg-card text-ink-2 shadow-[var(--shadow-card)] hover:text-ink',
          )}
        >
          {WEEKDAY_SHORT_NAMES[weekday]}
        </Link>
      ))}
    </nav>
  );
}
