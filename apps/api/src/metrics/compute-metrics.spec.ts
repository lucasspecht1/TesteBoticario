import { computeMetrics, type VisitRow } from './compute-metrics';

const SP = 'America/Sao_Paulo';
const now = new Date('2026-10-12T15:00:00-03:00'); // segunda-feira
const d = (s: string) => new Date(s);

const row = (
  p: Partial<VisitRow> & Pick<VisitRow, 'deviceId' | 'startedAt'>,
): VisitRow => ({
  endedAt: null,
  deviceFirstSeenAt: p.startedAt,
  optIn: false,
  ...p,
});

describe('computeMetrics', () => {
  it('sem visitas: zeros e nulos, sem NaN', () => {
    const m = computeMetrics([], { now, days: 7, timeZone: SP });
    expect(m.kpis.visits).toEqual({ value: 0, previous: 0, delta: null });
    expect(m.kpis.uniqueVisitors.value).toBe(0);
    expect(m.kpis.returningRate.value).toBeNull();
    expect(m.kpis.medianDwellMinutes.value).toBeNull();
    expect(m.kpis.optInRate.value).toBeNull();
    expect(m.daily).toHaveLength(7);
    expect(m.heatmap).toHaveLength(168);
    expect(JSON.stringify(m)).not.toContain('NaN');
  });

  const rows: VisitRow[] = [
    // A: cliente antigo, voltou no domingo, ficou 30 min, aceitou comunicações
    row({
      deviceId: 'A',
      deviceFirstSeenAt: d('2026-09-01T10:00:00-03:00'),
      startedAt: d('2026-10-11T14:00:00-03:00'),
      endedAt: d('2026-10-11T14:30:00-03:00'),
      optIn: true,
    }),
    // B: primeira vez hoje, 10 min
    row({
      deviceId: 'B',
      startedAt: d('2026-10-12T10:00:00-03:00'),
      endedAt: d('2026-10-12T10:10:00-03:00'),
    }),
    // B de novo no mesmo dia: não é recorrente; visita aberta não entra na permanência
    row({
      deviceId: 'B',
      deviceFirstSeenAt: d('2026-10-12T10:00:00-03:00'),
      startedAt: d('2026-10-12T13:00:00-03:00'),
    }),
    // C: período anterior (os 7 dias antes, até o mesmo horário)
    row({
      deviceId: 'C',
      startedAt: d('2026-10-04T15:00:00-03:00'),
      endedAt: d('2026-10-04T15:05:00-03:00'),
    }),
    // D: 22:30 de domingo no horário local (01:30Z de segunda)
    row({
      deviceId: 'D',
      startedAt: d('2026-10-12T01:30:00Z'),
      endedAt: d('2026-10-12T01:50:00Z'),
    }),
  ];
  const m = computeMetrics(rows, { now, days: 7, timeZone: SP });

  it('KPIs do período', () => {
    expect(m.kpis.uniqueVisitors).toEqual({
      value: 3,
      previous: 1,
      delta: 200,
    });
    expect(m.kpis.visits.value).toBe(4);
    expect(m.kpis.returningRate.value).toBe(33.3);
    expect(m.kpis.medianDwellMinutes.value).toBe(20);
    expect(m.kpis.optInRate.value).toBe(33.3);
  });

  it('taxas comparam em pontos percentuais', () => {
    expect(m.kpis.optInRate.previous).toBe(0);
    expect(m.kpis.optInRate.delta).toBe(33.3);
  });

  it('série diária no dia local', () => {
    expect(m.daily.at(-1)).toEqual({
      date: '2026-10-12',
      newVisitors: 1,
      returningVisitors: 0,
    });
    expect(m.daily.at(-2)).toEqual({
      date: '2026-10-11',
      newVisitors: 1,
      returningVisitors: 1,
    });
    expect(m.daily[0].date).toBe('2026-10-06');
  });

  it('mapa de calor no horário local', () => {
    expect(m.heatmap[0 * 24 + 22]).toEqual({
      weekday: 0,
      hour: 22,
      avgVisits: 1,
    });
    expect(m.heatmap[1 * 24 + 10].avgVisits).toBe(1);
  });

  it('faixas de permanência só com visitas encerradas', () => {
    // 10 min → "5 a 15"; 20 → "15 a 30"; 30 → "30 min ou mais"
    expect(m.dwellBuckets.map((b) => b.count)).toEqual([0, 1, 1, 1]);
  });
});
