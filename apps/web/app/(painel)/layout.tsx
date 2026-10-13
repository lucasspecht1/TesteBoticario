import { SignOut } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { cx } from '@/lib/cx';
import { Logo } from '@/components/ui/logo';
import { MainNav } from '@/components/ui/main-nav';
import { logout } from '@/app/login/actions';

const SKIP_LINK = cx(
  'sr-only rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white',
  'focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-30',
);
const SIGN_OUT_BUTTON = cx(
  'inline-flex items-center gap-2 rounded-full px-2.5 py-2 sm:px-3.5',
  'text-sm font-medium text-ink-2 transition-colors hover:bg-paper hover:text-ink',
);

/** Estrutura das telas logadas: link de pular conteúdo, cabeçalho fixo com navegação e a área principal. */
export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="min-h-dvh">
      <a href="#conteudo" className={SKIP_LINK}>
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-20 border-b border-line bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3 text-ink">
            <Logo className="h-3.5 shrink-0 sm:h-[18px]" />
            <span className="hidden h-5 w-px bg-line sm:block" aria-hidden />
            <span className="hidden text-sm font-medium text-ink-2 sm:block">Painel da loja</span>
          </Link>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <MainNav />
            <form action={logout}>
              <button className={SIGN_OUT_BUTTON}>
                <SignOut size={18} aria-hidden />
                <span className="sr-only sm:not-sr-only">Sair</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="conteudo" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
