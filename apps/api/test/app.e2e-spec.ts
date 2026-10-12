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
