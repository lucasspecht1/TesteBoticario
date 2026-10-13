// Verificação mínima: node --experimental-strip-types lib/today.check.mts
import assert from 'node:assert/strict';
import type { TomorrowInput } from './today.ts';
import { forecastTomorrow, summarizeToday } from './today.ts';

// Segunda típica: 2 visitas às 10h e 2 às 15h (metade do dia já passou às 15h, mais metade da hora das 15h)
const heatmap = Array.from({ length: 168 }, (_, index) => {
  const weekday = Math.floor(index / 24);
  const hour = index % 24;
  return { weekday, hour, avgVisits: weekday === 1 && (hour === 10 || hour === 15) ? 2 : 0 };
});
const daily = [
  { date: '2026-09-28', newVisitors: 10, returningVisitors: 2 }, // segunda
  { date: '2026-10-05', newVisitors: 6, returningVisitors: 2 }, // segunda
  { date: '2026-10-11', newVisitors: 50, returningVisitors: 0 }, // domingo
  { date: '2026-10-12', newVisitors: 6, returningVisitors: 3 }, // segunda (hoje)
];
const metrics = {
  daily: daily.map((entry) => ({ ...entry, visits: 0 })),
  heatmap,
  weekdayAvgVisits: [0, 4, 6, 0, 0, 0, 0],
} satisfies TomorrowInput;

// 2026-10-12 18:30 UTC = 15:30 em São Paulo. Típico do dia 10; até 15:30 já passou (2 + 1) / 4 = 75% → 7,5.
const summary = summarizeToday(metrics, new Date('2026-10-12T18:30:00Z'));
assert.equal(summary.weekday, 1);
assert.equal(summary.visitorsToday, 9);
assert.equal(summary.typicalVisitorsSoFar, 7.5);
assert.equal(summary.vsTypicalPercent, 20);

// Logo depois de abrir (10:15): o típico até agora é 1,25 visitante, pouco demais para virar porcentagem
// (9 contra 1,25 daria "620% acima"; 0 contra 1,25, "100% abaixo").
const earlySummary = summarizeToday(metrics, new Date('2026-10-12T13:15:00Z'));
assert.equal(earlySummary.typicalVisitorsSoFar, 1.25);
assert.equal(earlySummary.vsTypicalPercent, null);

// Antes de abrir (8h): nada costuma ter acontecido, sem comparação.
assert.equal(summarizeToday(metrics, new Date('2026-10-12T11:00:00Z')).vsTypicalPercent, null);

// Amanhã (terça) não tem movimento no mapa de calor da segunda, mas tem média: pico na primeira hora
const forecast = forecastTomorrow(metrics, new Date('2026-10-12T18:30:00Z'));
assert.deepEqual(forecast, { weekday: 2, expectedVisits: 6, peakHour: 0 });
// Quarta sem movimento esperado: sem previsão
assert.equal(forecastTomorrow(metrics, new Date('2026-10-13T18:30:00Z')), null);
console.log('today.check ok');
