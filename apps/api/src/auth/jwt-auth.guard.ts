import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AppRequest } from '../common/app-request';

/** Exige `Authorization: Bearer <jwt>` válido e guarda o usuário e a loja na requisição. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const [type, token] = (request.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token)
      throw new UnauthorizedException('Sessão ausente.');
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        storeId: string;
      }>(token);
      request.user = { userId: payload.sub, storeId: payload.storeId };
      return true;
    } catch {
      throw new UnauthorizedException('Sessão expirada ou inválida.');
    }
  }
}
