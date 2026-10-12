'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/submit-button';
import { registerConnection, type FormState } from './actions';
import { Feedback } from './simulate-form';

function Field({ label, name, error, ...props }: { label: string; name: string; error?: string[] } & React.InputHTMLAttributes<HTMLInputElement>) {
  const errorId = `${name}-erro`;
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input name={name} aria-invalid={!!error} aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border px-3 py-2 ${error ? 'border-red-500' : 'border-zinc-300'}`} {...props} />
      {error && <span id={errorId} className="mt-1 block text-xs text-red-700">{error[0]}</span>}
    </label>
  );
}

export function ConnectionForm() {
  const [state, action] = useActionState<FormState, FormData>(registerConnection, {});
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label="MAC do aparelho" name="mac" placeholder="AA:BB:CC:DD:EE:FF" required error={err.mac} />
      <div />
      <Field label="Entrada" name="connectedAt" type="datetime-local" required error={err.connectedAt} />
      <Field label="Saída (opcional)" name="disconnectedAt" type="datetime-local" error={err.disconnectedAt} />
      <Field label="Nome (cadastro opcional)" name="name" error={err.lead} />
      <Field label="E-mail (opcional)" name="email" type="email" />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="marketingOptIn" /> Aceita receber comunicações da loja
      </label>
      <div className="space-y-2 sm:col-span-2">
        <SubmitButton pendingLabel="Registrando…">Registrar conexão</SubmitButton>
        <Feedback state={state} />
      </div>
    </form>
  );
}
