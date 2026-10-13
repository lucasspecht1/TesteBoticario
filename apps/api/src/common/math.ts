/** Arredonda para 1 casa decimal (ex.: 12,34 vira 12,3). */
export const roundToOneDecimal = (value: number): number =>
  Math.round(value * 10) / 10;

/** Mediana arredondada a 1 casa decimal; null quando não há valores. */
export function computeRoundedMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const middleValue =
    sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  return roundToOneDecimal(middleValue);
}

/** Média de `total` por `count`, com 1 casa decimal; 0 quando `count` é zero. */
export const computeAverageOrZero = (total: number, count: number): number =>
  count ? roundToOneDecimal(total / count) : 0;

/**
 * Porcentagem de `part` em `whole` para os KPIs do painel: arredonda em duas etapas (razão x 100,
 * depois 1 casa). Nulo quando `whole` é zero. Em meio ponto exato (ex.: 23/80) difere de
 * `computeRetentionPercentage` por erro de ponto flutuante; as duas ficam separadas para que os
 * números já publicados em cada tela não mudem.
 */
export function computeKpiPercentage(
  part: number,
  whole: number,
): number | null {
  return whole ? roundToOneDecimal((part / whole) * 100) : null;
}

/**
 * Porcentagem de `part` em `whole` para a retenção: multiplica por 1000 e arredonda uma vez.
 * Nulo quando `whole` é zero. Ver `computeKpiPercentage` para a diferença em meio ponto.
 */
export function computeRetentionPercentage(
  part: number,
  whole: number,
): number | null {
  return whole ? Math.round((part / whole) * 1000) / 10 : null;
}
