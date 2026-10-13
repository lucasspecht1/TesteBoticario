import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Disponibiliza o `PrismaService` para todos os módulos. */
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
