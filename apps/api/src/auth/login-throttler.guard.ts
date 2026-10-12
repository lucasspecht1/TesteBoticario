import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Limita por e-mail: todas as chamadas chegam do servidor do Next, então o IP não distingue usuários. */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const body = req.body as { email?: unknown } | undefined;
    return Promise.resolve(String(body?.email ?? req.ip).toLowerCase());
  }
}
