import { ArrowDownRight, ArrowUpRight, Minus } from '@phosphor-icons/react/dist/ssr';
import { formatDecimal } from '@/lib/format';
import type { DeltaUnit } from '@/lib/kpis';
import { Chip, type ChipTone } from './chip';

type Direction = 'flat' | 'up' | 'down';

const DIRECTIONS: Record<
  Direction,
  { Icon: typeof Minus; tone: ChipTone; screenReaderText: string }
> = {
  flat: { Icon: Minus, tone: 'neutral', screenReaderText: 'estável' },
  up: { Icon: ArrowUpRight, tone: 'brand', screenReaderText: 'subiu' },
  down: { Icon: ArrowDownRight, tone: 'down', screenReaderText: 'caiu' },
};

const getDirection = (delta: number): Direction => {
  if (delta === 0) return 'flat';
  return delta > 0 ? 'up' : 'down';
};

/** Variação vs. período anterior, no formato dos selos de desconto do site (4px). */
export function Delta({
  delta,
  unit,
}: {
  delta: number | null;
  unit: DeltaUnit;
}): React.JSX.Element {
  if (delta === null) return <span className="text-xs text-ink-3">sem base de comparação</span>;
  const { Icon, tone, screenReaderText } = DIRECTIONS[getDirection(delta)];
  return (
    <Chip tone={tone} weight="medium" className="inline-flex items-center gap-1 tabular-nums">
      <Icon size={12} weight="bold" aria-hidden />
      <span className="sr-only">{screenReaderText}</span>
      {formatDecimal(Math.abs(delta))}
      {unit}
    </Chip>
  );
}
