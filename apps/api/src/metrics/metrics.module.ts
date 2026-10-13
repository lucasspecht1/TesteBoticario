import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

/** Métricas e insights do painel. */
@Module({ controllers: [MetricsController], providers: [MetricsService] })
export class MetricsModule {}
