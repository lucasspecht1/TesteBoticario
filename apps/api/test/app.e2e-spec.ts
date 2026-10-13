import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DAY_MS, HOUR_MS, MINUTE_MS } from '../src/common/time';
import { env } from '../src/env';
import { PrismaService } from '../src/prisma/prisma.service';
import { configureApp } from '../src/setup';
import { DemoAutofillService } from '../src/simulation/demo-autofill.service';

function assertLocalTestDb(url: string) {
  const message =
    'Os testes e2e apagam dados da loja: rode apenas contra um banco local cujo nome termine em "_test".';
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(message);
  }
  const isLocalHost = ['localhost', '127.0.0.1'].includes(parsedUrl.hostname);
  // host/hostaddr na query string podem redirecionar a conexão (estilo libpq)
  if (
    !isLocalHost ||
    !parsedUrl.pathname.slice(1).endsWith('_test') ||
    parsedUrl.searchParams.has('host') ||
    parsedUrl.searchParams.has('hostaddr')
  ) {
    throw new Error(message);
  }
}
assertLocalTestDb(env.DATABASE_URL);

const OWNER = { email: 'e2e@loja.test', password: 'senha-e2e-123' };
const storeId = env.DEFAULT_STORE_ID;
const key = { 'x-api-key': env.INGEST_API_KEY };
const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * HOUR_MS).toISOString();
const event = {
  mac: 'AA:BB:CC:DD:EE:01',
  connectedAt: hoursAgo(2),
  disconnectedAt: hoursAgo(1.5),
};

describe('API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  // um login só para a suíte: o limite de 10 logins por minuto por e-mail continua valendo
  let session: Promise<{ authorization: string }> | undefined;
  const auth = () =>
    (session ??= http()
      .post('/auth/login')
      .send(OWNER)
      .expect(200)
      .then((response) => ({
        authorization: `Bearer ${response.body.accessToken}`,
      })));
  const clearStoreHistory = async () => {
    await prisma.lead.deleteMany({ where: { device: { storeId } } });
    await prisma.visit.deleteMany({ where: { storeId } });
    await prisma.device.deleteMany({ where: { storeId } });
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.store.upsert({
      where: { id: storeId },
      create: { id: storeId, name: 'Loja E2E' },
      update: {},
    });
    await clearStoreHistory();
    await prisma.user.upsert({
      where: { email: OWNER.email },
      create: {
        email: OWNER.email,
        passwordHash: await bcrypt.hash(OWNER.password, 4),
        storeId,
      },
      update: {},
    });
  });

  afterAll(() => app.close());

  it('GET /health', () => http().get('/health').expect(200, { status: 'ok' }));

  it('ingestão sem chave → 401 no formato padrão', async () => {
    const response = await http().post('/connections').send(event).expect(401);
    expect(response.body).toMatchObject({
      statusCode: 401,
      path: '/connections',
    });
  });

  it('MAC inválido → 400 com erro no campo', async () => {
    const response = await http()
      .post('/connections')
      .set(key)
      .send({ ...event, mac: 'xyz' })
      .expect(400);
    expect(response.body.details.mac).toBeDefined();
  });

  it('saída antes da entrada → 400', async () => {
    const response = await http()
      .post('/connections')
      .set(key)
      .send({ ...event, disconnectedAt: hoursAgo(3) })
      .expect(400);
    expect(response.body.details.disconnectedAt).toBeDefined();
  });

  it('entrada no futuro → 400', async () => {
    const response = await http()
      .post('/connections')
      .set(key)
      .send({ mac: event.mac, connectedAt: hoursAgo(-2) })
      .expect(400);
    expect(response.body.details.connectedAt).toBeDefined();
  });

  it('saída no futuro → 400', async () => {
    const response = await http()
      .post('/connections')
      .set(key)
      .send({ ...event, disconnectedAt: hoursAgo(-2) })
      .expect(400);
    expect(response.body.details.disconnectedAt).toBeDefined();
  });

  it('evento repetido não duplica a visita', async () => {
    const firstResponse = await http()
      .post('/connections')
      .set(key)
      .send(event)
      .expect(201);
    const secondResponse = await http()
      .post('/connections')
      .set(key)
      .send(event)
      .expect(201);
    expect(firstResponse.body.merged).toBe(false);
    expect(secondResponse.body).toEqual({
      visitId: firstResponse.body.visitId,
      merged: true,
    });
    expect(await prisma.visit.count({ where: { storeId } })).toBe(1);
  });

  it('login com senha errada → 401', () =>
    http()
      .post('/auth/login')
      .send({ ...OWNER, password: 'errada' })
      .expect(401));

  it('métricas exigem token', () => http().get('/metrics').expect(401));

  it('token inválido → 401', () =>
    http().get('/metrics').set('authorization', 'Bearer abc').expect(401));

  it('métricas com token', async () => {
    const headers = await auth();
    const response = await http()
      .get('/metrics?range=7d')
      .set(headers)
      .expect(200);
    expect(response.body.kpis.visits.value).toBe(1);
    expect(response.body.heatmap).toHaveLength(168);
    expect(response.body.insights.length).toBeGreaterThan(0);
  });

  it('período inválido → 400', async () => {
    const headers = await auth();
    await http().get('/metrics?range=1y').set(headers).expect(400);
  });

  describe('dia da semana', () => {
    it('exige token', () =>
      http().get('/metrics/weekday?weekday=1').expect(401));

    it('dia fora de 0 a 6 → 400 com erro no campo', async () => {
      const headers = await auth();
      const response = await http()
        .get('/metrics/weekday?weekday=7')
        .set(headers)
        .expect(400);
      expect(response.body.details.weekday).toBeDefined();
    });

    it('com token → ocorrências, média por hora e KPIs', async () => {
      const headers = await auth();
      const weekday = new Date().getDay();
      const response = await http()
        .get(`/metrics/weekday?range=7d&weekday=${weekday}`)
        .set(headers)
        .expect(200);
      expect(response.body.weekday).toBe(weekday);
      expect(response.body.hourly).toHaveLength(24);
      expect(response.body.dates.length).toBeGreaterThanOrEqual(1);
      expect(response.body.kpis.visitsPerDay).toHaveProperty('delta');
    });
  });

  describe('visitas e clientes', () => {
    it('exige token', () => http().get('/visits').expect(401));

    it('busca inválida → 400 com erro no campo', async () => {
      const headers = await auth();
      const response = await http()
        .get('/visits?q=zz')
        .set(headers)
        .expect(400);
      expect(response.body.details.q).toBeDefined();
    });

    it('lista a visita com o cliente pseudonimizado e abre a ficha', async () => {
      const headers = await auth();
      const response = await http()
        .get('/visits?range=7d')
        .set(headers)
        .expect(200);
      expect(response.body.total).toBeGreaterThanOrEqual(1);
      const [visit] = response.body.items;
      expect(visit.durationMinutes).toBe(30);
      expect(visit.customer.alias).toMatch(/^[0-9A-F]{6}$/);
      // LGPD: e-mail e MAC nunca saem da API
      expect(JSON.stringify(response.body)).not.toMatch(/@|AA:BB/);

      const customer = await http()
        .get(`/customers/${visit.customer.id}`)
        .set(headers)
        .expect(200);
      expect(customer.body).toMatchObject({
        alias: visit.customer.alias,
        segment: 'novo',
        totalVisits: 1,
      });
    });

    it('cliente de outra loja ou inexistente → 404', async () => {
      const headers = await auth();
      await http().get('/customers/nao-existe').set(headers).expect(404);
    });
  });

  describe('retenção e clientes para reativar', () => {
    const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);
    // cliente sumido com consentimento (entra) e outro sem consentimento (não entra)
    beforeAll(async () => {
      for (const [mac, optIn] of [
        ['sumido-optin', true],
        ['sumido-sem-optin', false],
      ] as const) {
        const device = await prisma.device.create({
          data: {
            storeId,
            macHash: mac,
            firstSeenAt: daysAgo(50),
            lastSeenAt: daysAgo(40),
          },
        });
        await prisma.visit.createMany({
          data: [
            {
              storeId,
              deviceId: device.id,
              startedAt: daysAgo(50),
              endedAt: daysAgo(50),
            },
            {
              storeId,
              deviceId: device.id,
              startedAt: daysAgo(40),
              endedAt: daysAgo(40),
            },
          ],
        });
        await prisma.lead.create({
          data: {
            deviceId: device.id,
            name: `Rita ${mac}`,
            email: `${mac}@exemplo.com`,
            marketingOptIn: optIn,
            consentAt: daysAgo(50),
          },
        });
      }
    });

    it('exigem token', async () => {
      await http().get('/customers/retention').expect(401);
      await http().get('/customers/lapsed').expect(401);
      await http().get('/customers/lapsed.csv').expect(401);
    });

    it('retenção em 12 turmas semanais', async () => {
      const headers = await auth();
      const response = await http()
        .get('/customers/retention')
        .set(headers)
        .expect(200);
      expect(response.body.cohorts).toHaveLength(12);
      expect(response.body.cohorts[0]).toEqual(
        expect.objectContaining({ newCustomers: expect.any(Number) as number }),
      );
    });

    it('lista só os sumidos que aceitaram contato, sem e-mail na tela', async () => {
      const headers = await auth();
      const response = await http()
        .get('/customers/lapsed')
        .set(headers)
        .expect(200);
      expect(response.body.total).toBe(1);
      expect(response.body.items[0]).toMatchObject({
        firstName: 'Rita',
        totalVisits: 2,
        daysAway: 40,
      });
      expect(JSON.stringify(response.body)).not.toContain('@');
    });

    it('CSV com e-mail só de quem aceitou contato', async () => {
      const headers = await auth();
      const response = await http()
        .get('/customers/lapsed.csv')
        .set(headers)
        .expect(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain(
        'nome;email;ultima_visita;visitas;dias_sem_vir',
      );
      expect(response.text).toContain('sumido-optin@exemplo.com');
      expect(response.text).not.toContain('sumido-sem-optin@exemplo.com');
    });
  });

  describe('simulação (exige login)', () => {
    const other = { ...event, mac: 'AA:BB:CC:DD:EE:02' };

    it('POST /simulate/connection sem token → 401', () =>
      http().post('/simulate/connection').send(other).expect(401));

    it('POST /simulate/connection ignora a chave de ingestão', () =>
      http().post('/simulate/connection').set(key).send(other).expect(401));

    it('POST /simulate/connection com token → 201 e IngestResult', async () => {
      const headers = await auth();
      const response = await http()
        .post('/simulate/connection')
        .set(headers)
        .send(other)
        .expect(201);
      expect(response.body).toEqual({
        visitId: expect.any(String) as string,
        merged: false,
      });
    });

    it('POST /simulate/connection valida o corpo → 400', async () => {
      const headers = await auth();
      const response = await http()
        .post('/simulate/connection')
        .set(headers)
        .send({ ...other, mac: 'xyz' })
        .expect(400);
      expect(response.body.details.mac).toBeDefined();
    });

    it('POST /simulate sem token → 401', () =>
      http().post('/simulate').send({ visits: 3 }).expect(401));

    it('POST /simulate com token → { created }', async () => {
      const before = await prisma.visit.count({ where: { storeId } });
      const headers = await auth();
      const response = await http()
        .post('/simulate')
        .set(headers)
        .send({ visits: 3 })
        .expect(201);
      expect(response.body).toEqual({ created: 3 });
      expect(await prisma.visit.count({ where: { storeId } })).toBe(before + 3);
    });
  });

  describe('preenchimento automático da demo', () => {
    const autofill = () => app.get(DemoAutofillService);
    const minutesAgo = (minutes: number) =>
      new Date(Date.now() - minutes * MINUTE_MS);
    const createDeviceWithVisit = async (
      startedAt: Date,
      endedAt: Date | null,
    ) => {
      const device = await prisma.device.create({
        data: {
          storeId,
          macHash: `demo-${startedAt.getTime()}`,
          firstSeenAt: startedAt,
          lastSeenAt: endedAt ?? startedAt,
        },
      });
      const visit = await prisma.visit.create({
        data: { storeId, deviceId: device.id, startedAt, endedAt },
      });
      return { device, visit };
    };

    beforeEach(clearStoreHistory);

    it('sem visitas na loja não gera nada (o histórico inicial vem do seed)', async () => {
      expect(await autofill().run()).toEqual({
        createdVisits: 0,
        closedVisits: 0,
      });
      expect(await prisma.visit.count({ where: { storeId } })).toBe(0);
    });

    it('completa desde a última visita, com clientes novos e clientes que voltam', async () => {
      const lastVisitStart = new Date(Date.now() - 3 * DAY_MS);
      const { device } = await createDeviceWithVisit(
        lastVisitStart,
        new Date(lastVisitStart.getTime() + 10 * MINUTE_MS),
      );
      const now = new Date();

      const { createdVisits } = await autofill().run(now);

      const newVisits = await prisma.visit.findMany({
        where: { storeId, startedAt: { gt: lastVisitStart } },
      });
      expect(createdVisits).toBeGreaterThan(50);
      expect(newVisits).toHaveLength(createdVisits);
      expect(newVisits.every((visit) => visit.startedAt <= now)).toBe(true);
      expect(newVisits.some((visit) => visit.deviceId === device.id)).toBe(
        true,
      );
      const returningDevice = await prisma.device.findUniqueOrThrow({
        where: { id: device.id },
      });
      expect(returningDevice.lastSeenAt > device.lastSeenAt).toBe(true);
      expect(await prisma.device.count({ where: { storeId } })).toBeGreaterThan(
        1,
      );
      expect(
        await prisma.lead.count({ where: { device: { storeId } } }),
      ).toBeGreaterThan(0);
    });

    it('só sorteia como cliente que volta quem foi visto nos últimos 90 dias', async () => {
      const longAgo = new Date(Date.now() - 100 * DAY_MS);
      const { device: forgottenDevice } = await createDeviceWithVisit(
        longAgo,
        new Date(longAgo.getTime() + 10 * MINUTE_MS),
      );
      const lastVisitStart = new Date(Date.now() - 3 * DAY_MS);
      await createDeviceWithVisit(
        lastVisitStart,
        new Date(lastVisitStart.getTime() + 10 * MINUTE_MS),
      );

      await autofill().run();

      expect(
        await prisma.visit.count({ where: { deviceId: forgottenDevice.id } }),
      ).toBe(1);
    });

    it('refaz sem erro uma rodada que caiu depois de criar os aparelhos', async () => {
      const lastVisitStart = new Date(Date.now() - DAY_MS);
      await createDeviceWithVisit(
        lastVisitStart,
        new Date(lastVisitStart.getTime() + 10 * MINUTE_MS),
      );
      const now = new Date();
      const { createdVisits } = await autofill().run(now);
      const visitsAfterLast = { storeId, startedAt: { gt: lastVisitStart } };
      // a queda: aparelhos e cadastros ficaram gravados, as visitas da rodada não
      await prisma.visit.deleteMany({ where: visitsAfterLast });

      await autofill().run(now);

      expect(await prisma.visit.count({ where: visitsAfterLast })).toBe(
        createdVisits,
      );
    });

    it('encerra a visita aberta cuja permanência sorteada já passou e avança o visto por último', async () => {
      const { visit: finishedVisit, device } = await createDeviceWithVisit(
        minutesAgo(120),
        null,
      );
      const { visit: ongoingVisit } = await createDeviceWithVisit(
        minutesAgo(1),
        null,
      );

      const { closedVisits } = await autofill().run();

      const closed = await prisma.visit.findUniqueOrThrow({
        where: { id: finishedVisit.id },
      });
      const ongoing = await prisma.visit.findUniqueOrThrow({
        where: { id: ongoingVisit.id },
      });
      const closedDevice = await prisma.device.findUniqueOrThrow({
        where: { id: device.id },
      });
      expect(closedVisits).toBe(1);
      expect(closed.endedAt!.getTime()).toBeGreaterThan(
        closed.startedAt.getTime(),
      );
      expect(closedDevice.lastSeenAt).toEqual(closed.endedAt);
      expect(ongoing.endedAt).toBeNull();
    });
  });
});
