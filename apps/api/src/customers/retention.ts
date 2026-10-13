import type { Retention, RetentionCohort } from '@wifi/shared';
import { computeRetentionPercentage } from '../common/math';
import { DAYS_PER_WEEK, DAY_MS, getLocalParts } from '../common/time';

/** Prazos, em dias, em que se mede se o cliente novo voltou. */
const RETENTION_WINDOWS_DAYS = [7, 30, 60] as const;
type WindowDays = (typeof RETENTION_WINDOWS_DAYS)[number];

/** Um número por prazo de retenção. */
type CountByWindow = Record<WindowDays, number>;

/** Clientes de uma turma e quantos voltaram dentro de cada prazo. */
type Cohort = { size: number; returnedByWindow: CountByWindow };

/** Aparelho com a primeira vez em que foi visto e as datas de todas as suas visitas. */
type RetentionDevice = { firstSeenAt: Date; visits: Date[] };

/** Cria um registro com o mesmo valor inicial para cada prazo de retenção. */
const createCountByWindow = (): CountByWindow =>
  Object.fromEntries(
    RETENTION_WINDOWS_DAYS.map((windowDays) => [windowDays, 0]),
  ) as CountByWindow;

/** Dias contados desde 1970 (número inteiro) a partir de um dia local AAAA-MM-DD. */
const toDayNumber = (dateKey: string): number =>
  Date.parse(`${dateKey}T00:00:00Z`) / DAY_MS;

/** Inverso de `toDayNumber`: devolve o dia local AAAA-MM-DD. */
const toDateKey = (dayNumber: number): string =>
  new Date(dayNumber * DAY_MS).toISOString().slice(0, 10);

/** Número do dia da segunda-feira da semana a que o dia pertence. */
const findMondayOf = (dayNumber: number): number =>
  dayNumber -
  ((new Date(dayNumber * DAY_MS).getUTCDay() + DAYS_PER_WEEK - 1) %
    DAYS_PER_WEEK);

const createEmptyCohort = (): Cohort => ({
  size: 0,
  returnedByWindow: createCountByWindow(),
});

/**
 * Registra o aparelho na sua turma e marca em quais prazos ele voltou (primeira visita num
 * dia local posterior ao do primeiro registro). Visitas futuras são ignoradas.
 */
function addDeviceToCohort(
  cohort: Cohort,
  device: RetentionDevice,
  firstDay: number,
  now: Date,
  toLocalDay: (date: Date) => number,
): void {
  cohort.size++;
  const laterDays = device.visits
    .filter((visitDate) => visitDate <= now)
    .map(toLocalDay)
    .filter((day) => day > firstDay);
  if (laterDays.length === 0) return;
  const daysUntilReturn = Math.min(...laterDays) - firstDay;
  for (const windowDays of RETENTION_WINDOWS_DAYS) {
    if (daysUntilReturn <= windowDays) cohort.returnedByWindow[windowDays]++;
  }
}

/**
 * O prazo só é medido quando todos da turma já tiveram tempo de voltar: o último chega no
 * domingo da semana (segunda + 6) e o prazo fecha `windowDays` depois disso.
 */
const isWindowComplete = (
  monday: number,
  windowDays: WindowDays,
  today: number,
): boolean => today >= monday + (DAYS_PER_WEEK - 1) + windowDays;

/** Taxa de retorno da turma no prazo, em %; nula se a turma está vazia ou o prazo ainda não fechou. */
function computeCohortRate(
  cohort: Cohort,
  monday: number,
  windowDays: WindowDays,
  today: number,
): number | null {
  if (!cohort.size || !isWindowComplete(monday, windowDays, today)) return null;
  return computeRetentionPercentage(
    cohort.returnedByWindow[windowDays],
    cohort.size,
  );
}

/** Média de cada prazo, somando só as turmas que já completaram o prazo. */
function computeAverageRates(
  cohorts: { monday: number; cohort: Cohort }[],
  today: number,
): Retention['avg'] {
  const returned = createCountByWindow();
  const size = createCountByWindow();
  for (const { monday, cohort } of cohorts) {
    for (const windowDays of RETENTION_WINDOWS_DAYS) {
      if (!cohort.size || !isWindowComplete(monday, windowDays, today))
        continue;
      returned[windowDays] += cohort.returnedByWindow[windowDays];
      size[windowDays] += cohort.size;
    }
  }
  return {
    d7: computeRetentionPercentage(returned[7], size[7]),
    d30: computeRetentionPercentage(returned[30], size[30]),
    d60: computeRetentionPercentage(returned[60], size[60]),
  };
}

/** Linha da tabela de retenção de uma turma. */
function buildCohortRow(
  monday: number,
  cohort: Cohort,
  today: number,
): RetentionCohort {
  return {
    weekStart: toDateKey(monday),
    newCustomers: cohort.size,
    d7: computeCohortRate(cohort, monday, 7, today),
    d30: computeCohortRate(cohort, monday, 30, today),
    d60: computeCohortRate(cohort, monday, 60, today),
  };
}

/**
 * Turmas semanais de clientes novos e quantos voltaram em outro dia dentro de 7, 30 e 60 dias.
 * Um prazo só é medido quando todos da turma já tiveram esse tempo para voltar.
 */
export function computeRetention(
  devices: RetentionDevice[],
  options: { now: Date; weeks: number; timeZone: string },
): Retention {
  const { now, weeks, timeZone } = options;
  const toLocalDay = (date: Date) =>
    toDayNumber(getLocalParts(date, timeZone).dateKey);
  const today = toLocalDay(now);
  const thisMonday = findMondayOf(today);
  const mondays = Array.from(
    { length: weeks },
    (_, weekIndex) => thisMonday - DAYS_PER_WEEK * weekIndex,
  );

  const cohortsByMonday = new Map(
    mondays.map((monday) => [monday, createEmptyCohort()]),
  );
  for (const device of devices) {
    const firstDay = toLocalDay(device.firstSeenAt);
    const cohort = cohortsByMonday.get(findMondayOf(firstDay));
    if (cohort) addDeviceToCohort(cohort, device, firstDay, now, toLocalDay);
  }

  const cohorts = mondays.map((monday) => ({
    monday,
    cohort: cohortsByMonday.get(monday)!, // todas as segundas foram inseridas acima
  }));
  return {
    cohorts: cohorts.map(({ monday, cohort }) =>
      buildCohortRow(monday, cohort, today),
    ),
    avg: computeAverageRates(cohorts, today),
  };
}
