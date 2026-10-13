# Painel de Wi-Fi de Visitantes — Implementation Plan

> Plano original, aprovado antes do código. O código final evoluiu depois (redesign e revisão de clean code); a fonte da verdade é o repositório.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Painel online para o dono de uma loja O Boticário entender o fluxo de clientes a partir das conexões no Wi-Fi de visitantes.

**Architecture:** Monorepo pnpm com `packages/shared` (schemas Zod do contrato), `apps/api` (NestJS + Prisma + Postgres; métricas como funções puras) e `apps/web` (Next.js App Router só como front, Server Components chamando a API, token em cookie httpOnly).

**Tech Stack:** Node 22+, pnpm 10, TypeScript strict, NestJS 11, Prisma 6, PostgreSQL 16, Zod 4, Jest + Supertest, Next.js 15, React 19, Tailwind 4, Recharts 3. Deploy: Neon (banco), Railway (API), Vercel (web).

**Spec:** `docs/planejamento/especificacao.md`

## Global Constraints

- Node >= 22 (máquina tem 24). pnpm via corepack. TypeScript `strict: true` em todos os pacotes.
- Identificadores em inglês; textos de UI, mensagens de erro, README e commits em português.
- Commits no formato Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`).
- Nomes dos pacotes: `@wifi/shared`, `@wifi/api`, `@wifi/web`.
- Fuso da loja: `America/Sao_Paulo`. Regra de visita: reconexão em até 30 min soma à visita; visita aberta absorve reconexões por até 12 h.
- MAC nunca é salvo em claro: `HMAC-SHA256(MAC_HASH_SECRET, mac normalizado)`.
- O Next nunca acessa o banco; toda leitura/escrita passa pela API. `INGEST_API_KEY` e o JWT nunca chegam ao navegador.
- Sem dependências além das listadas nas tarefas.
- Ao fim de cada tarefa, acrescentar 1–3 linhas em `docs/ai-log.md` no formato `- **Tarefa N** — o que a IA gerou · o que foi revisado/corrigido · decisão humana (se houver)`. É a matéria-prima do `AI_USAGE.md` (Tarefa 12). Só fatos reais.

## Review Focus

1. **Fuso horário** — visita às 01:30Z é 22:30 do dia anterior em São Paulo; dia/hora do painel devem usar o horário local (testes em `time.spec.ts` e `compute-metrics.spec.ts`, Tarefa 4).
2. **Evento repetido ou reenviado** — mesmo POST duas vezes não pode criar duas visitas (testes em `merge.spec.ts`, Tarefa 3, e e2e, Tarefa 5).
3. **Loja/período sem dados** — sem NaN, sem divisão por zero, painel mostra estado vazio com caminho para gerar dados (teste `computeMetrics([])`, Tarefa 4; estado vazio, Tarefa 9).
4. **Sessão expirada/token inválido** — API responde 401 e o front volta ao login com aviso, sem tela de erro (e2e na Tarefa 5; `lib/api.ts` na Tarefa 8).
5. **Entrada inválida** — MAC mal formado, saída antes da entrada, data futura → 400 com mensagem por campo, exibida no formulário (e2e na Tarefa 5; formulário na Tarefa 10).

## File Structure

```
desafio-boticario/
  package.json, pnpm-workspace.yaml, .gitignore, .nvmrc, docker-compose.yml
  .github/workflows/ci.yml
  README.md, AI_USAGE.md, docs/ai-log.md
  packages/shared/src/index.ts                 contrato (schemas Zod + tipos)
  apps/api/
    prisma/schema.prisma, prisma/seed.ts
    src/main.ts, setup.ts, env.ts, app.module.ts
    src/common/  time.ts, zod-validation.pipe.ts, all-exceptions.filter.ts,
                 app-request.ts, store-id.decorator.ts, api-key.guard.ts
    src/prisma/  prisma.module.ts, prisma.service.ts
    src/health/  health.controller.ts
    src/connections/ mac.ts, merge.ts, connections.service.ts, connections.controller.ts, connections.module.ts
    src/metrics/ compute-metrics.ts, insights.ts, metrics.service.ts, metrics.controller.ts, metrics.module.ts
    src/auth/    auth.service.ts, auth.controller.ts, jwt-auth.guard.ts, login-throttler.guard.ts, auth.module.ts
    src/simulation/ generator.ts, simulation.controller.ts, simulation.module.ts
    test/app.e2e-spec.ts
  apps/web/
    middleware.ts
    lib/ api.ts, session.ts, format.ts
    app/ layout.tsx, globals.css
    app/login/ page.tsx, login-form.tsx, actions.ts
    app/(painel)/ layout.tsx, page.tsx, loading.tsx, error.tsx
    app/(painel)/simular/ page.tsx, actions.ts, simulate-form.tsx, connection-form.tsx
    components/ card.tsx, kpi-card.tsx, range-tabs.tsx, insights.tsx, empty-state.tsx,
                daily-chart.tsx, heatmap.tsx, dwell-bars.tsx, submit-button.tsx
```

## Cronograma

- **Dia 1:** Tarefas 0–7 (backend completo, publicado e com dados).
- **Dia 2:** Tarefas 8–12 (front, deploy do front, documentação).

---

### Task 0: Ferramentas locais (manual, ~10 min)

- [ ] **Step 1: pnpm e Postgres**

```bash
corepack enable pnpm && pnpm -v
brew install postgresql@16 && brew services start postgresql@16
/opt/homebrew/opt/postgresql@16/bin/createdb wifi
/opt/homebrew/opt/postgresql@16/bin/psql -d wifi -c 'select 1'
```
Expected: versão do pnpm (10.x) e `?column? = 1`.

- [ ] **Step 2: Contas** — criar (ou confirmar) contas em GitHub, Neon, Railway e Vercel. Criar repositório **público** vazio no GitHub `painel-wifi-visitantes`.

---

### Task 1: Monorepo + contrato compartilhado

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.nvmrc`, `docker-compose.yml`, `docs/ai-log.md`
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`

**Interfaces:**
- Produces (de `@wifi/shared`): `connectionInputSchema`, `ConnectionInput`, `loginSchema`, `LoginInput`, `rangeSchema`, `Range`, `RANGE_DAYS`, `metricsQuerySchema`, `MetricsQuery`, `simulateInputSchema`, `SimulateInput`, `Kpi`, `Metrics`, `MetricsCore`, `IngestResult`.

O repositório já existe (`git init` feito, com a especificação e este plano).

- [ ] **Step 1: Arquivos da raiz**

`package.json` (troque `10.x.y` pela saída de `pnpm -v`):
```json
{
  "name": "painel-wifi-visitantes",
  "private": true,
  "packageManager": "pnpm@10.x.y",
  "engines": { "node": ">=22" },
  "scripts": {
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "test:e2e": "pnpm --filter @wifi/api test:e2e",
    "dev": "pnpm --filter @wifi/shared build && pnpm --parallel --filter @wifi/api --filter @wifi/web dev"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - apps/*
  - packages/*
onlyBuiltDependencies:
  - '@prisma/client'
  - '@prisma/engines'
  - prisma
```

`.gitignore`:
```
node_modules
dist
.next
.env
.env.local
*.tsbuildinfo
coverage
.DS_Store
```

`.nvmrc`: `22`

`docker-compose.yml` (alternativa para quem avalia e usa Docker):
```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: wifi
    ports: ['5432:5432']
```

`docs/ai-log.md`:
```markdown
# Diário de uso de IA

Registro factual, tarefa a tarefa. Base do AI_USAGE.md.

- **Planejamento** — Claude Code (Opus) leu o PDF do desafio, propôs métricas de negócio, modelagem e stack; humano escolheu Next + Nest no lugar de Vite + Fastify e definiu prazo/escopo; spec e plano gerados e revisados antes de codar.
```

- [ ] **Step 2: Pacote shared**

`packages/shared/package.json`:
```json
{
  "name": "@wifi/shared",
  "version": "0.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

`packages/shared/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

```bash
pnpm --filter @wifi/shared add zod@^4
pnpm --filter @wifi/shared add -D typescript@~5.9
```

- [ ] **Step 3: Contrato** — `packages/shared/src/index.ts`:

```ts
import { z } from 'zod';

const MAC_RE = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i;
const FUTURE_TOLERANCE_MS = 5 * 60_000;

const isoDate = z.iso.datetime({ offset: true, message: 'Data/hora inválida (ISO 8601 com fuso)' });

export const connectionInputSchema = z
  .object({
    mac: z.string().regex(MAC_RE, 'MAC inválido (formato AA:BB:CC:DD:EE:FF)'),
    connectedAt: isoDate,
    disconnectedAt: isoDate.optional(),
    lead: z
      .object({
        name: z.string().trim().min(2, 'Nome muito curto').max(100),
        email: z.email('E-mail inválido').optional(),
        marketingOptIn: z.boolean(),
      })
      .optional(),
  })
  .refine((v) => Date.parse(v.connectedAt) <= Date.now() + FUTURE_TOLERANCE_MS, {
    message: 'A entrada não pode estar no futuro',
    path: ['connectedAt'],
  })
  .refine((v) => !v.disconnectedAt || Date.parse(v.disconnectedAt) >= Date.parse(v.connectedAt), {
    message: 'A saída deve ser depois da entrada',
    path: ['disconnectedAt'],
  });
export type ConnectionInput = z.infer<typeof connectionInputSchema>;
export type IngestResult = { visitId: string; merged: boolean };

export const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const rangeSchema = z.enum(['7d', '30d', '90d']);
export type Range = z.infer<typeof rangeSchema>;
export const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };

export const metricsQuerySchema = z.object({ range: rangeSchema.default('30d') });
export type MetricsQuery = z.infer<typeof metricsQuerySchema>;

export const simulateInputSchema = z.object({ visits: z.int().min(1).max(200) });
export type SimulateInput = z.infer<typeof simulateInputSchema>;

/**
 * delta: variação vs. período anterior.
 * - contagens e minutos: variação relativa em % ((atual - anterior) / anterior)
 * - taxas (returningRate, optInRate): diferença em pontos percentuais
 * null quando não há base de comparação.
 */
export type Kpi = { value: number | null; previous: number | null; delta: number | null };

export type Metrics = {
  range: { from: string; to: string; days: number };
  kpis: {
    uniqueVisitors: Kpi;
    visits: Kpi;
    returningRate: Kpi;
    medianDwellMinutes: Kpi;
    optInRate: Kpi;
  };
  /** Um item por dia local do período, em ordem. */
  daily: { date: string; newVisitors: number; returningVisitors: number }[];
  /** 168 células, ordenadas: índice = weekday * 24 + hour (weekday 0 = domingo). */
  heatmap: { weekday: number; hour: number; avgVisits: number }[];
  dwellBuckets: { label: string; count: number }[];
  insights: string[];
};
export type MetricsCore = Omit<Metrics, 'insights'>;
```

- [ ] **Step 4: Build**

Run: `pnpm install && pnpm --filter @wifi/shared build && ls packages/shared/dist`
Expected: `index.d.ts  index.js`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: monorepo pnpm e contrato compartilhado com Zod"
```

---

### Task 2: Base da API (Nest, Prisma, env, erros, health)

**Files:**
- Create (scaffold): `apps/api/**` via Nest CLI
- Create: `apps/api/.env.example`, `apps/api/prisma/schema.prisma`, `apps/api/src/env.ts`, `apps/api/src/setup.ts`, `apps/api/src/prisma/prisma.module.ts`, `apps/api/src/prisma/prisma.service.ts`, `apps/api/src/common/zod-validation.pipe.ts`, `apps/api/src/common/all-exceptions.filter.ts`, `apps/api/src/common/app-request.ts`, `apps/api/src/common/store-id.decorator.ts`, `apps/api/src/health/health.controller.ts`
- Modify: `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/package.json`, `apps/api/tsconfig.build.json`
- Delete: `apps/api/src/app.controller.ts`, `app.service.ts`, `app.controller.spec.ts`

**Interfaces:**
- Produces: `env` (`DATABASE_URL`, `JWT_SECRET`, `INGEST_API_KEY`, `MAC_HASH_SECRET`, `DEFAULT_STORE_ID`, `PORT`); `PrismaService` (global); `ZodValidationPipe(schema)`; `AllExceptionsFilter`; `configureApp(app: INestApplication): void`; `AppRequest`; `@StoreId()` param decorator → `string`.

- [ ] **Step 1: Scaffold**

```bash
cd apps && pnpm dlx @nestjs/cli@11 new api --package-manager pnpm --skip-git --skip-install --strict && cd ..
rm -f apps/api/pnpm-lock.yaml apps/api/src/app.controller.ts apps/api/src/app.service.ts apps/api/src/app.controller.spec.ts
```
Em `apps/api/package.json`: `"name": "@wifi/api"` e acrescente aos scripts:
```json
"typecheck": "tsc --noEmit",
"postinstall": "prisma generate",
"db:migrate": "prisma migrate dev",
"seed": "tsx prisma/seed.ts"
```
Em `apps/api/tsconfig.json`, garanta `"strict": true`. Em `apps/api/tsconfig.build.json`, acrescente `"prisma"` ao `exclude` (senão o build sai em `dist/src/main.js`).

```bash
pnpm --filter @wifi/api add @prisma/client@^6 zod@^4 @nestjs/swagger @nestjs/jwt @nestjs/throttler bcryptjs "@wifi/shared@workspace:*"
pnpm --filter @wifi/api add -D prisma@^6 tsx
```

- [ ] **Step 2: Env validado** — `apps/api/src/env.ts`:

```ts
import { z } from 'zod';

try {
  process.loadEnvFile();
} catch {
  // sem .env: usa as variáveis do ambiente (produção/CI)
}

const envSchema = z.object({
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  INGEST_API_KEY: z.string().min(24),
  MAC_HASH_SECRET: z.string().min(32),
  DEFAULT_STORE_ID: z.string().min(1).default('loja-demo'),
  PORT: z.coerce.number().default(3001),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
```

`apps/api/.env.example` (copie para `.env`; com Postgres do brew o usuário é o seu login do macOS):
```
DATABASE_URL=postgresql://lucas@localhost:5432/wifi
JWT_SECRET=troque-por-um-segredo-com-32-caracteres-ou-mais
INGEST_API_KEY=chave-de-ingestao-local-123456
MAC_HASH_SECRET=outro-segredo-com-pelo-menos-32-caracteres
DEFAULT_STORE_ID=loja-demo
PORT=3001
```
```bash
cp apps/api/.env.example apps/api/.env
```

- [ ] **Step 3: Schema Prisma** — `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Store {
  id        String   @id
  name      String
  timezone  String   @default("America/Sao_Paulo")
  createdAt DateTime @default(now())
  devices   Device[]
  visits    Visit[]
  users     User[]
}

/// Aparelho identificado pelo HMAC do MAC (nunca o MAC em claro).
model Device {
  id          String   @id @default(cuid())
  storeId     String
  macHash     String
  firstSeenAt DateTime
  lastSeenAt  DateTime
  store       Store    @relation(fields: [storeId], references: [id])
  visits      Visit[]
  lead        Lead?

  @@unique([storeId, macHash])
}

/// Uma ida à loja. Reconexões em até 30 min somam à mesma visita.
model Visit {
  id        String    @id @default(cuid())
  storeId   String
  deviceId  String
  startedAt DateTime
  endedAt   DateTime?
  store     Store     @relation(fields: [storeId], references: [id])
  device    Device    @relation(fields: [deviceId], references: [id])

  @@index([storeId, startedAt])
  @@index([deviceId, startedAt])
}

/// Cadastro opcional no portal do Wi-Fi, com registro do consentimento (LGPD).
model Lead {
  id             String   @id @default(cuid())
  deviceId       String   @unique
  name           String
  email          String?
  marketingOptIn Boolean
  consentAt      DateTime
  device         Device   @relation(fields: [deviceId], references: [id])
}

model User {
  id           String @id @default(cuid())
  email        String @unique
  passwordHash String
  storeId      String
  store        Store  @relation(fields: [storeId], references: [id])
}
```

Run: `pnpm --filter @wifi/api exec prisma migrate dev --name init`
Expected: `Your database is now in sync with your schema.`

- [ ] **Step 4: Prisma no Nest**

`apps/api/src/prisma/prisma.service.ts`:
```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

`apps/api/src/prisma/prisma.module.ts`:
```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

- [ ] **Step 5: Validação, erros, request e decorator**

`apps/api/src/common/zod-validation.pipe.ts`:
```ts
import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z, type ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Dados inválidos',
        details: z.flattenError(result.error).fieldErrors,
      });
    }
    return result.data;
  }
}
```

`apps/api/src/common/all-exceptions.filter.ts`:
```ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

const PRISMA_STATUS: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: 'Registro duplicado.' },
  P2025: { status: 404, message: 'Registro não encontrado.' },
};

/** Formato único de erro: { statusCode, message, details?, path, timestamp }. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Erro');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Erro interno. Tente novamente em instantes.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') message = body;
      else {
        const b = body as { message?: string | string[]; details?: unknown };
        message = Array.isArray(b.message) ? b.message.join('; ') : (b.message ?? message);
        details = b.details;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError && PRISMA_STATUS[exception.code]) {
      ({ status, message } = PRISMA_STATUS[exception.code]);
    }

    if (status >= 500) this.logger.error(exception instanceof Error ? exception.stack : exception);
    res.status(status).json({ statusCode: status, message, details, path: req.url, timestamp: new Date().toISOString() });
  }
}
```

`apps/api/src/common/app-request.ts`:
```ts
import type { Request } from 'express';

export type AuthUser = { userId: string; storeId: string };
/** user: preenchido pelo JwtAuthGuard. storeId: preenchido pelo ApiKeyGuard. */
export type AppRequest = Request & { user?: AuthUser; storeId?: string };
```

`apps/api/src/common/store-id.decorator.ts`:
```ts
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AppRequest } from './app-request';

/** Loja da requisição, vinda do JWT (painel) ou da chave de ingestão (portal Wi-Fi). */
export const StoreId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<AppRequest>();
  const storeId = req.user?.storeId ?? req.storeId;
  if (!storeId) throw new UnauthorizedException();
  return storeId;
});
```

- [ ] **Step 6: Health, setup e main**

`apps/api/src/health/health.controller.ts`:
```ts
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('saúde')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível.');
    }
  }
}
```

`apps/api/src/setup.ts`:
```ts
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

/** Configuração compartilhada entre main.ts e os testes e2e. */
export function configureApp(app: INestApplication) {
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();
  const doc = new DocumentBuilder()
    .setTitle('API — Wi-Fi de visitantes')
    .setDescription('Ingestão de conexões e métricas do painel da loja.')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'ingest')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, doc));
}
```

`apps/api/src/main.ts`:
```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './env';
import { configureApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(env.PORT);
}
void bootstrap();
```

`apps/api/src/app.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({ imports: [PrismaModule], controllers: [HealthController] })
export class AppModule {}
```

Apague `apps/api/test/app.e2e-spec.ts` gerado pelo scaffold (será reescrito na Tarefa 5).

- [ ] **Step 7: Verificar**

Run: `pnpm --filter @wifi/api start:dev` e, em outro terminal, `curl -s localhost:3001/health`
Expected: `{"status":"ok"}`; `http://localhost:3001/docs` abre o Swagger.
Run: `DATABASE_URL=x pnpm --filter @wifi/api exec tsx src/env.ts; echo $?`
Expected: mensagem "Variáveis de ambiente inválidas" com `DATABASE_URL` e saída `1`.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(api): base Nest com Prisma, env validado, erros padronizados e health"
```

---

### Task 3: Ingestão de conexões (MAC com hash, regra de visita, chave de API)

**Files:**
- Create: `apps/api/src/connections/mac.ts`, `mac.spec.ts`, `merge.ts`, `merge.spec.ts`, `connections.service.ts`, `connections.controller.ts`, `connections.module.ts`
- Create: `apps/api/src/common/api-key.guard.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `env`, `PrismaService`, `ZodValidationPipe`, `StoreId`, `AppRequest`, `connectionInputSchema`, `ConnectionInput`, `IngestResult`.
- Produces: `normalizeMac(mac: string): string`; `hashMac(mac: string, secret: string): string`; `shouldMerge(last: VisitWindow | null, connectedAt: Date): boolean`; `mergedEnd(lastEnd: Date | null, connectedAt: Date, disconnectedAt: Date | null): Date | null`; `ConnectionsService.ingest(storeId: string, input: ConnectionInput): Promise<IngestResult>` (exportado pelo `ConnectionsModule`); `ApiKeyGuard`.

- [ ] **Step 1: Testes do MAC** — `apps/api/src/connections/mac.spec.ts`:

```ts
import { hashMac, normalizeMac } from './mac';

describe('mac', () => {
  it('normaliza maiúsculas e hífens', () => {
    expect(normalizeMac('AA-BB-CC-DD-EE-FF')).toBe('aa:bb:cc:dd:ee:ff');
  });

  it('gera o mesmo hash para formatos diferentes do mesmo MAC', () => {
    expect(hashMac('AA-BB-CC-DD-EE-FF', 's')).toBe(hashMac('aa:bb:cc:dd:ee:ff', 's'));
  });

  it('depende do segredo e não contém o MAC', () => {
    const h = hashMac('aa:bb:cc:dd:ee:ff', 'segredo-1');
    expect(h).not.toBe(hashMac('aa:bb:cc:dd:ee:ff', 'segredo-2'));
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});
```

- [ ] **Step 2: Testes da regra de visita** — `apps/api/src/connections/merge.spec.ts`:

```ts
import { mergedEnd, shouldMerge } from './merge';

const t = (hhmm: string) => new Date(`2026-10-10T${hhmm}:00-03:00`);

describe('shouldMerge', () => {
  it('sem visita anterior cria nova', () => {
    expect(shouldMerge(null, t('14:00'))).toBe(false);
  });
  it('reconexão até 30 min após o fim soma à visita', () => {
    expect(shouldMerge({ startedAt: t('14:00'), endedAt: t('14:20') }, t('14:50'))).toBe(true);
  });
  it('reconexão depois de 30 min é visita nova', () => {
    expect(shouldMerge({ startedAt: t('14:00'), endedAt: t('14:20') }, t('14:51'))).toBe(false);
  });
  it('visita aberta absorve reconexão', () => {
    expect(shouldMerge({ startedAt: t('14:00'), endedAt: null }, t('16:00'))).toBe(true);
  });
  it('visita aberta há mais de 12 h não absorve', () => {
    expect(shouldMerge({ startedAt: new Date('2026-10-10T08:00:00-03:00'), endedAt: null }, new Date('2026-10-10T20:01:00-03:00'))).toBe(false);
  });
  it('evento repetido (mesma entrada) soma à visita existente', () => {
    expect(shouldMerge({ startedAt: t('14:00'), endedAt: t('14:20') }, t('14:00'))).toBe(true);
  });
});

describe('mergedEnd', () => {
  it('usa a saída mais tardia', () => {
    expect(mergedEnd(t('14:20'), t('14:00'), t('14:10'))).toEqual(t('14:20'));
    expect(mergedEnd(t('14:20'), t('14:30'), t('14:40'))).toEqual(t('14:40'));
  });
  it('reconexão sem saída reabre a visita', () => {
    expect(mergedEnd(t('14:20'), t('14:30'), null)).toBeNull();
  });
  it('evento repetido sem saída não reabre visita já encerrada', () => {
    expect(mergedEnd(t('14:20'), t('14:00'), null)).toEqual(t('14:20'));
  });
  it('visita aberta recebe a saída', () => {
    expect(mergedEnd(null, t('14:00'), t('14:15'))).toEqual(t('14:15'));
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm --filter @wifi/api test -- connections`
Expected: FAIL — `Cannot find module './mac'` / `'./merge'`.

- [ ] **Step 4: Implementar**

`apps/api/src/connections/mac.ts`:
```ts
import { createHmac } from 'node:crypto';

export function normalizeMac(mac: string): string {
  return mac.toLowerCase().replace(/-/g, ':');
}

/** HMAC em vez de hash simples: o espaço de MACs é pequeno o bastante para força bruta. */
export function hashMac(mac: string, secret: string): string {
  return createHmac('sha256', secret).update(normalizeMac(mac)).digest('hex');
}
```

`apps/api/src/connections/merge.ts`:
```ts
export const MERGE_GAP_MS = 30 * 60_000;
export const MAX_OPEN_VISIT_MS = 12 * 60 * 60_000;

export type VisitWindow = { startedAt: Date; endedAt: Date | null };

/** A nova conexão pertence à última visita do aparelho? */
export function shouldMerge(last: VisitWindow | null, connectedAt: Date): boolean {
  if (!last) return false;
  if (last.endedAt === null) return connectedAt.getTime() - last.startedAt.getTime() <= MAX_OPEN_VISIT_MS;
  return connectedAt.getTime() - last.endedAt.getTime() <= MERGE_GAP_MS;
}

/** Fim da visita depois de somar a conexão. null = aparelho ainda conectado. */
export function mergedEnd(lastEnd: Date | null, connectedAt: Date, disconnectedAt: Date | null): Date | null {
  if (disconnectedAt) return lastEnd && lastEnd > disconnectedAt ? lastEnd : disconnectedAt;
  return lastEnd && lastEnd >= connectedAt ? lastEnd : null;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm --filter @wifi/api test -- connections`
Expected: PASS (13 testes).

- [ ] **Step 6: Guard, service, controller, módulo**

`apps/api/src/common/api-key.guard.ts`:
```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
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
```

`apps/api/src/connections/connections.service.ts`:
```ts
import { Injectable } from '@nestjs/common';
import type { ConnectionInput, IngestResult } from '@wifi/shared';
import { env } from '../env';
import { PrismaService } from '../prisma/prisma.service';
import { hashMac } from './mac';
import { mergedEnd, shouldMerge } from './merge';

@Injectable()
export class ConnectionsService {
  constructor(private readonly prisma: PrismaService) {}

  // trade-off: dois eventos simultâneos do mesmo aparelho podem criar duas visitas; lock por aparelho se a controladora mandar em paralelo
  async ingest(storeId: string, input: ConnectionInput): Promise<IngestResult> {
    const connectedAt = new Date(input.connectedAt);
    const disconnectedAt = input.disconnectedAt ? new Date(input.disconnectedAt) : null;
    const seenAt = disconnectedAt ?? connectedAt;
    const macHash = hashMac(input.mac, env.MAC_HASH_SECRET);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.device.findUnique({ where: { storeId_macHash: { storeId, macHash } } });
      const device = existing
        ? await tx.device.update({
            where: { id: existing.id },
            data: {
              firstSeenAt: connectedAt < existing.firstSeenAt ? connectedAt : undefined,
              lastSeenAt: seenAt > existing.lastSeenAt ? seenAt : undefined,
            },
          })
        : await tx.device.create({ data: { storeId, macHash, firstSeenAt: connectedAt, lastSeenAt: seenAt } });

      if (input.lead) {
        const lead = { ...input.lead, consentAt: new Date() };
        await tx.lead.upsert({ where: { deviceId: device.id }, create: { deviceId: device.id, ...lead }, update: lead });
      }

      const last = await tx.visit.findFirst({
        where: { deviceId: device.id, startedAt: { lte: connectedAt } },
        orderBy: { startedAt: 'desc' },
      });

      if (last && shouldMerge(last, connectedAt)) {
        await tx.visit.update({
          where: { id: last.id },
          data: { endedAt: mergedEnd(last.endedAt, connectedAt, disconnectedAt) },
        });
        return { visitId: last.id, merged: true };
      }

      const visit = await tx.visit.create({
        data: { storeId, deviceId: device.id, startedAt: connectedAt, endedAt: disconnectedAt },
      });
      return { visitId: visit.id, merged: false };
    });
  }
}
```

`apps/api/src/connections/connections.controller.ts`:
```ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { connectionInputSchema, type ConnectionInput } from '@wifi/shared';
import { z } from 'zod';
import { ApiKeyGuard } from '../common/api-key.guard';
import { StoreId } from '../common/store-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ConnectionsService } from './connections.service';

@ApiTags('ingestão')
@ApiSecurity('ingest')
@Controller('connections')
@UseGuards(ApiKeyGuard)
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}

  /** Simula o portal do Wi-Fi registrando uma conexão (e a saída, quando houver). */
  @Post()
  @ApiBody({ schema: z.toJSONSchema(connectionInputSchema, { unrepresentable: 'any' }) as object })
  ingest(@StoreId() storeId: string, @Body(new ZodValidationPipe(connectionInputSchema)) body: ConnectionInput) {
    return this.connections.ingest(storeId, body);
  }
}
```
Se `z.toJSONSchema` quebrar a geração do Swagger, troque o `@ApiBody` por `@ApiBody({ description: 'Ver ConnectionInput em packages/shared' })` e registre isso em `docs/ai-log.md`.

`apps/api/src/connections/connections.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';

@Module({ controllers: [ConnectionsController], providers: [ConnectionsService], exports: [ConnectionsService] })
export class ConnectionsModule {}
```

Em `app.module.ts`, acrescente `ConnectionsModule` aos `imports`.

- [ ] **Step 7: Verificar manualmente**

Com `start:dev` rodando e uma loja criada (`psql -d wifi -c "insert into \"Store\"(id,name) values ('loja-demo','Loja Demo') on conflict do nothing"`):
```bash
curl -s -XPOST localhost:3001/connections -H 'content-type: application/json' -H 'x-api-key: chave-de-ingestao-local-123456' \
  -d "{\"mac\":\"AA:BB:CC:DD:EE:01\",\"connectedAt\":\"$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ)\"}"
```
Expected: `{"visitId":"...","merged":false}`; repetindo o mesmo comando → `"merged":true`; sem o header → 401 no formato padrão.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(api): ingestão de conexões com MAC em HMAC e regra de visita de 30 min"
```

---

### Task 4: Métricas como funções puras (fuso, períodos, KPIs, insights)

**Files:**
- Create: `apps/api/src/common/time.ts`, `time.spec.ts`
- Create: `apps/api/src/metrics/compute-metrics.ts`, `compute-metrics.spec.ts`, `insights.ts`, `insights.spec.ts`

**Interfaces:**
- Consumes: `MetricsCore`, `Kpi` de `@wifi/shared`.
- Produces: `DAY_MS`; `localParts(date: Date, timeZone: string): { dateKey: string; weekday: number; hour: number; minute: number; second: number }`; `startOfLocalDay(date: Date, timeZone: string): Date`; `VisitRow = { deviceId: string; startedAt: Date; endedAt: Date | null; deviceFirstSeenAt: Date; optIn: boolean }`; `periodBounds(now: Date, days: number, timeZone: string): { curFrom: Date; prevFrom: Date; prevTo: Date }`; `computeMetrics(rows: VisitRow[], opts: { now: Date; days: number; timeZone: string }): MetricsCore`; `buildInsights(m: MetricsCore): string[]`.

- [ ] **Step 1: Testes de fuso** — `apps/api/src/common/time.spec.ts`:

```ts
import { localParts, startOfLocalDay } from './time';

const SP = 'America/Sao_Paulo';

describe('time', () => {
  it('01:30Z é 22:30 de domingo do dia anterior em São Paulo', () => {
    expect(localParts(new Date('2026-10-12T01:30:00Z'), SP)).toMatchObject({ dateKey: '2026-10-11', hour: 22, weekday: 0 });
  });
  it('meia-noite local vira hora 0, não 24', () => {
    expect(localParts(new Date('2026-10-12T03:00:00Z'), SP)).toMatchObject({ dateKey: '2026-10-12', hour: 0, weekday: 1 });
  });
  it('início do dia local', () => {
    expect(startOfLocalDay(new Date('2026-10-12T18:00:00Z'), SP).toISOString()).toBe('2026-10-12T03:00:00.000Z');
    expect(startOfLocalDay(new Date('2026-10-12T01:30:00Z'), SP).toISOString()).toBe('2026-10-11T03:00:00.000Z');
  });
});
```

- [ ] **Step 2: Testes das métricas** — `apps/api/src/metrics/compute-metrics.spec.ts`:

```ts
import { computeMetrics, type VisitRow } from './compute-metrics';

const SP = 'America/Sao_Paulo';
const now = new Date('2026-10-12T15:00:00-03:00'); // segunda-feira
const d = (s: string) => new Date(s);

const row = (p: Partial<VisitRow> & Pick<VisitRow, 'deviceId' | 'startedAt'>): VisitRow => ({
  endedAt: null,
  deviceFirstSeenAt: p.startedAt,
  optIn: false,
  ...p,
});

describe('computeMetrics', () => {
  it('sem visitas: zeros e nulos, sem NaN', () => {
    const m = computeMetrics([], { now, days: 7, timeZone: SP });
    expect(m.kpis.visits).toEqual({ value: 0, previous: 0, delta: null });
    expect(m.kpis.uniqueVisitors.value).toBe(0);
    expect(m.kpis.returningRate.value).toBeNull();
    expect(m.kpis.medianDwellMinutes.value).toBeNull();
    expect(m.kpis.optInRate.value).toBeNull();
    expect(m.daily).toHaveLength(7);
    expect(m.heatmap).toHaveLength(168);
    expect(JSON.stringify(m)).not.toContain('NaN');
  });

  const rows: VisitRow[] = [
    // A: cliente antigo, voltou no domingo, ficou 30 min, aceitou comunicações
    row({ deviceId: 'A', deviceFirstSeenAt: d('2026-09-01T10:00:00-03:00'), startedAt: d('2026-10-11T14:00:00-03:00'), endedAt: d('2026-10-11T14:30:00-03:00'), optIn: true }),
    // B: primeira vez hoje, 10 min
    row({ deviceId: 'B', startedAt: d('2026-10-12T10:00:00-03:00'), endedAt: d('2026-10-12T10:10:00-03:00') }),
    // B de novo no mesmo dia: não é recorrente; visita aberta não entra na permanência
    row({ deviceId: 'B', deviceFirstSeenAt: d('2026-10-12T10:00:00-03:00'), startedAt: d('2026-10-12T13:00:00-03:00') }),
    // C: período anterior (os 7 dias antes, até o mesmo horário)
    row({ deviceId: 'C', startedAt: d('2026-10-04T15:00:00-03:00'), endedAt: d('2026-10-04T15:05:00-03:00') }),
    // D: 22:30 de domingo no horário local (01:30Z de segunda)
    row({ deviceId: 'D', startedAt: d('2026-10-12T01:30:00Z'), endedAt: d('2026-10-12T01:50:00Z') }),
  ];
  const m = computeMetrics(rows, { now, days: 7, timeZone: SP });

  it('KPIs do período', () => {
    expect(m.kpis.uniqueVisitors).toEqual({ value: 3, previous: 1, delta: 200 });
    expect(m.kpis.visits.value).toBe(4);
    expect(m.kpis.returningRate.value).toBe(33.3);
    expect(m.kpis.medianDwellMinutes.value).toBe(20);
    expect(m.kpis.optInRate.value).toBe(33.3);
  });

  it('taxas comparam em pontos percentuais', () => {
    expect(m.kpis.optInRate.previous).toBe(0);
    expect(m.kpis.optInRate.delta).toBe(33.3);
  });

  it('série diária no dia local', () => {
    expect(m.daily.at(-1)).toEqual({ date: '2026-10-12', newVisitors: 1, returningVisitors: 0 });
    expect(m.daily.at(-2)).toEqual({ date: '2026-10-11', newVisitors: 1, returningVisitors: 1 });
    expect(m.daily[0].date).toBe('2026-10-06');
  });

  it('mapa de calor no horário local', () => {
    expect(m.heatmap[0 * 24 + 22]).toEqual({ weekday: 0, hour: 22, avgVisits: 1 });
    expect(m.heatmap[1 * 24 + 10].avgVisits).toBe(1);
  });

  it('faixas de permanência só com visitas encerradas', () => {
    // 10 min → "5 a 15"; 20 → "15 a 30"; 30 → "30 min ou mais"
    expect(m.dwellBuckets.map((b) => b.count)).toEqual([0, 1, 1, 1]);
  });
});
```
(Conferência: atuais = A (30 min), B (10), B (aberta), D (20) → 4 visitas, 3 aparelhos; recorrente só A → 33,3%; mediana de [30, 10, 20] = 20; opt-in só A → 33,3%; anterior só C → delta de únicos = 200%.)

- [ ] **Step 3: Testes dos insights** — `apps/api/src/metrics/insights.spec.ts`:

```ts
import type { Kpi, MetricsCore } from '@wifi/shared';
import { buildInsights } from './insights';

const kpi = (value: number | null, delta: number | null = null): Kpi => ({ value, previous: null, delta });

function core(over: Partial<MetricsCore['kpis']> = {}, peak = { weekday: 6, hour: 15, avg: 9 }): MetricsCore {
  const heatmap = Array.from({ length: 168 }, (_, i) => {
    const weekday = Math.floor(i / 24), hour = i % 24;
    const open = hour >= 10 && hour < 22;
    let avgVisits = open ? (weekday === 2 ? 1 : 3) : 0;
    if (weekday === peak.weekday && hour === peak.hour) avgVisits = peak.avg;
    return { weekday, hour, avgVisits };
  });
  return {
    range: { from: '', to: '', days: 30 },
    kpis: {
      uniqueVisitors: kpi(100, 0),
      visits: kpi(120),
      returningRate: kpi(40),
      medianDwellMinutes: kpi(12),
      optInRate: kpi(50),
      ...over,
    },
    daily: [],
    heatmap,
    dwellBuckets: [],
  };
}

describe('buildInsights', () => {
  it('sem visitas orienta a gerar dados', () => {
    const out = buildInsights(core({ visits: kpi(0) }));
    expect(out).toHaveLength(1);
    expect(out[0]).toContain('Simular');
  });
  it('aponta o pico e o dia mais fraco', () => {
    const out = buildInsights(core());
    expect(out[0]).toContain('sábado das 15h às 16h');
    expect(out[1]).toContain('Terça-feira é o dia mais fraco');
  });
  it('tendência de alta e de queda', () => {
    expect(buildInsights(core({ uniqueVisitors: kpi(100, 12.5) })).join(' ')).toContain('subiram 12,5%');
    expect(buildInsights(core({ uniqueVisitors: kpi(100, -20) })).join(' ')).toContain('caíram 20%');
  });
  it('recorrência e opt-in baixos', () => {
    const out = buildInsights(core({ returningRate: kpi(18), optInRate: kpi(22.5) })).join(' ');
    expect(out).toContain('Só 18% dos visitantes');
    expect(out).toContain('Apenas 22,5% aceitaram');
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `pnpm --filter @wifi/api test -- time metrics`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 5: Implementar `time.ts`** — `apps/api/src/common/time.ts`:

```ts
export const DAY_MS = 86_400_000;

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Data/hora no fuso da loja. dateKey = AAAA-MM-DD; weekday 0 = domingo. */
export function localParts(date: Date, timeZone: string) {
  const p = Object.fromEntries(formatter(timeZone).formatToParts(date).map((x) => [x.type, x.value]));
  return {
    dateKey: `${p.year}-${p.month}-${p.day}`,
    weekday: WEEKDAYS_EN.indexOf(p.weekday),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

// trade-off: usa o deslocamento do fuso no instante `date`; erra se houver horário de verão entre a meia-noite e `date` (Brasil não tem desde 2019)
export function startOfLocalDay(date: Date, timeZone: string): Date {
  const p = localParts(date, timeZone);
  const [y, m, d] = p.dateKey.split('-').map(Number);
  const wholeSeconds = Math.floor(date.getTime() / 1000) * 1000;
  const offset = Date.UTC(y, m - 1, d, p.hour, p.minute, p.second) - wholeSeconds;
  return new Date(Date.UTC(y, m - 1, d) - offset);
}
```

- [ ] **Step 6: Implementar `compute-metrics.ts`** — `apps/api/src/metrics/compute-metrics.ts`:

```ts
import type { Kpi, MetricsCore } from '@wifi/shared';
import { DAY_MS, localParts, startOfLocalDay } from '../common/time';

export type VisitRow = {
  deviceId: string;
  startedAt: Date;
  endedAt: Date | null;
  deviceFirstSeenAt: Date;
  optIn: boolean;
};

const DWELL_BUCKETS = [
  { label: 'Até 5 min', max: 5 },
  { label: '5 a 15 min', max: 15 },
  { label: '15 a 30 min', max: 30 },
  { label: '30 min ou mais', max: Infinity },
];

const round1 = (n: number) => Math.round(n * 10) / 10;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const dwellMinutes = (r: VisitRow) => (r.endedAt ? (r.endedAt.getTime() - r.startedAt.getTime()) / 60_000 : null);

/** Período atual: dias locais completos até agora. Anterior: mesmo tamanho, até o mesmo ponto. */
export function periodBounds(now: Date, days: number, timeZone: string) {
  const curFrom = startOfLocalDay(new Date(now.getTime() - (days - 1) * DAY_MS), timeZone);
  return {
    curFrom,
    prevFrom: new Date(curFrom.getTime() - days * DAY_MS),
    prevTo: new Date(now.getTime() - days * DAY_MS),
  };
}

function summarize(rows: VisitRow[], tz: string) {
  const devices = new Set<string>();
  const returning = new Set<string>();
  const optIn = new Set<string>();
  const dwell: number[] = [];
  for (const r of rows) {
    devices.add(r.deviceId);
    if (localParts(r.deviceFirstSeenAt, tz).dateKey < localParts(r.startedAt, tz).dateKey) returning.add(r.deviceId);
    if (r.optIn) optIn.add(r.deviceId);
    const m = dwellMinutes(r);
    if (m !== null) dwell.push(m);
  }
  const pct = (n: number) => (devices.size ? round1((n / devices.size) * 100) : null);
  const med = median(dwell);
  return {
    uniqueVisitors: devices.size,
    visits: rows.length,
    returningRate: pct(returning.size),
    medianDwellMinutes: med === null ? null : round1(med),
    optInRate: pct(optIn.size),
  };
}

function kpi(value: number | null, previous: number | null, kind: 'relative' | 'points'): Kpi {
  if (value === null || previous === null) return { value, previous, delta: null };
  if (kind === 'points') return { value, previous, delta: round1(value - previous) };
  return { value, previous, delta: previous === 0 ? null : round1(((value - previous) / previous) * 100) };
}

// trade-off: agrega em memória (ok até centenas de milhares de visitas por período); depois disso, GROUP BY no Postgres ou tabela diária pré-calculada
export function computeMetrics(rows: VisitRow[], opts: { now: Date; days: number; timeZone: string }): MetricsCore {
  const { now, days, timeZone: tz } = opts;
  const { curFrom, prevFrom, prevTo } = periodBounds(now, days, tz);
  const current = rows.filter((r) => r.startedAt >= curFrom && r.startedAt <= now);
  const previous = rows.filter((r) => r.startedAt >= prevFrom && r.startedAt <= prevTo);
  const cur = summarize(current, tz);
  const prev = summarize(previous, tz);

  // dias locais do período (meio-dia evita bordas de fuso)
  const dayInfo = Array.from({ length: days }, (_, i) => localParts(new Date(curFrom.getTime() + i * DAY_MS + DAY_MS / 2), tz));

  const daily = new Map(dayInfo.map((p) => [p.dateKey, { newDevices: new Set<string>(), returningDevices: new Set<string>() }]));
  const slots = new Array<number>(168).fill(0);
  const buckets = DWELL_BUCKETS.map(() => 0);

  for (const r of current) {
    const p = localParts(r.startedAt, tz);
    const isReturning = localParts(r.deviceFirstSeenAt, tz).dateKey < p.dateKey;
    const day = daily.get(p.dateKey);
    if (day) (isReturning ? day.returningDevices : day.newDevices).add(r.deviceId);
    slots[p.weekday * 24 + p.hour]++;
    const m = dwellMinutes(r);
    if (m !== null) buckets[DWELL_BUCKETS.findIndex((b) => m < b.max)]++;
  }

  const weekdayCount = new Array<number>(7).fill(0);
  for (const p of dayInfo) weekdayCount[p.weekday]++;

  return {
    range: { from: curFrom.toISOString(), to: now.toISOString(), days },
    kpis: {
      uniqueVisitors: kpi(cur.uniqueVisitors, prev.uniqueVisitors, 'relative'),
      visits: kpi(cur.visits, prev.visits, 'relative'),
      returningRate: kpi(cur.returningRate, prev.returningRate, 'points'),
      medianDwellMinutes: kpi(cur.medianDwellMinutes, prev.medianDwellMinutes, 'relative'),
      optInRate: kpi(cur.optInRate, prev.optInRate, 'points'),
    },
    daily: [...daily].map(([date, v]) => ({ date, newVisitors: v.newDevices.size, returningVisitors: v.returningDevices.size })),
    heatmap: slots.map((count, i) => {
      const weekday = Math.floor(i / 24);
      return { weekday, hour: i % 24, avgVisits: weekdayCount[weekday] ? round1(count / weekdayCount[weekday]) : 0 };
    }),
    dwellBuckets: DWELL_BUCKETS.map((b, i) => ({ label: b.label, count: buckets[i] })),
  };
}
```
Observação para o teste de "sem visitas": `previous` de `optInRate` é `null` quando o período anterior está vazio, e `visits.previous` é `0` → `delta: null`. Confere com o Step 2.

No teste "taxas comparam em pontos percentuais" o período anterior tem só C (sem opt-in) → `previous: 0`, `delta: 33.3`. Confere.

- [ ] **Step 7: Implementar `insights.ts`** — `apps/api/src/metrics/insights.ts`:

```ts
import type { MetricsCore } from '@wifi/shared';

const WEEKDAYS_PT = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Leituras em linguagem de negócio, cada uma com a ação sugerida. */
export function buildInsights(m: MetricsCore): string[] {
  if (m.kpis.visits.value === 0) {
    return ['Ainda não há visitas neste período. Gere movimento na página “Simular dados” ou aguarde as primeiras conexões.'];
  }
  const out: string[] = [];

  const peak = m.heatmap.reduce((a, b) => (b.avgVisits > a.avgVisits ? b : a));
  out.push(
    `Pico de movimento: ${WEEKDAYS_PT[peak.weekday]} das ${peak.hour}h às ${peak.hour + 1}h (média de ${num(peak.avgVisits)} visitas). Reforce a equipe nesse horário.`,
  );

  const byWeekday = WEEKDAYS_PT.map((_, w) => ({
    w,
    total: m.heatmap.filter((c) => c.weekday === w).reduce((s, c) => s + c.avgVisits, 0),
  })).filter((d) => d.total > 0);
  if (byWeekday.length > 1) {
    const weakest = byWeekday.reduce((a, b) => (b.total < a.total ? b : a));
    out.push(`${capitalize(WEEKDAYS_PT[weakest.w])} é o dia mais fraco da semana — boa janela para ações promocionais.`);
  }

  const trend = m.kpis.uniqueVisitors.delta;
  if (trend !== null && trend >= 10) out.push(`Visitantes únicos subiram ${num(trend)}% em relação ao período anterior.`);
  if (trend !== null && trend <= -10) {
    out.push(`Visitantes únicos caíram ${num(Math.abs(trend))}% em relação ao período anterior — vale investigar o que mudou.`);
  }

  const returning = m.kpis.returningRate.value;
  if (returning !== null && returning < 25) {
    out.push(`Só ${num(returning)}% dos visitantes já tinham vindo antes — um cupom de retorno ou programa de fidelidade pode ajudar.`);
  }

  const optIn = m.kpis.optInRate.value;
  if (optIn !== null && optIn < 30) {
    out.push(`Apenas ${num(optIn)}% aceitaram receber comunicações — revise o incentivo do cadastro no Wi-Fi.`);
  }
  return out;
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `pnpm --filter @wifi/api test -- time metrics`
Expected: PASS. Se algum número divergir, recalcule à mão a partir dos comentários do teste antes de mudar o código — o teste é a especificação.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(api): cálculo de métricas no fuso da loja e insights de negócio"
```

---

### Task 5: Autenticação + endpoint de métricas + testes e2e

**Files:**
- Create: `apps/api/src/auth/auth.service.ts`, `auth.controller.ts`, `jwt-auth.guard.ts`, `login-throttler.guard.ts`, `auth.module.ts`
- Create: `apps/api/src/metrics/metrics.service.ts`, `metrics.controller.ts`, `metrics.module.ts`
- Create: `apps/api/test/app.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `env`, `PrismaService`, `ZodValidationPipe`, `StoreId`, `AppRequest`, `computeMetrics`, `periodBounds`, `VisitRow`, `buildInsights`, `loginSchema`, `metricsQuerySchema`, `RANGE_DAYS`, `Metrics`.
- Produces: `POST /auth/login` → `200 { accessToken: string }`; `JwtAuthGuard` (exportado por `AuthModule`); `GET /metrics?range=` → `Metrics`.

- [ ] **Step 1: Auth**

`apps/api/src/auth/jwt-auth.guard.ts`:
```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AppRequest } from '../common/app-request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AppRequest>();
    const [type, token] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('Sessão ausente.');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; storeId: string }>(token);
      req.user = { userId: payload.sub, storeId: payload.storeId };
      return true;
    } catch {
      throw new UnauthorizedException('Sessão expirada ou inválida.');
    }
  }
}
```

`apps/api/src/auth/login-throttler.guard.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Limita por e-mail: todas as chamadas chegam do servidor do Next, então o IP não distingue usuários. */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return String(req.body?.email ?? req.ip).toLowerCase();
  }
}
```

`apps/api/src/auth/auth.service.ts`:
```ts
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
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new UnauthorizedException('E-mail ou senha inválidos.');
    return { accessToken: await this.jwt.signAsync({ sub: user.id, storeId: user.storeId }) };
  }
}
```

`apps/api/src/auth/auth.controller.ts`:
```ts
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { loginSchema, type LoginInput } from '@wifi/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';
import { LoginThrottlerGuard } from './login-throttler.guard';

@ApiTags('autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(LoginThrottlerGuard)
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body.email, body.password);
  }
}
```

`apps/api/src/auth/auth.module.ts`:
```ts
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { env } from '../env';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Global()
@Module({
  imports: [
    JwtModule.register({ secret: env.JWT_SECRET, signOptions: { expiresIn: '8h' } }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
```

- [ ] **Step 2: Métricas**

`apps/api/src/metrics/metrics.service.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { RANGE_DAYS, type Metrics, type Range } from '@wifi/shared';
import { PrismaService } from '../prisma/prisma.service';
import { computeMetrics, periodBounds, type VisitRow } from './compute-metrics';
import { buildInsights } from './insights';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(storeId: string, range: Range, now = new Date()): Promise<Metrics> {
    const days = RANGE_DAYS[range];
    const store = await this.prisma.store.findUniqueOrThrow({ where: { id: storeId } });
    const { prevFrom } = periodBounds(now, days, store.timezone);
    const visits = await this.prisma.visit.findMany({
      where: { storeId, startedAt: { gte: prevFrom, lte: now } },
      select: {
        deviceId: true,
        startedAt: true,
        endedAt: true,
        device: { select: { firstSeenAt: true, lead: { select: { marketingOptIn: true } } } },
      },
    });
    const rows: VisitRow[] = visits.map((v) => ({
      deviceId: v.deviceId,
      startedAt: v.startedAt,
      endedAt: v.endedAt,
      deviceFirstSeenAt: v.device.firstSeenAt,
      optIn: v.device.lead?.marketingOptIn ?? false,
    }));
    const core = computeMetrics(rows, { now, days, timeZone: store.timezone });
    return { ...core, insights: buildInsights(core) };
  }
}
```

`apps/api/src/metrics/metrics.controller.ts`:
```ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { metricsQuerySchema, type MetricsQuery } from '@wifi/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreId } from '../common/store-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MetricsService } from './metrics.service';

@ApiTags('métricas')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @ApiQuery({ name: 'range', enum: ['7d', '30d', '90d'], required: false })
  get(@StoreId() storeId: string, @Query(new ZodValidationPipe(metricsQuerySchema)) query: MetricsQuery) {
    return this.metrics.get(storeId, query.range);
  }
}
```

`apps/api/src/metrics/metrics.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({ controllers: [MetricsController], providers: [MetricsService] })
export class MetricsModule {}
```

Em `app.module.ts`, acrescente `AuthModule` e `MetricsModule` aos `imports`.

- [ ] **Step 3: Teste e2e** — `apps/api/test/app.e2e-spec.ts`:

```ts
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { env } from '../src/env';
import { PrismaService } from '../src/prisma/prisma.service';
import { configureApp } from '../src/setup';

if (!/localhost|127\.0\.0\.1/.test(env.DATABASE_URL)) {
  throw new Error('Os testes e2e apagam dados da loja: rode apenas contra um banco local.');
}

const OWNER = { email: 'e2e@loja.test', password: 'senha-e2e-123' };
const storeId = env.DEFAULT_STORE_ID;
const key = { 'x-api-key': env.INGEST_API_KEY };
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const event = { mac: 'AA:BB:CC:DD:EE:01', connectedAt: hoursAgo(2), disconnectedAt: hoursAgo(1.5) };

describe('API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.store.upsert({ where: { id: storeId }, create: { id: storeId, name: 'Loja E2E' }, update: {} });
    await prisma.lead.deleteMany({ where: { device: { storeId } } });
    await prisma.visit.deleteMany({ where: { storeId } });
    await prisma.device.deleteMany({ where: { storeId } });
    await prisma.user.upsert({
      where: { email: OWNER.email },
      create: { email: OWNER.email, passwordHash: await bcrypt.hash(OWNER.password, 4), storeId },
      update: {},
    });
  });

  afterAll(() => app.close());

  it('GET /health', () => http().get('/health').expect(200, { status: 'ok' }));

  it('ingestão sem chave → 401 no formato padrão', async () => {
    const res = await http().post('/connections').send(event).expect(401);
    expect(res.body).toMatchObject({ statusCode: 401, path: '/connections' });
  });

  it('MAC inválido → 400 com erro no campo', async () => {
    const res = await http().post('/connections').set(key).send({ ...event, mac: 'xyz' }).expect(400);
    expect(res.body.details.mac).toBeDefined();
  });

  it('saída antes da entrada → 400', async () => {
    const res = await http().post('/connections').set(key).send({ ...event, disconnectedAt: hoursAgo(3) }).expect(400);
    expect(res.body.details.disconnectedAt).toBeDefined();
  });

  it('entrada no futuro → 400', async () => {
    const res = await http().post('/connections').set(key).send({ mac: event.mac, connectedAt: hoursAgo(-2) }).expect(400);
    expect(res.body.details.connectedAt).toBeDefined();
  });

  it('evento repetido não duplica a visita', async () => {
    const a = await http().post('/connections').set(key).send(event).expect(201);
    const b = await http().post('/connections').set(key).send(event).expect(201);
    expect(a.body.merged).toBe(false);
    expect(b.body).toEqual({ visitId: a.body.visitId, merged: true });
    expect(await prisma.visit.count({ where: { storeId } })).toBe(1);
  });

  it('login com senha errada → 401', () =>
    http().post('/auth/login').send({ ...OWNER, password: 'errada' }).expect(401));

  it('métricas exigem token', () => http().get('/metrics').expect(401));

  it('token inválido → 401', () => http().get('/metrics').set('authorization', 'Bearer abc').expect(401));

  it('métricas com token', async () => {
    const login = await http().post('/auth/login').send(OWNER).expect(200);
    const res = await http()
      .get('/metrics?range=7d')
      .set('authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
    expect(res.body.kpis.visits.value).toBe(1);
    expect(res.body.heatmap).toHaveLength(168);
    expect(res.body.insights.length).toBeGreaterThan(0);
  });

  it('período inválido → 400', async () => {
    const login = await http().post('/auth/login').send(OWNER).expect(200);
    await http().get('/metrics?range=1y').set('authorization', `Bearer ${login.body.accessToken}`).expect(400);
  });
});
```

- [ ] **Step 4: Rodar**

Run: `pnpm --filter @wifi/shared build && pnpm --filter @wifi/api test:e2e`
Expected: PASS (11 testes). Se o import `request from 'supertest'` falhar, use `import * as request from 'supertest'` (depende do `esModuleInterop` do scaffold).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(api): login JWT com limite por e-mail, endpoint de métricas e testes e2e"
```

---

### Task 6: Gerador de movimento, seed e simulação

**Files:**
- Create: `apps/api/src/simulation/generator.ts`, `generator.spec.ts`, `simulation.controller.ts`, `simulation.module.ts`
- Create: `apps/api/prisma/seed.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `DAY_MS`, `hashMac`, `env`, `ConnectionsService.ingest`, `JwtAuthGuard`, `StoreId`, `ZodValidationPipe`, `simulateInputSchema`.
- Produces: `mulberry32(seed: number): () => number`; `GeneratedVisit = { mac: string; connectedAt: Date; disconnectedAt?: Date; lead?: { name: string; email?: string; marketingOptIn: boolean } }`; `generateVisits(opts: { from: Date; to: Date; avgPerDay: number; seed?: number }): GeneratedVisit[]`; `generateRecent(rng: () => number, now: Date, count: number): GeneratedVisit[]`; `POST /simulate { visits }` → `{ created: number }`; `pnpm --filter @wifi/api seed`.

- [ ] **Step 1: Testes do gerador** — `apps/api/src/simulation/generator.spec.ts`:

```ts
import { generateRecent, generateVisits, mulberry32 } from './generator';

const from = new Date('2026-08-01T03:00:00Z'); // 00:00 local
const to = new Date('2026-09-26T03:00:00Z'); // 8 semanas
const visits = generateVisits({ from, to, avgPerDay: 60, seed: 7 });
const localHour = (d: Date) => (d.getUTCHours() + 21) % 24; // UTC-3
const localWeekday = (d: Date) => new Date(d.getTime() - 3 * 3_600_000).getUTCDay();

describe('generateVisits', () => {
  it('é determinístico para a mesma semente', () => {
    expect(generateVisits({ from, to, avgPerDay: 60, seed: 7 })).toEqual(visits);
  });
  it('fica dentro do intervalo e do horário da loja (10h–22h)', () => {
    for (const v of visits) {
      expect(v.connectedAt.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(v.connectedAt.getTime()).toBeLessThanOrEqual(to.getTime());
      expect(localHour(v.connectedAt)).toBeGreaterThanOrEqual(10);
      expect(localHour(v.connectedAt)).toBeLessThan(22);
      if (v.disconnectedAt) expect(v.disconnectedAt > v.connectedAt).toBe(true);
    }
  });
  it('tem clientes que voltam', () => {
    expect(new Set(visits.map((v) => v.mac)).size).toBeLessThan(visits.length * 0.8);
  });
  it('sábado tem mais movimento que terça', () => {
    const count = (w: number) => visits.filter((v) => localWeekday(v.connectedAt) === w).length;
    expect(count(6)).toBeGreaterThan(count(2));
  });
});

describe('generateRecent', () => {
  it('gera N visitas nas últimas 2 h, nunca no futuro', () => {
    const now = new Date('2026-10-12T18:00:00Z');
    const out = generateRecent(mulberry32(1), now, 25);
    expect(out).toHaveLength(25);
    for (const v of out) {
      expect(v.connectedAt <= now).toBe(true);
      expect(now.getTime() - v.connectedAt.getTime()).toBeLessThanOrEqual(2 * 3_600_000);
      if (v.disconnectedAt) expect(v.disconnectedAt <= now).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm --filter @wifi/api test -- generator`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar** — `apps/api/src/simulation/generator.ts`:

```ts
import { DAY_MS } from '../common/time';

export type GeneratedVisit = {
  mac: string;
  connectedAt: Date;
  disconnectedAt?: Date;
  lead?: { name: string; email?: string; marketingOptIn: boolean };
};

// trade-off: UTC-3 fixo (Brasil sem horário de verão desde 2019); usar localParts se houver lojas em outros fusos
const STORE_OFFSET_MS = -3 * 3_600_000;
const OPEN_HOUR = 10;
const HOUR_WEIGHTS = [0.4, 0.6, 0.9, 0.8, 0.7, 0.8, 1.0, 1.2, 1.3, 1.1, 0.8, 0.5]; // 10h..21h
const WEEKDAY_FACTOR = [0.6, 0.7, 0.8, 0.85, 0.95, 1.2, 1.5]; // dom..sáb
const RETURNING_SHARE = 0.3;
const NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Juliana', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sofia', 'Tiago'];

/** PRNG pequeno e determinístico (testes e seed reprodutíveis). */
export function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

function pickWeighted(rng: Rng, weights: number[]): number {
  let x = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) if ((x -= weights[i]) < 0) return i;
  return weights.length - 1;
}

const randomMac = (rng: Rng) =>
  Array.from({ length: 6 }, () => Math.floor(rng() * 256).toString(16).padStart(2, '0')).join(':');

/** Datas comemorativas puxam o movimento (Dia das Mães, Dia dos Pais, Natal). */
function seasonalBoost(month: number, day: number): number {
  if (month === 5 && day <= 10) return 1.8;
  if (month === 8 && day <= 9) return 1.3;
  if (month === 12 && day >= 10 && day <= 24) return 1.7;
  return 1;
}

function makeLead(rng: Rng): GeneratedVisit['lead'] {
  const name = NAMES[Math.floor(rng() * NAMES.length)];
  const slug = name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return {
    name,
    email: rng() < 0.8 ? `${slug}${Math.floor(rng() * 1000)}@exemplo.com` : undefined,
    marketingOptIn: rng() < 0.55,
  };
}

function makeVisit(rng: Rng, pool: string[], connectedAt: Date): GeneratedVisit {
  const returning = pool.length > 0 && rng() < RETURNING_SHARE;
  const mac = returning ? pool[Math.floor(rng() * pool.length)] : randomMac(rng);
  if (!returning) pool.push(mac);
  const dwellMin = rng() < 0.1 ? 30 + rng() * 30 : 2 + rng() ** 2 * 28;
  return {
    mac,
    connectedAt,
    disconnectedAt: new Date(connectedAt.getTime() + dwellMin * 60_000),
    lead: !returning && rng() < 0.45 ? makeLead(rng) : undefined,
  };
}

/** Clipa no fim: visita que ainda não terminou fica sem saída (cliente na loja). */
const clip = (v: GeneratedVisit, to: Date): GeneratedVisit =>
  v.disconnectedAt && v.disconnectedAt > to ? { ...v, disconnectedAt: undefined } : v;

/** Histórico realista: horário comercial, fim de semana mais cheio, sazonalidade, ~30% de retorno. */
export function generateVisits(opts: { from: Date; to: Date; avgPerDay: number; seed?: number }): GeneratedVisit[] {
  const rng = mulberry32(opts.seed ?? 42);
  const pool: string[] = [];
  const out: GeneratedVisit[] = [];
  const firstMidnight = Math.floor((opts.from.getTime() + STORE_OFFSET_MS) / DAY_MS) * DAY_MS - STORE_OFFSET_MS;

  for (let day = firstMidnight; day <= opts.to.getTime(); day += DAY_MS) {
    const local = new Date(day + STORE_OFFSET_MS);
    const factor = WEEKDAY_FACTOR[local.getUTCDay()] * seasonalBoost(local.getUTCMonth() + 1, local.getUTCDate());
    const count = Math.round(opts.avgPerDay * factor * (0.85 + rng() * 0.3));
    for (let i = 0; i < count; i++) {
      const hour = OPEN_HOUR + pickWeighted(rng, HOUR_WEIGHTS);
      const connectedAt = new Date(day + hour * 3_600_000 + Math.floor(rng() * 3_600_000));
      out.push(makeVisit(rng, pool, connectedAt));
    }
  }
  return out
    .filter((v) => v.connectedAt >= opts.from && v.connectedAt <= opts.to)
    .map((v) => clip(v, opts.to));
}

/** N visitas novas nas últimas 2 h (botão "Gerar movimento" do painel). */
export function generateRecent(rng: Rng, now: Date, count: number): GeneratedVisit[] {
  return Array.from({ length: count }, () =>
    clip(makeVisit(rng, [], new Date(now.getTime() - Math.floor(rng() * 2 * 3_600_000))), now),
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm --filter @wifi/api test -- generator`
Expected: PASS (5 testes).

- [ ] **Step 5: Endpoint de simulação**

`apps/api/src/simulation/simulation.controller.ts`:
```ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { simulateInputSchema, type SimulateInput } from '@wifi/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreId } from '../common/store-id.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ConnectionsService } from '../connections/connections.service';
import { generateRecent, mulberry32 } from './generator';

@ApiTags('simulação')
@ApiBearerAuth()
@Controller('simulate')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private readonly connections: ConnectionsService) {}

  /** Gera visitas pelo mesmo caminho da ingestão real (mesmas regras de visita e hash). */
  @Post()
  async simulate(@StoreId() storeId: string, @Body(new ZodValidationPipe(simulateInputSchema)) body: SimulateInput) {
    const now = new Date();
    const visits = generateRecent(mulberry32(now.getTime()), now, body.visits);
    for (const v of visits) {
      await this.connections.ingest(storeId, {
        mac: v.mac,
        connectedAt: v.connectedAt.toISOString(),
        disconnectedAt: v.disconnectedAt?.toISOString(),
        lead: v.lead,
      });
    }
    return { created: visits.length };
  }
}
```

`apps/api/src/simulation/simulation.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module';
import { SimulationController } from './simulation.controller';

@Module({ imports: [ConnectionsModule], controllers: [SimulationController] })
export class SimulationModule {}
```

Em `app.module.ts`, acrescente `SimulationModule`.

- [ ] **Step 6: Seed** — `apps/api/prisma/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DAY_MS } from '../src/common/time';
import { hashMac } from '../src/connections/mac';
import { env } from '../src/env';
import { generateVisits, type GeneratedVisit } from '../src/simulation/generator';

const prisma = new PrismaClient();
const DAYS = 180;
const CHUNK = 5000;

async function main() {
  const storeId = env.DEFAULT_STORE_ID;
  const email = (process.env.SEED_OWNER_EMAIL ?? 'dono@loja.demo').toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD ?? 'demo1234';

  await prisma.store.upsert({ where: { id: storeId }, create: { id: storeId, name: 'Loja Demo — Shopping Centro' }, update: {} });
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({ where: { email }, create: { email, passwordHash, storeId }, update: { passwordHash } });

  await prisma.$transaction([
    prisma.lead.deleteMany({ where: { device: { storeId } } }),
    prisma.visit.deleteMany({ where: { storeId } }),
    prisma.device.deleteMany({ where: { storeId } }),
  ]);

  const now = new Date();
  const visits = generateVisits({ from: new Date(now.getTime() - DAYS * DAY_MS), to: now, avgPerDay: 70 });

  const devices = new Map<string, { firstSeenAt: Date; lastSeenAt: Date; lead?: GeneratedVisit['lead'] }>();
  for (const v of visits) {
    const key = hashMac(v.mac, env.MAC_HASH_SECRET);
    const seen = v.disconnectedAt ?? v.connectedAt;
    const d = devices.get(key);
    if (!d) devices.set(key, { firstSeenAt: v.connectedAt, lastSeenAt: seen, lead: v.lead });
    else {
      if (v.connectedAt < d.firstSeenAt) d.firstSeenAt = v.connectedAt;
      if (seen > d.lastSeenAt) d.lastSeenAt = seen;
      d.lead ??= v.lead;
    }
  }

  await prisma.device.createMany({
    data: [...devices].map(([macHash, d]) => ({ storeId, macHash, firstSeenAt: d.firstSeenAt, lastSeenAt: d.lastSeenAt })),
  });
  const ids = new Map(
    (await prisma.device.findMany({ where: { storeId }, select: { id: true, macHash: true } })).map((d) => [d.macHash, d.id]),
  );

  await prisma.lead.createMany({
    data: [...devices]
      .filter(([, d]) => d.lead)
      .map(([macHash, d]) => ({ deviceId: ids.get(macHash)!, ...d.lead!, consentAt: d.firstSeenAt })),
  });

  const visitRows = visits.map((v) => ({
    storeId,
    deviceId: ids.get(hashMac(v.mac, env.MAC_HASH_SECRET))!,
    startedAt: v.connectedAt,
    endedAt: v.disconnectedAt ?? null,
  }));
  for (let i = 0; i < visitRows.length; i += CHUNK) {
    await prisma.visit.createMany({ data: visitRows.slice(i, i + CHUNK) });
  }

  console.log(`Seed ok: ${devices.size} aparelhos, ${visits.length} visitas. Login: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 7: Rodar seed e conferir**

Run: `pnpm --filter @wifi/api seed`
Expected: `Seed ok: ~9000 aparelhos, ~12000 visitas. Login: dono@loja.demo / demo1234`

Com `start:dev` rodando:
```bash
TOKEN=$(curl -s -XPOST localhost:3001/auth/login -H 'content-type: application/json' -d '{"email":"dono@loja.demo","password":"demo1234"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')
curl -s "localhost:3001/metrics?range=30d" -H "authorization: Bearer $TOKEN" | node -pe 'const m=JSON.parse(require("fs").readFileSync(0)); JSON.stringify({kpis:m.kpis, insights:m.insights}, null, 2)'
curl -s -XPOST localhost:3001/simulate -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"visits":20}'
```
Expected: KPIs plausíveis (recorrência ~25–45%, permanência mediana ~8–14 min, opt-in ~20–30%), 3–5 insights; simulação → `{"created":20}`. Se os números parecerem irreais, ajuste as constantes do gerador (não o cálculo) e registre em `docs/ai-log.md`.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(api): gerador de movimento realista, seed de 180 dias e endpoint de simulação"
```

---

### Task 7: CI + deploy da API (Neon + Railway)

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: URL pública da API (`https://<servico>.up.railway.app`) usada nas Tarefas 11 e 12.

- [ ] **Step 1: Workflow** — `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: wifi
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/wifi
      JWT_SECRET: ci-secret-with-at-least-32-characters-long
      INGEST_API_KEY: ci-ingest-key-0123456789abcd
      MAC_HASH_SECRET: ci-mac-secret-with-at-least-32-characters
      DEFAULT_STORE_ID: loja-demo
      API_URL: http://localhost:3001
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @wifi/shared build
      - run: pnpm --filter @wifi/api exec prisma migrate deploy
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm test:e2e
      - run: pnpm build
```

- [ ] **Step 2: Publicar no GitHub**

```bash
git add -A && git commit -m "ci: lint, tipos, testes unitários, e2e com Postgres e build"
git remote add origin git@github.com:<usuario>/painel-wifi-visitantes.git
git branch -M main && git push -u origin main
```
Expected: workflow verde na aba Actions. Se falhar, corrigir antes de seguir.

- [ ] **Step 3: Banco (Neon)** — criar projeto `painel-wifi` (região São Paulo, se disponível), copiar a connection string **direta** (sem `-pooler`), com `?sslmode=require`.

- [ ] **Step 4: API (Railway)** — New Project → Deploy from GitHub → repositório. Em Settings do serviço:
  - Build command: `pnpm install --frozen-lockfile && pnpm --filter @wifi/api... build`
  - Start command: `pnpm --filter @wifi/api exec prisma migrate deploy && pnpm --filter @wifi/api start:prod`
  - Healthcheck path: `/health`
  - Variables: `DATABASE_URL` (Neon), `JWT_SECRET`, `INGEST_API_KEY`, `MAC_HASH_SECRET` (gerar cada um com `openssl rand -hex 32`), `DEFAULT_STORE_ID=loja-demo`. `PORT` é injetado pelo Railway.
  - Networking → Generate Domain.

- [ ] **Step 5: Seed em produção** (roda da máquina local contra o Neon; usa o mesmo `MAC_HASH_SECRET` da produção):

```bash
cd apps/api && DATABASE_URL='<neon>' MAC_HASH_SECRET='<o de prod>' JWT_SECRET='<o de prod>' INGEST_API_KEY='<o de prod>' pnpm seed && cd ../..
```
(O guard e2e não roda aqui; o seed só apaga dados da `loja-demo`.)

- [ ] **Step 6: Verificar**

Run: `curl -s https://<api>/health` → `{"status":"ok"}`; abrir `https://<api>/docs`.

- [ ] **Step 7: Registrar** — acrescentar URL da API e decisões em `docs/ai-log.md`; commit `docs: registra deploy da API`.

---

### Task 8: Base do web (Next), cliente da API, login e proteção de rotas

**Files:**
- Create (scaffold): `apps/web/**` via create-next-app
- Create: `apps/web/.env.example`, `apps/web/lib/session.ts`, `apps/web/lib/api.ts`, `apps/web/lib/format.ts`, `apps/web/middleware.ts`, `apps/web/app/login/page.tsx`, `apps/web/app/login/login-form.tsx`, `apps/web/app/login/actions.ts`, `apps/web/components/submit-button.tsx`
- Modify: `apps/web/app/layout.tsx`, `apps/web/app/globals.css`, `apps/web/package.json`
- Delete: `apps/web/app/page.tsx` (substituído por `app/(painel)/page.tsx` na Tarefa 9)

**Interfaces:**
- Consumes: `@wifi/shared` (`loginSchema`, `Metrics`, `Range`, `ConnectionInput`, `IngestResult`); API: `POST /auth/login`, `GET /metrics`, `POST /connections`, `POST /simulate`.
- Produces: `SESSION_COOKIE`; `ApiError(status, message, details?)`; `api.login(email, password)`, `api.metrics(range)`, `api.ingest(input)`, `api.simulate(visits)`; `logout()` server action; `fmtInt`, `fmtDecimal`, `fmtPct`, `fmtMin`; `<SubmitButton pendingLabel>`.

- [ ] **Step 1: Scaffold**

```bash
cd apps && pnpm dlx create-next-app@15 web --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm --skip-install --yes && cd ..
rm -f apps/web/pnpm-lock.yaml apps/web/app/page.tsx
```
Em `apps/web/package.json`: `"name": "@wifi/web"`.
```bash
pnpm --filter @wifi/web add "@wifi/shared@workspace:*" recharts@^3 server-only
pnpm install
```

`apps/web/.env.example` (copie para `.env.local`):
```
API_URL=http://localhost:3001
INGEST_API_KEY=chave-de-ingestao-local-123456
```

- [ ] **Step 2: Sessão, cliente e formatação**

`apps/web/lib/session.ts`:
```ts
export const SESSION_COOKIE = 'painel_sessao';
```

`apps/web/lib/api.ts`:
```ts
import 'server-only';
import type { ConnectionInput, IngestResult, Metrics, Range } from '@wifi/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from './session';

const API_URL = process.env.API_URL;
const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

type Auth = 'user' | 'ingest' | 'none';

async function request<T>(path: string, init: RequestInit & { auth: Auth }): Promise<T> {
  if (!API_URL) throw new ApiError(500, 'API_URL não configurada no servidor do painel.');
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (init.auth === 'user') {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) redirect('/login');
    headers.set('authorization', `Bearer ${token}`);
  }
  if (init.auth === 'ingest') headers.set('x-api-key', process.env.INGEST_API_KEY ?? '');

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new ApiError(503, 'Não foi possível falar com o servidor. Verifique a conexão e tente de novo.');
  }
  if (res.status === 401 && init.auth === 'user') redirect('/login?expirada=1');

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.message ?? 'Erro inesperado no servidor.', body?.details);
  return body as T;
}

const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string }>('/auth/login', { ...post({ email, password }), auth: 'none' }),
  metrics: (range: Range) => request<Metrics>(`/metrics?range=${range}`, { auth: 'user' }),
  ingest: (input: ConnectionInput) => request<IngestResult>('/connections', { ...post(input), auth: 'ingest' }),
  simulate: (visits: number) => request<{ created: number }>('/simulate', { ...post({ visits }), auth: 'user' }),
};
```

`apps/web/lib/format.ts`:
```ts
const int = new Intl.NumberFormat('pt-BR');
const dec = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const fmtInt = (n: number | null) => (n === null ? '—' : int.format(n));
export const fmtDecimal = (n: number | null) => (n === null ? '—' : dec.format(n));
export const fmtPct = (n: number | null) => (n === null ? '—' : `${dec.format(n)}%`);
export const fmtMin = (n: number | null) => (n === null ? '—' : `${dec.format(n)} min`);
```

- [ ] **Step 3: Proteção de rotas** — `apps/web/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from './lib/session';

export function middleware(req: NextRequest) {
  if (!req.cookies.has(SESSION_COOKIE)) return NextResponse.redirect(new URL('/login', req.url));
}

export const config = { matcher: ['/((?!login|_next|favicon.ico).*)'] };
```

- [ ] **Step 4: Layout e tema**

`apps/web/app/globals.css` (substitui o gerado):
```css
@import 'tailwindcss';

@theme {
  --color-brand: #0f766e;
  --color-novo: #0f766e;
  --color-recorrente: #d97706;
}

body {
  background: #f8fafc;
  color: #18181b;
}
```

Em `apps/web/app/layout.tsx`, mantenha as fontes geradas e troque: `<html lang="pt-BR">` e
```ts
export const metadata: Metadata = {
  title: 'Painel Wi-Fi da Loja',
  description: 'Fluxo de clientes a partir do Wi-Fi de visitantes.',
};
```

- [ ] **Step 5: Botão e login**

`apps/web/components/submit-button.tsx`:
```tsx
'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
```

`apps/web/app/login/actions.ts`:
```ts
'use server';

import { loginSchema } from '@wifi/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { SESSION_COOKIE } from '@/lib/session';

export type LoginState = { error?: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: 'Informe um e-mail válido e a senha.' };
  try {
    const { accessToken } = await api.login(parsed.data.email, parsed.data.password);
    (await cookies()).set(SESSION_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 3600,
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { error: 'E-mail ou senha incorretos.' };
    if (e instanceof ApiError && e.status === 429) return { error: 'Muitas tentativas. Aguarde um minuto e tente de novo.' };
    return { error: e instanceof ApiError ? e.message : 'Não foi possível entrar agora. Tente de novo.' };
  }
  redirect('/');
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}
```

`apps/web/app/login/login-form.tsx`:
```tsx
'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/submit-button';
import { login, type LoginState } from './actions';

export function LoginForm({ expired }: { expired: boolean }) {
  const [state, action] = useActionState<LoginState, FormData>(login, {});
  const message = state.error ?? (expired ? 'Sua sessão expirou. Entre de novo.' : undefined);
  return (
    <form action={action} className="space-y-4">
      {message && (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {message}
        </p>
      )}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">E-mail</span>
        <input name="email" type="email" required autoComplete="username" defaultValue="dono@loja.demo"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Senha</span>
        <input name="password" type="password" required autoComplete="current-password"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </label>
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
    </form>
  );
}
```

`apps/web/app/login/page.tsx`:
```tsx
import { LoginForm } from './login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expirada?: string }> }) {
  const { expirada } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Wi-Fi de visitantes</p>
        <h1 className="mb-1 text-xl font-semibold">Painel da loja</h1>
        <p className="mb-6 text-sm text-zinc-600">Demo: dono@loja.demo / demo1234</p>
        <LoginForm expired={expirada === '1'} />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Verificar**

Com a API local rodando: `pnpm --filter @wifi/web dev`, abrir `http://localhost:3000`.
Expected: redireciona para `/login`; senha errada → "E-mail ou senha incorretos."; certa → vai para `/` (404 por enquanto — a página vem na Tarefa 9). DevTools → Application → Cookies: `painel_sessao` com HttpOnly.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(web): base Next com cliente da API, login e proteção de rotas"
```

---

### Task 9: Painel (KPIs, insights, gráficos, estados de carregamento/erro/vazio)

**Files:**
- Create: `apps/web/app/(painel)/layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`
- Create: `apps/web/components/card.tsx`, `kpi-card.tsx`, `range-tabs.tsx`, `insights.tsx`, `empty-state.tsx`, `daily-chart.tsx`, `heatmap.tsx`, `dwell-bars.tsx`

**Interfaces:**
- Consumes: `api.metrics`, `logout`, `fmt*`, `rangeSchema`, `Range`, `Metrics`.
- Produces: rota `/` (com `?range=`), layout com navegação usado também por `/simular`.

- [ ] **Step 1: Layout com navegação** — `apps/web/app/(painel)/layout.tsx`:

```tsx
import Link from 'next/link';
import { logout } from '../login/actions';

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Wi-Fi de visitantes</p>
            <p className="font-semibold">Painel da loja</p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="hover:underline">Painel</Link>
            <Link href="/simular" className="hover:underline">Simular dados</Link>
            <form action={logout}>
              <button className="text-zinc-600 hover:underline">Sair</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Componentes de apresentação**

`apps/web/components/card.tsx`:
```tsx
export function Card({ title, subtitle, className = '', children }: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-4 ${className}`}>
      <h2 className="font-semibold">{title}</h2>
      {subtitle && <p className="mb-3 text-sm text-zinc-600">{subtitle}</p>}
      {children}
    </section>
  );
}
```

`apps/web/components/kpi-card.tsx`:
```tsx
import { fmtDecimal } from '@/lib/format';

type Props = { label: string; value: string; delta: number | null; deltaUnit: '%' | ' p.p.'; hint: string };

export function KpiCard({ label, value, delta, deltaUnit, hint }: Props) {
  const tone = !delta ? 'text-zinc-500' : delta > 0 ? 'text-emerald-700' : 'text-red-700';
  const arrow = !delta ? '=' : delta > 0 ? '▲' : '▼';
  const text = delta === null ? 'sem base de comparação' : `${arrow} ${fmtDecimal(Math.abs(delta))}${deltaUnit} vs. período anterior`;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      <p className={`mt-1 text-xs ${tone}`}>{text}</p>
      <p className="mt-2 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
```

`apps/web/components/range-tabs.tsx`:
```tsx
import type { Range } from '@wifi/shared';
import Link from 'next/link';

const OPTIONS: { value: Range; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

export function RangeTabs({ current }: { current: Range }) {
  return (
    <nav aria-label="Período" className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 text-sm">
      {OPTIONS.map((o) => (
        <Link
          key={o.value}
          href={`/?range=${o.value}`}
          aria-current={o.value === current ? 'page' : undefined}
          className={`rounded-md px-3 py-1.5 ${o.value === current ? 'bg-brand text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
```

`apps/web/components/insights.tsx`:
```tsx
export function Insights({ items }: { items: string[] }) {
  return (
    <section aria-labelledby="insights" className="rounded-xl border border-teal-200 bg-teal-50 p-4">
      <h2 id="insights" className="mb-2 font-semibold text-teal-900">O que os dados dizem</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-teal-950">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </section>
  );
}
```

`apps/web/components/empty-state.tsx`:
```tsx
import Link from 'next/link';

export function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
      <p className="font-semibold">Nenhuma visita neste período</p>
      <p className="mt-1 text-sm text-zinc-600">
        Assim que clientes se conectarem ao Wi-Fi, os números aparecem aqui.
      </p>
      <Link href="/simular" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
        Gerar movimento de teste
      </Link>
    </div>
  );
}
```

`apps/web/components/dwell-bars.tsx`:
```tsx
import type { Metrics } from '@wifi/shared';
import { fmtInt } from '@/lib/format';

export function DwellBars({ buckets }: { buckets: Metrics['dwellBuckets'] }) {
  const total = buckets.reduce((s, b) => s + b.count, 0) || 1;
  return (
    <ul className="space-y-3">
      {buckets.map((b) => {
        const pct = Math.round((b.count / total) * 100);
        return (
          <li key={b.label} className="text-sm">
            <div className="mb-1 flex justify-between">
              <span>{b.label}</span>
              <span className="tabular-nums text-zinc-600">{pct}% · {fmtInt(b.count)}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100" aria-hidden>
              <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

`apps/web/components/heatmap.tsx`:
```tsx
import type { Metrics } from '@wifi/shared';
import { fmtDecimal } from '@/lib/format';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Tabela real (acessível) colorida por intensidade. Mostra só as horas com movimento. */
export function Heatmap({ cells }: { cells: Metrics['heatmap'] }) {
  const active = cells.filter((c) => c.avgVisits > 0).map((c) => c.hour);
  if (active.length === 0) return <p className="text-sm text-zinc-600">Sem movimento no período.</p>;
  const first = Math.min(...active);
  const hours = Array.from({ length: Math.max(...active) - first + 1 }, (_, i) => first + i);
  const max = Math.max(...cells.map((c) => c.avgVisits));

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-xs">
        <caption className="sr-only">Média de visitas por dia da semana e hora</caption>
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">Dia</span></th>
            {hours.map((h) => <th key={h} scope="col" className="font-normal text-zinc-500">{h}h</th>)}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, w) => (
            <tr key={day}>
              <th scope="row" className="pr-2 text-left font-medium">{day}</th>
              {hours.map((h) => {
                const v = cells[w * 24 + h].avgVisits;
                const intensity = max ? Math.round((v / max) * 100) : 0;
                return (
                  <td
                    key={h}
                    title={`${day} ${h}h: ${fmtDecimal(v)} visitas em média`}
                    className={`h-8 min-w-8 rounded text-center tabular-nums ${intensity > 55 ? 'text-white' : 'text-zinc-700'}`}
                    style={{ backgroundColor: `color-mix(in oklab, var(--color-brand) ${intensity}%, #f4f4f5)` }}
                  >
                    {v ? Math.round(v) : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`apps/web/components/daily-chart.tsx`:
```tsx
'use client';

import type { Metrics } from '@wifi/shared';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function DailyChart({ data }: { data: Metrics['daily'] }) {
  const rows = data.map((d) => ({ ...d, label: `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}` }));
  return (
    <figure className="h-72" aria-label="Visitantes por dia, separados entre novos e recorrentes">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: 0, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={36} />
          <Tooltip />
          <Legend />
          <Bar dataKey="newVisitors" name="Novos" stackId="v" fill="var(--color-novo)" />
          <Bar dataKey="returningVisitors" name="Recorrentes" stackId="v" fill="var(--color-recorrente)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
```

- [ ] **Step 3: Página do painel** — `apps/web/app/(painel)/page.tsx`:

```tsx
import { rangeSchema, type Range } from '@wifi/shared';
import { Card } from '@/components/card';
import { DailyChart } from '@/components/daily-chart';
import { DwellBars } from '@/components/dwell-bars';
import { EmptyState } from '@/components/empty-state';
import { Heatmap } from '@/components/heatmap';
import { Insights } from '@/components/insights';
import { KpiCard } from '@/components/kpi-card';
import { RangeTabs } from '@/components/range-tabs';
import { api } from '@/lib/api';
import { fmtInt, fmtMin, fmtPct } from '@/lib/format';

const RANGE_LABEL: Record<Range, string> = { '7d': '7 dias', '30d': '30 dias', '90d': '90 dias' };

export default async function PainelPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = rangeSchema.catch('30d').parse((await searchParams).range);
  const m = await api.metrics(range);
  const { kpis } = m;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Visitantes da loja</h1>
          <p className="text-sm text-zinc-600">
            Últimos {RANGE_LABEL[range]}, comparados ao período anterior até o mesmo horário.
          </p>
        </div>
        <RangeTabs current={range} />
      </div>

      {kpis.visits.value === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section aria-labelledby="kpis" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <h2 id="kpis" className="sr-only">Indicadores</h2>
            <KpiCard label="Visitantes únicos" value={fmtInt(kpis.uniqueVisitors.value)} delta={kpis.uniqueVisitors.delta} deltaUnit="%" hint="Aparelhos diferentes que se conectaram." />
            <KpiCard label="Visitas" value={fmtInt(kpis.visits.value)} delta={kpis.visits.delta} deltaUnit="%" hint="Idas à loja (reconexões em até 30 min contam como uma)." />
            <KpiCard label="Clientes que voltaram" value={fmtPct(kpis.returningRate.value)} delta={kpis.returningRate.delta} deltaUnit=" p.p." hint="Já tinham vindo à loja em outro dia." />
            <KpiCard label="Permanência típica" value={fmtMin(kpis.medianDwellMinutes.value)} delta={kpis.medianDwellMinutes.delta} deltaUnit="%" hint="Mediana do tempo conectado." />
            <KpiCard label="Aceitaram comunicações" value={fmtPct(kpis.optInRate.value)} delta={kpis.optInRate.delta} deltaUnit=" p.p." hint="Cadastro no Wi-Fi com consentimento (LGPD)." />
          </section>

          <Insights items={m.insights} />

          <Card title="Visitantes por dia" subtitle="Novos e recorrentes">
            <DailyChart data={m.daily} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2" title="Quando a loja enche" subtitle="Média de visitas por dia da semana e hora">
              <Heatmap cells={m.heatmap} />
            </Card>
            <Card title="Quanto tempo ficam" subtitle="Visitas encerradas, por faixa">
              <DwellBars buckets={m.dwellBuckets} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Carregando e erro**

`apps/web/app/(painel)/loading.tsx`:
```tsx
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Carregando painel">
      <div className="h-8 w-64 rounded bg-zinc-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-32 rounded-xl bg-zinc-200" />)}
      </div>
      <div className="h-24 rounded-xl bg-zinc-200" />
      <div className="h-80 rounded-xl bg-zinc-200" />
    </div>
  );
}
```

`apps/web/app/(painel)/error.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';

export default function PainelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6">
      <p className="font-semibold text-red-900">Não foi possível carregar o painel.</p>
      <p className="mt-1 text-sm text-red-800">O servidor pode estar indisponível por um instante. Seus dados estão seguros.</p>
      <button
        onClick={() => startTransition(() => { router.refresh(); reset(); })}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white"
      >
        Tentar de novo
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Verificar**

Com API (com seed) e web rodando: entrar e conferir em `/`, `/?range=7d`, `/?range=90d`, `/?range=xyz` (cai em 30 dias).
- Derrubar a API e recarregar → card de erro; subir a API e clicar "Tentar de novo" → painel volta.
- Largura de 375 px (DevTools): KPIs em 1 coluna, mapa de calor com rolagem horizontal, sem rolagem horizontal na página.
- Apagar o cookie manualmente → volta ao login.
- Rodar `pnpm --filter @wifi/web build` → sem erros de tipo.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(web): painel com KPIs, insights, série diária, mapa de calor e permanência"
```

---

### Task 10: Página "Simular dados" (gerar movimento + cadastrar conexão)

**Files:**
- Create: `apps/web/app/(painel)/simular/page.tsx`, `actions.ts`, `simulate-form.tsx`, `connection-form.tsx`

**Interfaces:**
- Consumes: `api.simulate`, `api.ingest`, `ApiError`, `connectionInputSchema`, `simulateInputSchema`, `SubmitButton`.
- Produces: rota `/simular`; `FormState = { ok?: string; error?: string; fieldErrors?: Record<string, string[] | undefined> }`.

- [ ] **Step 1: Server actions** — `apps/web/app/(painel)/simular/actions.ts`:

```ts
'use server';

import { connectionInputSchema, simulateInputSchema } from '@wifi/shared';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';

export type FormState = { ok?: string; error?: string; fieldErrors?: Record<string, string[] | undefined> };

function failure(e: unknown): FormState {
  unstable_rethrow(e); // deixa passar o redirect para o login em sessão expirada
  if (e instanceof ApiError) return { error: e.message, fieldErrors: e.details };
  return { error: 'Falha inesperada. Tente de novo.' };
}

export async function simulate(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = simulateInputSchema.safeParse({ visits: Number(formData.get('visits')) });
  if (!parsed.success) return { error: 'Informe um número inteiro entre 1 e 200.' };
  try {
    const { created } = await api.simulate(parsed.data.visits);
    revalidatePath('/');
    return { ok: `${created} visitas geradas nas últimas 2 horas. Veja no painel.` };
  } catch (e) {
    return failure(e);
  }
}

// trade-off: datetime-local não tem fuso; assume o da loja (UTC-3) porque o painel é de uma loja só
const withStoreOffset = (v: FormDataEntryValue | null) => (v ? `${v}:00-03:00` : undefined);

export async function registerConnection(_: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get('name') ?? '').trim();
  const input = {
    mac: formData.get('mac'),
    connectedAt: withStoreOffset(formData.get('connectedAt')),
    disconnectedAt: withStoreOffset(formData.get('disconnectedAt')),
    lead: name
      ? { name, email: formData.get('email') || undefined, marketingOptIn: formData.get('marketingOptIn') === 'on' }
      : undefined,
  };
  const parsed = connectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Corrija os campos destacados.', fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  try {
    const { merged } = await api.ingest(parsed.data);
    revalidatePath('/');
    return { ok: merged ? 'Conexão somada a uma visita existente (reconexão em até 30 min).' : 'Nova visita registrada.' };
  } catch (e) {
    return failure(e);
  }
}
```
Adicione `zod` ao web: `pnpm --filter @wifi/web add zod@^4`.

- [ ] **Step 2: Formulários**

`apps/web/app/(painel)/simular/simulate-form.tsx`:
```tsx
'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/submit-button';
import { simulate, type FormState } from './actions';

export function SimulateForm() {
  const [state, action] = useActionState<FormState, FormData>(simulate, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Quantidade de visitas</span>
        <input name="visits" type="number" min={1} max={200} defaultValue={40} required
          className="w-32 rounded-lg border border-zinc-300 px-3 py-2" />
      </label>
      <SubmitButton pendingLabel="Gerando…">Gerar movimento</SubmitButton>
      <Feedback state={state} />
    </form>
  );
}

export function Feedback({ state }: { state: FormState }) {
  if (state.ok) return <p role="status" className="text-sm text-emerald-700">{state.ok}</p>;
  if (state.error) return <p role="alert" className="text-sm text-red-700">{state.error}</p>;
  return null;
}
```

`apps/web/app/(painel)/simular/connection-form.tsx`:
```tsx
'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/submit-button';
import { registerConnection, type FormState } from './actions';
import { Feedback } from './simulate-form';

function Field({ label, name, error, ...props }: { label: string; name: string; error?: string[] } & React.InputHTMLAttributes<HTMLInputElement>) {
  const errorId = `${name}-erro`;
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input name={name} aria-invalid={!!error} aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border px-3 py-2 ${error ? 'border-red-500' : 'border-zinc-300'}`} {...props} />
      {error && <span id={errorId} className="mt-1 block text-xs text-red-700">{error[0]}</span>}
    </label>
  );
}

export function ConnectionForm() {
  const [state, action] = useActionState<FormState, FormData>(registerConnection, {});
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label="MAC do aparelho" name="mac" placeholder="AA:BB:CC:DD:EE:FF" required error={err.mac} />
      <div />
      <Field label="Entrada" name="connectedAt" type="datetime-local" required error={err.connectedAt} />
      <Field label="Saída (opcional)" name="disconnectedAt" type="datetime-local" error={err.disconnectedAt} />
      <Field label="Nome (cadastro opcional)" name="name" error={err.lead} />
      <Field label="E-mail (opcional)" name="email" type="email" />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="marketingOptIn" /> Aceita receber comunicações da loja
      </label>
      <div className="space-y-2 sm:col-span-2">
        <SubmitButton pendingLabel="Registrando…">Registrar conexão</SubmitButton>
        <Feedback state={state} />
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Página** — `apps/web/app/(painel)/simular/page.tsx`:

```tsx
import { Card } from '@/components/card';
import { ConnectionForm } from './connection-form';
import { SimulateForm } from './simulate-form';

export default function SimularPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Simular dados</h1>
        <p className="text-sm text-zinc-600">
          Sem integração real com o Wi-Fi: aqui você gera conexões pelo mesmo endpoint que o portal do Wi-Fi usaria.
        </p>
      </div>
      <Card title="Gerar movimento" subtitle="Cria visitas aleatórias nas últimas 2 horas.">
        <SimulateForm />
      </Card>
      <Card title="Registrar uma conexão" subtitle="Simula um cliente conectando (e saindo). Reconexões em até 30 min somam à mesma visita.">
        <ConnectionForm />
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verificar**

- Gerar 40 visitas → mensagem de sucesso; voltar ao painel em 7 dias → visitas de hoje aumentaram.
- Registrar com MAC `xyz` → erro no campo MAC; saída antes da entrada → erro no campo Saída; entrada amanhã → erro em Entrada.
- Registrar a mesma conexão duas vezes → segunda mensagem "somada a uma visita existente".
- `pnpm --filter @wifi/web build` sem erros.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): página para gerar movimento e cadastrar conexões com validação por campo"
```

---

### Task 11: Deploy do web (Vercel) e verificação ponta a ponta em produção

**Interfaces:**
- Consumes: URL da API (Tarefa 7).
- Produces: URL pública do painel.

- [ ] **Step 1: Vercel** — Add New Project → importar o repositório:
  - Root Directory: `apps/web`
  - Build Command: `cd ../.. && pnpm --filter @wifi/web... build`
  - Install Command: `cd ../.. && pnpm install --frozen-lockfile`
  - Environment Variables: `API_URL=https://<api>` (sem barra no fim), `INGEST_API_KEY=<o de prod>`

- [ ] **Step 2: Roteiro em produção** (anotar o resultado de cada item)

1. Abrir a URL → login → entrar com `dono@loja.demo / demo1234`.
2. Trocar 7/30/90 dias; conferir insights e gráficos.
3. Simular 40 visitas → painel de 7 dias reflete.
4. Registrar conexão inválida → erros por campo.
5. Abrir no celular (ou 375 px) → layout ok.
6. Senha errada 11 vezes seguidas → mensagem de "muitas tentativas".
7. `https://<api>/docs` abre.

- [ ] **Step 3: Registrar** — URLs e resultado do roteiro em `docs/ai-log.md`; commit `docs: registra deploy do painel`.

---

### Task 12: Documentação (README + AI_USAGE)

**Files:**
- Create: `README.md`, `AI_USAGE.md`

- [ ] **Step 1: README.md** — em português, com estas seções e conteúdo real:

1. **Links** — painel, API, Swagger, credenciais de demo (`dono@loja.demo / demo1234`).
2. **O problema e a leitura dele** — Wi-Fi como sensor de fluxo; tabela pergunta → métrica → decisão (copiar da spec §2).
3. **O que o painel mostra** — KPIs e definições exatas (visita = reconexão em 30 min; recorrente = voltou em outro dia; permanência = mediana das visitas encerradas; comparação "até o mesmo horário"); 1 print do painel (`docs/imagens/painel.png`).
4. **Arquitetura** — diagrama em Mermaid:
   ```mermaid
   flowchart LR
     Portal[Portal Wi-Fi / Simulador] -- POST /connections + x-api-key --> API
     Browser -- cookie httpOnly --> Web[Next.js na Vercel]
     Web -- Bearer JWT --> API[NestJS no Railway]
     API --> DB[(Postgres no Neon)]
   ```
   e por que o Next não fala com o banco (separação full-stack, segredos só no servidor).
5. **Modelagem de dados** — as 5 tabelas, o porquê do HMAC do MAC (LGPD), do índice `(storeId, startedAt)` e do Lead com `consentAt`.
6. **Erros e falhas** — lista da spec §5.
7. **Como rodar localmente** — Postgres (brew ou `docker compose up -d`), `cp .env.example`, `pnpm install`, `pnpm --filter @wifi/api exec prisma migrate dev`, `pnpm --filter @wifi/api seed`, `pnpm dev`.
8. **Testes** — `pnpm test`, `pnpm test:e2e`; o que cada suíte cobre; CI.
9. **Decisões e trade-offs** — cada comentário `trade-off:` do código vira uma linha (`grep -rn "trade-off:" apps`): o atalho, o limite dele e o próximo passo.
10. **Próximos passos** — spec §6.

- [ ] **Step 2: AI_USAGE.md** — montado a partir de `docs/ai-log.md`, sem inventar:

1. Ferramentas (Claude Code com modelo Opus) e em que fases foram usadas.
2. Fluxo: leitura do desafio → spec → plano com TDD → execução tarefa a tarefa com revisão → deploy.
3. O que a IA fez bem (exemplos concretos do log).
4. Onde a IA errou ou foi corrigida (exemplos concretos do log, com o que foi feito).
5. O que foi decisão humana (stack, escopo, prazo, regras de negócio validadas).
6. Como a qualidade foi garantida (testes escritos antes, revisão de cada tarefa, CI).
7. Link para `docs/superpowers/` (spec e plano) e `docs/ai-log.md`.

- [ ] **Step 3: Print** — tirar print do painel em produção (30 dias) e salvar em `docs/imagens/painel.png`.

- [ ] **Step 4: Revisão final**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build`
Expected: tudo verde. Conferir que nenhum segredo foi commitado: `git grep -nE "(neon|railway).*(password|@)|openssl" -- ':!docs'` não deve achar credenciais.

- [ ] **Step 5: Commit e push**

```bash
git add -A && git commit -m "docs: README com decisões e arquitetura, e relato do uso de IA"
git push
```
