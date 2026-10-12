import Link from 'next/link';
import { logout } from '../login/actions';

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Wi-Fi de visitantes</p>
            <p className="font-semibold">Painel da loja</p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="hover:underline">Painel</Link>
            <Link href="/simular" className="hover:underline">Simular dados</Link>
            <form action={logout}>
              <button className="text-zinc-600 hover:underline">Sair</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
