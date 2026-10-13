import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

/** Verificação de saúde para a hospedagem. */
@ApiTags('saúde')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** `{ status: 'ok' }` se o banco responde; 503 caso contrário. */
  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível.');
    }
  }
}
