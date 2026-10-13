import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConnectionsModule } from './connections/connections.module';
import { CustomersModule } from './customers/customers.module';
import { HealthController } from './health/health.controller';
import { MetricsModule } from './metrics/metrics.module';
import { PrismaModule } from './prisma/prisma.module';
import { SimulationModule } from './simulation/simulation.module';
import { StoreModule } from './store/store.module';
import { VisitsModule } from './visits/visits.module';

/** Módulo raiz: junta todos os módulos da API. */
@Module({
  imports: [
    PrismaModule,
    StoreModule,
    ConnectionsModule,
    AuthModule,
    MetricsModule,
    SimulationModule,
    VisitsModule,
    CustomersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
