import type { VisitRow } from './compute-metrics';
import { computeWeekday } from './compute-weekday';
import { NOW, SAO_PAULO, atTime, buildVisitRow } from './metrics-fixtures';

// período de 14 dias: 29/09 (terça) a 12/10 (segunda, hoje). Segundas: 05/10 e 12/10.
const rows: VisitRow[] = [
  buildVisitRow({
    deviceId: 'A',
    deviceFirstSeenAt: atTime('2026-09-01T10:00:00-03:00'),
    startedAt: atTime('2026-10-05T17:00:00-03:00'),
    endedAt: atTime('2026-10-05T17:20:00-03:00'),
    hasOptedIn: true,
  }),
  buildVisitRow({
    deviceId: 'B',
    startedAt: atTime('2026-10-05T17:30:00-03:00'),
    endedAt: atTime('2026-10-05T17:40:00-03:00'),
  }),
  buildVisitRow({
    deviceId: 'C',
    startedAt: atTime('2026-10-12T10:00:00-03:00'),
  }),
  buildVisitRow({
    deviceId: 'D',
    startedAt: atTime('2026-10-06T11:00:00-03:00'),
    endedAt: atTime('2026-10-06T11:30:00-03:00'),
  }),
  buildVisitRow({
    deviceId: 'E',
    startedAt: atTime('2026-10-10T16:00:00-03:00'),
    endedAt: atTime('2026-10-10T16:05:00-03:00'),
  }),
];
const detail = computeWeekday(rows, {
  now: NOW,
  days: 14,
  timeZone: SAO_PAULO,
  weekday: 1,
});

describe('computeWeekday', () => {
  it('lista cada segunda do período, a mais recente primeiro, com hoje marcado', () => {
    expect(detail.dates).toEqual([
      {
        date: '2026-10-12',
        newVisitors: 1,
        returningVisitors: 0,
        visits: 1,
        today: true,
      },
      {
        date: '2026-10-05',
        newVisitors: 1,
        returningVisitors: 1,
        visits: 2,
        today: false,
      },
    ]);
  });

  it('média por hora igual ao mapa de calor, ao lado da média de todos os dias', () => {
    expect(detail.hourly).toHaveLength(24);
    expect(detail.hourly[17]).toEqual({
      hour: 17,
      avgVisits: 1,
      allDaysAvgVisits: 0.1,
    });
    expect(detail.hourly[10].avgVisits).toBe(0.5);
    expect(detail.hourly[11]).toEqual({
      hour: 11,
      avgVisits: 0,
      allDaysAvgVisits: 0.1,
    });
  });

  it('KPIs do dia comparados com os outros dias do mesmo período', () => {
    expect(detail.kpis.visitsPerDay).toEqual({
      value: 1.5,
      previous: 0.2,
      delta: 650,
    });
    expect(detail.kpis.returningRate).toEqual({
      value: 33.3,
      previous: 0,
      delta: 33.3,
    });
    expect(detail.kpis.medianDwellMinutes).toEqual({
      value: 15,
      previous: 17.5,
      delta: -14.3,
    });
    expect(detail.kpis.optInRate).toEqual({
      value: 33.3,
      previous: 0,
      delta: 33.3,
    });
  });

  it('permanência só das visitas encerradas desse dia', () => {
    expect(detail.dwellBuckets.map((bucket) => bucket.count)).toEqual([
      0, 1, 1, 0,
    ]);
  });

  it('dia sem movimento: zeros e nulos, sem NaN', () => {
    const empty = computeWeekday([], {
      now: NOW,
      days: 7,
      timeZone: SAO_PAULO,
      weekday: 3,
    });
    expect(empty.dates).toHaveLength(1);
    expect(empty.kpis.visitsPerDay.value).toBe(0);
    expect(empty.kpis.returningRate.value).toBeNull();
    expect(JSON.stringify(empty)).not.toContain('NaN');
  });
});
