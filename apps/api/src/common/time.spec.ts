import { localParts, startOfLocalDay } from './time';

const SP = 'America/Sao_Paulo';

describe('time', () => {
  it('01:30Z é 22:30 de domingo do dia anterior em São Paulo', () => {
    expect(localParts(new Date('2026-10-12T01:30:00Z'), SP)).toMatchObject({
      dateKey: '2026-10-11',
      hour: 22,
      weekday: 0,
    });
  });
  it('meia-noite local vira hora 0, não 24', () => {
    expect(localParts(new Date('2026-10-12T03:00:00Z'), SP)).toMatchObject({
      dateKey: '2026-10-12',
      hour: 0,
      weekday: 1,
    });
  });
  it('início do dia local', () => {
    expect(
      startOfLocalDay(new Date('2026-10-12T18:00:00Z'), SP).toISOString(),
    ).toBe('2026-10-12T03:00:00.000Z');
    expect(
      startOfLocalDay(new Date('2026-10-12T01:30:00Z'), SP).toISOString(),
    ).toBe('2026-10-11T03:00:00.000Z');
  });
});
