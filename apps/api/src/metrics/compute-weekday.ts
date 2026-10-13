import type { WeekdayDetail } from '@wifi/shared';
import { computeAverageOrZero, roundToOneDecimal } from '../common/math';
import {
  HOURS_PER_DAY,
  computePeriodBounds,
  getLocalParts,
  listLocalDaysFrom,
  type LocalParts,
} from '../common/time';
import {
  buildKpi,
  countDwellBuckets,
  countVisitorsByDate,
  filterVisitsBetween,
  summarizeVisits,
  type VisitRow,
} from './compute-metrics';

/** Separa as visitas entre as que caíram no dia da semana pedido e as dos outros dias. */
function splitByWeekday(
  rows: VisitRow[],
  weekday: number,
  timeZone: string,
): { onWeekday: VisitRow[]; onOtherDays: VisitRow[] } {
  const onWeekday: VisitRow[] = [];
  const onOtherDays: VisitRow[] = [];
  for (const row of rows) {
    const target =
      getLocalParts(row.startedAt, timeZone).weekday === weekday
        ? onWeekday
        : onOtherDays;
    target.push(row);
  }
  return { onWeekday, onOtherDays };
}

/** Visitas por hora do dia (0 a 23). */
function countVisitsByHour(rows: VisitRow[], timeZone: string): number[] {
  const counts = new Array<number>(HOURS_PER_DAY).fill(0);
  for (const row of rows) counts[getLocalParts(row.startedAt, timeZone).hour]++;
  return counts;
}

/** Cada ocorrência do dia da semana com seus visitantes e visitas, da mais recente para a mais antiga. */
function buildOccurrenceDates(
  occurrences: LocalParts[],
  weekdayRows: VisitRow[],
  todayKey: string,
  timeZone: string,
): WeekdayDetail['dates'] {
  const countsByDate = countVisitorsByDate(weekdayRows, occurrences, timeZone);
  return [...countsByDate]
    .map(([date, counts]) => ({
      date,
      newVisitors: counts.newVisitors,
      returningVisitors: counts.returningVisitors,
      visits: counts.visits,
      today: date === todayKey,
    }))
    .reverse();
}

/** Média por dia, com 1 casa decimal; nulo quando não há dias. */
const computeAveragePerDay = (visits: number, days: number): number | null =>
  days ? roundToOneDecimal(visits / days) : null;

/** KPIs do dia da semana contra a média dos outros dias do mesmo período. */
function buildWeekdayKpis(
  weekdayRows: VisitRow[],
  otherRows: VisitRow[],
  dayCounts: { weekdayDays: number; otherDays: number },
  options: { timeZone: string; periodFrom: Date },
): WeekdayDetail['kpis'] {
  const { timeZone, periodFrom } = options;
  const weekdaySummary = summarizeVisits(weekdayRows, timeZone, periodFrom);
  const otherSummary = summarizeVisits(otherRows, timeZone, periodFrom);
  return {
    visitsPerDay: buildKpi(
      computeAveragePerDay(weekdayRows.length, dayCounts.weekdayDays),
      computeAveragePerDay(otherRows.length, dayCounts.otherDays),
      'relative',
    ),
    returningRate: buildKpi(
      weekdaySummary.returningRate,
      otherSummary.returningRate,
      'points',
    ),
    medianDwellMinutes: buildKpi(
      weekdaySummary.medianDwellMinutes,
      otherSummary.medianDwellMinutes,
      'relative',
    ),
    optInRate: buildKpi(
      weekdaySummary.optInRate,
      otherSummary.optInRate,
      'points',
    ),
  };
}

/**
 * Um dia da semana no período: cada ocorrência, a média por hora (mesma conta do mapa de calor)
 * e os KPIs desse dia contra os outros dias do mesmo período.
 */
export function computeWeekday(
  rows: VisitRow[],
  options: { now: Date; days: number; timeZone: string; weekday: number },
): WeekdayDetail {
  const { now, days, timeZone, weekday } = options;
  const { currentFrom } = computePeriodBounds(now, days, timeZone);
  const currentRows = filterVisitsBetween(rows, currentFrom, now);

  const occurrences = listLocalDaysFrom(currentFrom, days, timeZone).filter(
    (day) => day.weekday === weekday,
  );
  const { onWeekday, onOtherDays } = splitByWeekday(
    currentRows,
    weekday,
    timeZone,
  );
  const weekdayByHour = countVisitsByHour(onWeekday, timeZone);
  const allDaysByHour = countVisitsByHour(currentRows, timeZone);

  return {
    weekday,
    range: { from: currentFrom.toISOString(), to: now.toISOString(), days },
    dates: buildOccurrenceDates(
      occurrences,
      onWeekday,
      getLocalParts(now, timeZone).dateKey,
      timeZone,
    ),
    hourly: weekdayByHour.map((count, hour) => ({
      hour,
      avgVisits: computeAverageOrZero(count, occurrences.length),
      allDaysAvgVisits: computeAverageOrZero(allDaysByHour[hour], days),
    })),
    kpis: buildWeekdayKpis(
      onWeekday,
      onOtherDays,
      {
        weekdayDays: occurrences.length,
        otherDays: days - occurrences.length,
      },
      { timeZone, periodFrom: currentFrom },
    ),
    dwellBuckets: countDwellBuckets(onWeekday),
  };
}
