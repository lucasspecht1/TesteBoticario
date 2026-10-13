import { lapsedQuerySchema } from '@wifi/shared';
import { Suspense } from 'react';
import { LapsedCard } from '@/components/customers/lapsed-card';
import { RetentionCard } from '@/components/customers/retention-card';
import { PageIntro } from '@/components/ui/page-intro';
import { PageSkeleton } from '@/components/ui/skeletons';
import { api } from '@/lib/api';

const RETENTION_RISE_INDEX = 1;
const LAPSED_RISE_INDEX = 2;

/** Tela de clientes: retenção por turma e a lista de sumidos para reativar. */
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<React.JSX.Element> {
  const { page } = lapsedQuerySchema.catch({ page: 1 }).parse(await searchParams);
  return (
    <div className="space-y-6">
      <PageIntro title="Clientes">
        Se a loja fideliza quem vem pela primeira vez, e quem vale chamar de volta.
      </PageIntro>
      <Suspense key={page} fallback={<PageSkeleton label="Carregando clientes" />}>
        <CustomersContent page={page} />
      </Suspense>
    </div>
  );
}

/** Busca retenção e sumidos em paralelo e monta os dois cartões. */
async function CustomersContent({ page }: { page: number }) {
  const [retention, lapsed] = await Promise.all([api.retention(), api.lapsed(page)]);
  return (
    <div className="space-y-6">
      <RetentionCard retention={retention} riseIndex={RETENTION_RISE_INDEX} />
      <LapsedCard list={lapsed} riseIndex={LAPSED_RISE_INDEX} />
    </div>
  );
}
