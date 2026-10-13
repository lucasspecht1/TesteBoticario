import type { Range } from '@wifi/shared';
import { WEEKDAY_SLUGS } from './weekdays';

/** Endereço da análise de um dia da semana (0 = domingo), com o período quando houver. */
export const weekdayHref = (weekday: number, range?: Range): string =>
  `/semana/${WEEKDAY_SLUGS[weekday]}${range ? `?range=${range}` : ''}`;

/** Endereço do perfil de um cliente. */
export const customerHref = (customerId: string): string => `/visitas/cliente/${customerId}`;
