import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module';
import { DemoAutofillService } from './demo-autofill.service';
import { DemoHistoryService } from './demo-history.service';
import { SimulationController } from './simulation.controller';

/** Geração de dados de demonstração, cadastro manual de conexões e preenchimento automático da demo. */
@Module({
  imports: [ConnectionsModule],
  controllers: [SimulationController],
  providers: [DemoHistoryService, DemoAutofillService],
})
export class SimulationModule {}
