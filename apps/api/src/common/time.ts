/** Milissegundos em um minuto. */
export const MINUTE_MS = 60_000;
/** Milissegundos em uma hora. */
export const HOUR_MS = 3_600_000;
/** Horas em um dia. */
export const HOURS_PER_DAY = 24;
/** Dias em uma semana. */
export const DAYS_PER_WEEK = 7;
/** Milissegundos em um dia de 24 h (dias locais são calculados pelo fuso, não por esta constante). */
export const DAY_MS = 86_400_000;

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const formattersByTimeZone = new Map<string, Intl.DateTimeFormat>();

/** Data e hora de um instante no fuso da loja. */
export type LocalParts = {
  /** Dia local no formato AAAA-MM-DD. */
  dateKey: string;
  /** 0 = domingo … 6 = sábado. */
  weekday: number;
  hour: number;
  minute: number;
  second: number;
};

/** Formatadores `Intl` são caros de criar, então ficam em cache por fuso. */
function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formattersByTimeZone.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    });
    formattersByTimeZone.set(timeZone, formatter);
  }
  return formatter;
}

/** Decompõe um instante em data/hora no fuso da loja (dia local, dia da semana, hora). */
export function getLocalParts(date: Date, timeZone: string): LocalParts {
  const partsByType = Object.fromEntries(
    getFormatter(timeZone)
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    dateKey: `${partsByType.year}-${partsByType.month}-${partsByType.day}`,
    weekday: WEEKDAYS_EN.indexOf(partsByType.weekday),
    hour: Number(partsByType.hour),
    minute: Number(partsByType.minute),
    second: Number(partsByType.second),
  };
}

/** Instante (UTC) em que começa o dia local de `date` no fuso da loja. */
// trade-off: usa o deslocamento do fuso no instante `date`; erra se houver horário de verão entre a meia-noite e `date` (Brasil não tem desde 2019)
export function startOfLocalDay(date: Date, timeZone: string): Date {
  const parts = getLocalParts(date, timeZone);
  const [year, month, day] = parts.dateKey.split('-').map(Number);
  const wholeSecondsMs = Math.floor(date.getTime() / 1000) * 1000;
  const offsetMs =
    Date.UTC(year, month - 1, day, parts.hour, parts.minute, parts.second) -
    wholeSecondsMs;
  return new Date(Date.UTC(year, month - 1, day) - offsetMs);
}

/**
 * Os `days` dias locais consecutivos a partir de `firstDayStart`, em ordem cronológica.
 * Amostra o meio-dia de cada dia para fugir das bordas de fuso.
 */
export function listLocalDaysFrom(
  firstDayStart: Date,
  days: number,
  timeZone: string,
): LocalParts[] {
  return Array.from({ length: days }, (_, index) =>
    getLocalParts(
      new Date(firstDayStart.getTime() + index * DAY_MS + DAY_MS / 2),
      timeZone,
    ),
  );
}

/**
 * Limites dos períodos do painel: o atual vai dos `days` dias locais completos até agora; o
 * anterior tem o mesmo tamanho e termina no mesmo ponto do dia, `days` dias antes.
 */
export function computePeriodBounds(
  now: Date,
  days: number,
  timeZone: string,
): { currentFrom: Date; previousFrom: Date; previousTo: Date } {
  const currentFrom = startOfLocalDay(
    new Date(now.getTime() - (days - 1) * DAY_MS),
    timeZone,
  );
  return {
    currentFrom,
    previousFrom: new Date(currentFrom.getTime() - days * DAY_MS),
    previousTo: new Date(now.getTime() - days * DAY_MS),
  };
}

/** Dias inteiros entre `date` e `now`. */
export const countDaysSince = (date: Date, now: Date): number =>
  Math.floor((now.getTime() - date.getTime()) / DAY_MS);
