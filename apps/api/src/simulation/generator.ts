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
