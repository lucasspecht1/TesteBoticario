import { unstable_rethrow } from 'next/navigation';
import { ApiError } from '@/lib/api';

type DescribeOptions = {
  /** Mensagens próprias por status HTTP (ex.: 401 no login). */
  messageByStatus?: Partial<Record<number, string>>;
  /** Mensagem para falhas que não vêm da API. */
  fallback?: string;
};

/** Mensagem genérica para falhas inesperadas, com o próximo passo. */
export const UNEXPECTED_ERROR_MESSAGE = 'Falha inesperada. Tente de novo.';

/**
 * Texto de erro de uma server action para o usuário. Deixa passar o redirect do Next (sessão
 * expirada); erros da API usam a mensagem dela, salvo as trocadas por status.
 */
export function describeActionError(error: unknown, options: DescribeOptions = {}): string {
  unstable_rethrow(error);
  const { messageByStatus = {}, fallback = UNEXPECTED_ERROR_MESSAGE } = options;
  if (!(error instanceof ApiError)) return fallback;
  return messageByStatus[error.status] ?? error.message;
}
