import type { Metrics } from '@wifi/shared';
import { fmtInt } from '@/lib/format';

export function DwellBars({ buckets }: { buckets: Metrics['dwellBuckets'] }) {
  const total = buckets.reduce((s, b) => s + b.count, 0) || 1;
  return (
    <ul className="space-y-3">
      {buckets.map((b) => {
        const pct = Math.round((b.count / total) * 100);
        return (
          <li key={b.label} className="text-sm">
            <div className="mb-1 flex justify-between">
              <span>{b.label}</span>
              <span className="tabular-nums text-zinc-600">{pct}% · {fmtInt(b.count)}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100" aria-hidden>
              <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
