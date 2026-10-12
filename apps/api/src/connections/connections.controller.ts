import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { connectionInputSchema, type ConnectionInput } from '@wifi/shared';
import { z } from 'zod';
import { ApiKeyGuard } from '../common/api-key.guard';
import { StoreId } from '../common/store-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ConnectionsService } from './connections.service';

@ApiTags('ingestão')
@ApiSecurity('ingest')
@Controller('connections')
@UseGuards(ApiKeyGuard)
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}

  /** Simula o portal do Wi-Fi registrando uma conexão (e a saída, quando houver). */
  @Post()
  @ApiBody({ schema: z.toJSONSchema(connectionInputSchema, { unrepresentable: 'any' }) as object })
  ingest(@StoreId() storeId: string, @Body(new ZodValidationPipe(connectionInputSchema)) body: ConnectionInput) {
    return this.connections.ingest(storeId, body);
  }
}
