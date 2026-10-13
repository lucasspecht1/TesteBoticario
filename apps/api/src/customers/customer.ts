import {
  LAPSED_DAYS,
  LOYAL_MIN_VISITS,
  LOYAL_WINDOW_DAYS,
  MIN_VISITS_TO_LAPSE,
  type CustomerSegment,
} from '@wifi/shared';
import { roundToOneDecimal } from '../common/math';
import { DAY_MS } from '../common/time';

/**
 * Segmento do cliente: novo (poucas visitas), sumido (última há mais de `LAPSED_DAYS`), fiel
 * (`LOYAL_MIN_VISITS`+ visitas em `LOYAL_WINDOW_DAYS`) ou recorrente. `visitDates` = início de
 * cada visita, em qualquer ordem.
 */
export function classifyCustomer(
  visitDates: Date[],
  now: Date,
): CustomerSegment {
  if (visitDates.length < MIN_VISITS_TO_LAPSE) return 'novo';
  const lastVisitMs = Math.max(...visitDates.map((date) => date.getTime()));
  if (now.getTime() - lastVisitMs > LAPSED_DAYS * DAY_MS) return 'sumido';
  const recentVisits = visitDates.filter(
    (date) => now.getTime() - date.getTime() <= LOYAL_WINDOW_DAYS * DAY_MS,
  );
  return recentVisits.length >= LOYAL_MIN_VISITS ? 'fiel' : 'recorrente';
}

/** Média de dias entre visitas consecutivas (1 casa decimal); nulo com uma visita só. */
export function computeAverageDaysBetween(visitDates: Date[]): number | null {
  if (visitDates.length < 2) return null;
  const sortedMs = visitDates
    .map((date) => date.getTime())
    .sort((a, b) => a - b);
  const spanMs = sortedMs[sortedMs.length - 1] - sortedMs[0];
  return roundToOneDecimal(spanMs / (sortedMs.length - 1) / DAY_MS);
}
