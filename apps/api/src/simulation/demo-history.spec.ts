import { HOUR_MS, MINUTE_MS } from '../common/time';
import {
  groupNewDevicesByMacHash,
  listFinishedVisits,
  splitReturningCustomers,
  type OpenVisit,
} from './demo-history';
import {
  createSeededRng,
  generateVisits,
  type GeneratedVisit,
} from './generator';

const MAC_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres';
const from = new Date('2026-08-01T03:00:00Z');
const visits = generateVisits({
  from,
  to: new Date('2026-09-01T03:00:00Z'),
  avgPerDay: 70,
  seed: 3,
});
const knownDeviceIds = ['aparelho-1', 'aparelho-2', 'aparelho-3'];

describe('splitReturningCustomers', () => {
  it('sem aparelhos conhecidos, toda visita é de cliente novo', () => {
    const split = splitReturningCustomers(visits, [], createSeededRng(1));
    expect(split.returningVisits).toEqual([]);
    expect(split.newCustomerVisits).toEqual(visits);
  });

  it('cerca de 30% das visitas vão para clientes que já existem', () => {
    const split = splitReturningCustomers(
      visits,
      knownDeviceIds,
      createSeededRng(1),
    );
    const returningShare = split.returningVisits.length / visits.length;
    expect(returningShare).toBeGreaterThan(0.25);
    expect(returningShare).toBeLessThan(0.35);
    expect(split.returningVisits.length + split.newCustomerVisits.length).toBe(
      visits.length,
    );
  });

  it('a visita de quem volta usa um aparelho conhecido e mantém os horários', () => {
    const visit: GeneratedVisit = {
      mac: 'aa:bb:cc:dd:ee:ff',
      connectedAt: from,
      disconnectedAt: new Date(from.getTime() + HOUR_MS),
      lead: { name: 'Ana', marketingOptIn: true },
    };
    const alwaysReturning = () => 0;
    const [returningVisit] = splitReturningCustomers(
      [visit],
      knownDeviceIds,
      alwaysReturning,
    ).returningVisits;
    expect(returningVisit).toEqual({
      deviceId: 'aparelho-1',
      startedAt: visit.connectedAt,
      endedAt: visit.disconnectedAt,
    });
  });
});

describe('groupNewDevicesByMacHash', () => {
  it('MAC repetido vira um aparelho só, da primeira à última vez visto', () => {
    const firstVisit: GeneratedVisit = {
      mac: 'AA:BB:CC:DD:EE:01',
      connectedAt: new Date('2026-08-01T13:00:00Z'),
      disconnectedAt: new Date('2026-08-01T13:20:00Z'),
      lead: { name: 'Bruno', marketingOptIn: false },
    };
    const secondVisit: GeneratedVisit = {
      mac: 'aa:bb:cc:dd:ee:01',
      connectedAt: new Date('2026-08-05T15:00:00Z'),
    };
    const devices = groupNewDevicesByMacHash(
      [secondVisit, firstVisit],
      MAC_SECRET,
    );
    expect([...devices.values()]).toEqual([
      {
        firstSeenAt: firstVisit.connectedAt,
        lastSeenAt: secondVisit.connectedAt,
        lead: firstVisit.lead,
      },
    ]);
  });
});

describe('listFinishedVisits', () => {
  const now = new Date('2026-08-01T18:00:00Z');
  const openVisit = (minutesAgo: number, id = 'visita'): OpenVisit => ({
    id,
    deviceId: `aparelho-${id}`,
    startedAt: new Date(now.getTime() - minutesAgo * MINUTE_MS),
  });
  const stayMinutes = (visit: { startedAt: Date; endedAt: Date }) =>
    (visit.endedAt.getTime() - visit.startedAt.getTime()) / MINUTE_MS;

  it('encerra a visita no fim da permanência sorteada, quando ela já passou', () => {
    const [finished] = listFinishedVisits([openVisit(120)], now);
    expect(finished.id).toBe('visita');
    expect(stayMinutes(finished)).toBeGreaterThanOrEqual(2);
    expect(finished.endedAt <= now).toBe(true);
  });

  it('mantém aberta a visita que ainda não chegou à permanência mínima', () => {
    expect(listFinishedVisits([openVisit(1)], now)).toEqual([]);
  });

  it('sorteia a mesma permanência em toda rodada', () => {
    const visit = openVisit(120);
    const later = new Date(now.getTime() + HOUR_MS);
    expect(listFinishedVisits([visit], later)).toEqual(
      listFinishedVisits([visit], now),
    );
  });

  it('segue a distribuição de permanência do gerador: mediana perto de 10 min e ~10% acima de 30', () => {
    const openVisits = Array.from({ length: 2000 }, (_, i) =>
      openVisit(120 + i / 100, String(i)),
    );
    const stays = listFinishedVisits(openVisits, now)
      .map(stayMinutes)
      .sort((a, b) => a - b);
    const longStayShare =
      stays.filter((minutes) => minutes > 30).length / stays.length;
    expect(stays).toHaveLength(openVisits.length);
    expect(stays[stays.length / 2]).toBeGreaterThan(8);
    expect(stays[stays.length / 2]).toBeLessThan(13);
    expect(longStayShare).toBeGreaterThan(0.07);
    expect(longStayShare).toBeLessThan(0.13);
  });
});
