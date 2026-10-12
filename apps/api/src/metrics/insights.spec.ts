import type { Kpi, MetricsCore } from '@wifi/shared';
import { buildInsights } from './insights';

const kpi = (value: number | null, delta: number | null = null): Kpi => ({
  value,
  previous: null,
  delta,
});

function core(
  over: Partial<MetricsCore['kpis']> = {},
  peak = { weekday: 6, hour: 15, avg: 9 },
): MetricsCore {
  const heatmap = Array.from({ length: 168 }, (_, i) => {
    const weekday = Math.floor(i / 24),
      hour = i % 24;
    const open = hour >= 10 && hour < 22;
    let avgVisits = open ? (weekday === 2 ? 1 : 3) : 0;
    if (weekday === peak.weekday && hour === peak.hour) avgVisits = peak.avg;
    return { weekday, hour, avgVisits };
  });
  return {
    range: { from: '', to: '', days: 30 },
    kpis: {
      uniqueVisitors: kpi(100, 0),
      visits: kpi(120),
      returningRate: kpi(40),
      medianDwellMinutes: kpi(12),
      optInRate: kpi(50),
      ...over,
    },
    daily: [],
    heatmap,
    dwellBuckets: [],
  };
}

describe('buildInsights', () => {
  it('sem visitas orienta a gerar dados', () => {
    const out = buildInsights(core({ visits: kpi(0) }));
    expect(out).toHaveLength(1);
    expect(out[0]).toContain('Simular');
  });
  it('aponta o pico e o dia mais fraco', () => {
    const out = buildInsights(core());
    expect(out[0]).toContain('sábado das 15h às 16h');
    expect(out[1]).toContain('Terça-feira é o dia mais fraco');
  });
  it('tendência de alta e de queda', () => {
    expect(
      buildInsights(core({ uniqueVisitors: kpi(100, 12.5) })).join(' '),
    ).toContain('subiram 12,5%');
    expect(
      buildInsights(core({ uniqueVisitors: kpi(100, -20) })).join(' '),
    ).toContain('caíram 20%');
  });
  it('recorrência e opt-in baixos', () => {
    const out = buildInsights(
      core({ returningRate: kpi(18), optInRate: kpi(22.5) }),
    ).join(' ');
    expect(out).toContain('Só 18% dos visitantes');
    expect(out).toContain('Apenas 22,5% aceitaram');
  });
});
