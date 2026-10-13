'use client';

import { ArrowClockwise, CloudSlash } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { MessagePanel, PANEL_ACTION } from '@/components/ui/message-panel';

/** Tela de erro do painel: o servidor falhou, com botão para tentar de novo. */
export default function PanelError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  const router = useRouter();
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });
  return (
    <MessagePanel
      icon={CloudSlash}
      tone="down"
      role="alert"
      title="Não foi possível carregar o painel"
      description="O servidor pode estar indisponível por um instante. Seus dados estão seguros."
      action={
        <button onClick={retry} className={PANEL_ACTION}>
          <ArrowClockwise size={16} weight="bold" aria-hidden />
          Tentar de novo
        </button>
      }
    />
  );
}
