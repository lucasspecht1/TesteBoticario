import { cx } from '@/lib/cx';

/** Um item da legenda: cor (qualquer valor CSS) e forma da amostra. */
type LegendItem = { label: string; color: string; shape?: 'square' | 'line' };

const SHAPES = { square: 'size-2.5 rounded-[3px]', line: 'h-0.5 w-4 rounded' } as const;

/** Legenda de um gráfico: amostra de cor seguida do nome da série. */
export function Legend({
  items,
  className,
}: {
  items: LegendItem[];
  className: string;
}): React.JSX.Element {
  return (
    <div className={cx('flex text-xs text-ink-2', className)}>
      {items.map(({ label, color, shape = 'square' }) => (
        <span key={label} className="inline-flex items-center gap-2">
          <i className={SHAPES[shape]} style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}
