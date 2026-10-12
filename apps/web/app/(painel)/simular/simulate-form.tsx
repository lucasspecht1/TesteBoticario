'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/submit-button';
import { simulate, type FormState } from './actions';

export function SimulateForm() {
  const [state, action] = useActionState<FormState, FormData>(simulate, {});
  return (
    <form key={state.values?.visits ?? ''} action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Quantidade de visitas</span>
        <input name="visits" type="number" min={1} max={200} defaultValue={state.values?.visits ?? 40} required
          className="w-32 rounded-lg border border-zinc-300 px-3 py-2" />
      </label>
      <SubmitButton pendingLabel="Gerando…">Gerar movimento</SubmitButton>
      <Feedback state={state} />
    </form>
  );
}

export function Feedback({ state }: { state: FormState }) {
  if (state.ok) return <p role="status" className="text-sm text-emerald-700">{state.ok}</p>;
  if (state.error) return <p role="alert" className="text-sm text-red-700">{state.error}</p>;
  return null;
}
