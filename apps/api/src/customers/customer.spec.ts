import { DAY_MS } from '../common/time';
import { classifyCustomer, computeAverageDaysBetween } from './customer';

const now = new Date('2026-10-12T15:00:00-03:00');
const daysAgo = (days: number) => new Date(now.getTime() - days * DAY_MS);

describe('segmento do cliente', () => {
  it('novo, fiel, sumido e recorrente', () => {
    expect(classifyCustomer([daysAgo(2)], now)).toBe('novo');
    expect(
      classifyCustomer(
        [daysAgo(1), daysAgo(10), daysAgo(30), daysAgo(60)],
        now,
      ),
    ).toBe('fiel');
    expect(classifyCustomer([daysAgo(40), daysAgo(80)], now)).toBe('sumido');
    expect(classifyCustomer([daysAgo(3), daysAgo(20)], now)).toBe('recorrente');
    // 4 visitas, mas uma fora dos 90 dias: recorrente
    expect(
      classifyCustomer(
        [daysAgo(1), daysAgo(10), daysAgo(30), daysAgo(120)],
        now,
      ),
    ).toBe('recorrente');
  });
});

describe('intervalo médio entre visitas', () => {
  it('em dias, nulo com uma visita só', () => {
    expect(
      computeAverageDaysBetween([daysAgo(0), daysAgo(10), daysAgo(30)]),
    ).toBe(15);
    expect(computeAverageDaysBetween([daysAgo(5)])).toBeNull();
  });
});
