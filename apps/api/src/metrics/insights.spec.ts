import type { Kpi, MetricsCore } from '@wifi/shared';
import { DAYS_PER_WEEK, HOURS_PER_DAY } from '../common/time';
import { buildInsights } from './insights';

const kpi = (value: number | null, delta: number | null = null): Kpi => ({
  value,
  previous: null,
  delta,
});

function buildMetricsCore(
  kpiOverrides: Partial<MetricsCore['kpis']> = {},
  peak = { weekday: 6, hour: 15, avg: 9 },
): MetricsCore {
  const heatmap = Array.from(
    { length: DAYS_PER_WEEK * HOURS_PER_DAY },
    (_, slotIndex) => {
      const weekday = Math.floor(slotIndex / HOURS_PER_DAY);
      const hour = slotIndex % HOURS_PER_DAY;
      const open = hour >= 10 && hour < 22;
      let avgVisits = open ? (weekday === 2 ? 1 : 3) : 0;
      if (weekday === peak.weekday && hour === peak.hour) avgVisits = peak.avg;
      return { weekday, hour, avgVisits };
    },
  );
  return {
    range: { from: '', to: '', days: 30 },
    kpis: {
      uniqueVisitors: kpi(100, 0),
      visits: kpi(120),
      returningRate: kpi(40),
      medianDwellMinutes: kpi(12),
      optInRate: kpi(50),
      newReturnRate: kpi(30),
      ...kpiOverrides,
    },
    daily: [],
    heatmap,
    weekdayAvgVisits: [],
    dwellBuckets: [],
  };
}

describe('buildInsights', () => {
  it('sem visitas orienta a gerar dados', () => {
    const insights = buildInsights(buildMetricsCore({ visits: kpi(0) }));
    expect(insights).toHaveLength(1);
    expect(insights[0]).toContain('Simular');
  });
  it('aponta o pico e o dia mais fraco', () => {
    const insights = buildInsights(buildMetricsCore());
    expect(insights[0]).toContain('sábado das 15h às 16h');
    expect(insights[1]).toContain('Terça-feira é o dia mais fraco');
  });
  it('tendência de alta e de queda', () => {
    expect(
      buildInsights(buildMetricsCore({ uniqueVisitors: kpi(100, 12.5) })).join(
        ' ',
      ),
    ).toContain('subiram 12,5%');
    expect(
      buildInsights(buildMetricsCore({ uniqueVisitors: kpi(100, -20) })).join(
        ' ',
      ),
    ).toContain('caíram 20%');
  });
  it('recorrência e opt-in baixos', () => {
    const insights = buildInsights(
      buildMetricsCore({ returningRate: kpi(18), optInRate: kpi(22.5) }),
    ).join(' ');
    expect(insights).toContain('Só 18% dos visitantes');
    expect(insights).toContain('Apenas 22,5% aceitaram');
  });
  it('aponta o horário mais vazio com a ação sugerida', () => {
    const insights = buildInsights(buildMetricsCore()).join(' ');
    // terça tem média 1 em todas as horas abertas: a primeira janela de 2 h é a mais vazia
    expect(insights).toContain(
      'Horário mais vazio: terça-feira das 10h às 12h (média de 1 visita por hora)',
    );
    expect(insights).toContain('treinamento da equipe');
  });
});
