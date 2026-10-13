import 'server-only';
import type {
  ConnectionInput,
  CustomerDetail,
  IngestResult,
  LapsedList,
  LoginResult,
  Metrics,
  Range,
  Retention,
  SimulateResult,
  VisitList,
  VisitsQuery,
  WeekdayDetail,
} from '@wifi/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LOGIN_PATH, SESSION_COOKIE } from './session';

const API_URL = process.env.API_URL;

/** Endereço da documentação Swagger da API; null quando a API não está configurada. */
export const API_DOCS_URL = API_URL ? `${API_URL}/docs` : null;

/** Códigos HTTP que o painel trata de forma especial. */
export const HTTP_STATUS = {
  unauthorized: 401,
  notFound: 404,
  tooManyRequests: 429,
  internalServerError: 500,
  serviceUnavailable: 503,
} as const;
/** Tempo máximo de espera por uma resposta da API. */
const TIMEOUT_MS = 10_000;

/** Erro devolvido pela API (ou falha ao alcançá-la), com o status HTTP e os erros por campo. */
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

/** Chamada autenticada à API, com timeout; 401 com login volta para a tela de login. */
async function send(path: string, init: RequestInit & { auth: Auth }): Promise<Response> {
  if (!API_URL)
    throw new ApiError(
      HTTP_STATUS.internalServerError,
      'API_URL não configurada no servidor do painel.',
    );
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (init.auth === 'user') {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) redirect(LOGIN_PATH);
    headers.set('authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(
      HTTP_STATUS.serviceUnavailable,
      'Não foi possível falar com o servidor. Verifique a conexão e tente de novo.',
    );
  }
  if (response.status === HTTP_STATUS.unauthorized && init.auth === 'user')
    redirect(`${LOGIN_PATH}?expirada=1`);
  return response;
}

async function request<T>(path: string, init: RequestInit & { auth: Auth }): Promise<T> {
  const response = await send(path, init);
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const { message, details } = readErrorBody(body);
    throw new ApiError(response.status, message ?? 'Erro inesperado no servidor.', details);
  }
  // trade-off: o corpo de sucesso não é revalidado aqui; o tipo vem do contrato de @wifi/shared
  return body as T;
}

type ErrorBody = { message?: string; details?: Record<string, string[] | undefined> };

/** Lê a mensagem e os erros por campo do corpo de erro da API, ignorando o que não tem essa forma. */
function readErrorBody(body: unknown): ErrorBody {
  if (typeof body !== 'object' || body === null) return {};
  const { message, details } = body as Record<string, unknown>;
  return {
    message: typeof message === 'string' ? message : undefined,
    details:
      typeof details === 'object' && details !== null
        ? (details as Record<string, string[] | undefined>)
        : undefined,
  };
}

const post = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

/** Query string da lista de visitas, sem os filtros vazios. */
function visitsSearchParams(query: VisitsQuery): URLSearchParams {
  const entries = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([name, value]): [string, string] => [name, String(value)]);
  return new URLSearchParams(entries);
}

/** Cliente da API do painel; só roda no servidor e leva o token da sessão em cada chamada. */
export const api = {
  login: (email: string, password: string): Promise<LoginResult> =>
    request<LoginResult>('/auth/login', { ...post({ email, password }), auth: 'none' }),
  metrics: (range: Range): Promise<Metrics> =>
    request<Metrics>(`/metrics?range=${range}`, { auth: 'user' }),
  weekday: (range: Range, weekday: number): Promise<WeekdayDetail> =>
    request<WeekdayDetail>(`/metrics/weekday?range=${range}&weekday=${weekday}`, { auth: 'user' }),
  visits: (query: VisitsQuery): Promise<VisitList> =>
    request<VisitList>(`/visits?${visitsSearchParams(query)}`, { auth: 'user' }),
  retention: (): Promise<Retention> => request<Retention>('/customers/retention', { auth: 'user' }),
  lapsed: (page: number): Promise<LapsedList> =>
    request<LapsedList>(`/customers/lapsed?page=${page}`, { auth: 'user' }),
  /** CSV de reativação, repassado como veio da API. */
  lapsedCsv: (): Promise<Response> => send('/customers/lapsed.csv', { auth: 'user' }),
  customer: (id: string): Promise<CustomerDetail> =>
    request<CustomerDetail>(`/customers/${encodeURIComponent(id)}`, { auth: 'user' }),
  ingest: (input: ConnectionInput): Promise<IngestResult> =>
    request<IngestResult>('/simulate/connection', { ...post(input), auth: 'user' }),
  simulate: (visits: number): Promise<SimulateResult> =>
    request<SimulateResult>('/simulate', { ...post({ visits }), auth: 'user' }),
};
