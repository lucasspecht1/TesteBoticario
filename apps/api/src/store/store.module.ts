import { Global, Module } from '@nestjs/common';
import { StoreService } from './store.service';

/** Disponibiliza o `StoreService` para todos os módulos. */
@Global()
@Module({ providers: [StoreService], exports: [StoreService] })
export class StoreModule {}
