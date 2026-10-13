import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { cx } from '@/lib/cx';
import { listVisiblePages } from '@/lib/pagination';
import { PILL_ACTIVE } from './styles';

const CELL =
  'grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-medium tabular-nums transition-colors';

/** Cor do fundo de passagem do mouse: depende de a paginação estar sobre a página ou dentro de um cartão. */
const HOVER_BY_SURFACE = { page: 'hover:bg-card', card: 'hover:bg-paper' } as const;

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Monta a URL de uma página (cada tela tem seus próprios filtros). */
  pageHref: (page: number) => string;
  /** Frase à esquerda, ex.: "Página 2 de 5". */
  summary: string;
  surface: keyof typeof HOVER_BY_SURFACE;
  className?: string;
};

type PageStepProps = {
  href: string | null;
  label: string;
  hoverClassName: string;
  children: React.ReactNode;
};

/** Seta de anterior/próxima; sem destino, vira um espaço apagado. */
function PageStep({ href, label, hoverClassName, children }: PageStepProps) {
  if (!href)
    return (
      <span className={cx(CELL, 'text-ink-3/50')} aria-hidden>
        {children}
      </span>
    );
  return (
    <Link href={href} aria-label={label} className={cx(CELL, 'text-ink-2', hoverClassName)}>
      {children}
    </Link>
  );
}

/** Paginação com números (janela de 5 em volta da página atual); some quando há uma página só. */
export function Pagination({
  page,
  totalPages,
  pageHref,
  summary,
  surface,
  className,
}: PaginationProps): React.JSX.Element | null {
  if (totalPages <= 1) return null;
  const hoverClassName = HOVER_BY_SURFACE[surface];
  return (
    <nav
      aria-label="Páginas"
      className={cx('flex flex-wrap items-center justify-between gap-3', className)}
    >
      <p className="text-sm text-ink-3">{summary}</p>
      <div className="flex items-center gap-1">
        <PageStep
          href={page > 1 ? pageHref(page - 1) : null}
          label="Página anterior"
          hoverClassName={hoverClassName}
        >
          <CaretLeft size={16} aria-hidden />
        </PageStep>
        {listVisiblePages(page, totalPages).map((number) => (
          <Link
            key={number}
            href={pageHref(number)}
            aria-current={number === page ? 'page' : undefined}
            className={cx(CELL, number === page ? PILL_ACTIVE : cx('text-ink-2', hoverClassName))}
          >
            {number}
          </Link>
        ))}
        <PageStep
          href={page < totalPages ? pageHref(page + 1) : null}
          label="Próxima página"
          hoverClassName={hoverClassName}
        >
          <CaretRight size={16} aria-hidden />
        </PageStep>
      </div>
    </nav>
  );
}
