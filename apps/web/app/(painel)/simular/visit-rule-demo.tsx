'use client';

import { ArrowCounterClockwise, Check } from '@phosphor-icons/react';
import type { IngestResult } from '@wifi/shared';
import { useState, useTransition } from 'react';
import { Chip } from '@/components/ui/chip';
import { Notice } from '@/components/ui/notice';
import { PendingButton } from '@/components/ui/pending-button';
import { PILL_INACTIVE } from '@/components/ui/styles';
import { cx } from '@/lib/cx';
import { runRuleStep } from './actions';
import type { RuleStep, RuleStepNumber } from './rule-steps';

/** Quantos caracteres finais do id da visita aparecem no selo. */
const SHORT_ID_LENGTH = 6;

const RESTART_BUTTON = cx(
  'inline-flex items-center gap-2 rounded-full px-4 py-2.5',
  'text-sm font-medium transition-colors',
  PILL_INACTIVE,
);

type TestRun = { mac: string; startedAt: string };

/** Fundo do passo: feito (verde), o próximo (destacado) ou ainda bloqueado (apagado). */
function getStepTone(isDone: boolean, isCurrent: boolean): string {
  if (isDone) return 'bg-brand-soft/60';
  return isCurrent ? 'bg-paper' : 'opacity-55';
}

type RuleStepItemProps = {
  number: number;
  step: RuleStep;
  /** Resposta da API para este passo; undefined enquanto ele não rodou. */
  result: IngestResult | undefined;
  isCurrent: boolean;
};

/** Um passo do roteiro: feito (verde), o próximo (destacado) ou ainda bloqueado (apagado). */
function RuleStepItem({ number, step, result, isCurrent }: RuleStepItemProps) {
  const isDone = result !== undefined;
  return (
    <li
      className={cx(
        'flex gap-3 rounded-[var(--radius-card)] p-3.5 transition-colors',
        getStepTone(isDone, isCurrent),
      )}
    >
      <span
        className={cx(
          'grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold',
          isDone ? 'bg-brand text-white' : 'bg-card text-ink-2 shadow-[var(--shadow-card)]',
        )}
        aria-hidden
      >
        {isDone ? <Check size={14} weight="bold" /> : number}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{step.title}</p>
        <p className="text-sm text-ink-3">
          {step.detail} <span className="text-ink-2">{step.expect}</span>
        </p>
        {result && (
          <p role="status" className="mt-1.5 text-sm font-medium text-brand-strong">
            {result.merged ? 'Somada à visita' : 'Visita nova'}{' '}
            <Chip tone="surface" weight="normal" className="tabular-nums">
              #{result.visitId.slice(-SHORT_ID_LENGTH)}
            </Chip>
          </p>
        )}
      </div>
    </li>
  );
}

type VisitRuleDemoProps = {
  steps: readonly RuleStep[];
  /** Quantas horas atrás começa o teste. */
  testOffsetHours: number;
};

/** Roteiro de 3 cliques que mostra a regra de visita com a resposta real da API. */
export function VisitRuleDemo({ steps, testOffsetHours }: VisitRuleDemoProps): React.JSX.Element {
  const [run, setRun] = useState<TestRun | null>(null);
  const [results, setResults] = useState<IngestResult[]>([]);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const nextStepIndex = results.length;

  const runNextStep = () =>
    startTransition(async () => {
      setError(undefined);
      const outcome = await runRuleStep(
        // o botão só aparece enquanto há passo pendente, então o número está entre 1 e 3
        (nextStepIndex + 1) as RuleStepNumber,
        run ?? undefined,
      );
      if (!outcome.isSuccess) return setError(outcome.error);
      setRun({ mac: outcome.mac, startedAt: outcome.startedAt });
      setResults((previous) => [...previous, outcome.result]);
    });
  const restart = () => {
    setRun(null);
    setResults([]);
    setError(undefined);
  };

  return (
    <div className="space-y-5">
      {run && (
        <p className="text-xs text-ink-3">
          Aparelho de teste <span className="font-medium text-ink-2 tabular-nums">{run.mac}</span>,
          começando {testOffsetHours} horas atrás.
        </p>
      )}
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <RuleStepItem
            key={step.title}
            number={index + 1}
            step={step}
            result={results[index]}
            isCurrent={index === nextStepIndex}
          />
        ))}
      </ol>
      {error && <Notice kind="error">{error}</Notice>}
      <div className="flex flex-wrap gap-2">
        {nextStepIndex < steps.length ? (
          <PendingButton
            type="button"
            onClick={runNextStep}
            isPending={isPending}
            disabledStyle="wait"
            pendingLabel="Enviando…"
          >
            {`Executar: ${steps[nextStepIndex].title.toLowerCase()}`}
          </PendingButton>
        ) : (
          <p className="text-sm text-ink-2">
            Pronto: os passos 1 e 2 viraram a mesma visita, e o 3 virou outra.
          </p>
        )}
        {results.length > 0 && (
          <button type="button" onClick={restart} disabled={isPending} className={RESTART_BUTTON}>
            <ArrowCounterClockwise size={16} aria-hidden /> Recomeçar com outro aparelho
          </button>
        )}
      </div>
    </div>
  );
}
