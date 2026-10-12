'use client';

import type { Metrics } from '@wifi/shared';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function DailyChart({ data }: { data: Metrics['daily'] }) {
  const rows = data.map((d) => ({ ...d, label: `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}` }));
  return (
    <figure className="h-72" aria-label="Visitantes por dia, separados entre novos e recorrentes">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: 0, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={36} />
          <Tooltip />
          <Legend />
          <Bar dataKey="newVisitors" name="Novos" stackId="v" fill="var(--color-novo)" />
          <Bar dataKey="returningVisitors" name="Recorrentes" stackId="v" fill="var(--color-recorrente)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
