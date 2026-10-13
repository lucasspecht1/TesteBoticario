import { CheckCircle } from '@phosphor-icons/react/dist/ssr';
import type { VisitListItem } from '@wifi/shared';
import {
  CARD_SURFACE_CLIPPED,
  TABLE_HEADER_CELL,
  TABLE_HEADER_ROW_ROUNDED,
} from '@/components/ui/styles';
import { cx } from '@/lib/cx';
import {
  EMPTY_VALUE,
  formatDayMonth,
  formatDuration,
  formatInteger,
  formatOptionalDuration,
  formatTime,
  formatVisitSchedule,
  pluralize,
} from '@/lib/format';
import { getRiseStyle } from '@/lib/rise';
import { CustomerLink } from './customer-link';
import { ExitCell } from './exit-cell';
import { KindChip } from './kind-chip';

const COLUMN_HEADERS = ['Cliente', 'Entrada', 'Saída', 'Duração', 'Tipo', 'Visitas', 'Cadastro'];
const DEFAULT_RISE_INDEX = 3;

// Embutida, a tabela não tem cartão próprio e a linha de títulos ganha cantos arredondados.
const EMBEDDED_WRAPPER = 'px-5 pb-3 sm:px-6 sm:pb-4';

type VisitRowsProps = {
  visits: VisitListItem[];
  shouldShowDay: boolean;
  isEmbedded: boolean;
  now: number;
};

/** Tabela de visitas para telas médias e grandes. */
function VisitsDesktopTable({ visits, shouldShowDay, isEmbedded, now }: VisitRowsProps) {
  const cellPadding = isEmbedded ? 'px-4 py-3' : 'px-5 py-3';
  return (
    <table className="hidden w-full text-left text-sm md:table">
      <caption className="sr-only">
        Visitas: cliente, entrada, saída, duração, tipo, total de visitas e cadastro
      </caption>
      <thead className="text-xs text-ink-3">
        <tr className={isEmbedded ? TABLE_HEADER_ROW_ROUNDED : ''}>
          {COLUMN_HEADERS.map((header) => (
            <th
              key={header}
              scope="col"
              className={cx(TABLE_HEADER_CELL, isEmbedded ? 'px-4' : 'px-5')}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line/60">
        {visits.map((visit) => (
          <tr key={visit.id} className="transition-colors hover:bg-paper/60">
            <td className={cellPadding}>
              <CustomerLink customer={visit.customer} layout="stacked" />
            </td>
            <td className={cx(cellPadding, 'tabular-nums')}>
              {shouldShowDay && (
                <span className="mr-1.5 text-ink-3">{formatDayMonth(visit.startedAt)}</span>
              )}
              {formatTime(visit.startedAt)}
            </td>
            <td className={cellPadding}>
              <ExitCell visit={visit} now={now} />
            </td>
            <td className={cx(cellPadding, 'tabular-nums')}>
              {visit.durationMinutes === null ? (
                <span className="text-ink-3">{EMPTY_VALUE}</span>
              ) : (
                formatDuration(visit.durationMinutes)
              )}
            </td>
            <td className={cellPadding}>
              <KindChip isReturning={visit.returning} />
            </td>
            <td className={cx(cellPadding, 'tabular-nums')}>
              {formatInteger(visit.customer.totalVisits)}
            </td>
            <td className={cellPadding}>
              {visit.customer.optIn ? (
                <span className="inline-flex items-center gap-1.5 text-brand-strong">
                  <CheckCircle size={16} weight="fill" aria-hidden />
                  Aceitou contato
                </span>
              ) : (
                <span className="text-ink-3">Sem cadastro</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Lista de cartões de visitas para o celular. */
function VisitsMobileList({ visits, shouldShowDay, isEmbedded, now }: VisitRowsProps) {
  return (
    <ul className={cx('divide-y divide-line/60 md:hidden', isEmbedded && '-mx-1')}>
      {visits.map((visit) => (
        <li
          key={visit.id}
          className={cx(
            'flex items-start justify-between gap-3 py-3.5 text-sm',
            isEmbedded ? 'px-1' : 'px-4',
          )}
        >
          <div className="min-w-0 space-y-1">
            <CustomerLink customer={visit.customer} layout="stacked" />
            <p className="text-ink-3 tabular-nums">
              {shouldShowDay && `${formatDayMonth(visit.startedAt)} `}
              {formatVisitSchedule(visit)}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <KindChip isReturning={visit.returning} />
              {visit.customer.optIn && (
                <span className="text-xs text-brand-strong">Aceitou contato</span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            {visit.inStore ? (
              <ExitCell visit={visit} now={now} />
            ) : (
              <span className="font-medium text-ink tabular-nums">
                {formatOptionalDuration(visit.durationMinutes)}
              </span>
            )}
            <p className="mt-1 text-xs text-ink-3 tabular-nums">
              {formatInteger(visit.customer.totalVisits)}{' '}
              {pluralize(visit.customer.totalVisits, 'visita', 'visitas')}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

type VisitsTableProps = {
  visits: VisitListItem[];
  /** Mostra o dia antes da hora de entrada (períodos maiores que um dia). */
  shouldShowDay: boolean;
  riseIndex?: number;
  /** Sem cartão próprio, para ficar dentro de outro cartão (Últimas visitas do painel). */
  isEmbedded?: boolean;
};

/** Tabela no desktop, lista de cartões no celular. */
export function VisitsTable({
  visits,
  shouldShowDay,
  riseIndex = DEFAULT_RISE_INDEX,
  isEmbedded = false,
}: VisitsTableProps): React.JSX.Element {
  const rowsProps: VisitRowsProps = { visits, shouldShowDay, isEmbedded, now: Date.now() };
  return (
    <div
      className={isEmbedded ? EMBEDDED_WRAPPER : cx('rise', CARD_SURFACE_CLIPPED)}
      style={isEmbedded ? undefined : getRiseStyle(riseIndex)}
    >
      <VisitsDesktopTable {...rowsProps} />
      <VisitsMobileList {...rowsProps} />
    </div>
  );
}
