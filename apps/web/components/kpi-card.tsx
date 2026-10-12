import { fmtDecimal } from '@/lib/format';

type Props = { label: string; value: string; delta: number | null; deltaUnit: '%' | ' p.p.'; hint: string };

export function KpiCard({ label, value, delta, deltaUnit, hint }: Props) {
  const tone = !delta ? 'text-zinc-500' : delta > 0 ? 'text-emerald-700' : 'text-red-700';
  const arrow = !delta ? '=' : delta > 0 ? '▲' : '▼';
  const text = delta === null ? 'sem base de comparação' : `${arrow} ${fmtDecimal(Math.abs(delta))}${deltaUnit} vs. período anterior`;
  return (
    <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      <p className={`mt-1 text-xs ${tone}`}>{text}</p>
      <p className="mt-2 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
