import type { Range } from '@wifi/shared';
import Link from 'next/link';

const OPTIONS: { value: Range; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

export function RangeTabs({ current }: { current: Range }) {
  return (
    <nav aria-label="Período" className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 text-sm">
      {OPTIONS.map((o) => (
        <Link
          key={o.value}
          href={`/?range=${o.value}`}
          aria-current={o.value === current ? 'page' : undefined}
          className={`rounded-md px-3 py-1.5 ${o.value === current ? 'bg-brand text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
