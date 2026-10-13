import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  VISIT_KINDS,
  VISIT_LEADS,
  VISIT_RANGES,
  VISIT_STATUSES,
  visitsQuerySchema,
  type VisitList,
  type VisitsQuery,
} from '@wifi/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreId } from '../common/store-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { VisitsService } from './visits.service';

/** Lista de visitas da loja autenticada. */
@ApiTags('visitas')
@ApiBearerAuth()
@Controller('visits')
@UseGuards(JwtAuthGuard)
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  /** Visitas da loja, uma por linha, com o cliente pseudonimizado. */
  @Get()
  @ApiQuery({ name: 'range', enum: VISIT_RANGES, required: false })
  @ApiQuery({
    name: 'status',
    enum: VISIT_STATUSES,
    required: false,
  })
  @ApiQuery({
    name: 'kind',
    enum: VISIT_KINDS,
    required: false,
  })
  @ApiQuery({ name: 'lead', enum: VISIT_LEADS, required: false })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Começo do apelido do cliente',
  })
  @ApiQuery({ name: 'page', required: false })
  list(
    @StoreId() storeId: string,
    @Query(new ZodValidationPipe(visitsQuerySchema)) query: VisitsQuery,
  ): Promise<VisitList> {
    return this.visits.list(storeId, query);
  }
}
