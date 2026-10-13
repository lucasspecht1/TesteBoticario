import { HOUR_MS } from '../common/time';
import { generateRecent, generateVisits, createSeededRng } from './generator';

const from = new Date('2026-08-01T03:00:00Z'); // 00:00 local
const to = new Date('2026-09-26T03:00:00Z'); // 8 semanas
const visits = generateVisits({ from, to, avgPerDay: 60, seed: 7 });
const localHour = (date: Date) => (date.getUTCHours() + 21) % 24; // UTC-3
const localWeekday = (date: Date) =>
  new Date(date.getTime() - 3 * HOUR_MS).getUTCDay();

describe('generateVisits', () => {
  it('é determinístico para a mesma semente', () => {
    expect(generateVisits({ from, to, avgPerDay: 60, seed: 7 })).toEqual(
      visits,
    );
  });
  it('fica dentro do intervalo e do horário da loja (10h–22h)', () => {
    for (const visit of visits) {
      expect(visit.connectedAt.getTime()).toBeGreaterThanOrEqual(
        from.getTime(),
      );
      expect(visit.connectedAt.getTime()).toBeLessThanOrEqual(to.getTime());
      expect(localHour(visit.connectedAt)).toBeGreaterThanOrEqual(10);
      expect(localHour(visit.connectedAt)).toBeLessThan(22);
      if (visit.disconnectedAt)
        expect(visit.disconnectedAt > visit.connectedAt).toBe(true);
    }
  });
  it('tem clientes que voltam', () => {
    expect(new Set(visits.map((visit) => visit.mac)).size).toBeLessThan(
      visits.length * 0.8,
    );
  });
  it('sábado tem mais movimento que terça', () => {
    const count = (weekday: number) =>
      visits.filter((visit) => localWeekday(visit.connectedAt) === weekday)
        .length;
    expect(count(6)).toBeGreaterThan(count(2));
  });
});

describe('generateRecent', () => {
  it('gera N visitas nas últimas 2 h, nunca no futuro', () => {
    const now = new Date('2026-10-12T18:00:00Z');
    const recentVisits = generateRecent(createSeededRng(1), now, 25);
    expect(recentVisits).toHaveLength(25);
    for (const visit of recentVisits) {
      expect(visit.connectedAt <= now).toBe(true);
      expect(now.getTime() - visit.connectedAt.getTime()).toBeLessThanOrEqual(
        2 * HOUR_MS,
      );
      if (visit.disconnectedAt) expect(visit.disconnectedAt <= now).toBe(true);
    }
  });
});
