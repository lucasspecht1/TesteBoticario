import { Injectable } from '@nestjs/common';
import { hashMac } from '../connections/mac';
import { env } from '../env';
import { PrismaService } from '../prisma/prisma.service';
import {
  groupNewDevicesByMacHash,
  type DeviceVisit,
  type NewDevice,
} from './demo-history';
import type { GeneratedVisit } from './generator';

/** Visitas por `createMany`, para não estourar o limite de parâmetros do Postgres. */
const VISITS_PER_INSERT = 5000;

/** Grava o histórico sintético da loja demo, usado pelo seed e pelo preenchimento automático. */
@Injectable()
export class DemoHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria um aparelho por MAC novo, com o cadastro gerado, e grava as visitas; devolve quantos aparelhos criou. */
  async insertNewCustomerVisits(
    storeId: string,
    visits: GeneratedVisit[],
  ): Promise<number> {
    const devicesByMacHash = groupNewDevicesByMacHash(
      visits,
      env.MAC_HASH_SECRET,
    );
    const deviceIdByMacHash = await this.insertDevicesWithLeads(
      storeId,
      devicesByMacHash,
    );
    await this.insertVisits(
      storeId,
      visits.map((visit) => ({
        // cada MAC das visitas acabou de virar aparelho
        deviceId: deviceIdByMacHash.get(
          hashMac(visit.mac, env.MAC_HASH_SECRET),
        )!,
        startedAt: visit.connectedAt,
        endedAt: visit.disconnectedAt ?? null,
      })),
    );
    return devicesByMacHash.size;
  }

  /** Grava visitas de aparelhos que já existem e avança o "visto por último" de cada um. */
  async insertReturningVisits(
    storeId: string,
    visits: DeviceVisit[],
  ): Promise<void> {
    await this.insertVisits(storeId, visits);
    await this.advanceLastSeen(visits);
  }

  /**
   * Cria os aparelhos e os cadastros e devolve o id de cada aparelho pelo hash do MAC. Os que já
   * existem são mantidos: assim uma rodada que caiu depois de criar os aparelhos, e antes de
   * gravar as visitas, pode ser refeita.
   */
  private async insertDevicesWithLeads(
    storeId: string,
    devicesByMacHash: Map<string, NewDevice>,
  ): Promise<Map<string, string>> {
    await this.prisma.device.createMany({
      data: [...devicesByMacHash].map(([macHash, device]) => ({
        storeId,
        macHash,
        firstSeenAt: device.firstSeenAt,
        lastSeenAt: device.lastSeenAt,
      })),
      skipDuplicates: true,
    });
    const savedDevices = await this.prisma.device.findMany({
      where: { storeId, macHash: { in: [...devicesByMacHash.keys()] } },
      select: { id: true, macHash: true },
    });
    const deviceIdByMacHash = new Map(
      savedDevices.map((device) => [device.macHash, device.id]),
    );
    await this.prisma.lead.createMany({
      data: [...devicesByMacHash].flatMap(([macHash, device]) =>
        device.lead
          ? [
              {
                deviceId: deviceIdByMacHash.get(macHash)!,
                ...device.lead,
                consentAt: device.firstSeenAt,
              },
            ]
          : [],
      ),
      skipDuplicates: true,
    });
    return deviceIdByMacHash;
  }

  private async insertVisits(
    storeId: string,
    visits: DeviceVisit[],
  ): Promise<void> {
    for (let start = 0; start < visits.length; start += VISITS_PER_INSERT) {
      await this.prisma.visit.createMany({
        data: visits
          .slice(start, start + VISITS_PER_INSERT)
          .map((visit) => ({ storeId, ...visit })),
      });
    }
  }

  /** Avança o "visto por último" de cada aparelho até a visita mais recente dele, sem recuar. */
  async advanceLastSeen(visits: DeviceVisit[]): Promise<void> {
    const lastSeenByDeviceId = new Map<string, Date>();
    for (const visit of visits) {
      const seenAt = visit.endedAt ?? visit.startedAt;
      const knownLastSeen = lastSeenByDeviceId.get(visit.deviceId);
      if (!knownLastSeen || seenAt > knownLastSeen)
        lastSeenByDeviceId.set(visit.deviceId, seenAt);
    }
    await this.prisma.$transaction(
      [...lastSeenByDeviceId].map(([deviceId, lastSeenAt]) =>
        this.prisma.device.updateMany({
          where: { id: deviceId, lastSeenAt: { lt: lastSeenAt } },
          data: { lastSeenAt },
        }),
      ),
    );
  }
}
