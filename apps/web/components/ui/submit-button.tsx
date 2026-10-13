'use client';

import { useFormStatus } from 'react-dom';
import { PendingButton } from './pending-button';

type SubmitButtonProps = {
  children: React.ReactNode;
  /** Texto enquanto o formulário envia. */
  pendingLabel: string;
  className?: string;
};

/** Botão de enviar do formulário: lê o estado do envio e mostra o texto de espera. */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: SubmitButtonProps): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <PendingButton
      type="submit"
      isPending={pending}
      disabledStyle="wait"
      pendingLabel={pendingLabel}
      className={className}
    >
      {children}
    </PendingButton>
  );
}
