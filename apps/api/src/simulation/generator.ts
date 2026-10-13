import { RECENT_WINDOW_HOURS } from '@wifi/shared';
import { DAY_MS, HOUR_MS, MINUTE_MS } from '../common/time';
import {
  STORE_OFFSET_MS,
  OPEN_HOUR,
  HOUR_WEIGHTS,
  WEEKDAY_FACTOR,
  RETURNING_SHARE,
  LONG_STAY_SHARE,
  SHORT_STAY_MIN_MINUTES,
  SHORT_STAY_SPREAD_MINUTES,
  LONG_STAY_MIN_MINUTES,
  LONG_STAY_SPREAD_MINUTES,
  DAILY_FACTOR_MIN,
  DAILY_FACTOR_SPREAD,
  MAC_BYTES,
  BYTE_VALUES,
  EMAIL_SUFFIX_RANGE,
  DEFAULT_SEED,
  SEASONAL_BOOSTS,
  LEAD_SHARE,
  EMAIL_SHARE,
  OPT_IN_SHARE,
  NAMES,
} from './generator-params';

/** Visita sintética: conexão, saída opcional e lead opcional (só quem se cadastrou no portal). */
export type GeneratedVisit = {
  mac: string;
  connectedAt: Date;
  disconnectedAt?: Date;
  lead?: { name: string; email?: string; marketingOptIn: boolean };
};

/** PRNG pequeno e determinístico (testes e seed reprodutíveis); devolve números em [0, 1). */
export function createSeededRng(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let mixed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gerador de números pseudoaleatórios em [0, 1). */
export type Rng = () => number;

/** Sorteia um índice com probabilidade proporcional ao peso. */
function pickWeighted(rng: Rng, weights: number[]): number {
  let remaining = rng() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < weights.length; index++)
    if ((remaining -= weights[index]) < 0) return index;
  return weights.length - 1;
}

const generateMac = (rng: Rng): string =>
  Array.from({ length: MAC_BYTES }, () =>
    Math.floor(rng() * BYTE_VALUES)
      .toString(16)
      .padStart(2, '0'),
  ).join(':');

/** Datas comemorativas puxam o movimento (ver `SEASONAL_BOOSTS`); 1 nos demais dias. */
function getSeasonalBoost(month: number, day: number): number {
  const boost = SEASONAL_BOOSTS.find(
    (season) =>
      season.month === month && day >= season.fromDay && day <= season.toDay,
  );
  return boost?.factor ?? 1;
}

function makeLead(rng: Rng): GeneratedVisit['lead'] {
  const name = NAMES[Math.floor(rng() * NAMES.length)];
  const emailPrefix = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  return {
    name,
    email:
      rng() < EMAIL_SHARE
        ? `${emailPrefix}${Math.floor(rng() * EMAIL_SUFFIX_RANGE)}@exemplo.com`
        : undefined,
    marketingOptIn: rng() < OPT_IN_SHARE,
  };
}

/** Permanência de uma visita: `LONG_STAY_SHARE` delas longas, as demais curtas e concentradas nas mais curtas. */
export const drawStayMinutes = (rng: Rng): number =>
  rng() < LONG_STAY_SHARE
    ? LONG_STAY_MIN_MINUTES + rng() * LONG_STAY_SPREAD_MINUTES
    : SHORT_STAY_MIN_MINUTES + rng() ** 2 * SHORT_STAY_SPREAD_MINUTES;

/**
 * Uma visita: com `RETURNING_SHARE` de chance reaproveita um MAC do `macPool` (e então não gera
 * lead); caso contrário cria um MAC novo e o adiciona ao pool.
 */
function makeVisit(
  rng: Rng,
  macPool: string[],
  connectedAt: Date,
): GeneratedVisit {
  const isReturning = macPool.length > 0 && rng() < RETURNING_SHARE;
  const mac = isReturning
    ? macPool[Math.floor(rng() * macPool.length)]
    : generateMac(rng);
  if (!isReturning) macPool.push(mac);
  const stayMinutes = drawStayMinutes(rng);
  return {
    mac,
    connectedAt,
    disconnectedAt: new Date(connectedAt.getTime() + stayMinutes * MINUTE_MS),
    lead: !isReturning && rng() < LEAD_SHARE ? makeLead(rng) : undefined,
  };
}

/** Clipa no fim: visita que ainda não terminou fica sem saída (cliente na loja). */
const clipAt = (visit: GeneratedVisit, end: Date): GeneratedVisit =>
  visit.disconnectedAt && visit.disconnectedAt > end
    ? { ...visit, disconnectedAt: undefined }
    : visit;

/** Visitas de um dia local (`dayStart` = meia-noite local em UTC), com a quantidade ajustada ao dia. */
function generateDayVisits(
  rng: Rng,
  macPool: string[],
  dayStart: number,
  avgPerDay: number,
): GeneratedVisit[] {
  const localDay = new Date(dayStart + STORE_OFFSET_MS);
  const factor =
    WEEKDAY_FACTOR[localDay.getUTCDay()] *
    getSeasonalBoost(localDay.getUTCMonth() + 1, localDay.getUTCDate());
  const count = Math.round(
    avgPerDay * factor * (DAILY_FACTOR_MIN + rng() * DAILY_FACTOR_SPREAD),
  );
  return Array.from({ length: count }, () => {
    const hour = OPEN_HOUR + pickWeighted(rng, HOUR_WEIGHTS);
    const connectedAt = new Date(
      dayStart + hour * HOUR_MS + Math.floor(rng() * HOUR_MS),
    );
    return makeVisit(rng, macPool, connectedAt);
  });
}

/** Histórico realista: horário comercial, fim de semana mais cheio, sazonalidade, ~30% de retorno. */
export function generateVisits(options: {
  from: Date;
  to: Date;
  avgPerDay: number;
  seed?: number;
}): GeneratedVisit[] {
  const { from, to, avgPerDay } = options;
  const rng = createSeededRng(options.seed ?? DEFAULT_SEED);
  const macPool: string[] = [];
  const visits: GeneratedVisit[] = [];
  const firstMidnight =
    Math.floor((from.getTime() + STORE_OFFSET_MS) / DAY_MS) * DAY_MS -
    STORE_OFFSET_MS;

  for (
    let dayStart = firstMidnight;
    dayStart <= to.getTime();
    dayStart += DAY_MS
  )
    visits.push(...generateDayVisits(rng, macPool, dayStart, avgPerDay));
  return visits
    .filter((visit) => visit.connectedAt >= from && visit.connectedAt <= to)
    .map((visit) => clipAt(visit, to));
}

/** N visitas novas dentro da janela `RECENT_WINDOW_HOURS` (botão "Gerar movimento" do painel). */
export function generateRecent(
  rng: Rng,
  now: Date,
  count: number,
): GeneratedVisit[] {
  return Array.from({ length: count }, () =>
    clipAt(
      makeVisit(
        rng,
        [],
        new Date(
          now.getTime() - Math.floor(rng() * RECENT_WINDOW_HOURS * HOUR_MS),
        ),
      ),
      now,
    ),
  );
}
