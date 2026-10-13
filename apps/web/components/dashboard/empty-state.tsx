import { WifiHigh } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { MessagePanel, PANEL_ACTION } from '@/components/ui/message-panel';

/** Painel sem nenhuma visita no período, com o caminho para gerar dados de teste. */
export function EmptyState(): React.JSX.Element {
  return (
    <MessagePanel
      icon={WifiHigh}
      title="Nenhuma visita neste período"
      description="Assim que clientes se conectarem ao Wi-Fi da loja, os números aparecem aqui."
      action={
        <Link href="/simular" className={PANEL_ACTION}>
          Gerar movimento de teste
        </Link>
      }
    />
  );
}
