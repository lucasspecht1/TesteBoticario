import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  connectionInputSchema,
  simulateInputSchema,
  type ConnectionInput,
  type SimulateInput,
} from '@wifi/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreId } from '../common/store-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ConnectionsService } from '../connections/connections.service';
import { generateRecent, mulberry32 } from './generator';

const BATCH = 10;

@ApiTags('simulação')
@ApiBearerAuth()
@Controller('simulate')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private readonly connections: ConnectionsService) {}

  /** Gera visitas pelo mesmo caminho da ingestão real (mesmas regras de visita e hash). */
  @Post()
  async simulate(
    @StoreId() storeId: string,
    @Body(new ZodValidationPipe(simulateInputSchema)) body: SimulateInput,
  ) {
    const now = new Date();
    const visits = generateRecent(mulberry32(now.getTime()), now, body.visits);
    // Lotes de 10 em paralelo: em série, 200 visitas estouram o timeout do painel
    // (Neon + Railway). Os aparelhos gerados são todos novos, então não colidem.
    for (let i = 0; i < visits.length; i += BATCH) {
      await Promise.all(
        visits.slice(i, i + BATCH).map((v) =>
          this.connections.ingest(storeId, {
            mac: v.mac,
            connectedAt: v.connectedAt.toISOString(),
            disconnectedAt: v.disconnectedAt?.toISOString(),
            lead: v.lead,
          }),
        ),
      );
    }
    return { created: visits.length };
  }

  /** Cadastro manual do painel: mesma ingestão do portal, mas autenticada pelo login do dono. */
  @Post('connection')
  connection(
    @StoreId() storeId: string,
    @Body(new ZodValidationPipe(connectionInputSchema)) body: ConnectionInput,
  ) {
    return this.connections.ingest(storeId, body);
  }
}
