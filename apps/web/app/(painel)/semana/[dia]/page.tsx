import type { Range } from '@wifi/shared';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { DayAnalysis } from '@/components/day/day-analysis';
import { PageSkeleton } from '@/components/ui/skeletons';
import { api } from '@/lib/api';
import { parseRange } from '@/lib/ranges';
import { WEEKDAY_SLUGS } from '@/lib/weekdays';

/** Análise de um dia da semana (`/semana/segunda`); endereço inválido responde 404. */
export default async function DayAnalysisPage({
  params,
  searchParams,
}: {
  params: Promise<{ dia: string }>;
  searchParams: Promise<{ range?: string }>;
}): Promise<React.JSX.Element> {
  // validado antes do Suspense: endereço inválido responde 404 de verdade
  const weekday = WEEKDAY_SLUGS.indexOf((await params).dia);
  if (weekday < 0) notFound();
  const range = parseRange((await searchParams).range);
  return (
    <Suspense
      key={`${weekday}-${range}`}
      fallback={<PageSkeleton label="Carregando a análise do dia" />}
    >
      <DayAnalysisContent weekday={weekday} range={range} />
    </Suspense>
  );
}

/** Busca o detalhe do dia e monta a análise. */
async function DayAnalysisContent({ weekday, range }: { weekday: number; range: Range }) {
  return <DayAnalysis detail={await api.weekday(range, weekday)} range={range} />;
}
