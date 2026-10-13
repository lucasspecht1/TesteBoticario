import type { DwellBucket, Kpi, MetricsCore } from '@wifi/shared';
import {
  computeAverageOrZero,
  computeKpiPercentage,
  computeRoundedMedian,
  roundToOneDecimal,
} from '../common/math';
import {
  DAYS_PER_WEEK,
  HOURS_PER_DAY,
  computePeriodBounds,
  getLocalParts,
  listLocalDaysFrom,
  type LocalParts,
} from '../common/time';
import { computeDwellMinutes, type VisitSpan } from '../common/visit-span';

/** Uma visita com os dados do aparelho e do lead necessários para as métricas. */
export type VisitRow = VisitSpan & {
  deviceId: string;
  deviceFirstSeenAt: Date;
  hasOptedIn: boolean;
};

/** Faixas de permanência; `max` (minutos) é exclusivo e a última faixa é aberta. */
const DWELL_BUCKETS = [
  { label: 'Até 5 min', max: 5 },
  { label: '5 a 15 min', max: 15 },
  { label: '15 a 30 min', max: 30 },
  { label: '30 min ou mais', max: Infinity },
];

/** Resumo de um conjunto de visitas, base dos KPIs. Taxas em %, permanência em minutos. */
type VisitSummary = {
  uniqueVisitors: number;
  visits: number;
  returningRate: number | null;
  medianDwellMinutes: number | null;
  optInRate: number | null;
  newReturnRate: number | null;
};

/** Visitantes novos e de retorno de um dia e o total de visitas dele. */
type DayVisitorCounts = {
  newVisitors: number;
  returningVisitors: number;
  visits: number;
};

/** A visita é de retorno quando o aparelho foi visto pela 1ª vez em um dia local anterior ao dela. */
const isReturningVisit = (row: VisitRow, timeZone: string): boolean =>
  getLocalParts(row.deviceFirstSeenAt, timeZone).dateKey <
  getLocalParts(row.startedAt, timeZone).dateKey;

/** Posição da faixa de permanência (`DWELL_BUCKETS`) a que a duração pertence. */
const findDwellBucketIndex = (minutes: number): number =>
  DWELL_BUCKETS.findIndex((bucket) => minutes < bucket.max);

/** Conta as visitas com saída registrada por faixa de permanência (mesma ordem de `DWELL_BUCKETS`). */
export function countDwellBuckets(rows: VisitRow[]): DwellBucket[] {
  const counts = DWELL_BUCKETS.map(() => 0);
  for (const row of rows) {
    const minutes = computeDwellMinutes(row);
    if (minutes !== null) counts[findDwellBucketIndex(minutes)]++;
  }
  return DWELL_BUCKETS.map((bucket, index) => ({
    label: bucket.label,
    count: counts[index],
  }));
}

/**
 * Resume as visitas de um período. `from` marca o início da janela: cliente novo é quem foi
 * visto pela 1ª vez dentro dela, e "voltou" é ter outra visita num dia local seguinte.
 */
export function summarizeVisits(
  rows: VisitRow[],
  timeZone: string,
  from: Date,
): VisitSummary {
  const devices = new Set<string>();
  const returningDevices = new Set<string>();
  const newDevices = new Set<string>();
  const newReturnedDevices = new Set<string>();
  const optInDevices = new Set<string>();
  const dwellMinutesList: number[] = [];

  for (const row of rows) {
    devices.add(row.deviceId);
    const isReturning = isReturningVisit(row, timeZone);
    if (isReturning) returningDevices.add(row.deviceId);
    if (row.deviceFirstSeenAt >= from) {
      newDevices.add(row.deviceId);
      if (isReturning) newReturnedDevices.add(row.deviceId);
    }
    if (row.hasOptedIn) optInDevices.add(row.deviceId);
    const minutes = computeDwellMinutes(row);
    if (minutes !== null) dwellMinutesList.push(minutes);
  }

  return {
    uniqueVisitors: devices.size,
    visits: rows.length,
    returningRate: computeKpiPercentage(returningDevices.size, devices.size),
    medianDwellMinutes: computeRoundedMedian(dwellMinutesList),
    optInRate: computeKpiPercentage(optInDevices.size, devices.size),
    newReturnRate: computeKpiPercentage(
      newReturnedDevices.size,
      newDevices.size,
    ),
  };
}

/**
 * KPI com variação contra o período anterior. `relative` = % sobre o anterior (nulo se o
 * anterior é 0); `points` = diferença em pontos percentuais.
 */
export function buildKpi(
  value: number | null,
  previous: number | null,
  kind: 'relative' | 'points',
): Kpi {
  if (value === null || previous === null)
    return { value, previous, delta: null };
  if (kind === 'points')
    return { value, previous, delta: roundToOneDecimal(value - previous) };
  return {
    value,
    previous,
    delta:
      previous === 0
        ? null
        : roundToOneDecimal(((value - previous) / previous) * 100),
  };
}

/** Quantas vezes cada dia da semana (0 = domingo) aparece nos dias do período. */
function countWeekdayOccurrences(days: LocalParts[]): number[] {
  const counts = new Array<number>(DAYS_PER_WEEK).fill(0);
  for (const day of days) counts[day.weekday]++;
  return counts;
}

/** Visitas que começaram dentro de [from, to]. */
export const filterVisitsBetween = (
  rows: VisitRow[],
  from: Date,
  to: Date,
): VisitRow[] =>
  rows.filter((row) => row.startedAt >= from && row.startedAt <= to);

/**
 * Visitantes novos, de retorno e total de visitas por dia local. Só entram os dias de `days`
 * (na ordem recebida); visitas de outros dias são ignoradas.
 */
export function countVisitorsByDate(
  rows: VisitRow[],
  days: LocalParts[],
  timeZone: string,
): Map<string, DayVisitorCounts> {
  const devicesByDate = new Map(
    days.map((day) => [
      day.dateKey,
      {
        newDevices: new Set<string>(),
        returningDevices: new Set<string>(),
        visits: 0,
      },
    ]),
  );
  for (const row of rows) {
    const day = devicesByDate.get(
      getLocalParts(row.startedAt, timeZone).dateKey,
    );
    if (!day) continue;
    const devices = isReturningVisit(row, timeZone)
      ? day.returningDevices
      : day.newDevices;
    devices.add(row.deviceId);
    day.visits++;
  }
  return new Map(
    [...devicesByDate].map(([date, day]) => [
      date,
      {
        newVisitors: day.newDevices.size,
        returningVisitors: day.returningDevices.size,
        visits: day.visits,
      },
    ]),
  );
}

/** Visitas por posição semana x hora (`weekday * HOURS_PER_DAY + hour`) no período. */
function countVisitsByWeekHour(rows: VisitRow[], timeZone: string): number[] {
  const slots = new Array<number>(DAYS_PER_WEEK * HOURS_PER_DAY).fill(0);
  for (const row of rows) {
    const { weekday, hour } = getLocalParts(row.startedAt, timeZone);
    slots[weekday * HOURS_PER_DAY + hour]++;
  }
  return slots;
}

/** Média de visitas por hora da semana: visitas na posição divididas pelas ocorrências do dia. */
function buildHeatmap(
  slots: number[],
  weekdayOccurrences: number[],
): MetricsCore['heatmap'] {
  return slots.map((count, slotIndex) => {
    const weekday = Math.floor(slotIndex / HOURS_PER_DAY);
    return {
      weekday,
      hour: slotIndex % HOURS_PER_DAY,
      avgVisits: computeAverageOrZero(count, weekdayOccurrences[weekday]),
    };
  });
}

/** Média de visitas por dia para cada dia da semana (0 = domingo). */
function buildWeekdayAverages(
  slots: number[],
  weekdayOccurrences: number[],
): number[] {
  return weekdayOccurrences.map((occurrences, weekday) => {
    const weekdayVisits = slots
      .slice(weekday * HOURS_PER_DAY, (weekday + 1) * HOURS_PER_DAY)
      .reduce((sum, count) => sum + count, 0);
    return computeAverageOrZero(weekdayVisits, occurrences);
  });
}

/** KPIs do período atual contra o anterior. */
function buildKpis(
  current: VisitSummary,
  previous: VisitSummary,
): MetricsCore['kpis'] {
  return {
    uniqueVisitors: buildKpi(
      current.uniqueVisitors,
      previous.uniqueVisitors,
      'relative',
    ),
    visits: buildKpi(current.visits, previous.visits, 'relative'),
    returningRate: buildKpi(
      current.returningRate,
      previous.returningRate,
      'points',
    ),
    medianDwellMinutes: buildKpi(
      current.medianDwellMinutes,
      previous.medianDwellMinutes,
      'relative',
    ),
    optInRate: buildKpi(current.optInRate, previous.optInRate, 'points'),
    newReturnRate: buildKpi(
      current.newReturnRate,
      previous.newReturnRate,
      'points',
    ),
  };
}

/**
 * Métricas do painel para os últimos `days` dias locais contra os `days` anteriores.
 * `rows` deve cobrir os dois períodos.
 */
// trade-off: agrega em memória (ok até centenas de milhares de visitas por período); depois disso, GROUP BY no Postgres ou tabela diária pré-calculada
export function computeMetrics(
  rows: VisitRow[],
  options: { now: Date; days: number; timeZone: string },
): MetricsCore {
  const { now, days, timeZone } = options;
  const { currentFrom, previousFrom, previousTo } = computePeriodBounds(
    now,
    days,
    timeZone,
  );
  const currentRows = filterVisitsBetween(rows, currentFrom, now);
  const previousRows = filterVisitsBetween(rows, previousFrom, previousTo);

  const periodDays = listLocalDaysFrom(currentFrom, days, timeZone);
  const weekdayOccurrences = countWeekdayOccurrences(periodDays);
  const slots = countVisitsByWeekHour(currentRows, timeZone);

  return {
    range: { from: currentFrom.toISOString(), to: now.toISOString(), days },
    kpis: buildKpis(
      summarizeVisits(currentRows, timeZone, currentFrom),
      summarizeVisits(previousRows, timeZone, previousFrom),
    ),
    daily: [...countVisitorsByDate(currentRows, periodDays, timeZone)].map(
      ([date, counts]) => ({
        date,
        newVisitors: counts.newVisitors,
        returningVisitors: counts.returningVisitors,
      }),
    ),
    heatmap: buildHeatmap(slots, weekdayOccurrences),
    weekdayAvgVisits: buildWeekdayAverages(slots, weekdayOccurrences),
    dwellBuckets: countDwellBuckets(currentRows),
  };
}
