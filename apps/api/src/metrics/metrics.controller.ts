import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  metricsQuerySchema,
  rangeSchema,
  weekdayQuerySchema,
  type Metrics,
  type MetricsQuery,
  type WeekdayDetail,
  type WeekdayQuery,
} from '@wifi/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreId } from '../common/store-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MetricsService } from './metrics.service';

/** Painel de métricas da loja autenticada. */
@ApiTags('métricas')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  /** Métricas do período (7, 30 ou 90 dias) contra o período anterior, com insights. */
  @Get()
  @ApiQuery({ name: 'range', enum: rangeSchema.options, required: false })
  getMetrics(
    @StoreId() storeId: string,
    @Query(new ZodValidationPipe(metricsQuerySchema)) query: MetricsQuery,
  ): Promise<Metrics> {
    return this.metrics.getMetrics(storeId, query.range);
  }

  /** Detalhe de um dia da semana (0 = domingo) no período. */
  @Get('weekday')
  @ApiQuery({ name: 'range', enum: rangeSchema.options, required: false })
  @ApiQuery({ name: 'weekday', description: '0 = domingo … 6 = sábado' })
  getWeekday(
    @StoreId() storeId: string,
    @Query(new ZodValidationPipe(weekdayQuerySchema)) query: WeekdayQuery,
  ): Promise<WeekdayDetail> {
    return this.metrics.getWeekday(storeId, query.range, query.weekday);
  }
}
