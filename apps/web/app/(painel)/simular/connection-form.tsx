'use client';

import { useActionState } from 'react';
import { Field } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { registerConnection, type FormState } from './actions';
import { FormFeedback } from './form-feedback';

/** Formulário de cadastro manual de uma conexão (MAC, horários e cadastro do cliente). */
export function ConnectionForm(): React.JSX.Element {
  const [state, action] = useActionState<FormState, FormData>(registerConnection, {});
  const fieldErrors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  return (
    <form key={JSON.stringify(values)} action={action} className="grid gap-5 sm:grid-cols-2">
      <Field
        label="MAC do aparelho"
        name="mac"
        defaultValue={values.mac}
        placeholder="AA:BB:CC:DD:EE:FF…"
        required
        autoComplete="off"
        spellCheck={false}
        error={fieldErrors.mac}
        className="sm:col-span-2 sm:max-w-sm"
      />
      <Field
        label="Entrada"
        name="connectedAt"
        defaultValue={values.connectedAt}
        type="datetime-local"
        required
        error={fieldErrors.connectedAt}
      />
      <Field
        label="Saída (opcional)"
        name="disconnectedAt"
        defaultValue={values.disconnectedAt}
        type="datetime-local"
        error={fieldErrors.disconnectedAt}
      />
      <Field
        label="Nome (cadastro opcional)"
        name="name"
        autoComplete="off"
        defaultValue={values.name}
        error={fieldErrors.name ?? fieldErrors['lead.name']}
      />
      <Field
        label="E-mail (opcional)"
        name="email"
        type="email"
        autoComplete="off"
        spellCheck={false}
        defaultValue={values.email}
        error={fieldErrors['lead.email']}
      />
      <label className="flex items-center gap-3 text-sm text-ink sm:col-span-2">
        <input
          type="checkbox"
          name="marketingOptIn"
          defaultChecked={!!values.marketingOptIn}
          className="size-4 accent-[var(--color-brand)]"
        />
        Aceita receber comunicações da loja
      </label>
      <div className="space-y-4 sm:col-span-2">
        <SubmitButton pendingLabel="Registrando…">Registrar conexão</SubmitButton>
        <FormFeedback state={state} />
      </div>
    </form>
  );
}
