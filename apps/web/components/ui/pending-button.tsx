import { cx } from '@/lib/cx';
import { Spinner } from './spinner';
import { PRIMARY_BUTTON_LARGE } from './styles';

/** Aparência do botão desligado: `wait` (cursor de espera, só enquanto roda) ou `blocked` (não permitido). */
const DISABLED_STYLES = {
  wait: 'disabled:cursor-wait disabled:opacity-70',
  blocked: 'disabled:cursor-not-allowed disabled:opacity-50',
} as const;

type PendingButtonProps = {
  type: 'submit' | 'button';
  isPending: boolean;
  /** Desliga o botão por outro motivo além de estar enviando. */
  isDisabled?: boolean;
  disabledStyle: keyof typeof DISABLED_STYLES;
  pendingLabel: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
};

/** Botão verde que mostra o giro e um texto de espera enquanto a ação roda. */
export function PendingButton({
  type,
  isPending,
  isDisabled = false,
  disabledStyle,
  pendingLabel,
  onClick,
  className,
  children,
}: PendingButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled || isPending}
      className={cx(PRIMARY_BUTTON_LARGE, DISABLED_STYLES[disabledStyle], className)}
    >
      {isPending && <Spinner />}
      {isPending ? pendingLabel : children}
    </button>
  );
}
