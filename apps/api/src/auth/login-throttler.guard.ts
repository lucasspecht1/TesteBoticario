import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Limita por e-mail: todas as chamadas chegam do servidor do Next, então o IP não distingue usuários. */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return String(req.body?.email ?? req.ip).toLowerCase();
  }
}
