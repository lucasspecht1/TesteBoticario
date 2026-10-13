import { UsersThree } from '@phosphor-icons/react/dist/ssr';
import { Notice } from '@/components/ui/notice';
import { isStoreCrowded } from '@/lib/crowd';
import { formatInteger } from '@/lib/format';

/** Alerta de loja cheia (role=status); não aparece abaixo do limite. */
export function CrowdAlert({ inStore }: { inStore: number }): React.JSX.Element | null {
  if (!isStoreCrowded(inStore)) return null;
  return (
    <Notice kind="error" icon={UsersThree} role="status" spacing="roomy">
      <span>
        <strong className="font-semibold">
          Loja cheia agora: {formatInteger(inStore)} clientes.
        </strong>{' '}
        Chame reforço para o atendimento.
      </span>
    </Notice>
  );
}
