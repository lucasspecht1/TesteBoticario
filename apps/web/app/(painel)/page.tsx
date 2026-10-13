import type { Range } from '@wifi/shared';
import { Suspense } from 'react';
import { DailyAndDwell } from '@/components/dashboard/daily-and-dwell';
import { EmptyState } from '@/components/dashboard/empty-state';
import { InsightReading } from '@/components/dashboard/insight-reading';
import { KpiRuler } from '@/components/dashboard/kpi-ruler';
import { PeriodHeadline } from '@/components/dashboard/period-headline';
import { WeekOverview } from '@/components/dashboard/week-overview';
import { AutoRefresh } from '@/components/ui/auto-refresh';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { RecentVisits } from '@/components/visits/recent-visits';
import { api } from '@/lib/api';
import { parseRange } from '@/lib/ranges';
import { DEFAULT_VISIT_FILTERS, RECENT_VISITS_RANGE } from '@/lib/visit-filters';

// Posição de cada bloco na sequência de entrada (`.rise`); as colunas da semana ocupam da 2 à 8.
const INSIGHTS_RISE_INDEX = 9;
const KPIS_RISE_INDEX = 10;
const CHARTS_RISE_INDEX = 11;
const RECENT_VISITS_RISE_INDEX = 13;

// Suspense com chave pelo filtro (e não loading.tsx): no Next 15.5 em produção, trocar só o
// ?range= sob um loading.tsx buscava os dados mas não trocava a tela.
/** Painel inicial: manchete do período, semana típica, indicadores, gráficos e últimas visitas. */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}): Promise<React.JSX.Element> {
  const range = parseRange((await searchParams).range);
  return (
    <>
      <AutoRefresh />
      <Suspense key={range} fallback={<DashboardSkeleton />}>
        <DashboardContent range={range} />
      </Suspense>
    </>
  );
}

/** Busca as métricas do período e as visitas recentes e monta o painel; sem visita, mostra o estado vazio. */
async function DashboardContent({ range }: { range: Range }) {
  const [metrics, recentVisits] = await Promise.all([
    api.metrics(range),
    api.visits({ ...DEFAULT_VISIT_FILTERS, range: RECENT_VISITS_RANGE, page: 1 }),
  ]);
  if (metrics.kpis.visits.value === 0) return <EmptyState />;
  return (
    <div className="space-y-10">
      {/* A manchete diz como foi o período; as colunas dizem o que fazer na semana. */}
      <PeriodHeadline metrics={metrics} range={range} />
      <WeekOverview metrics={metrics} range={range} />
      <InsightReading insights={metrics.insights} riseIndex={INSIGHTS_RISE_INDEX} />
      <KpiRuler metrics={metrics} riseIndex={KPIS_RISE_INDEX} />
      <DailyAndDwell metrics={metrics} riseIndex={CHARTS_RISE_INDEX} />
      <RecentVisits list={recentVisits} riseIndex={RECENT_VISITS_RISE_INDEX} />
    </div>
  );
}
