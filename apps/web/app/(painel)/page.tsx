import { rangeSchema, type Range } from '@wifi/shared';
import { Card } from '@/components/card';
import { DailyChart } from '@/components/daily-chart';
import { DwellBars } from '@/components/dwell-bars';
import { EmptyState } from '@/components/empty-state';
import { Heatmap } from '@/components/heatmap';
import { Insights } from '@/components/insights';
import { KpiCard } from '@/components/kpi-card';
import { RangeTabs } from '@/components/range-tabs';
import { api } from '@/lib/api';
import { fmtInt, fmtMin, fmtPct } from '@/lib/format';

const RANGE_LABEL: Record<Range, string> = { '7d': '7 dias', '30d': '30 dias', '90d': '90 dias' };

export default async function PainelPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = rangeSchema.catch('30d').parse((await searchParams).range);
  const m = await api.metrics(range);
  const { kpis } = m;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Visitantes da loja</h1>
          <p className="text-sm text-zinc-600">
            Últimos {RANGE_LABEL[range]}, comparados ao período anterior até o mesmo horário.
          </p>
        </div>
        <RangeTabs current={range} />
      </div>

      {kpis.visits.value === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section aria-labelledby="kpis" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <h2 id="kpis" className="sr-only">Indicadores</h2>
            <KpiCard label="Visitantes únicos" value={fmtInt(kpis.uniqueVisitors.value)} delta={kpis.uniqueVisitors.delta} deltaUnit="%" hint="Aparelhos diferentes que se conectaram." />
            <KpiCard label="Visitas" value={fmtInt(kpis.visits.value)} delta={kpis.visits.delta} deltaUnit="%" hint="Idas à loja (reconexões em até 30 min contam como uma)." />
            <KpiCard label="Clientes que voltaram" value={fmtPct(kpis.returningRate.value)} delta={kpis.returningRate.delta} deltaUnit=" p.p." hint="Já tinham vindo à loja em outro dia." />
            <KpiCard label="Permanência típica" value={fmtMin(kpis.medianDwellMinutes.value)} delta={kpis.medianDwellMinutes.delta} deltaUnit="%" hint="Mediana do tempo conectado." />
            <KpiCard label="Aceitaram comunicações" value={fmtPct(kpis.optInRate.value)} delta={kpis.optInRate.delta} deltaUnit=" p.p." hint="Cadastro no Wi-Fi com consentimento (LGPD)." />
          </section>

          <Insights items={m.insights} />

          <Card title="Visitantes por dia" subtitle="Novos e recorrentes">
            <DailyChart data={m.daily} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2" title="Quando a loja enche" subtitle="Média de visitas por dia da semana e hora">
              <Heatmap cells={m.heatmap} />
            </Card>
            <Card title="Quanto tempo ficam" subtitle="Visitas encerradas, por faixa">
              <DwellBars buckets={m.dwellBuckets} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
