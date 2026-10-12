export const DAY_MS = 86_400_000;

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
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
    formatters.set(timeZone, f);
  }
  return f;
}

/** Data/hora no fuso da loja. dateKey = AAAA-MM-DD; weekday 0 = domingo. */
export function localParts(date: Date, timeZone: string) {
  const p = Object.fromEntries(formatter(timeZone).formatToParts(date).map((x) => [x.type, x.value]));
  return {
    dateKey: `${p.year}-${p.month}-${p.day}`,
    weekday: WEEKDAYS_EN.indexOf(p.weekday),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

// trade-off: usa o deslocamento do fuso no instante `date`; erra se houver horário de verão entre a meia-noite e `date` (Brasil não tem desde 2019)
export function startOfLocalDay(date: Date, timeZone: string): Date {
  const p = localParts(date, timeZone);
  const [y, m, d] = p.dateKey.split('-').map(Number);
  const wholeSeconds = Math.floor(date.getTime() / 1000) * 1000;
  const offset = Date.UTC(y, m - 1, d, p.hour, p.minute, p.second) - wholeSeconds;
  return new Date(Date.UTC(y, m - 1, d) - offset);
}
