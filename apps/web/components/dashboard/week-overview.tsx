import type { Metrics, Range } from '@wifi/shared';
import { SECTION_TITLE } from '@/components/ui/styles';
import { getRiseStyle } from '@/lib/rise';
import { TomorrowNote } from './tomorrow-note';
import { WeekColumns } from './week-columns';

// Posição de cada bloco na sequência de entrada (`.rise`); as colunas ocupam da 2 à 8.
const HEADER_RISE_INDEX = 1;
const NOTE_RISE_INDEX = 2;
const COLUMNS_RISE_INDEX = 2;

/** Seção "Como cada dia costuma ser": título, nota de amanhã e as sete colunas da semana. */
export function WeekOverview({
  metrics,
  range,
}: {
  metrics: Metrics;
  range: Range;
}): React.JSX.Element {
  return (
    <section aria-labelledby="semana-titulo" className="space-y-4">
      <div className="rise" style={getRiseStyle(HEADER_RISE_INDEX)}>
        <h2 id="semana-titulo" className={SECTION_TITLE}>
          Como cada dia costuma ser
        </h2>
        <p className="mt-1 text-sm text-ink-3">
          Média do período por dia da semana. Toque num dia para ver a análise completa.
        </p>
      </div>
      <div className="rise" style={getRiseStyle(NOTE_RISE_INDEX)}>
        <TomorrowNote metrics={metrics} range={range} />
      </div>
      <WeekColumns metrics={metrics} range={range} riseIndex={COLUMNS_RISE_INDEX} />
    </section>
  );
}
