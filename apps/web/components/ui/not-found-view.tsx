import { Compass } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { MessagePanel, PANEL_ACTION } from './message-panel';

/** Conteúdo da página 404, usado no 404 geral e no do painel. */
export function NotFoundView(): React.JSX.Element {
  return (
    <MessagePanel
      icon={Compass}
      title="Página não encontrada"
      titleAs="heading"
      description="O endereço não existe ou mudou. Volte para o painel e escolha o dia na semana."
      action={
        <Link href="/" className={PANEL_ACTION}>
          Voltar para o painel
        </Link>
      }
    />
  );
}
