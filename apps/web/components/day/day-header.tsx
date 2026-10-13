import type { Range, WeekdayDetail } from '@wifi/shared';
import { BackLink } from '@/components/ui/back-link';
import { RangeTabs } from '@/components/ui/range-tabs';
import { pluralize } from '@/lib/format';
import { RANGE_LABEL } from '@/lib/ranges';
import { weekdayHref } from '@/lib/routes';
import { describeWeekday } from '@/lib/weekdays';
import { WeekdayNav } from './weekday-nav';

/** Frase de apoio: quantas ocorrências do dia entram na análise e se a de hoje ainda está aberta. */
function describeScope(detail: WeekdayDetail, range: Range): string {
  const { name, article } = describeWeekday(detail.weekday);
  const count = detail.dates.length;
  const hasToday = detail.dates.some((entry) => entry.today);
  const occurrences = `${count} ${pluralize(count, name, `${name}s`)}`;
  const todayNote = hasToday ? `, ${article} de hoje ainda em andamento` : '';
  const period = `nos últimos ${RANGE_LABEL[range]}`;
  return `${occurrences} ${period}${todayNote}. Comparado com os outros dias do mesmo período.`;
}

type DayHeaderProps = {
  detail: WeekdayDetail;
  range: Range;
};

/** Topo da análise do dia: voltar, título, escopo, seletor de período e atalhos entre os dias. */
export function DayHeader({ detail, range }: DayHeaderProps): React.JSX.Element {
  const { plural } = describeWeekday(detail.weekday);
  return (
    <header className="rise space-y-6">
      <BackLink href={`/?range=${range}`}>Voltar para a semana</BackLink>
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="font-display text-4xl leading-tight text-balance text-ink sm:text-6xl">
            {plural}
          </h1>
          <p className="mt-2 text-sm text-ink-3">{describeScope(detail, range)}</p>
        </div>
        <RangeTabs current={range} basePath={weekdayHref(detail.weekday)} />
      </div>
      <WeekdayNav currentWeekday={detail.weekday} range={range} />
    </header>
  );
}
