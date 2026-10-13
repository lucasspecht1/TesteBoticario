import { DEFAULT_RANGE, rangeSchema, type Range } from '@wifi/shared';

/** Nome de cada período para frases ("nos últimos 30 dias"). */
export const RANGE_LABEL: Record<Range, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
};

/** Lê o `?range=` da URL; valor ausente ou inválido cai no período padrão. */
export const parseRange = (raw: string | undefined): Range =>
  rangeSchema.catch(DEFAULT_RANGE).parse(raw);
