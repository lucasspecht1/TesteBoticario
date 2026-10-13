import {
  computeAverageOrZero,
  computeKpiPercentage,
  computeRetentionPercentage,
  computeRoundedMedian,
  roundToOneDecimal,
} from './math';

describe('porcentagens', () => {
  it('KPI e retenção concordam nos casos comuns', () => {
    expect(computeKpiPercentage(1, 3)).toBe(33.3);
    expect(computeRetentionPercentage(1, 3)).toBe(33.3);
    expect(computeKpiPercentage(2, 3)).toBe(66.7);
    expect(computeRetentionPercentage(2, 3)).toBe(66.7);
  });

  it('divisor zero dá nulo nas duas', () => {
    expect(computeKpiPercentage(0, 0)).toBeNull();
    expect(computeRetentionPercentage(0, 0)).toBeNull();
  });

  it('fixa os meios pontos em que as duas fórmulas diferem (números já publicados)', () => {
    // 23/80 = 28,75: o KPI arredonda em duas etapas e fica em 28,7; a retenção em 28,8
    expect(computeKpiPercentage(23, 80)).toBe(28.7);
    expect(computeRetentionPercentage(23, 80)).toBe(28.8);
  });
});

describe('arredondamento e médias', () => {
  it('arredonda para 1 casa', () => {
    expect(roundToOneDecimal(12.34)).toBe(12.3);
    expect(roundToOneDecimal(12.36)).toBe(12.4);
  });

  it('mediana arredondada; nulo sem valores', () => {
    expect(computeRoundedMedian([])).toBeNull();
    expect(computeRoundedMedian([3, 1, 2])).toBe(2);
    expect(computeRoundedMedian([1, 2, 3, 4.5])).toBe(2.5);
    expect(computeRoundedMedian([1, 2])).toBe(1.5);
  });

  it('média ou zero quando não há divisor', () => {
    expect(computeAverageOrZero(10, 4)).toBe(2.5);
    expect(computeAverageOrZero(10, 0)).toBe(0);
  });
});
