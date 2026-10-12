import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { metricsQuerySchema, type MetricsQuery } from '@wifi/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreId } from '../common/store-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MetricsService } from './metrics.service';

@ApiTags('métricas')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @ApiQuery({ name: 'range', enum: ['7d', '30d', '90d'], required: false })
  get(@StoreId() storeId: string, @Query(new ZodValidationPipe(metricsQuerySchema)) query: MetricsQuery) {
    return this.metrics.get(storeId, query.range);
  }
}
