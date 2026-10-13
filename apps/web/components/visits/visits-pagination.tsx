import type { VisitList } from '@wifi/shared';
import { Pagination } from '@/components/ui/pagination';
import { formatInteger } from '@/lib/format';
import { countPages } from '@/lib/pagination';
import { buildVisitsHref, type VisitFilters } from '@/lib/visit-filters';

type VisitsPaginationProps = {
  list: VisitList;
  /** Filtros atuais, repetidos na URL de cada página. */
  filters: VisitFilters;
};

/** Paginação da lista de visitas, mantendo os filtros em cada link. */
export function VisitsPagination({ list, filters }: VisitsPaginationProps): React.JSX.Element {
  const pages = countPages(list.total, list.pageSize);
  return (
    <Pagination
      page={list.page}
      totalPages={pages}
      pageHref={(page) => buildVisitsHref(filters, { page })}
      summary={`Página ${list.page} de ${pages} · ${formatInteger(list.total)} visitas`}
      surface="page"
    />
  );
}
