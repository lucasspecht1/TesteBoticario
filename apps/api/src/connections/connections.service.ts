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
    const disconnectedAt = input.disconnectedAt
      ? new Date(input.disconnectedAt)
      : null;
    const seenAt = disconnectedAt ?? connectedAt;
    const macHash = hashMac(input.mac, env.MAC_HASH_SECRET);

    return this.prisma.$transaction(async (tx) => {
      const device = await tx.device.upsert({
        where: { storeId_macHash: { storeId, macHash } },
        create: {
          storeId,
          macHash,
          firstSeenAt: connectedAt,
          lastSeenAt: seenAt,
        },
        update: {},
      });
      // first/last seen só se movem para fora do intervalo já conhecido (eventos fora de ordem)
      if (connectedAt < device.firstSeenAt || seenAt > device.lastSeenAt) {
        await tx.device.update({
          where: { id: device.id },
          data: {
            firstSeenAt:
              connectedAt < device.firstSeenAt ? connectedAt : undefined,
            lastSeenAt: seenAt > device.lastSeenAt ? seenAt : undefined,
          },
        });
      }

      if (input.lead) {
        const prev = await tx.lead.findUnique({
          where: { deviceId: device.id },
        });
        const fields = {
          name: input.lead.name,
          email: input.lead.email,
          marketingOptIn: input.lead.marketingOptIn,
        };
        // consentAt é registro LGPD: só nasce na criação e só muda quando o consentimento muda
        await tx.lead.upsert({
          where: { deviceId: device.id },
          create: { deviceId: device.id, ...fields, consentAt: new Date() },
          update: {
            ...fields,
            consentAt:
              prev && prev.marketingOptIn !== fields.marketingOptIn
                ? new Date()
                : undefined,
          },
        });
      }

      const last = await tx.visit.findFirst({
        where: { deviceId: device.id, startedAt: { lte: connectedAt } },
        orderBy: { startedAt: 'desc' },
      });

      if (last && shouldMerge(last, connectedAt)) {
        await tx.visit.update({
          where: { id: last.id },
          data: {
            endedAt: mergedEnd(last.endedAt, connectedAt, disconnectedAt),
          },
        });
        return { visitId: last.id, merged: true };
      }

      const visit = await tx.visit.create({
        data: {
          storeId,
          deviceId: device.id,
          startedAt: connectedAt,
          endedAt: disconnectedAt,
        },
      });
      return { visitId: visit.id, merged: false };
    });
  }
}
