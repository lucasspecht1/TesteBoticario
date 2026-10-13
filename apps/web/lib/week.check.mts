// Verificação mínima: node --experimental-strip-types lib/week.check.mts
import assert from 'node:assert/strict';
import type { WeekInput } from './week.ts';
import { getDayEmphasis, listVisibleHours, summarizeWeek } from './week.ts';

const heatmap = Array.from({ length: 168 }, (_, index) => {
  const weekday = Math.floor(index / 24);
  const hour = index % 24;
  return {
    weekday,
    hour,
    avgVisits:
      weekday === 6 && (hour === 17 || hour === 18) ? 10 : hour >= 10 && hour <= 20 ? 1 : 0,
  };
});
const metrics = {
  heatmap,
  weekdayAvgVisits: [11, 11, 11, 11, 11, 11, 31],
} satisfies WeekInput;

const stats = summarizeWeek(metrics);
assert.equal(stats.days[0].weekday, 1);
assert.equal(stats.days[6].weekday, 0);
assert.equal(stats.busiestWeekday, 6);
assert.equal(stats.days[5].peakFrom, 17);
assert.equal(stats.days[5].peakTo, 18);
assert.equal(stats.firstActiveHour, 10);
assert.equal(stats.lastActiveHour, 20);

assert.deepEqual(listVisibleHours(stats), [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
assert.equal(getDayEmphasis(stats, 6), 'busiest');
assert.equal(getDayEmphasis(stats, stats.weakestWeekday), 'weakest');
assert.equal(getDayEmphasis(stats, 3), 'regular');

console.log('week.check ok');
