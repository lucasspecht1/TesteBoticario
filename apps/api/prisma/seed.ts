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
