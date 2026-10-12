import { LoginForm } from './login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expirada?: string }> }) {
  const { expirada } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Wi-Fi de visitantes</p>
        <h1 className="mb-1 text-xl font-semibold">Painel da loja</h1>
        <p className="mb-6 text-sm text-zinc-600">Demo: dono@loja.demo / demo1234</p>
        <LoginForm expired={expirada === '1'} />
      </div>
    </main>
  );
}
