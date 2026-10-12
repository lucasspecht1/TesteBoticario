import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module';
import { SimulationController } from './simulation.controller';

@Module({ imports: [ConnectionsModule], controllers: [SimulationController] })
export class SimulationModule {}
