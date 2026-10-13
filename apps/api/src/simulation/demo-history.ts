import { MINUTE_MS } from '../common/time';
import { hashMac } from '../connections/mac';
import {
  createSeededRng,
  drawStayMinutes,
  type GeneratedVisit,
  type Rng,
} from './generator';
import { RETURNING_SHARE } from './generator-params';

/** Média de visitas por dia da loja demo, no seed e no preenchimento automático. */
export const DEMO_AVG_VISITS_PER_DAY = 70;

/** Visita já ligada a um aparelho gravado no banco. */
export type DeviceVisit = {
  deviceId: string;
  startedAt: Date;
  endedAt: Date | null;
};

/** Visita ainda sem saída registrada. */
export type OpenVisit = { id: string; deviceId: string; startedAt: Date };

/** Visita aberta que já terminou, com a saída calculada. */
export type FinishedVisit = OpenVisit & { endedAt: Date };

/** Aparelho que ainda não existe no banco, montado a partir das visitas geradas. */
export type NewDevice = {
  firstSeenAt: Date;
  lastSeenAt: Date;
  lead?: GeneratedVisit['lead'];
};

/** Visitas geradas divididas entre clientes que voltam e clientes novos. */
export type CustomerSplit = {
  returningVisits: DeviceVisit[];
  newCustomerVisits: GeneratedVisit[];
};

/**
 * Manda `RETURNING_SHARE` das visitas para aparelhos sorteados entre os conhecidos; as demais
 * ficam como clientes novos, com o MAC e o cadastro gerados.
 */
export function splitReturningCustomers(
  visits: GeneratedVisit[],
  knownDeviceIds: string[],
  rng: Rng,
): CustomerSplit {
  const split: CustomerSplit = { returningVisits: [], newCustomerVisits: [] };
  for (const visit of visits) {
    const isReturning = knownDeviceIds.length > 0 && rng() < RETURNING_SHARE;
    if (!isReturning) {
      split.newCustomerVisits.push(visit);
      continue;
    }
    split.returningVisits.push({
      deviceId: knownDeviceIds[Math.floor(rng() * knownDeviceIds.length)],
      startedAt: visit.connectedAt,
      endedAt: visit.disconnectedAt ?? null,
    });
  }
  return split;
}

/** Um aparelho por MAC: primeira e última vez visto e o primeiro cadastro informado. */
export function groupNewDevicesByMacHash(
  visits: GeneratedVisit[],
  macHashSecret: string,
): Map<string, NewDevice> {
  const devicesByMacHash = new Map<string, NewDevice>();
  for (const visit of visits) {
    const macHash = hashMac(visit.mac, macHashSecret);
    const seenAt = visit.disconnectedAt ?? visit.connectedAt;
    const device = devicesByMacHash.get(macHash);
    if (!device) {
      devicesByMacHash.set(macHash, {
        firstSeenAt: visit.connectedAt,
        lastSeenAt: seenAt,
        lead: visit.lead,
      });
      continue;
    }
    if (visit.connectedAt < device.firstSeenAt)
      device.firstSeenAt = visit.connectedAt;
    if (seenAt > device.lastSeenAt) device.lastSeenAt = seenAt;
    device.lead ??= visit.lead;
  }
  return devicesByMacHash;
}

/**
 * Visitas abertas cuja permanência já passou, com a saída no fim dela. A permanência segue a
 * distribuição do gerador e é sorteada a partir do início da visita, então se repete em toda rodada.
 */
export function listFinishedVisits(
  openVisits: OpenVisit[],
  now: Date,
): FinishedVisit[] {
  return openVisits
    .map((visit) => {
      const stayMinutes = drawStayMinutes(
        createSeededRng(visit.startedAt.getTime()),
      );
      return {
        ...visit,
        endedAt: new Date(visit.startedAt.getTime() + stayMinutes * MINUTE_MS),
      };
    })
    .filter((visit) => visit.endedAt <= now);
}
