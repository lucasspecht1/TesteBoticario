import Link from 'next/link';

export function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
      <p className="font-semibold">Nenhuma visita neste período</p>
      <p className="mt-1 text-sm text-zinc-600">
        Assim que clientes se conectarem ao Wi-Fi, os números aparecem aqui.
      </p>
      <Link href="/simular" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
        Gerar movimento de teste
      </Link>
    </div>
  );
}
