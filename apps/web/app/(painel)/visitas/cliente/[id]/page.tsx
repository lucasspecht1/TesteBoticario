import { notFound } from 'next/navigation';
import { CustomerHeader } from '@/components/customers/customer-header';
import { CustomerStats } from '@/components/customers/customer-stats';
import { VisitHistory } from '@/components/customers/visit-history';
import { api, ApiError, HTTP_STATUS } from '@/lib/api';

/** Perfil de um cliente: segmento, números e histórico de visitas; id desconhecido responde 404. */
export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;
  const customer = await api.customer(id).catch((error) => {
    if (error instanceof ApiError && error.status === HTTP_STATUS.notFound) notFound();
    throw error;
  });
  return (
    <div className="space-y-6">
      <CustomerHeader customer={customer} />
      <CustomerStats customer={customer} />
      <VisitHistory customer={customer} />
    </div>
  );
}
