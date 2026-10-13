import type { Metrics } from '@wifi/shared';
import {
  DAYS_PER_WEEK,
  findPeak,
  MINUTES_PER_HOUR,
  noonUtcOfDateKey,
  sumVisitors,
  weekdayOfDateKey,
} from './units.ts';

/** Fuso da loja: o painel é de uma loja só, então "hoje" é sempre o dia dela. */
export const STORE_TIMEZONE = 'America/Sao_Paulo';

/**
 * Só compara quando o típico até agora chega a esse número de visitantes: logo depois de abrir, o
 * esperado é uma fração de visitante e qualquer diferença viraria centenas de por cento.
 */
const MIN_TYPICAL_VISITORS_TO_COMPARE = 5;

/** Data, dia da semana, hora e minuto locais da loja. */
function getStoreNow(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: STORE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  // formatToParts sempre devolve todas as partes pedidas acima
  const partValue = (type: string) => parts.find((part) => part.type === type)!.value;
  const date = `${partValue('year')}-${partValue('month')}-${partValue('day')}`;
  return {
    date,
    weekday: noonUtcOfDateKey(date).getUTCDay(),
    hour: Number(partValue('hour')),
    minute: Number(partValue('minute')),
  };
}

/** Parte das métricas que o resumo de hoje usa. */
type TodayInput = Pick<Metrics, 'daily' | 'heatmap'>;

/** Parte das métricas que a previsão de amanhã usa. */
export type TomorrowInput = Pick<Metrics, 'daily' | 'heatmap' | 'weekdayAvgVisits'>;

/** Resumo de hoje contra o dia típico, no horário atual da loja. */
export type TodaySummary = {
  /** Dia da semana de hoje (0 = domingo). */
  weekday: number;
  /** Visitantes de hoje até agora. */
  visitorsToday: number;
  /** Visitantes esperados até este horário num dia típico; null sem base. */
  typicalVisitorsSoFar: number | null;
  /** Variação % contra o típico até este horário; null sem base ou cedo demais para comparar. */
  vsTypicalPercent: number | null;
};

/**
 * Hoje até agora contra o típico do mesmo dia da semana *até o mesmo horário*.
 * Típico do dia = média dos visitantes desse dia da semana no período (sem hoje).
 * A parte do dia que costuma já ter passado sai do mapa de calor (visitas por hora).
 */
export function summarizeToday(metrics: TodayInput, now = new Date()): TodaySummary {
  const { date, weekday, hour, minute } = getStoreNow(now);
  const todayEntry = metrics.daily.find((entry) => entry.date === date);
  const sameWeekdayEntries = metrics.daily.filter(
    (entry) => entry.date !== date && weekdayOfDateKey(entry.date) === weekday,
  );
  const typicalDay = sameWeekdayEntries.length
    ? sameWeekdayEntries.reduce((sum, entry) => sum + sumVisitors(entry), 0) /
      sameWeekdayEntries.length
    : null;

  const visitsByHour = metrics.heatmap
    .filter((cell) => cell.weekday === weekday)
    .map((cell) => cell.avgVisits);
  const dayVisits = visitsByHour.reduce((sum, visits) => sum + visits, 0);
  const doneVisits =
    visitsByHour.slice(0, hour).reduce((sum, visits) => sum + visits, 0) +
    (visitsByHour[hour] ?? 0) * (minute / MINUTES_PER_HOUR);
  const typicalVisitorsSoFar =
    typicalDay !== null && dayVisits > 0 && doneVisits > 0
      ? typicalDay * (doneVisits / dayVisits)
      : null;
  const visitorsToday = todayEntry ? sumVisitors(todayEntry) : 0;

  return {
    weekday,
    visitorsToday,
    typicalVisitorsSoFar,
    vsTypicalPercent:
      typicalVisitorsSoFar !== null && typicalVisitorsSoFar >= MIN_TYPICAL_VISITORS_TO_COMPARE
        ? Math.round((visitorsToday / typicalVisitorsSoFar - 1) * 100)
        : null,
  };
}

/** Previsão de amanhã pela semana típica: o dia, as visitas esperadas e a hora de pico. */
type TomorrowForecast = { weekday: number; expectedVisits: number; peakHour: number };

/** Previsão de amanhã a partir da semana típica; null quando o dia costuma ficar sem movimento. */
export function forecastTomorrow(
  metrics: TomorrowInput,
  now = new Date(),
): TomorrowForecast | null {
  const weekday = (summarizeToday(metrics, now).weekday + 1) % DAYS_PER_WEEK;
  const expectedVisits = metrics.weekdayAvgVisits[weekday];
  if (expectedVisits <= 0) return null;
  const peak = findPeak(metrics.heatmap.filter((cell) => cell.weekday === weekday));
  return { weekday, expectedVisits, peakHour: peak.hour };
}
