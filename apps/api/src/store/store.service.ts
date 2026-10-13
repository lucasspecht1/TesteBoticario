import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Dados da loja que vários módulos precisam. */
@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fuso horário IANA da loja (ex.: America/Sao_Paulo); falha com P2025 (404) se a loja não existe. */
  async findTimeZone(storeId: string): Promise<string> {
    const { timezone } = await this.prisma.store.findUniqueOrThrow({
      where: { id: storeId },
    });
    return timezone;
  }
}
