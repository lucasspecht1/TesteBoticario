import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  lapsedQuerySchema,
  type CustomerDetail,
  type LapsedList,
  type LapsedQuery,
  type Retention,
} from '@wifi/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreId } from '../common/store-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CustomersService } from './customers.service';

/** Marca de ordem de bytes UTF-8: faz o Excel abrir o CSV com os acentos certos. */
const UTF8_BOM = '\uFEFF';

/** Clientes da loja autenticada: ficha, retenção e sumidos. */
@ApiTags('clientes')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  /** Retenção por turma semanal de clientes novos (7, 30 e 60 dias). */
  @Get('retention')
  getRetention(@StoreId() storeId: string): Promise<Retention> {
    return this.customers.getRetention(storeId);
  }

  /** Sumidos que aceitaram contato, para reativação. */
  @Get('lapsed')
  @ApiQuery({ name: 'page', required: false })
  listLapsed(
    @StoreId() storeId: string,
    @Query(new ZodValidationPipe(lapsedQuerySchema)) query: LapsedQuery,
  ): Promise<LapsedList> {
    return this.customers.listLapsed(storeId, query.page);
  }

  /** Mesma lista em CSV (com e-mail: só quem aceitou receber comunicações). */
  @Get('lapsed.csv')
  @Header('content-type', 'text/csv; charset=utf-8')
  @Header(
    'content-disposition',
    'attachment; filename="clientes-para-reativar.csv"',
  )
  @Header('cache-control', 'no-store')
  async exportLapsedCsv(@StoreId() storeId: string): Promise<string> {
    return UTF8_BOM + (await this.customers.exportLapsedCsv(storeId));
  }

  /** Ficha do cliente: segmento, frequência e histórico de visitas. */
  @Get(':id')
  getDetail(
    @StoreId() storeId: string,
    @Param('id') id: string,
  ): Promise<CustomerDetail> {
    return this.customers.getDetail(storeId, id);
  }
}
