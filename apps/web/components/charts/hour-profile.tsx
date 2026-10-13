'use client';

import type { WeekdayDetail } from '@wifi/shared';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { computeVisibleHourWindow } from '@/lib/day';
import { formatDecimal } from '@/lib/format';
import {
  buildAxisTick,
  CHART_COLORS,
  CHART_MARGIN,
  TOOLTIP_CONTENT_STYLE,
  TOOLTIP_LABEL_STYLE,
} from './chart-theme';
import { Legend } from './legend';

const ALL_DAYS_LABEL = 'Média de todos os dias';

type HourProfileProps = {
  hourly: WeekdayDetail['hourly'];
  /** Faixa de reforço (`to` exclusivo) a destacar; null quando o dia não tem movimento. */
  staffing: { from: number; to: number } | null;
  dayLabel: string;
};

/** Média de visitas por hora do dia escolhido, com a faixa de reforço em destaque e a média geral em linha. */
export function HourProfile({ hourly, staffing, dayLabel }: HourProfileProps): React.JSX.Element {
  const { firstHour, lastHour } = computeVisibleHourWindow(hourly);
  const rows = hourly
    .slice(firstHour, lastHour + 1)
    .map((entry) => ({ ...entry, label: `${entry.hour}h` }));
  const isInStaffingWindow = (hour: number) =>
    !!staffing && hour >= staffing.from && hour < staffing.to;

  const legendItems = [
    { label: `${dayLabel}, faixa de reforço`, color: CHART_COLORS.brand },
    { label: `${dayLabel}, demais horas`, color: CHART_COLORS.brandLight },
    { label: ALL_DAYS_LABEL, color: CHART_COLORS.mauve, shape: 'line' as const },
  ];

  return (
    <figure aria-label={`Média de visitas por hora: ${dayLabel} e média de todos os dias`}>
      <Legend items={legendItems} className="mb-4 flex-wrap gap-x-5 gap-y-2" />
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={CHART_MARGIN} barCategoryGap="18%">
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={buildAxisTick(12)}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis tick={buildAxisTick(12)} tickLine={false} axisLine={false} width={36} />
            <Tooltip
              cursor={{ fill: CHART_COLORS.hoverBackground }}
              formatter={(value, name) => [
                `${formatDecimal(Number(value))} visitas`,
                name === 'avgVisits' ? dayLabel : ALL_DAYS_LABEL,
              ]}
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
            />
            <Bar dataKey="avgVisits" radius={[4, 4, 0, 0]}>
              {rows.map((row) => (
                <Cell
                  key={row.hour}
                  fill={isInStaffingWindow(row.hour) ? CHART_COLORS.brand : CHART_COLORS.brandLight}
                />
              ))}
            </Bar>
            <Line
              dataKey="allDaysAvgVisits"
              type="monotone"
              stroke={CHART_COLORS.mauve}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
