'use client';

import type { Metrics } from '@wifi/shared';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDateKey } from '@/lib/format';
import {
  buildAxisTick,
  CHART_COLORS,
  CHART_MARGIN,
  TOOLTIP_CONTENT_STYLE,
  TOOLTIP_LABEL_STYLE,
  VISITOR_LEGEND_ITEMS,
  VISITOR_SERIES,
} from './chart-theme';
import { Legend } from './legend';

/** Barras empilhadas de visitantes novos e recorrentes por dia. */
export function DailyChart({ data }: { data: Metrics['daily'] }): React.JSX.Element {
  const rows = data.map((entry) => ({ ...entry, label: formatDateKey(entry.date) }));
  return (
    <figure aria-label="Visitantes por dia, separados entre novos e recorrentes">
      <Legend items={VISITOR_LEGEND_ITEMS} className="mb-4 gap-5" />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={CHART_MARGIN} barCategoryGap="22%">
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={buildAxisTick(11)}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              allowDecimals={false}
              tick={buildAxisTick(11)}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              cursor={{ fill: CHART_COLORS.hoverBackground }}
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
            />
            <Bar
              dataKey="newVisitors"
              name={VISITOR_SERIES.new.label}
              stackId="v"
              fill={VISITOR_SERIES.new.color}
            />
            <Bar
              dataKey="returningVisitors"
              name={VISITOR_SERIES.returning.label}
              stackId="v"
              fill={VISITOR_SERIES.returning.color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
