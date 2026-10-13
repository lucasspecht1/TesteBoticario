import type { Range, WeekdayDetail } from '@wifi/shared';
import { DwellBars } from '@/components/charts/dwell-bars';
import { HourProfile } from '@/components/charts/hour-profile';
import { Card } from '@/components/ui/card';
import { readDay } from '@/lib/day';
import { capitalize } from '@/lib/format';
import { getRiseStyle } from '@/lib/rise';
import { describeWeekday } from '@/lib/weekdays';
import { DayHeader } from './day-header';
import { DayKpis } from './day-kpis';
import { OccurrencesCard } from './occurrences-card';
import { ScheduleReading } from './schedule-reading';
import { StaffingCard } from './staffing-card';

const HOUR_PROFILE_RISE_INDEX = 1;
const DWELL_RISE_INDEX = 5;

type DayAnalysisProps = {
  detail: WeekdayDetail;
  range: Range;
};

/** Análise de um dia da semana: horas, leitura para a escala, KPIs contra os outros dias e cada ocorrência. */
export function DayAnalysis({ detail, range }: DayAnalysisProps): React.JSX.Element {
  const labels = describeWeekday(detail.weekday);
  const reading = readDay(detail.hourly);
  const dayWithArticle = `${labels.indefiniteArticle} ${labels.name}`;

  return (
    <div className="space-y-8">
      <DayHeader detail={detail} range={range} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          className="rise lg:col-span-2"
          style={getRiseStyle(HOUR_PROFILE_RISE_INDEX)}
          title="Movimento por hora"
          subtitle={`Média de visitas em cada hora de ${dayWithArticle}, contra a média de todos os dias`}
        >
          <HourProfile
            hourly={detail.hourly}
            staffing={reading?.staffing ?? null}
            dayLabel={capitalize(labels.name)}
          />
        </Card>
        <ScheduleReading
          labels={labels}
          reading={reading}
          visitsDelta={detail.kpis.visitsPerDay.delta}
        />
      </div>

      <StaffingCard
        hourly={detail.hourly}
        medianDwellMinutes={detail.kpis.medianDwellMinutes.value}
        dayName={labels.name}
      />

      <DayKpis detail={detail} />

      <div className="grid gap-6 lg:grid-cols-3">
        <OccurrencesCard occurrences={detail.dates} labels={labels} />
        <Card
          className="rise"
          style={getRiseStyle(DWELL_RISE_INDEX)}
          title="Quanto tempo ficam"
          subtitle={`Visitas encerradas de ${labels.name}, por faixa`}
        >
          <DwellBars buckets={detail.dwellBuckets} />
        </Card>
      </div>
    </div>
  );
}
