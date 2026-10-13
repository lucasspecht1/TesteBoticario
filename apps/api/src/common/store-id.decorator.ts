import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AppRequest } from './app-request';

/** Loja da requisição, vinda do JWT (painel) ou da chave de ingestão (portal Wi-Fi). */
export const StoreId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const storeId = request.user?.storeId ?? request.storeId;
    if (!storeId) throw new UnauthorizedException();
    return storeId;
  },
);
