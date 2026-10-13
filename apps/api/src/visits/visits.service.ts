import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  RANGE_DAYS,
  type VisitList,
  type VisitListItem,
  type VisitsQuery,
} from '@wifi/shared';
import { getFirstName, toAlias } from '../common/customer-identity';
import { computeRoundedMedian } from '../common/math';
import { PAGE_SIZE, computePageOffset } from '../common/pagination';
import { computePeriodBounds, startOfLocalDay } from '../common/time';
import {
  IN_STORE_MAX_MS,
  computeDurationMinutes,
  isInStore,
} from '../common/visit-span';
import { PrismaService } from '../prisma/prisma.service';
import { StoreService } from '../store/store.service';
import {
  VISIT_LIST_JOINS,
  buildReturningCondition,
  buildVisitListFilter,
} from './visit-list-query';

/** Linha crua da consulta da lista de visitas. */
type VisitListRow = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  deviceId: string;
  macHash: string;
  leadName: string | null;
  hasOptedIn: boolean;
  isReturning: boolean;
  totalVisits: number;
};

/** Contadores ao vivo do cabeçalho da lista. */
type LiveCounters = VisitList['live'];

/** Lista paginada de visitas da loja e os contadores ao vivo do dia. */
@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stores: StoreService,
  ) {}

  /** Visitas filtradas e paginadas (mais recentes primeiro), com o cliente pseudonimizado. */
  async list(
    storeId: string,
    query: VisitsQuery,
    now = new Date(),
  ): Promise<VisitList> {
    const timeZone = await this.stores.findTimeZone(storeId);
    const todayStart = startOfLocalDay(now, timeZone);
    const from =
      query.range === 'today'
        ? todayStart
        : computePeriodBounds(now, RANGE_DAYS[query.range], timeZone)
            .currentFrom;
    const inStoreSince = new Date(now.getTime() - IN_STORE_MAX_MS);
    const filter = buildVisitListFilter(
      storeId,
      query,
      { from, now, inStoreSince },
      timeZone,
    );

    const [rows, total, live] = await Promise.all([
      this.fetchPage(filter, timeZone, query.page),
      this.countMatching(filter),
      this.fetchLiveCounters(storeId, now, todayStart, inStoreSince),
    ]);
    return {
      items: rows.map((row) => toVisitListItem(row, now)),
      total,
      page: query.page,
      pageSize: PAGE_SIZE,
      live,
    };
  }

  /** Uma página de visitas, com o total de visitas do aparelho e se a visita é de retorno. */
  private fetchPage(
    filter: Prisma.Sql,
    timeZone: string,
    page: number,
  ): Promise<VisitListRow[]> {
    return this.prisma.$queryRaw<VisitListRow[]>`
      SELECT v.id, v."startedAt", v."endedAt", d.id AS "deviceId", d."macHash",
        l.name AS "leadName", COALESCE(l."marketingOptIn", false) AS "hasOptedIn",
        ${buildReturningCondition(timeZone)} AS "isReturning",
        (SELECT count(*)::int FROM "Visit" v2 WHERE v2."deviceId" = d.id) AS "totalVisits"
      ${VISIT_LIST_JOINS} WHERE ${filter}
      ORDER BY v."startedAt" DESC, v.id DESC
      LIMIT ${PAGE_SIZE} OFFSET ${computePageOffset(page)}`;
  }

  /** Total de visitas que atendem ao filtro, antes da paginação. */
  private async countMatching(filter: Prisma.Sql): Promise<number> {
    const [{ total }] = await this.prisma.$queryRaw<
      { total: number }[]
    >`SELECT count(*)::int AS total ${VISIT_LIST_JOINS} WHERE ${filter}`;
    return total;
  }

  /** Na loja agora, visitas de hoje e mediana de permanência das visitas de hoje já encerradas. */
  private async fetchLiveCounters(
    storeId: string,
    now: Date,
    todayStart: Date,
    inStoreSince: Date,
  ): Promise<LiveCounters> {
    const [inStore, visitsToday, closedToday] = await Promise.all([
      this.prisma.visit.count({
        where: {
          storeId,
          endedAt: null,
          startedAt: { gt: inStoreSince, lte: now },
        },
      }),
      this.prisma.visit.count({
        where: { storeId, startedAt: { gte: todayStart, lte: now } },
      }),
      this.prisma.visit.findMany({
        where: {
          storeId,
          startedAt: { gte: todayStart, lte: now },
          endedAt: { not: null },
        },
        select: { startedAt: true, endedAt: true },
      }),
    ]);
    return {
      inStore,
      visitsToday,
      // endedAt não é nulo por causa do filtro da consulta acima
      medianDwellTodayMinutes: computeRoundedMedian(
        closedToday.map((visit) => computeDurationMinutes(visit)!),
      ),
    };
  }
}

/** Converte a linha do banco no item da lista (datas em ISO, cliente pseudonimizado). */
function toVisitListItem(row: VisitListRow, now: Date): VisitListItem {
  return {
    id: row.id,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    durationMinutes: computeDurationMinutes(row),
    inStore: isInStore(row, now),
    returning: row.isReturning,
    customer: {
      id: row.deviceId,
      alias: toAlias(row.macHash),
      firstName: getFirstName(row.leadName, row.hasOptedIn),
      optIn: row.hasOptedIn,
      totalVisits: row.totalVisits,
    },
  };
}
