import { CircleNotch } from '@phosphor-icons/react';

/** Ícone girando ao lado do texto de um botão enquanto a ação roda. */
export function Spinner(): React.JSX.Element {
  return <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden />;
}
