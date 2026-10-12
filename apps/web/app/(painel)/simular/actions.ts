'use server';

import { connectionInputSchema, simulateInputSchema } from '@wifi/shared';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';

export type FormState = { ok?: string; error?: string; fieldErrors?: Record<string, string[] | undefined> };

function failure(e: unknown): FormState {
  unstable_rethrow(e); // deixa passar o redirect para o login em sessão expirada
  if (e instanceof ApiError) return { error: e.message, fieldErrors: e.details };
  return { error: 'Falha inesperada. Tente de novo.' };
}

export async function simulate(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = simulateInputSchema.safeParse({ visits: Number(formData.get('visits')) });
  if (!parsed.success) return { error: 'Informe um número inteiro entre 1 e 200.' };
  try {
    const { created } = await api.simulate(parsed.data.visits);
    revalidatePath('/');
    return { ok: `${created} visitas geradas nas últimas 2 horas. Veja no painel.` };
  } catch (e) {
    return failure(e);
  }
}

// trade-off: datetime-local não tem fuso; assume o da loja (UTC-3) porque o painel é de uma loja só
const withStoreOffset = (v: FormDataEntryValue | null) => (v ? `${v}:00-03:00` : undefined);

export async function registerConnection(_: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get('name') ?? '').trim();
  const input = {
    mac: formData.get('mac'),
    connectedAt: withStoreOffset(formData.get('connectedAt')),
    disconnectedAt: withStoreOffset(formData.get('disconnectedAt')),
    lead: name
      ? { name, email: formData.get('email') || undefined, marketingOptIn: formData.get('marketingOptIn') === 'on' }
      : undefined,
  };
  const parsed = connectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Corrija os campos destacados.', fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  try {
    const { merged } = await api.ingest(parsed.data);
    revalidatePath('/');
    return { ok: merged ? 'Conexão somada a uma visita existente (reconexão em até 30 min).' : 'Nova visita registrada.' };
  } catch (e) {
    return failure(e);
  }
}
