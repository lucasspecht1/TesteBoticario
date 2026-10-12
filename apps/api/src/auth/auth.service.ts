import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

// compara contra um hash fictício quando o e-mail não existe, para não revelar quais e-mails existem pelo tempo de resposta
const DUMMY_HASH = bcrypt.hashSync('senha-ficticia', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok)
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    return {
      accessToken: await this.jwt.signAsync({
        sub: user.id,
        storeId: user.storeId,
      }),
    };
  }
}
