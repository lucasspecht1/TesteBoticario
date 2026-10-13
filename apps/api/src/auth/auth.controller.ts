import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { loginSchema, type LoginInput, type LoginResult } from '@wifi/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';
import { LoginThrottlerGuard } from './login-throttler.guard';

/** Login do dono da loja. */
@ApiTags('autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Troca e-mail e senha por um token de acesso (JWT). */
  @Post('login')
  @HttpCode(200)
  @UseGuards(LoginThrottlerGuard)
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
  ): Promise<LoginResult> {
    return this.auth.login(body.email, body.password);
  }
}
