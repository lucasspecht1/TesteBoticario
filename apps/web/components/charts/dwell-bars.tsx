import type { Metrics } from '@wifi/shared';
import { formatInteger } from '@/lib/format';

/** Barras horizontais com a parcela das visitas encerradas em cada faixa de permanência. */
export function DwellBars({ buckets }: { buckets: Metrics['dwellBuckets'] }): React.JSX.Element {
  const totalVisits = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  // evita dividir por zero quando não há visita encerrada
  const divisor = totalVisits || 1;
  return (
    <>
      <ul className="space-y-4">
        {buckets.map((bucket) => {
          const percent = Math.round((bucket.count / divisor) * 100);
          return (
            <li key={bucket.label} className="text-sm">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-ink-2">{bucket.label}</span>
                <span className="tabular-nums">
                  <strong className="font-semibold text-ink">{percent}%</strong>{' '}
                  <span className="text-xs text-ink-3">{formatInteger(bucket.count)}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-paper" aria-hidden>
                <div className="h-1.5 rounded-full bg-brand" style={{ width: `${percent}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-ink-3">
        Base: {formatInteger(totalVisits)} visitas encerradas no período.
      </p>
    </>
  );
}
