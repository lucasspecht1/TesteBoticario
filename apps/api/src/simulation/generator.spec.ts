import { generateRecent, generateVisits, mulberry32 } from './generator';

const from = new Date('2026-08-01T03:00:00Z'); // 00:00 local
const to = new Date('2026-09-26T03:00:00Z'); // 8 semanas
const visits = generateVisits({ from, to, avgPerDay: 60, seed: 7 });
const localHour = (d: Date) => (d.getUTCHours() + 21) % 24; // UTC-3
const localWeekday = (d: Date) => new Date(d.getTime() - 3 * 3_600_000).getUTCDay();

describe('generateVisits', () => {
  it('é determinístico para a mesma semente', () => {
    expect(generateVisits({ from, to, avgPerDay: 60, seed: 7 })).toEqual(visits);
  });
  it('fica dentro do intervalo e do horário da loja (10h–22h)', () => {
    for (const v of visits) {
      expect(v.connectedAt.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(v.connectedAt.getTime()).toBeLessThanOrEqual(to.getTime());
      expect(localHour(v.connectedAt)).toBeGreaterThanOrEqual(10);
      expect(localHour(v.connectedAt)).toBeLessThan(22);
      if (v.disconnectedAt) expect(v.disconnectedAt > v.connectedAt).toBe(true);
    }
  });
  it('tem clientes que voltam', () => {
    expect(new Set(visits.map((v) => v.mac)).size).toBeLessThan(visits.length * 0.8);
  });
  it('sábado tem mais movimento que terça', () => {
    const count = (w: number) => visits.filter((v) => localWeekday(v.connectedAt) === w).length;
    expect(count(6)).toBeGreaterThan(count(2));
  });
});

describe('generateRecent', () => {
  it('gera N visitas nas últimas 2 h, nunca no futuro', () => {
    const now = new Date('2026-10-12T18:00:00Z');
    const out = generateRecent(mulberry32(1), now, 25);
    expect(out).toHaveLength(25);
    for (const v of out) {
      expect(v.connectedAt <= now).toBe(true);
      expect(now.getTime() - v.connectedAt.getTime()).toBeLessThanOrEqual(2 * 3_600_000);
      if (v.disconnectedAt) expect(v.disconnectedAt <= now).toBe(true);
    }
  });
});
