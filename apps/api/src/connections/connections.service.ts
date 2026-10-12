import { Injectable } from '@nestjs/common';
import type { ConnectionInput, IngestResult } from '@wifi/shared';
import { env } from '../env';
import { PrismaService } from '../prisma/prisma.service';
import { hashMac } from './mac';
import { mergedEnd, shouldMerge } from './merge';

@Injectable()
export class ConnectionsService {
  constructor(private readonly prisma: PrismaService) {}

  // trade-off: dois eventos simultâneos do mesmo aparelho podem criar duas visitas; lock por aparelho se a controladora mandar em paralelo
  async ingest(storeId: string, input: ConnectionInput): Promise<IngestResult> {
    const connectedAt = new Date(input.connectedAt);
    const disconnectedAt = input.disconnectedAt ? new Date(input.disconnectedAt) : null;
    const seenAt = disconnectedAt ?? connectedAt;
    const macHash = hashMac(input.mac, env.MAC_HASH_SECRET);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.device.findUnique({ where: { storeId_macHash: { storeId, macHash } } });
      const device = existing
        ? await tx.device.update({
            where: { id: existing.id },
            data: {
              firstSeenAt: connectedAt < existing.firstSeenAt ? connectedAt : undefined,
              lastSeenAt: seenAt > existing.lastSeenAt ? seenAt : undefined,
            },
          })
        : await tx.device.create({ data: { storeId, macHash, firstSeenAt: connectedAt, lastSeenAt: seenAt } });

      if (input.lead) {
        const lead = { ...input.lead, consentAt: new Date() };
        await tx.lead.upsert({ where: { deviceId: device.id }, create: { deviceId: device.id, ...lead }, update: lead });
      }

      const last = await tx.visit.findFirst({
        where: { deviceId: device.id, startedAt: { lte: connectedAt } },
        orderBy: { startedAt: 'desc' },
      });

      if (last && shouldMerge(last, connectedAt)) {
        await tx.visit.update({
          where: { id: last.id },
          data: { endedAt: mergedEnd(last.endedAt, connectedAt, disconnectedAt) },
        });
        return { visitId: last.id, merged: true };
      }

      const visit = await tx.visit.create({
        data: { storeId, deviceId: device.id, startedAt: connectedAt, endedAt: disconnectedAt },
      });
      return { visitId: visit.id, merged: false };
    });
  }
}
