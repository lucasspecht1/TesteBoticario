/*
 * Constantes e contas básicas de tempo e visitantes, sem nenhum import: os módulos puros de lib/
 * (day, today, week) as usam e continuam rodando direto no Node pelas checagens `.check.mts`.
 */

export const MINUTES_PER_HOUR = 60;
export const MS_PER_SECOND = 1000;
export const MINUTE_MS = 60_000;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;

/** Primeira e última hora mostradas quando ainda não há movimento para indicar o horário da loja. */
export const DEFAULT_FIRST_HOUR = 8;
export const DEFAULT_LAST_HOUR = 22;

/** Instante (meio-dia UTC) de uma data "AAAA-MM-DD", para formatar sem deslocar o dia. */
export const noonUtcOfDateKey = (dateKey: string): Date => new Date(`${dateKey}T12:00:00Z`);

/** Dia da semana (0 = domingo) de uma data "AAAA-MM-DD". Lida ao meio-dia UTC, o dia não escorrega em nenhum fuso. */
export const weekdayOfDateKey = (dateKey: string): number => noonUtcOfDateKey(dateKey).getUTCDay();

/** Total de visitantes de um dia: novos mais recorrentes. */
export const sumVisitors = (entry: { newVisitors: number; returningVisitors: number }): number =>
  entry.newVisitors + entry.returningVisitors;

/** Item com a maior média de visitas; o primeiro vence o empate. Exige lista não vazia. */
export function findPeak<Item extends { avgVisits: number }>(items: Item[]): Item {
  return items.reduce((best, item) => (item.avgVisits > best.avgVisits ? item : best));
}
