import { Module } from '@nestjs/common';
import { ConnectionsModule } from './connections/connections.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({ imports: [PrismaModule, ConnectionsModule], controllers: [HealthController] })
export class AppModule {}
