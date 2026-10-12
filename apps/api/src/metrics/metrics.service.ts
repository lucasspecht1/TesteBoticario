import { Injectable } from '@nestjs/common';
import { RANGE_DAYS, type Metrics, type Range } from '@wifi/shared';
import { PrismaService } from '../prisma/prisma.service';
import { computeMetrics, periodBounds, type VisitRow } from './compute-metrics';
import { buildInsights } from './insights';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(storeId: string, range: Range, now = new Date()): Promise<Metrics> {
    const days = RANGE_DAYS[range];
    const store = await this.prisma.store.findUniqueOrThrow({ where: { id: storeId } });
    const { prevFrom } = periodBounds(now, days, store.timezone);
    const visits = await this.prisma.visit.findMany({
      where: { storeId, startedAt: { gte: prevFrom, lte: now } },
      select: {
        deviceId: true,
        startedAt: true,
        endedAt: true,
        device: { select: { firstSeenAt: true, lead: { select: { marketingOptIn: true } } } },
      },
    });
    const rows: VisitRow[] = visits.map((v) => ({
      deviceId: v.deviceId,
      startedAt: v.startedAt,
      endedAt: v.endedAt,
      deviceFirstSeenAt: v.device.firstSeenAt,
      optIn: v.device.lead?.marketingOptIn ?? false,
    }));
    const core = computeMetrics(rows, { now, days, timeZone: store.timezone });
    return { ...core, insights: buildInsights(core) };
  }
}
