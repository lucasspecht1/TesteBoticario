import type { Retention } from '@wifi/shared';
import { formatWithUnit } from '@/lib/format';
import { RETENTION_WINDOWS } from './retention-windows';

/** Média de retorno em 7, 30 e 60 dias, em três números grandes. */
export function RetentionSummary({ averages }: { averages: Retention['avg'] }): React.JSX.Element {
  return (
    <dl className="mt-5 grid grid-cols-3 gap-3">
      {RETENTION_WINDOWS.map(({ key, label }) => (
        <div key={key} className="rounded-[var(--radius-card)] bg-paper/70 p-3 sm:p-4">
          <dt className="text-xs text-ink-3">
            <span className="max-sm:hidden">Voltam em </span>
            {label}
          </dt>
          <dd className="mt-1 font-display text-2xl leading-none text-ink tabular-nums sm:text-3xl">
            {formatWithUnit(averages[key], '%')}
          </dd>
        </div>
      ))}
    </dl>
  );
}
