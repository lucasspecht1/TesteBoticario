import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../env';
import type { AppRequest } from './app-request';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AppRequest>();
    const given = Buffer.from(String(req.headers['x-api-key'] ?? ''));
    const expected = Buffer.from(env.INGEST_API_KEY);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new UnauthorizedException('Chave de ingestão inválida.');
    }
    // trade-off: uma chave = uma loja; tabela de chaves por loja quando houver várias lojas
    req.storeId = env.DEFAULT_STORE_ID;
    return true;
  }
}
