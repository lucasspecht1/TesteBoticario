import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { SESSION_TTL_SECONDS } from '@wifi/shared';
import { MINUTE_MS } from '../common/time';
import { env } from '../env';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

/** Janela, em ms, em que as tentativas de login são contadas. */
const LOGIN_WINDOW_MS = MINUTE_MS;
/** Tentativas de login permitidas por e-mail em cada janela. */
const LOGIN_ATTEMPTS_PER_WINDOW = 10;
/** Autenticação por JWT e limite de tentativas de login; global para os guards dos demais módulos. */
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: SESSION_TTL_SECONDS },
    }),
    ThrottlerModule.forRoot([
      { ttl: LOGIN_WINDOW_MS, limit: LOGIN_ATTEMPTS_PER_WINDOW },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
