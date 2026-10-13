import { cx } from '@/lib/cx';
import { CARD_SURFACE_CLIPPED } from './styles';

const RULER_GRID =
  'grid grid-cols-2 divide-line max-lg:[&>*]:border-b max-lg:[&>*]:border-line lg:divide-x';

type StatRulerProps = {
  /** Colunas por largura de tela (ex.: "lg:grid-cols-4"). */
  columns: string;
  /** Posição na sequência de entrada (`.rise`). */
  style: React.CSSProperties;
  /** Com título, a régua vira uma seção rotulada (o título só aparece para leitores de tela). */
  title?: { id: string; text: string };
  children: React.ReactNode;
};

/** Régua de indicadores lado a lado num único cartão, com divisórias entre os itens. */
export function StatRuler({ columns, style, title, children }: StatRulerProps): React.JSX.Element {
  if (!title)
    return (
      <dl className={cx('rise', CARD_SURFACE_CLIPPED, RULER_GRID, columns)} style={style}>
        {children}
      </dl>
    );
  return (
    <section aria-labelledby={title.id} className={cx('rise', CARD_SURFACE_CLIPPED)} style={style}>
      <h2 id={title.id} className="sr-only">
        {title.text}
      </h2>
      <dl className={cx(RULER_GRID, columns)}>{children}</dl>
    </section>
  );
}

/** Um item da régua: o rótulo e, em seguida, os `<dd>` com valor e extras. */
export function StatRulerItem({
  label,
  hasTallLabel = false,
  children,
}: {
  label: string;
  /** Reserva duas linhas para o rótulo, alinhando os valores quando um rótulo quebra. */
  hasTallLabel?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="min-w-0 p-5">
      <dt className={cx('text-sm text-ink-3', hasTallLabel && 'min-h-10')}>{label}</dt>
      {children}
    </div>
  );
}
