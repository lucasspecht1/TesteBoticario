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
