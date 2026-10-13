'use server';

import {
  connectionInputSchema,
  MERGE_GAP_MINUTES,
  RECENT_WINDOW_HOURS,
  SIMULATE_MAX_VISITS,
  simulateInputSchema,
  type IngestResult,
} from '@wifi/shared';
import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { ZodError } from 'zod';
import { describeActionError } from '@/lib/action-errors';
import { api, ApiError } from '@/lib/api';
import { HOURS_PER_DAY, MINUTE_MS, MINUTES_PER_HOUR } from '@/lib/units';
import { RULE_STEPS, RULE_TEST_OFFSET_HOURS, type RuleStepNumber } from './rule-steps';

/** O primeiro passo do roteiro começa `RULE_TEST_OFFSET_HOURS` atrás, para o último não cair no futuro. */
const RULE_START_OFFSET_MS = RULE_TEST_OFFSET_HOURS * MINUTES_PER_HOUR * MINUTE_MS;
/** Idade máxima de um teste em andamento; depois disso é preciso recomeçar. */
const RULE_MAX_AGE_MS = HOURS_PER_DAY * MINUTES_PER_HOUR * MINUTE_MS;

/** Resultado de uma ação de formulário: mensagem de sucesso ou erro, erros por campo e os valores enviados. */
export type FormState = {
  successMessage?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Valores enviados, devolvidos em erro para o formulário não esvaziar. */
  values?: Record<string, string>;
};

/** Estado de erro do formulário a partir de uma exceção; os erros por campo vêm da API, se houver. */
function toFailureState(error: unknown): FormState {
  return {
    error: describeActionError(error),
    fieldErrors: error instanceof ApiError ? error.details : undefined,
  };
}

/** Gera visitas aleatórias nas últimas horas da janela de simulação. */
export async function simulate(_previousState: FormState, formData: FormData): Promise<FormState> {
  // atalho selecionado ou quantidade digitada, já resolvidos no formulário
  const parsed = simulateInputSchema.safeParse({ visits: Number(formData.get('visits')) });
  if (!parsed.success) {
    return {
      error: `Informe um número inteiro entre 1 e ${SIMULATE_MAX_VISITS}.`,
      values: { visits: String(formData.get('visits') ?? '') },
    };
  }
  try {
    const { created } = await api.simulate(parsed.data.visits);
    revalidatePath('/');
    return {
      successMessage: `${created} visitas geradas nas últimas ${RECENT_WINDOW_HOURS} horas.`,
    };
  } catch (error) {
    return { ...toFailureState(error), values: { visits: String(parsed.data.visits) } };
  }
}

// trade-off: datetime-local não tem fuso; assume o da loja (UTC-3) porque o painel é de uma loja só
const addStoreOffset = (value: FormDataEntryValue | null) =>
  value ? `${value}:00-03:00` : undefined;

type ConnectionFormValues = {
  mac: string;
  connectedAt: string;
  disconnectedAt: string;
  name: string;
  email: string;
  marketingOptIn: string;
};

/** Lê os campos do formulário de conexão, já sem espaços nas pontas. */
function readConnectionForm(formData: FormData): ConnectionFormValues {
  const trimmedField = (fieldName: string) => String(formData.get(fieldName) ?? '').trim();
  return {
    mac: trimmedField('mac'),
    connectedAt: trimmedField('connectedAt'),
    disconnectedAt: trimmedField('disconnectedAt'),
    name: trimmedField('name'),
    email: trimmedField('email'),
    marketingOptIn: formData.get('marketingOptIn') === 'on' ? 'on' : '',
  };
}

/** Monta o corpo da conexão; o cadastro (lead) só existe quando há nome. */
function buildConnectionInput(values: ConnectionFormValues, formData: FormData) {
  return {
    mac: values.mac,
    connectedAt: addStoreOffset(formData.get('connectedAt')),
    disconnectedAt: addStoreOffset(formData.get('disconnectedAt')),
    lead: values.name
      ? {
          name: values.name,
          email: values.email || undefined,
          marketingOptIn: !!values.marketingOptIn,
        }
      : undefined,
  };
}

/** Agrupa os problemas da validação por campo, para mostrar cada um embaixo do seu campo. */
function toFieldErrors(zodError: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of zodError.issues)
    (fieldErrors[issue.path.join('.')] ??= []).push(issue.message);
  return fieldErrors;
}

/** Registra uma conexão informada à mão, com cadastro opcional do cliente. */
export async function registerConnection(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = readConnectionForm(formData);
  const invalid = (fieldErrors: Record<string, string[]>): FormState => ({
    error: 'Corrija os campos destacados.',
    fieldErrors,
    values,
  });
  if (!values.name && (values.email || values.marketingOptIn)) {
    return invalid({ name: ['Informe o nome para registrar o cadastro'] });
  }
  const parsed = connectionInputSchema.safeParse(buildConnectionInput(values, formData));
  if (!parsed.success) return invalid(toFieldErrors(parsed.error));
  try {
    const { merged } = await api.ingest(parsed.data);
    revalidatePath('/');
    return {
      successMessage: merged
        ? `Conexão somada a uma visita existente (reconexão em até ${MERGE_GAP_MINUTES} min).`
        : 'Nova visita registrada.',
    };
  } catch (error) {
    return { ...toFailureState(error), values };
  }
}

/** Resultado de um passo do roteiro: a resposta da API com o aparelho e o início do teste, ou o erro. */
type RuleStepResult =
  | { isSuccess: true; result: IngestResult; mac: string; startedAt: string }
  | { isSuccess: false; error: string };

/** MAC "administrado localmente" (02:…), que não colide com fabricante real. */
const generateLocalMac = (): string =>
  ['02', ...Array.from(randomBytes(5), (byte) => byte.toString(16).padStart(2, '0'))]
    .join(':')
    .toUpperCase();

/** Um passo do roteiro. O passo 1 cria um aparelho de teste novo; os seguintes reaproveitam o mesmo. */
export async function runRuleStep(
  step: RuleStepNumber,
  run?: { mac: string; startedAt: string },
): Promise<RuleStepResult> {
  const ruleStep = RULE_STEPS[step - 1];
  if (!ruleStep) return { isSuccess: false, error: 'Passo inválido.' };
  const now = Date.now();
  const isFirstStep = step === 1 || !run;
  const start = isFirstStep ? now - RULE_START_OFFSET_MS : Date.parse(run.startedAt);
  const isExpired =
    !Number.isFinite(start) ||
    start > now - RULE_START_OFFSET_MS + MINUTE_MS ||
    start < now - RULE_MAX_AGE_MS;
  if (isExpired) return { isSuccess: false, error: 'Teste expirado. Recomece com outro aparelho.' };

  const mac = isFirstStep ? generateLocalMac() : run.mac;
  const parsed = connectionInputSchema.safeParse({
    mac,
    connectedAt: new Date(start + ruleStep.enterMinutes * MINUTE_MS).toISOString(),
    disconnectedAt: new Date(start + ruleStep.exitMinutes * MINUTE_MS).toISOString(),
  });
  if (!parsed.success)
    return { isSuccess: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  try {
    const result = await api.ingest(parsed.data);
    revalidatePath('/');
    return { isSuccess: true, result, mac, startedAt: new Date(start).toISOString() };
  } catch (error) {
    return { isSuccess: false, error: describeActionError(error) };
  }
}
