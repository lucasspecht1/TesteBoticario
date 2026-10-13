import type { Metrics } from '@wifi/shared';
import { DEFAULT_FIRST_HOUR, DEFAULT_LAST_HOUR } from './units.ts';

/** Ordem de exibição da semana: segunda a domingo (0 = domingo). */
export const WEEK_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Média de um dia da semana típico: total, visitas por hora e a hora de pico. */
export type WeekdayStats = {
  weekday: number;
  total: number;
  hours: number[];
  peakFrom: number;
  peakTo: number;
};

/** Semana típica pronta para desenhar. */
type WeekStats = {
  days: WeekdayStats[];
  /** Primeira e última hora com movimento em qualquer dia. */
  firstActiveHour: number;
  lastActiveHour: number;
  busiestWeekday: number;
  weakestWeekday: number;
};

/** Destaque de um dia na semana: o mais cheio, o mais fraco ou um dia comum. */
export type DayEmphasis = 'busiest' | 'weakest' | 'regular';

/** Parte das métricas que a semana típica usa. */
export type WeekInput = Pick<Metrics, 'heatmap' | 'weekdayAvgVisits'>;

/** Semana típica a partir do mapa de calor (média de visitas por dia da semana e hora), de segunda a domingo. */
export function summarizeWeek(metrics: WeekInput): WeekStats {
  const days = WEEK_DISPLAY_ORDER.map((weekday) => {
    const hours = metrics.heatmap
      .filter((cell) => cell.weekday === weekday)
      .map((cell) => cell.avgVisits);
    // mesma definição do insight de pico: a hora de maior média
    const peak = hours.indexOf(Math.max(...hours));
    return {
      weekday,
      total: metrics.weekdayAvgVisits[weekday],
      hours,
      peakFrom: peak,
      peakTo: peak + 1,
    };
  });
  const activeHours = metrics.heatmap.filter((cell) => cell.avgVisits > 0).map((cell) => cell.hour);
  const ranked = [...days].sort((first, second) => second.total - first.total);
  return {
    days,
    firstActiveHour: activeHours.length ? Math.min(...activeHours) : DEFAULT_FIRST_HOUR,
    lastActiveHour: activeHours.length ? Math.max(...activeHours) : DEFAULT_LAST_HOUR,
    busiestWeekday: ranked[0].weekday,
    weakestWeekday: ranked[ranked.length - 1].weekday,
  };
}

/** Horas mostradas nas colunas da semana, da primeira à última com movimento. */
export const listVisibleHours = (week: WeekStats): number[] =>
  Array.from(
    { length: week.lastActiveHour - week.firstActiveHour + 1 },
    (_, offset) => week.firstActiveHour + offset,
  );

/** Maior média de visitas de qualquer hora visível da semana: é a altura de 100% das barras. */
export const findWeekMaxVisits = (week: WeekStats, hours: number[]): number =>
  Math.max(...week.days.flatMap((day) => hours.map((hour) => day.hours[hour])), 1);

/** Destaque do dia da semana: o dia mais cheio vence se (hipoteticamente) também for o mais fraco. */
export function getDayEmphasis(week: WeekStats, weekday: number): DayEmphasis {
  if (weekday === week.busiestWeekday) return 'busiest';
  return weekday === week.weakestWeekday ? 'weakest' : 'regular';
}
