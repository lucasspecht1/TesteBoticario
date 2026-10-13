import { cx } from '@/lib/cx';
import { DAYS_PER_WEEK } from '@/lib/units';
import { CARD_SURFACE } from './styles';

// Esqueletos de carregamento, usados como fallback de Suspense dentro de cada página.

const SKELETON_BLOCK = 'rounded-lg bg-line';
const SKELETON_LINE = 'rounded bg-line';

/** Painel: manchete, 7 colunas, régua e gráfico. */
export function DashboardSkeleton(): React.JSX.Element {
  return (
    <div
      className="animate-pulse space-y-10"
      role="status"
      aria-busy="true"
      aria-label="Carregando painel"
    >
      <div className="space-y-4">
        <div className={cx('h-12 w-full max-w-2xl', SKELETON_BLOCK)} />
        <div className={cx('h-12 w-3/5', SKELETON_BLOCK)} />
        <div className={cx('h-4 w-80 max-w-full', SKELETON_LINE)} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
        {Array.from({ length: DAYS_PER_WEEK }, (_, index) => (
          <div
            key={index}
            className={cx(
              'h-60',
              CARD_SURFACE,
              index === DAYS_PER_WEEK - 1 && 'col-span-2 lg:col-span-1',
            )}
          />
        ))}
      </div>
      <div className={cx('h-36', CARD_SURFACE)} />
      <div className={cx('h-96', CARD_SURFACE)} />
    </div>
  );
}

/** Páginas de detalhe e listas: título, faixa de números e um bloco grande. */
export function PageSkeleton({ label }: { label: string }): React.JSX.Element {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-busy="true" aria-label={label}>
      <div className="space-y-3">
        <div className={cx('h-12 w-72 max-w-full', SKELETON_BLOCK)} />
        <div className={cx('h-4 w-96 max-w-full', SKELETON_LINE)} />
      </div>
      <div className={cx('h-28', CARD_SURFACE)} />
      <div className={cx('h-96', CARD_SURFACE)} />
    </div>
  );
}
