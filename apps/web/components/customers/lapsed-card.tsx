import { DownloadSimple } from '@phosphor-icons/react/dist/ssr';
import { LAPSED_DAYS, type LapsedCustomer, type LapsedList } from '@wifi/shared';
import { CustomerLink } from '@/components/visits/customer-link';
import { Pagination } from '@/components/ui/pagination';
import { SectionCard } from '@/components/ui/section-card';
import {
  CARD_EMPTY_TEXT,
  CARD_SUBTITLE,
  PRIMARY_BUTTON,
  SECTION_TITLE,
} from '@/components/ui/styles';
import { cx } from '@/lib/cx';
import { formatDayMonth, formatInteger, formatLongDate, pluralize } from '@/lib/format';
import { countPages } from '@/lib/pagination';
import { getRiseStyle } from '@/lib/rise';

/** URL de uma página da lista de sumidos; a primeira não leva `?page=`. */
const buildLapsedPageHref = (page: number): string =>
  page > 1 ? `/clientes?page=${page}` : '/clientes';

/** Linha de um cliente sumido: quem é, há quantos dias não vem e quando foi a última visita. */
function LapsedRow({ customer }: { customer: LapsedCustomer }) {
  return (
    <li className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <CustomerLink customer={customer} layout="inline" />
      <span className="text-ink-2 sm:text-right">
        <span className="tabular-nums">{formatInteger(customer.daysAway)} dias sem vir</span>
        <span className="text-xs text-ink-3 max-sm:ml-1.5 sm:block">
          <span className="sm:hidden">desde {formatDayMonth(customer.lastVisitAt)}, </span>
          <span className="max-sm:hidden">
            última visita em {formatLongDate(customer.lastVisitAt)},{' '}
          </span>
          {formatInteger(customer.totalVisits)} visitas
        </span>
      </span>
    </li>
  );
}

/** Texto de apoio do cartão, com singular e plural conforme o total. */
function describeLapsed(total: number): string {
  const returned = pluralize(total, 'cliente já voltou', 'clientes já voltaram');
  const missing = pluralize(total, 'aparece', 'aparecem');
  const sinceLastVisit = `antes, mas não ${missing} há mais de ${LAPSED_DAYS} dias.`;
  const consent = 'Só entra quem aceitou receber comunicações da loja.';
  return `${formatInteger(total)} ${returned} ${sinceLastVisit} ${consent}`;
}

type LapsedCardProps = {
  list: LapsedList;
  riseIndex?: number;
};

/** Sumidos que aceitaram contato, com exportação para campanha de reativação. */
export function LapsedCard({ list, riseIndex = 0 }: LapsedCardProps): React.JSX.Element {
  const pages = countPages(list.total, list.pageSize);
  return (
    <SectionCard labelledBy="reativar" style={getRiseStyle(riseIndex)}>
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="max-w-xl">
          <h2 id="reativar" className={SECTION_TITLE}>
            Clientes para reativar
          </h2>
          <p className={CARD_SUBTITLE}>{describeLapsed(list.total)}</p>
        </div>
        {list.total > 0 && (
          <a
            href="/clientes/exportar"
            download
            className={cx('inline-flex items-center gap-2 px-4 py-2.5', PRIMARY_BUTTON)}
          >
            <DownloadSimple size={16} weight="bold" aria-hidden /> Exportar lista (CSV)
          </a>
        )}
      </div>
      {list.total === 0 ? (
        <p className={CARD_EMPTY_TEXT}>Nenhum cliente sumido com consentimento. Bom sinal.</p>
      ) : (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <ul className="divide-y divide-line/60">
            {list.items.map((customer) => (
              <LapsedRow key={customer.id} customer={customer} />
            ))}
          </ul>
          <Pagination
            page={list.page}
            totalPages={pages}
            pageHref={buildLapsedPageHref}
            summary={`Página ${list.page} de ${pages}`}
            surface="card"
            className="mt-4"
          />
        </div>
      )}
    </SectionCard>
  );
}
