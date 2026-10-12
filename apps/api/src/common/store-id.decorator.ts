import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AppRequest } from './app-request';

/** Loja da requisição, vinda do JWT (painel) ou da chave de ingestão (portal Wi-Fi). */
export const StoreId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<AppRequest>();
    const storeId = req.user?.storeId ?? req.storeId;
    if (!storeId) throw new UnauthorizedException();
    return storeId;
  },
);
