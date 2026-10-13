import { Injectable } from '@nestjs/common';
import type { Device, Prisma } from '@prisma/client';
import type { ConnectionInput, IngestResult } from '@wifi/shared';
import { env } from '../env';
import { PrismaService } from '../prisma/prisma.service';
import { hashMac } from './mac';
import { computeMergedEnd, shouldMerge } from './merge';

type TransactionClient = Prisma.TransactionClient;

/** Quando o aparelho conectou e (se já saiu) desconectou. */
type ConnectionWindow = { connectedAt: Date; disconnectedAt: Date | null };

/** Ingestão de conexões do Wi-Fi: registra aparelho, lead e visita numa única transação. */
@Injectable()
export class ConnectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra uma conexão: cria/atualiza o aparelho (identificado só pelo HMAC do MAC), guarda o
   * lead se veio e funde a conexão na última visita do aparelho quando a regra de visita manda.
   */
  // trade-off: dois eventos simultâneos do mesmo aparelho podem criar duas visitas; lock por aparelho se a controladora mandar em paralelo
  async ingest(storeId: string, input: ConnectionInput): Promise<IngestResult> {
    const window: ConnectionWindow = {
      connectedAt: new Date(input.connectedAt),
      disconnectedAt: input.disconnectedAt
        ? new Date(input.disconnectedAt)
        : null,
    };
    const macHash = hashMac(input.mac, env.MAC_HASH_SECRET);

    return this.prisma.$transaction(async (transaction) => {
      const device = await this.upsertDevice(
        transaction,
        storeId,
        macHash,
        window,
      );
      if (input.lead) await this.upsertLead(transaction, device.id, input.lead);
      return this.mergeOrCreateVisit(transaction, storeId, device.id, window);
    });
  }

  /** Cria o aparelho ou estende o intervalo first/last seen (eventos podem chegar fora de ordem). */
  private async upsertDevice(
    transaction: TransactionClient,
    storeId: string,
    macHash: string,
    { connectedAt, disconnectedAt }: ConnectionWindow,
  ): Promise<Device> {
    const seenAt = disconnectedAt ?? connectedAt;
    const device = await transaction.device.upsert({
      where: { storeId_macHash: { storeId, macHash } },
      create: {
        storeId,
        macHash,
        firstSeenAt: connectedAt,
        lastSeenAt: seenAt,
      },
      update: {},
    });
    // first/last seen só se movem para fora do intervalo já conhecido
    if (connectedAt < device.firstSeenAt || seenAt > device.lastSeenAt) {
      await transaction.device.update({
        where: { id: device.id },
        data: {
          firstSeenAt:
            connectedAt < device.firstSeenAt ? connectedAt : undefined,
          lastSeenAt: seenAt > device.lastSeenAt ? seenAt : undefined,
        },
      });
    }
    return device;
  }

  /** Grava o lead do aparelho; `consentAt` é registro LGPD e só muda quando o consentimento muda. */
  private async upsertLead(
    transaction: TransactionClient,
    deviceId: string,
    lead: NonNullable<ConnectionInput['lead']>,
  ): Promise<void> {
    const existingLead = await transaction.lead.findUnique({
      where: { deviceId },
    });
    const fields = {
      name: lead.name,
      email: lead.email,
      marketingOptIn: lead.marketingOptIn,
    };
    await transaction.lead.upsert({
      where: { deviceId },
      create: { deviceId, ...fields, consentAt: new Date() },
      update: {
        ...fields,
        consentAt:
          existingLead && existingLead.marketingOptIn !== fields.marketingOptIn
            ? new Date()
            : undefined,
      },
    });
  }

  /** Junta a conexão à última visita do aparelho (regras em `shouldMerge`) ou abre uma visita nova. */
  private async mergeOrCreateVisit(
    transaction: TransactionClient,
    storeId: string,
    deviceId: string,
    { connectedAt, disconnectedAt }: ConnectionWindow,
  ): Promise<IngestResult> {
    const lastVisit = await transaction.visit.findFirst({
      where: { deviceId, startedAt: { lte: connectedAt } },
      orderBy: { startedAt: 'desc' },
    });

    if (lastVisit && shouldMerge(lastVisit, connectedAt)) {
      await transaction.visit.update({
        where: { id: lastVisit.id },
        data: {
          endedAt: computeMergedEnd(
            lastVisit.endedAt,
            connectedAt,
            disconnectedAt,
          ),
        },
      });
      return { visitId: lastVisit.id, merged: true };
    }

    const visit = await transaction.visit.create({
      data: {
        storeId,
        deviceId,
        startedAt: connectedAt,
        endedAt: disconnectedAt,
      },
    });
    return { visitId: visit.id, merged: false };
  }
}
