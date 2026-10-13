import { cx } from '@/lib/cx';

const TONES = {
  neutral: 'bg-paper text-ink-2',
  surface: 'bg-card text-ink-2',
  brand: 'bg-brand-soft text-brand-strong',
  strong: 'bg-brand text-white',
  rose: 'bg-rose-soft text-mauve',
  down: 'bg-down-soft text-down',
  live: 'bg-primavera/70 text-brand-deep',
  highlight: 'bg-primavera text-brand-deep',
} as const;

const WEIGHTS = { semibold: 'font-semibold', medium: 'font-medium', normal: '' } as const;

/** Cor do selo. */
export type ChipTone = keyof typeof TONES;

type ChipProps = {
  tone: ChipTone;
  weight?: keyof typeof WEIGHTS;
  className?: string;
  children: React.ReactNode;
};

/** Selo de 4px para rótulos curtos (tipo de cliente, "Hoje", variação). */
export function Chip({
  tone,
  weight = 'semibold',
  className,
  children,
}: ChipProps): React.JSX.Element {
  return (
    <span
      className={cx(
        'rounded-[var(--radius-chip)] px-1.5 py-0.5 text-xs',
        WEIGHTS[weight],
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
