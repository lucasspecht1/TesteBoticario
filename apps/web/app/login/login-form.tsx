'use client';

import { useActionState } from 'react';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { DEMO_OWNER_EMAIL } from '@/lib/demo-account';
import { login, type LoginState } from './actions';

/** Formulário de login; avisa quando a sessão anterior expirou. */
export function LoginForm({ isExpired }: { isExpired: boolean }): React.JSX.Element {
  const [state, action] = useActionState<LoginState, FormData>(login, {});
  const message = state.error ?? (isExpired ? 'Sua sessão expirou. Entre de novo.' : undefined);
  return (
    <form action={action} className="space-y-5">
      {message && <Notice kind="error">{message}</Notice>}
      <Field
        label="E-mail"
        name="email"
        type="email"
        required
        autoComplete="username"
        spellCheck={false}
        defaultValue={DEMO_OWNER_EMAIL}
      />
      <Field
        label="Senha"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />
      <SubmitButton pendingLabel="Entrando…" className="w-full py-3">
        Entrar
      </SubmitButton>
    </form>
  );
}
