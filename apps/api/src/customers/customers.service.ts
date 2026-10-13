import { Injectable, NotFoundException } from '@nestjs/common';
import type { CustomerDetail, LapsedList, Retention } from '@wifi/shared';
import { getFirstName, toAlias } from '../common/customer-identity';
import { computeRoundedMedian } from '../common/math';
import { PAGE_SIZE, computePageOffset } from '../common/pagination';
import {
  DAYS_PER_WEEK,
  DAY_MS,
  countDaysSince,
  getLocalParts,
  startOfLocalDay,
} from '../common/time';
import { computeDurationMinutes, isInStore } from '../common/visit-span';
import { PrismaService } from '../prisma/prisma.service';
import { StoreService } from '../store/store.service';
import { toCsv } from './csv';
import { classifyCustomer, computeAverageDaysBetween } from './customer';
import { LAPSED_ORDER, buildLapsedQuery, type LapsedRow } from './lapsed-query';
import { computeRetention } from './retention';

/** Quantas visitas recentes aparecem na ficha do cliente. */
const HISTORY_SIZE = 30;
/** Semanas de turmas da retenção: as turmas mais antigas já completam os 60 dias. */
const RETENTION_WEEKS = 12;
/** Máximo de linhas do CSV de reativação. */
const EXPORT_LIMIT = 5000;

/** Linha da lista de sumidos na tela (sem e-mail). */
type LapsedPageRow = Omit<LapsedRow, 'email'> & { id: string; macHash: string };

/** Ficha do cliente, retenção por turma e lista de sumidos (tela e CSV). */
@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stores: StoreService,
  ) {}

  /** Ficha do cliente: segmento, frequência e as visitas mais recentes. 404 se não é da loja. */
  async getDetail(
    storeId: string,
    customerId: string,
    now = new Date(),
  ): Promise<CustomerDetail> {
    const device = await this.prisma.device.findFirst({
      where: { id: customerId, storeId },
      include: {
        lead: { select: { name: true, marketingOptIn: true } },
        visits: {
          orderBy: { startedAt: 'desc' },
          select: { id: true, startedAt: true, endedAt: true },
        },
      },
    });
    if (!device) throw new NotFoundException('Cliente não encontrado.');
    const hasOptedIn = device.lead?.marketingOptIn ?? false;
    const visitDates = device.visits.map((visit) => visit.startedAt);
    const closedDurations = device.visits
      .map(computeDurationMinutes)
      .filter((minutes): minutes is number => minutes !== null);
    return {
      id: device.id,
      alias: toAlias(device.macHash),
      firstName: getFirstName(device.lead?.name ?? null, hasOptedIn),
      optIn: hasOptedIn,
      totalVisits: device.visits.length,
      segment: classifyCustomer(visitDates, now),
      firstSeenAt: device.firstSeenAt.toISOString(),
      lastSeenAt: device.lastSeenAt.toISOString(),
      medianDwellMinutes: computeRoundedMedian(closedDurations),
      avgDaysBetweenVisits: computeAverageDaysBetween(visitDates),
      visits: device.visits.slice(0, HISTORY_SIZE).map((visit) => ({
        id: visit.id,
        startedAt: visit.startedAt.toISOString(),
        endedAt: visit.endedAt?.toISOString() ?? null,
        durationMinutes: computeDurationMinutes(visit),
        inStore: isInStore(visit, now),
      })),
    };
  }

  /** Turmas semanais de clientes novos e quanto voltaram em 7, 30 e 60 dias. */
  async getRetention(storeId: string, now = new Date()): Promise<Retention> {
    const timeZone = await this.stores.findTimeZone(storeId);
    const from = startOfLocalDay(
      new Date(now.getTime() - RETENTION_WEEKS * DAYS_PER_WEEK * DAY_MS),
      timeZone,
    );
    const devices = await this.prisma.device.findMany({
      where: { storeId, firstSeenAt: { gte: from, lte: now } },
      select: {
        firstSeenAt: true,
        visits: {
          select: { startedAt: true },
          where: { startedAt: { lte: now } },
        },
      },
    });
    return computeRetention(
      devices.map((device) => ({
        firstSeenAt: device.firstSeenAt,
        visits: device.visits.map((visit) => visit.startedAt),
      })),
      { now, weeks: RETENTION_WEEKS, timeZone },
    );
  }

  /** Página dos sumidos que aceitaram contato (sem e-mail), do mais recente ao mais antigo. */
  async listLapsed(
    storeId: string,
    page: number,
    now = new Date(),
  ): Promise<LapsedList> {
    const lapsedQuery = buildLapsedQuery(storeId, now);
    const [rows, [{ total }]] = await Promise.all([
      this.prisma.$queryRaw<
        LapsedPageRow[]
      >`${lapsedQuery} ${LAPSED_ORDER} LIMIT ${PAGE_SIZE} OFFSET ${computePageOffset(page)}`,
      this.prisma.$queryRaw<
        { total: number }[]
      >`SELECT count(*)::int AS total FROM (${lapsedQuery}) lapsed`,
    ]);
    return {
      items: rows.map((row) => ({
        id: row.id,
        alias: toAlias(row.macHash),
        // a consulta só traz leads com aceite, então o primeiro nome pode aparecer
        firstName: getFirstName(row.leadName, true),
        totalVisits: row.totalVisits,
        lastVisitAt: row.lastVisitAt.toISOString(),
        daysAway: countDaysSince(row.lastVisitAt, now),
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  /**
   * CSV para campanha de reativação. Exceção deliberada à regra "e-mail nunca sai da API":
   * só entram clientes que aceitaram receber comunicações da loja, e o arquivo serve a isso.
   */
  async exportLapsedCsv(storeId: string, now = new Date()): Promise<string> {
    const timeZone = await this.stores.findTimeZone(storeId);
    const rows = await this.prisma.$queryRaw<
      LapsedRow[]
    >`${buildLapsedQuery(storeId, now)} ${LAPSED_ORDER} LIMIT ${EXPORT_LIMIT}`;
    return toCsv(
      ['nome', 'email', 'ultima_visita', 'visitas', 'dias_sem_vir'],
      rows.map((row) => [
        row.leadName,
        row.email ?? '',
        getLocalParts(row.lastVisitAt, timeZone).dateKey,
        row.totalVisits,
        countDaysSince(row.lastVisitAt, now),
      ]),
    );
  }
}
