import type { WeekdayDetail } from '@wifi/shared';
import { VISITOR_LEGEND_ITEMS } from '@/components/charts/chart-theme';
import { Legend } from '@/components/charts/legend';
import { Card } from '@/components/ui/card';
import { Chip, type ChipTone } from '@/components/ui/chip';
import { rankOccurrences } from '@/lib/day';
import { capitalize, formatDateKey, formatInteger } from '@/lib/format';
import { sumVisitors } from '@/lib/units';
import { getRiseStyle } from '@/lib/rise';
import type { WeekdayLabels } from '@/lib/weekdays';

const OCCURRENCES_RISE_INDEX = 4;
/** Largura da maior barra, em % da linha: deixa espaço para a etiqueta ao lado. */
const MAX_BAR_WIDTH_PERCENT = 70;

type Occurrence = WeekdayDetail['dates'][number];

/** Etiqueta de uma ocorrência: hoje, a melhor ou a mais fraca; null nas demais. */
function describeOccurrence(
  occurrence: Occurrence,
  labels: WeekdayLabels,
  best: Occurrence | null,
  worst: Occurrence | null,
): { text: string; tone: ChipTone } | null {
  if (occurrence.today) return { text: 'Hoje, até agora', tone: 'live' };
  if (occurrence.date === best?.date) return { text: `Melhor ${labels.name}`, tone: 'brand' };
  if (occurrence.date === worst?.date)
    return { text: `${capitalize(labels.name)} mais ${labels.weak}`, tone: 'rose' };
  return null;
}

type OccurrenceRowProps = {
  occurrence: Occurrence;
  maxVisitors: number;
  tag: { text: string; tone: ChipTone } | null;
};

/** Linha de uma data: o dia, a barra de novos e recorrentes, a etiqueta e o total. */
function OccurrenceRow({ occurrence, maxVisitors, tag }: OccurrenceRowProps) {
  return (
    <li className="grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-3 py-2.5 text-sm">
      <span className="text-ink-2 tabular-nums">{formatDateKey(occurrence.date)}</span>
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        <span
          className="flex h-2.5 min-w-1 overflow-hidden rounded-full"
          style={{ width: `${(sumVisitors(occurrence) / maxVisitors) * MAX_BAR_WIDTH_PERCENT}%` }}
          aria-hidden
        >
          <span className="bg-brand" style={{ flexGrow: occurrence.newVisitors }} />
          <span className="bg-musk" style={{ flexGrow: occurrence.returningVisitors }} />
        </span>
        {tag && (
          <Chip tone={tag.tone} className="shrink-0">
            {tag.text}
          </Chip>
        )}
      </span>
      <span className="text-right font-medium text-ink tabular-nums">
        {formatInteger(sumVisitors(occurrence))}
      </span>
    </li>
  );
}

type OccurrencesCardProps = {
  occurrences: Occurrence[];
  labels: WeekdayLabels;
};

/** Cada ocorrência do dia no período, da mais recente para a mais antiga, com a melhor e a mais fraca marcadas. */
export function OccurrencesCard({ occurrences, labels }: OccurrencesCardProps): React.JSX.Element {
  const { best, worst, maxVisitors } = rankOccurrences(occurrences);

  return (
    <Card
      className="rise lg:col-span-2"
      style={getRiseStyle(OCCURRENCES_RISE_INDEX)}
      title={`Cada ${labels.name} do período`}
      subtitle="Visitantes de cada dia, do mais recente para o mais antigo"
    >
      <Legend items={VISITOR_LEGEND_ITEMS} className="mb-3 gap-4" />
      <ol className="divide-y divide-line">
        {occurrences.map((occurrence) => (
          <OccurrenceRow
            key={occurrence.date}
            occurrence={occurrence}
            maxVisitors={maxVisitors}
            tag={describeOccurrence(occurrence, labels, best, worst)}
          />
        ))}
      </ol>
    </Card>
  );
}
