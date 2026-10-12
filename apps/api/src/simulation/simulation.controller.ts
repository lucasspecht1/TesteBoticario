import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { simulateInputSchema, type SimulateInput } from '@wifi/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreId } from '../common/store-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ConnectionsService } from '../connections/connections.service';
import { generateRecent, mulberry32 } from './generator';

@ApiTags('simulação')
@ApiBearerAuth()
@Controller('simulate')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private readonly connections: ConnectionsService) {}

  /** Gera visitas pelo mesmo caminho da ingestão real (mesmas regras de visita e hash). */
  @Post()
  async simulate(@StoreId() storeId: string, @Body(new ZodValidationPipe(simulateInputSchema)) body: SimulateInput) {
    const now = new Date();
    const visits = generateRecent(mulberry32(now.getTime()), now, body.visits);
    for (const v of visits) {
      await this.connections.ingest(storeId, {
        mac: v.mac,
        connectedAt: v.connectedAt.toISOString(),
        disconnectedAt: v.disconnectedAt?.toISOString(),
        lead: v.lead,
      });
    }
    return { created: visits.length };
  }
}
