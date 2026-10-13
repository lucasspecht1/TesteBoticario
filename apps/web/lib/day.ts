import type { WeekdayDetail } from '@wifi/shared';
import {
  DEFAULT_FIRST_HOUR,
  DEFAULT_LAST_HOUR,
  findPeak,
  HOURS_PER_DAY,
  MINUTES_PER_HOUR,
  sumVisitors,
} from './units.ts';

type Hourly = WeekdayDetail['hourly'];
type Occurrence = WeekdayDetail['dates'][number];

const LAST_HOUR_OF_DAY = HOURS_PER_DAY - 1;
/** Largura, em horas, da janela mais vazia do dia. */
const IDLE_WINDOW_HOURS = 2;
/** Horas de folga mostradas antes e depois do primeiro e do último horário com movimento. */
const VISIBLE_HOUR_PADDING = 1;

/** Fração do pico que define a faixa de reforço de equipe. */
const STAFFING_SHARE = 0.6;
/** Atendimento consultivo: 1 pessoa para cada 2 clientes na loja ao mesmo tempo. */
export const CLIENTS_PER_ATTENDANT = 2;

/** Leitura de um dia da semana para a escala de equipe. */
export type DayReading = {
  /** Hora de maior movimento e a média de visitas nela. */
  peak: { hour: number; averageVisits: number };
  /** Faixa de reforço (`to` exclusivo) e a fatia das visitas do dia que ela concentra, em %. */
  staffing: { from: number; to: number; share: number };
  /** Janela mais vazia (`to` exclusivo); null quando não há uma fora da faixa de reforço. */
  idle: { from: number; to: number; averageVisits: number } | null;
};

/**
 * Leitura de um dia da semana para a escala: pico, faixa contínua em volta do pico
 * com movimento de pelo menos 60% dele (reforço) e a janela de 2 h mais vazia.
 *
 * trade-off: a janela vazia tem largura fixa de 2 h; a API (apps/api/src/metrics/insights.ts)
 * calcula a mesma ideia para o texto dos insights, então ajuste os dois lados juntos.
 */
export function readDay(hourly: Hourly): DayReading | null {
  const total = hourly.reduce((sum, entry) => sum + entry.avgVisits, 0);
  if (total === 0) return null;
  const peak = findPeak(hourly);
  const floor = peak.avgVisits * STAFFING_SHARE;
  let from = peak.hour;
  let to = peak.hour;
  while (from > 0 && hourly[from - 1].avgVisits >= floor) from--;
  while (to < LAST_HOUR_OF_DAY && hourly[to + 1].avgVisits >= floor) to++;
  const inWindow = hourly.slice(from, to + 1).reduce((sum, entry) => sum + entry.avgVisits, 0);

  let idle = null as { from: number; averageVisits: number } | null;
  for (let hour = 0; hour < LAST_HOUR_OF_DAY; hour++) {
    const [first, second] = [hourly[hour].avgVisits, hourly[hour + 1].avgVisits];
    const average = (first + second) / 2;
    if (first > 0 && second > 0 && (!idle || average < idle.averageVisits))
      idle = { from: hour, averageVisits: average };
  }
  // a janela vazia não pode cair dentro da faixa de reforço
  if (idle && idle.from + 1 >= from && idle.from <= to) idle = null;

  return {
    peak: { hour: peak.hour, averageVisits: peak.avgVisits },
    staffing: { from, to: to + 1, share: Math.round((inWindow / total) * 100) },
    idle: idle
      ? { from: idle.from, to: idle.from + IDLE_WINDOW_HOURS, averageVisits: idle.averageVisits }
      : null,
  };
}

/** Faixa de horas seguidas (`to` exclusivo) com a mesma necessidade de pessoas. */
export type StaffingBlock = { from: number; to: number; people: number; peakClients: number };

/**
 * Escala sugerida pela lei de Little: clientes ao mesmo tempo ≈ chegadas por hora × permanência (h).
 * Junta horas seguidas com a mesma necessidade; mínimo de 1 pessoa nas horas com movimento.
 */
export function planStaffing(hourly: Hourly, medianDwellMinutes: number | null): StaffingBlock[] {
  if (!medianDwellMinutes) return [];
  const blocks: StaffingBlock[] = [];
  for (const entry of hourly) {
    if (entry.avgVisits <= 0) continue;
    // arredonda antes de dividir, para a conta bater com o número mostrado ("até 2 clientes" → 1 pessoa)
    const clients = Math.round(entry.avgVisits * (medianDwellMinutes / MINUTES_PER_HOUR) * 10) / 10;
    const people = Math.max(1, Math.ceil(clients / CLIENTS_PER_ATTENDANT));
    const last = blocks[blocks.length - 1];
    if (last && last.to === entry.hour && last.people === people) {
      last.to = entry.hour + 1;
      last.peakClients = Math.max(last.peakClients, clients);
    } else blocks.push({ from: entry.hour, to: entry.hour + 1, people, peakClients: clients });
  }
  return blocks;
}

/** Janela de horas mostrada no gráfico do dia: do primeiro ao último horário com movimento, com folga. */
export function computeVisibleHourWindow(hourly: Hourly): { firstHour: number; lastHour: number } {
  const activeHours = hourly
    .filter((entry) => entry.avgVisits > 0 || entry.allDaysAvgVisits > 0)
    .map((entry) => entry.hour);
  if (activeHours.length === 0)
    return { firstHour: DEFAULT_FIRST_HOUR, lastHour: DEFAULT_LAST_HOUR };
  return {
    firstHour: Math.max(Math.min(...activeHours) - VISIBLE_HOUR_PADDING, 0),
    lastHour: Math.min(Math.max(...activeHours) + VISIBLE_HOUR_PADDING, LAST_HOUR_OF_DAY),
  };
}

/** Melhor e pior ocorrência do dia e o maior total, para dimensionar as barras. */
type OccurrenceRanking = {
  best: Occurrence | null;
  worst: Occurrence | null;
  maxVisitors: number;
};

/**
 * Compara as ocorrências já encerradas do dia (hoje fica de fora: ainda não terminou); com menos
 * de duas não há o que comparar e `best` e `worst` ficam nulos.
 */
export function rankOccurrences(occurrences: Occurrence[]): OccurrenceRanking {
  const completed = occurrences.filter((occurrence) => !occurrence.today);
  const canCompare = completed.length > 1;
  return {
    best: canCompare
      ? completed.reduce((top, item) => (sumVisitors(item) > sumVisitors(top) ? item : top))
      : null,
    worst: canCompare
      ? completed.reduce((low, item) => (sumVisitors(item) < sumVisitors(low) ? item : low))
      : null,
    maxVisitors: Math.max(...occurrences.map(sumVisitors), 1),
  };
}
