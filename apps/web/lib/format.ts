import { STORE_TIMEZONE } from './today.ts';
import { MINUTE_MS, MINUTES_PER_HOUR, noonUtcOfDateKey } from './units.ts';

/** Como mostrar um número: inteiro ou com até uma casa decimal. */
export type NumberStyle = 'integer' | 'decimal';

/** Texto mostrado quando não há valor. */
export const EMPTY_VALUE = '—';

/** Aviso de visita que ainda não tem a hora de saída. */
export const NO_EXIT_RECORDED = 'sem saída registrada';

const INTEGER_FORMAT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const DECIMAL_FORMAT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

const TIME_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: STORE_TIMEZONE,
});
const DAY_MONTH_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: STORE_TIMEZONE,
});
const LONG_DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: STORE_TIMEZONE,
});
// Datas "AAAA-MM-DD" não têm fuso: lidas ao meio-dia UTC (noonUtcOfDateKey) e formatadas em UTC.
const DATE_KEY_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

/** Inteiro em pt-BR ("1.234"); "—" quando não há valor. */
export const formatInteger = (value: number | null): string =>
  value === null ? EMPTY_VALUE : INTEGER_FORMAT.format(value);

/** Número com até uma casa decimal ("12,5"); "—" quando não há valor. */
export const formatDecimal = (value: number | null): string =>
  value === null ? EMPTY_VALUE : DECIMAL_FORMAT.format(value);

/** Número no estilo pedido (inteiro ou decimal), para componentes que recebem o estilo por prop. */
export const FORMATTERS: Record<NumberStyle, (value: number) => string> = {
  integer: formatInteger,
  decimal: formatDecimal,
};

/** Número decimal seguido da unidade, que traz o próprio espaço ("12,5 min", "40%"); "—" sem valor. */
export const formatWithUnit = (value: number | null, unit: string): string =>
  value === null ? EMPTY_VALUE : `${DECIMAL_FORMAT.format(value)}${unit}`;

/** Singular quando a quantidade é 1; plural nas demais. */
export const pluralize = (count: number, singular: string, plural: string): string =>
  count === 1 ? singular : plural;

/** Hora e minuto no fuso da loja ("14:05"), a partir de um instante ISO. */
export const formatTime = (iso: string): string => TIME_FORMAT.format(new Date(iso));

/** Hora e minuto de agora no fuso da loja ("14:05"). */
export const formatCurrentTime = (): string => TIME_FORMAT.format(new Date());

/** Dia e mês no fuso da loja ("12/10"), a partir de um instante ISO. */
export const formatDayMonth = (iso: string): string => DAY_MONTH_FORMAT.format(new Date(iso));

/** Data longa no fuso da loja, sem pontos ("12 out 2026"), a partir de um instante ISO. */
export const formatLongDate = (iso: string): string =>
  LONG_DATE_FORMAT.format(new Date(iso)).replace(/\./g, '');

/** Dia e mês de uma data "AAAA-MM-DD" ("12/10"). */
export const formatDateKey = (dateKey: string): string =>
  DATE_KEY_FORMAT.format(noonUtcOfDateKey(dateKey));

/** Faixa de horas "14h às 18h". */
export const formatHourRange = (from: number, to: number): string => `${from}h às ${to}h`;

/** Duração legível em minutos inteiros: "23 min", "1 h 05 min". */
export function formatDuration(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min`;
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  return `${hours} h ${String(minutes % MINUTES_PER_HOUR).padStart(2, '0')} min`;
}

/** Duração da visita ou "—" quando ainda não há saída. */
export const formatOptionalDuration = (minutes: number | null): string =>
  minutes === null ? EMPTY_VALUE : formatDuration(minutes);

type VisitTimes = { startedAt: string; endedAt: string | null; inStore: boolean };

/** Horário da visita: a entrada e, se já saiu, "às" a saída ("14:05 às 14:40"). */
export const formatVisitSchedule = (visit: VisitTimes): string =>
  visit.endedAt && !visit.inStore
    ? `${formatTime(visit.startedAt)} às ${formatTime(visit.endedAt)}`
    : formatTime(visit.startedAt);

/** Minutos desde o início, para quem ainda está na loja. */
export const countMinutesSince = (iso: string, now = Date.now()): number =>
  Math.max(0, Math.round((now - Date.parse(iso)) / MINUTE_MS));

/** Primeira letra em maiúscula. */
export const capitalize = (text: string): string => text[0].toUpperCase() + text.slice(1);

/** Apelido do cliente como aparece na tela ("Cliente 7B3D4F"). */
export const formatCustomerAlias = (alias: string): string => `Cliente ${alias}`;

/** Nome mostrado do cliente: o primeiro nome (só de quem aceitou contato) ou o apelido. */
export const formatCustomerName = (customer: { firstName: string | null; alias: string }): string =>
  customer.firstName ?? formatCustomerAlias(customer.alias);
