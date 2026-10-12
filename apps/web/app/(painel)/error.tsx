'use client';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';

export default function PainelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6">
      <p className="font-semibold text-red-900">Não foi possível carregar o painel.</p>
      <p className="mt-1 text-sm text-red-800">O servidor pode estar indisponível por um instante. Seus dados estão seguros.</p>
      <button
        onClick={() => startTransition(() => { router.refresh(); reset(); })}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white"
      >
        Tentar de novo
      </button>
    </div>
  );
}
