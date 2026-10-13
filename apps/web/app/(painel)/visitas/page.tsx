import { visitsQuerySchema, type VisitsQuery } from '@wifi/shared';
import { Suspense } from 'react';
import { AutoRefresh } from '@/components/ui/auto-refresh';
import { PageIntro } from '@/components/ui/page-intro';
import { PageSkeleton } from '@/components/ui/skeletons';
import { FiltersBar } from '@/components/visits/filters-bar';
import { LiveStrip } from '@/components/visits/live-strip';
import { NoVisitsPanel } from '@/components/visits/no-visits-panel';
import { VisitsPagination } from '@/components/visits/visits-pagination';
import { VisitsTable } from '@/components/visits/visits-table';
import { api } from '@/lib/api';

/** Lista de visitas com filtros e busca na URL, faixa do agora e paginação. */
export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<React.JSX.Element> {
  const rawFilters = await searchParams;
  const parsed = visitsQuerySchema.safeParse(rawFilters);
  // busca inválida: mostra o erro no campo e lista sem ela, em vez de quebrar a página
  const query = parsed.success
    ? parsed.data
    : visitsQuerySchema.parse({ ...rawFilters, q: undefined });
  const queryError = parsed.success
    ? undefined
    : parsed.error.issues.find((issue) => issue.path[0] === 'q')?.message;
  return (
    <div className="space-y-6">
      <PageIntro title="Visitas">
        Cada ida à loja, com entrada, saída e duração. O cliente aparece por um apelido; o nome só
        de quem se cadastrou e aceitou contato.
      </PageIntro>
      <FiltersBar
        current={{ ...query, page: undefined, q: queryError ? rawFilters.q : query.q }}
        queryError={queryError}
      />
      <AutoRefresh />
      <Suspense key={JSON.stringify(query)} fallback={<PageSkeleton label="Carregando visitas" />}>
        <VisitsContent query={query} />
      </Suspense>
    </div>
  );
}

/** Busca a página de visitas e mostra a faixa do agora, a tabela e a paginação (ou o estado vazio). */
async function VisitsContent({ query }: { query: VisitsQuery }) {
  const list = await api.visits(query);
  const filters = { ...query, page: undefined };
  return (
    <div className="space-y-6">
      <LiveStrip live={list.live} />
      {list.items.length === 0 ? (
        <NoVisitsPanel filters={filters} />
      ) : (
        <>
          <VisitsTable visits={list.items} shouldShowDay={query.range !== 'today'} />
          <VisitsPagination list={list} filters={filters} />
        </>
      )}
    </div>
  );
}
