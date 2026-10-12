import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConnectionsModule } from './connections/connections.module';
import { HealthController } from './health/health.controller';
import { MetricsModule } from './metrics/metrics.module';
import { PrismaModule } from './prisma/prisma.module';
import { SimulationModule } from './simulation/simulation.module';

@Module({
  imports: [PrismaModule, ConnectionsModule, AuthModule, MetricsModule, SimulationModule],
  controllers: [HealthController],
})
export class AppModule {}
