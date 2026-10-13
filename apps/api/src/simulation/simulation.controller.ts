import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  connectionInputSchema,
  simulateInputSchema,
  type ConnectionInput,
  type IngestResult,
  type SimulateResult,
  type SimulateInput,
} from '@wifi/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreId } from '../common/store-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ConnectionsService } from '../connections/connections.service';
import { createSeededRng, generateRecent } from './generator';

/** Visitas ingeridas em paralelo por lote. */
const INGEST_BATCH_SIZE = 10;

/** Rotas de demonstração do painel (simular movimento e cadastrar conexão). */
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
  ): Promise<SimulateResult> {
    const now = new Date();
    const visits = generateRecent(
      createSeededRng(now.getTime()),
      now,
      body.visits,
    );
    // Lotes de `INGEST_BATCH_SIZE` em paralelo: em série, 200 visitas estouram o timeout do painel
    // (Neon + Railway). Os aparelhos gerados são todos novos, então não colidem.
    for (let i = 0; i < visits.length; i += INGEST_BATCH_SIZE) {
      await Promise.all(
        visits.slice(i, i + INGEST_BATCH_SIZE).map((visit) =>
          this.connections.ingest(storeId, {
            mac: visit.mac,
            connectedAt: visit.connectedAt.toISOString(),
            disconnectedAt: visit.disconnectedAt?.toISOString(),
            lead: visit.lead,
          }),
        ),
      );
    }
    return { created: visits.length };
  }

  /** Cadastro manual do painel: mesma ingestão do portal, mas autenticada pelo login do dono. */
  @Post('connection')
  registerConnection(
    @StoreId() storeId: string,
    @Body(new ZodValidationPipe(connectionInputSchema)) body: ConnectionInput,
  ): Promise<IngestResult> {
    return this.connections.ingest(storeId, body);
  }
}
