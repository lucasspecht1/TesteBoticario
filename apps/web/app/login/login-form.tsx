'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/submit-button';
import { login, type LoginState } from './actions';

export function LoginForm({ expired }: { expired: boolean }) {
  const [state, action] = useActionState<LoginState, FormData>(login, {});
  const message = state.error ?? (expired ? 'Sua sessão expirou. Entre de novo.' : undefined);
  return (
    <form action={action} className="space-y-4">
      {message && (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {message}
        </p>
      )}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">E-mail</span>
        <input name="email" type="email" required autoComplete="username" defaultValue="dono@loja.demo"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Senha</span>
        <input name="password" type="password" required autoComplete="current-password"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </label>
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
    </form>
  );
}
