import { HOUR_MS } from './time';
import { isInStore } from './visit-span';

const now = new Date('2026-10-12T15:00:00-03:00');

describe('na loja agora', () => {
  it('visita aberta há menos de 4 h', () => {
    expect(
      isInStore(
        { startedAt: new Date(now.getTime() - HOUR_MS), endedAt: null },
        now,
      ),
    ).toBe(true);
    expect(
      isInStore(
        { startedAt: new Date(now.getTime() - 5 * HOUR_MS), endedAt: null },
        now,
      ),
    ).toBe(false);
    expect(
      isInStore(
        { startedAt: new Date(now.getTime() - HOUR_MS), endedAt: now },
        now,
      ),
    ).toBe(false);
  });
});
