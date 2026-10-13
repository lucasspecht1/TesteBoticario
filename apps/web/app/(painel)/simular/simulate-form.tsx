'use client';

import { ArrowRight, Check } from '@phosphor-icons/react';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Field } from '@/components/ui/field';
import { PendingButton } from '@/components/ui/pending-button';
import { TEXT_LINK_UNDERLINE } from '@/components/ui/styles';
import { cx } from '@/lib/cx';
import { simulate, type FormState } from './actions';
import { FormFeedback } from './form-feedback';

const PRESETS = [
  { visits: 10, label: 'Movimento fraco' },
  { visits: 40, label: 'Hora do rush' },
  { visits: 120, label: 'Loja lotada' },
];

const PRESET_BASE = cx(
  'relative flex min-w-0 flex-col items-start rounded-[var(--radius-card)] border',
  'px-4 py-3 text-left transition active:scale-[0.98]',
);
const TEXT_LINK = cx(
  'inline-flex items-center gap-1.5 text-sm font-semibold text-brand',
  TEXT_LINK_UNDERLINE,
);

type PresetButtonProps = {
  label: string;
  visits: number;
  isActive: boolean;
  onToggle: () => void;
};

/** Atalho de quantidade de visitas; clicar de novo desmarca. */
function PresetButton({ label, visits, isActive, onToggle }: PresetButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onToggle}
      className={cx(
        PRESET_BASE,
        isActive
          ? 'border-brand bg-brand-soft ring-1 ring-brand'
          : 'border-line bg-card hover:border-quartzo',
      )}
    >
      {isActive && (
        <span
          className="absolute top-2.5 right-2.5 grid size-5 place-items-center rounded-full bg-brand text-white"
          aria-hidden
        >
          <Check size={12} weight="bold" />
        </span>
      )}
      <span className={cx('text-sm font-semibold', isActive ? 'text-brand-strong' : 'text-ink')}>
        {label}
      </span>
      <span className="mt-0.5 text-xs text-ink-3 tabular-nums">{visits} visitas</span>
    </button>
  );
}

/** Botão "Gerar": desligado enquanto nada foi escolhido e durante o envio. */
function GenerateButton({ isDisabled }: { isDisabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <PendingButton
      type="submit"
      isPending={pending}
      isDisabled={isDisabled}
      disabledStyle="blocked"
      pendingLabel="Gerando…"
      className="mb-6"
    >
      Gerar
    </PendingButton>
  );
}

/**
 * Escolha alternada: um atalho OU uma quantidade digitada. Clicar num atalho só seleciona e limpa o
 * campo; digitar desmarca o atalho. "Gerar" envia o que estiver escolhido.
 */
export function SimulateForm({ maxVisits }: { maxVisits: number }): React.JSX.Element {
  const [state, action] = useActionState<FormState, FormData>(simulate, {});
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customVisits, setCustomVisits] = useState('');
  const visits = selectedPreset ?? (customVisits === '' ? null : Number(customVisits));
  const fieldError = state.error && !state.successMessage ? [state.error] : undefined;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="visits" value={visits ?? ''} />
      <div role="group" aria-label="Atalhos de movimento" className="grid grid-cols-3 gap-2">
        {PRESETS.map((preset) => {
          const isActive = selectedPreset === preset.visits;
          return (
            <PresetButton
              key={preset.visits}
              label={preset.label}
              visits={preset.visits}
              isActive={isActive}
              onToggle={() => {
                setSelectedPreset(isActive ? null : preset.visits);
                setCustomVisits('');
              }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Field
          label="Ou escolha a quantidade"
          name="custom"
          type="number"
          min={1}
          max={maxVisits}
          inputMode="numeric"
          placeholder={`1 a ${maxVisits}`}
          value={customVisits}
          onChange={(event) => {
            setCustomVisits(event.target.value);
            if (event.target.value !== '') setSelectedPreset(null);
          }}
          hint={`Entre 1 e ${maxVisits}.`}
          error={fieldError}
          className="w-52"
        />
        <GenerateButton isDisabled={visits === null} />
      </div>
      {visits === null && (
        <p className="-mt-2 text-xs text-ink-3">Escolha um atalho ou digite a quantidade.</p>
      )}
      {state.successMessage && <FormFeedback state={state} />}
      {state.successMessage && (
        <Link href="/" className={TEXT_LINK}>
          Ver no painel <ArrowRight size={14} weight="bold" aria-hidden />
        </Link>
      )}
    </form>
  );
}
