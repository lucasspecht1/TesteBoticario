import * as bcrypt from 'bcryptjs';
import { BCRYPT_COST } from '../src/auth/bcrypt-cost';
import { DAY_MS } from '../src/common/time';
import { env } from '../src/env';
import { PrismaService } from '../src/prisma/prisma.service';
import { DEMO_AVG_VISITS_PER_DAY } from '../src/simulation/demo-history';
import { DemoHistoryService } from '../src/simulation/demo-history.service';
import { generateVisits } from '../src/simulation/generator';

const prisma = new PrismaService();
const demoHistory = new DemoHistoryService(prisma);
/** Dias de histórico gerados para a loja demo. */
const HISTORY_DAYS = 180;

/** Garante a loja demo. */
async function upsertDemoStore(storeId: string): Promise<void> {
  await prisma.store.upsert({
    where: { id: storeId },
    create: { id: storeId, name: 'Loja Demo — Shopping Centro' },
    update: {},
  });
}

/** Garante o dono da loja com o e-mail e a senha do ambiente (ou os padrões da demo). */
async function upsertOwner(
  storeId: string,
): Promise<{ email: string; password: string }> {
  const email = (
    process.env.SEED_OWNER_EMAIL ?? 'dono@loja.demo'
  ).toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD ?? 'demo1234';
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, storeId },
    update: { passwordHash },
  });
  return { email, password };
}

/** Apaga leads, visitas e aparelhos da loja para recriar o histórico do zero. */
async function clearStoreHistory(storeId: string): Promise<void> {
  await prisma.$transaction([
    prisma.lead.deleteMany({ where: { device: { storeId } } }),
    prisma.visit.deleteMany({ where: { storeId } }),
    prisma.device.deleteMany({ where: { storeId } }),
  ]);
}

/** Com `SEED_IF_EMPTY=1` (serviço `seed` do docker-compose), preserva o histórico que já existe em vez de recriá-lo. */
async function shouldKeepExistingHistory(storeId: string): Promise<boolean> {
  if (process.env.SEED_IF_EMPTY !== '1') return false;
  return (await prisma.visit.count({ where: { storeId } })) > 0;
}

/** Recria a loja demo com o dono e `HISTORY_DAYS` dias de visitas sintéticas (apaga o histórico atual da loja). */
async function main(): Promise<void> {
  const storeId = env.DEFAULT_STORE_ID;
  if (await shouldKeepExistingHistory(storeId)) {
    console.log('Seed pulado: a loja demo já tem visitas.');
    return;
  }
  await upsertDemoStore(storeId);
  const { email, password } = await upsertOwner(storeId);
  await clearStoreHistory(storeId);

  const now = new Date();
  const visits = generateVisits({
    from: new Date(now.getTime() - HISTORY_DAYS * DAY_MS),
    to: now,
    avgPerDay: DEMO_AVG_VISITS_PER_DAY,
  });
  const createdDevices = await demoHistory.insertNewCustomerVisits(
    storeId,
    visits,
  );

  console.log(
    `Seed ok: ${createdDevices} aparelhos, ${visits.length} visitas. Login: ${email} / ${password}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
