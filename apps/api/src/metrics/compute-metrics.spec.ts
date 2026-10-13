import { computeMetrics, type VisitRow } from './compute-metrics';
import { NOW, SAO_PAULO, atTime, buildVisitRow } from './metrics-fixtures';

describe('computeMetrics', () => {
  it('sem visitas: zeros e nulos, sem NaN', () => {
    const metrics = computeMetrics([], {
      now: NOW,
      days: 7,
      timeZone: SAO_PAULO,
    });
    expect(metrics.kpis.visits).toEqual({ value: 0, previous: 0, delta: null });
    expect(metrics.kpis.uniqueVisitors.value).toBe(0);
    expect(metrics.kpis.returningRate.value).toBeNull();
    expect(metrics.kpis.medianDwellMinutes.value).toBeNull();
    expect(metrics.kpis.optInRate.value).toBeNull();
    expect(metrics.daily).toHaveLength(7);
    expect(metrics.heatmap).toHaveLength(168);
    expect(JSON.stringify(metrics)).not.toContain('NaN');
  });

  const rows: VisitRow[] = [
    // A: cliente antigo, voltou no domingo, ficou 30 min, aceitou comunicações
    buildVisitRow({
      deviceId: 'A',
      deviceFirstSeenAt: atTime('2026-09-01T10:00:00-03:00'),
      startedAt: atTime('2026-10-11T14:00:00-03:00'),
      endedAt: atTime('2026-10-11T14:30:00-03:00'),
      hasOptedIn: true,
    }),
    // B: primeira vez hoje, 10 min
    buildVisitRow({
      deviceId: 'B',
      startedAt: atTime('2026-10-12T10:00:00-03:00'),
      endedAt: atTime('2026-10-12T10:10:00-03:00'),
    }),
    // B de novo no mesmo dia: não é recorrente; visita aberta não entra na permanência
    buildVisitRow({
      deviceId: 'B',
      deviceFirstSeenAt: atTime('2026-10-12T10:00:00-03:00'),
      startedAt: atTime('2026-10-12T13:00:00-03:00'),
    }),
    // C: período anterior (os 7 dias antes, até o mesmo horário)
    buildVisitRow({
      deviceId: 'C',
      startedAt: atTime('2026-10-04T15:00:00-03:00'),
      endedAt: atTime('2026-10-04T15:05:00-03:00'),
    }),
    // D: 22:30 de domingo no horário local (01:30Z de segunda)
    buildVisitRow({
      deviceId: 'D',
      startedAt: atTime('2026-10-12T01:30:00Z'),
      endedAt: atTime('2026-10-12T01:50:00Z'),
    }),
  ];
  const metrics = computeMetrics(rows, {
    now: NOW,
    days: 7,
    timeZone: SAO_PAULO,
  });

  it('KPIs do período', () => {
    expect(metrics.kpis.uniqueVisitors).toEqual({
      value: 3,
      previous: 1,
      delta: 200,
    });
    expect(metrics.kpis.visits.value).toBe(4);
    expect(metrics.kpis.returningRate.value).toBe(33.3);
    expect(metrics.kpis.medianDwellMinutes.value).toBe(20);
    expect(metrics.kpis.optInRate.value).toBe(33.3);
  });

  it('taxas comparam em pontos percentuais', () => {
    expect(metrics.kpis.optInRate.previous).toBe(0);
    expect(metrics.kpis.optInRate.delta).toBe(33.3);
  });

  it('série diária no dia local', () => {
    expect(metrics.daily.at(-1)).toEqual({
      date: '2026-10-12',
      newVisitors: 1,
      returningVisitors: 0,
    });
    expect(metrics.daily.at(-2)).toEqual({
      date: '2026-10-11',
      newVisitors: 1,
      returningVisitors: 1,
    });
    expect(metrics.daily[0].date).toBe('2026-10-06');
  });

  it('mapa de calor no horário local', () => {
    expect(metrics.heatmap[0 * 24 + 22]).toEqual({
      weekday: 0,
      hour: 22,
      avgVisits: 1,
    });
    expect(metrics.heatmap[1 * 24 + 10].avgVisits).toBe(1);
  });

  it('média de visitas por dia da semana, sem somar células arredondadas', () => {
    // domingo 11/10: A às 14h e D às 22h; segunda 12/10: as duas visitas de B
    expect(metrics.weekdayAvgVisits).toEqual([2, 2, 0, 0, 0, 0, 0]);
  });

  it('faixas de permanência só com visitas encerradas', () => {
    // 10 min → "5 a 15"; 20 → "15 a 30"; 30 → "30 min ou mais"
    expect(metrics.dwellBuckets.map((bucket) => bucket.count)).toEqual([
      0, 1, 1, 1,
    ]);
  });
});

describe('novos que voltaram', () => {
  const first = (deviceId: string, startedAtIso: string) =>
    buildVisitRow({
      deviceId,
      startedAt: atTime(startedAtIso),
      deviceFirstSeenAt: atTime(startedAtIso),
    });
  const again = (
    deviceId: string,
    firstSeenAtIso: string,
    startedAtIso: string,
  ) =>
    buildVisitRow({
      deviceId,
      startedAt: atTime(startedAtIso),
      deviceFirstSeenAt: atTime(firstSeenAtIso),
    });

  const rows: VisitRow[] = [
    // E: primeira vez na terça, voltou na quinta → voltou
    first('E', '2026-10-07T11:00:00-03:00'),
    again('E', '2026-10-07T11:00:00-03:00', '2026-10-09T16:00:00-03:00'),
    // F: primeira vez na quarta, não voltou
    first('F', '2026-10-08T12:00:00-03:00'),
    // G: primeira vez hoje e voltou no mesmo dia → não conta como retorno
    first('G', '2026-10-12T09:00:00-03:00'),
    again('G', '2026-10-12T09:00:00-03:00', '2026-10-12T13:00:00-03:00'),
    // A: cliente antigo (primeira vez antes do período) → fora da conta
    again('A', '2026-09-01T10:00:00-03:00', '2026-10-10T10:00:00-03:00'),
    // período anterior: H voltou, I não
    first('H', '2026-09-30T10:00:00-03:00'),
    again('H', '2026-09-30T10:00:00-03:00', '2026-10-02T10:00:00-03:00'),
    first('I', '2026-10-01T10:00:00-03:00'),
  ];
  const metrics = computeMetrics(rows, {
    now: NOW,
    days: 7,
    timeZone: SAO_PAULO,
  });

  it('mede quem veio pela primeira vez no período e voltou em outro dia', () => {
    expect(metrics.kpis.newReturnRate).toEqual({
      value: 33.3,
      previous: 50,
      delta: -16.7,
    });
  });

  it('sem clientes novos no período: nulo', () => {
    const only = computeMetrics([rows[6]], {
      now: NOW,
      days: 7,
      timeZone: SAO_PAULO,
    });
    expect(only.kpis.newReturnRate.value).toBeNull();
  });
});
