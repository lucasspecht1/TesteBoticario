import Image from 'next/image';
import { Logo } from '@/components/ui/logo';
import { cx } from '@/lib/cx';
import { DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD } from '@/lib/demo-account';
import monstera from '@/public/login-monstera.webp';
import { LoginForm } from './login-form';

const HERO_PANEL = cx(
  'relative isolate flex min-h-[26rem] flex-col justify-between overflow-hidden',
  'p-6 text-white sm:p-10 lg:min-h-dvh',
);
const HERO_GRADIENT = cx(
  'absolute inset-0 -z-10 bg-gradient-to-b',
  'from-brand-deep/50 via-transparent via-40% to-brand-deep/90',
);

/** Tela de login: foto da marca à esquerda e o formulário à direita. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expirada?: string }>;
}): Promise<React.JSX.Element> {
  const { expirada: expiredFlag } = await searchParams;
  return (
    <main className="grid min-h-dvh bg-card lg:grid-cols-[1.1fr_1fr]">
      <section className={HERO_PANEL}>
        {/* Crédito só no HTML (a Unsplash License não exige crédito visível); origem em public/login-monstera.webp.json */}
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html:
              '<!-- Foto: Bart Zimny / Unsplash (https://unsplash.com/photos/W5XTTLpk1-I), Unsplash License -->',
          }}
        />
        <Image
          src={monstera}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="-z-20 object-cover motion-safe:animate-[settle_2.4s_var(--ease-out-expo)_both]"
        />
        {/* véu verde da marca e escurecimento: leve no topo (logo), forte embaixo (texto) */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-brand/20 mix-blend-multiply" />
        <div aria-hidden className={HERO_GRADIENT} />

        <Logo className="relative h-5 self-start sm:h-6" />

        {/* texto no pé do painel, sobre a parte escura do degradê */}
        <div className="relative mt-24">
          <div className="max-w-lg [text-shadow:0_1px_18px_rgb(35_57_46/0.55)]">
            <span aria-hidden className="mb-6 block h-1 w-12 bg-primavera" />
            <p className="font-display text-4xl leading-[1.08] text-balance sm:text-5xl">
              Cada conexão no Wi-Fi é um cliente na sua loja.
            </p>
            <p className="mt-4 max-w-sm text-sm text-white/85 sm:text-base">
              Veja quando a loja enche, quem volta e quanto tempo fica.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-4xl text-balance text-ink">Entrar no painel</h1>
          <p className="mt-2 text-sm text-ink-3">Use a conta da loja para ver o movimento.</p>
          <div className="mt-8">
            <LoginForm isExpired={expiredFlag === '1'} />
          </div>
          <p className="mt-8 rounded-[var(--radius-card)] bg-paper px-4 py-3 text-xs leading-relaxed text-ink-2">
            Conta de demonstração: <strong className="font-semibold">{DEMO_OWNER_EMAIL}</strong> e
            senha <strong className="font-semibold">{DEMO_OWNER_PASSWORD}</strong>
          </p>
        </div>
      </section>
    </main>
  );
}
