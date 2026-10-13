import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

/** Ficha do cliente, retenção e sumidos (tela e CSV). */
@Module({ controllers: [CustomersController], providers: [CustomersService] })
export class CustomersModule {}
