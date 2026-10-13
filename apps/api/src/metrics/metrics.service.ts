import { Injectable } from '@nestjs/common';
import {
  RANGE_DAYS,
  type Metrics,
  type Range,
  type WeekdayDetail,
} from '@wifi/shared';
import { computePeriodBounds } from '../common/time';
import { StoreService } from '../store/store.service';
import { PrismaService } from '../prisma/prisma.service';
import { computeMetrics, type VisitRow } from './compute-metrics';
import { computeWeekday } from './compute-weekday';
import { buildInsights } from './insights';

/** Lê as visitas da loja e delega o cálculo das métricas às funções puras. */
@Injectable()
export class MetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stores: StoreService,
  ) {}

  /** Métricas do período contra o anterior, com os insights em linguagem de negócio. */
  async getMetrics(
    storeId: string,
    range: Range,
    now = new Date(),
  ): Promise<Metrics> {
    const days = RANGE_DAYS[range];
    const timeZone = await this.stores.findTimeZone(storeId);
    const { previousFrom } = computePeriodBounds(now, days, timeZone);
    const rows = await this.loadVisitRows(storeId, previousFrom, now);
    const core = computeMetrics(rows, { now, days, timeZone });
    return { ...core, insights: buildInsights(core) };
  }

  /** Um dia da semana no período, contra os outros dias do mesmo período. */
  async getWeekday(
    storeId: string,
    range: Range,
    weekday: number,
    now = new Date(),
  ): Promise<WeekdayDetail> {
    const days = RANGE_DAYS[range];
    const timeZone = await this.stores.findTimeZone(storeId);
    const { currentFrom } = computePeriodBounds(now, days, timeZone);
    const rows = await this.loadVisitRows(storeId, currentFrom, now);
    return computeWeekday(rows, { now, days, timeZone, weekday });
  }

  /** Visitas que começaram em [from, to], com o que as métricas precisam do aparelho e do lead. */
  private async loadVisitRows(
    storeId: string,
    from: Date,
    to: Date,
  ): Promise<VisitRow[]> {
    const visits = await this.prisma.visit.findMany({
      where: { storeId, startedAt: { gte: from, lte: to } },
      select: {
        deviceId: true,
        startedAt: true,
        endedAt: true,
        device: {
          select: {
            firstSeenAt: true,
            lead: { select: { marketingOptIn: true } },
          },
        },
      },
    });
    return visits.map((visit) => ({
      deviceId: visit.deviceId,
      startedAt: visit.startedAt,
      endedAt: visit.endedAt,
      deviceFirstSeenAt: visit.device.firstSeenAt,
      hasOptedIn: visit.device.lead?.marketingOptIn ?? false,
    }));
  }
}
