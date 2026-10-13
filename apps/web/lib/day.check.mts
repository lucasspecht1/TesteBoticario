// Verificação mínima: node --experimental-strip-types lib/day.check.mts
import assert from 'node:assert/strict';
import { computeVisibleHourWindow, planStaffing, rankOccurrences, readDay } from './day.ts';

const curve: Record<number, number> = {
  10: 2,
  11: 2,
  12: 4,
  13: 3,
  14: 3,
  15: 4,
  16: 7,
  17: 10,
  18: 8,
  19: 6,
  20: 3,
  21: 2,
};
const hourly = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  avgVisits: curve[hour] ?? 0,
  allDaysAvgVisits: 0,
}));
const reading = readDay(hourly)!;
assert.deepEqual(reading.peak, { hour: 17, averageVisits: 10 });
// >= 6 (60% de 10) em volta do pico: 16h a 19h → faixa 16h às 20h
assert.equal(reading.staffing.from, 16);
assert.equal(reading.staffing.to, 20);
assert.equal(reading.staffing.share, 57); // (7+10+8+6) / 54
assert.deepEqual(reading.idle, { from: 10, to: 12, averageVisits: 2 });

assert.equal(readDay(hourly.map((entry) => ({ ...entry, avgVisits: 0 }))), null);
// escala pela lei de Little, 1 pessoa a cada 2 clientes ao mesmo tempo
// 10 min de permanência: o pico (10 visitas/h) dá 1,7 cliente simultâneo → 1 pessoa o dia todo
assert.deepEqual(
  planStaffing(hourly, 10).map((block) => [block.from, block.to, block.people]),
  [[10, 22, 1]],
);
// 30 min: 16h tem 3,5 clientes → 2; 17h tem 5 → 3; 18h e 19h → 2
assert.deepEqual(
  planStaffing(hourly, 30).map((block) => [block.from, block.to, block.people]),
  [
    [10, 16, 1],
    [16, 17, 2],
    [17, 18, 3],
    [18, 20, 2],
    [20, 22, 1],
  ],
);
assert.deepEqual(planStaffing(hourly, null), []);
// 12 visitas/h × 10 min = 2,0 clientes: exatamente 2 → 1 pessoa (não 2 por resto de arredondamento)
const borderline = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  avgVisits: hour === 20 ? 12.1 : 0,
  allDaysAvgVisits: 0,
}));
assert.deepEqual(
  planStaffing(borderline, 10).map((block) => [block.people, block.peakClients]),
  [[1, 2]],
);

// Janela visível do gráfico: 10h a 21h com movimento, mais 1 h de folga de cada lado
assert.deepEqual(computeVisibleHourWindow(hourly), { firstHour: 9, lastHour: 22 });
assert.deepEqual(computeVisibleHourWindow(hourly.map((entry) => ({ ...entry, avgVisits: 0 }))), {
  firstHour: 8,
  lastHour: 22,
});

// Melhor e pior ocorrência ignoram hoje; barras usam o maior total (inclusive o de hoje)
const occurrences = [
  { date: '2026-10-12', newVisitors: 30, returningVisitors: 0, visits: 30, today: true },
  { date: '2026-10-05', newVisitors: 6, returningVisitors: 2, visits: 8, today: false },
  { date: '2026-09-28', newVisitors: 10, returningVisitors: 2, visits: 12, today: false },
  { date: '2026-09-21', newVisitors: 3, returningVisitors: 1, visits: 4, today: false },
];
const ranking = rankOccurrences(occurrences);
assert.equal(ranking.best?.date, '2026-09-28');
assert.equal(ranking.worst?.date, '2026-09-21');
assert.equal(ranking.maxVisitors, 30);
assert.equal(rankOccurrences(occurrences.slice(0, 2)).best, null);
console.log('day.check ok');
