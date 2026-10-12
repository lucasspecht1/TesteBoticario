import 'server-only';
import type { ConnectionInput, IngestResult, Metrics, Range } from '@wifi/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from './session';

const API_URL = process.env.API_URL;
const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string[] | undefined>,
  ) {
    super(message);
  }
}

type Auth = 'user' | 'none';

async function request<T>(path: string, init: RequestInit & { auth: Auth }): Promise<T> {
  if (!API_URL) throw new ApiError(500, 'API_URL não configurada no servidor do painel.');
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (init.auth === 'user') {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) redirect('/login');
    headers.set('authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new ApiError(503, 'Não foi possível falar com o servidor. Verifique a conexão e tente de novo.');
  }
  if (res.status === 401 && init.auth === 'user') redirect('/login?expirada=1');

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.message ?? 'Erro inesperado no servidor.', body?.details);
  return body as T;
}

const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string }>('/auth/login', { ...post({ email, password }), auth: 'none' }),
  metrics: (range: Range) => request<Metrics>(`/metrics?range=${range}`, { auth: 'user' }),
  ingest: (input: ConnectionInput) => request<IngestResult>('/simulate/connection', { ...post(input), auth: 'user' }),
  simulate: (visits: number) => request<{ created: number }>('/simulate', { ...post({ visits }), auth: 'user' }),
};
