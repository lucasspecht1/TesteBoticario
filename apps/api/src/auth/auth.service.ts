import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginResult } from '@wifi/shared';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_COST } from './bcrypt-cost';

// compara contra um hash fictício quando o e-mail não existe, para não revelar quais e-mails existem pelo tempo de resposta
const DUMMY_HASH = bcrypt.hashSync('senha-ficticia', BCRYPT_COST);

/** Autentica o dono da loja e emite o token de acesso. */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Valida as credenciais e devolve `{ accessToken }`; 401 com a mesma mensagem para e-mail ou senha errados. */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    const isPasswordValid = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !isPasswordValid)
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    return {
      accessToken: await this.jwt.signAsync({
        sub: user.id,
        storeId: user.storeId,
      }),
    };
  }
}
