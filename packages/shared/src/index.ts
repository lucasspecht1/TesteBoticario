import { z } from 'zod';

import { ALIAS_LENGTH, SIMULATE_MAX_VISITS } from './constants';

export * from './constants';

/**
 * Contrato entre API e painel. Exceção à norma de nomes: campos como `optIn`, `inStore`, `merged`,
 * `returning`, `today`, `avg*` e `d7/d30/d60` são nomes de JSON já publicados; renomeá-los quebra
 * os clientes da API, então só mudam numa versão nova do contrato.
 */

const MINUTE_MS = 60_000;
const MAC_PATTERN = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i;
const FUTURE_TOLERANCE_MS = 5 * MINUTE_MS;

const isoDate = z.iso.datetime({ offset: true, message: 'Data/hora inválida (ISO 8601 com fuso)' });

/** Conexão enviada pelo portal Wi-Fi: MAC, entrada, saída opcional e lead opcional. Datas em ISO 8601 com fuso, sem futuro (tolerância de 5 min). */
export const connectionInputSchema = z
  .object({
    mac: z.string().regex(MAC_PATTERN, 'MAC inválido (formato AA:BB:CC:DD:EE:FF)'),
    connectedAt: isoDate,
    disconnectedAt: isoDate.optional(),
    lead: z
      .object({
        name: z.string().trim().min(2, 'Nome muito curto').max(100),
        email: z.email('E-mail inválido').optional(),
        marketingOptIn: z.boolean(),
      })
      .optional(),
  })
  .refine((connection) => Date.parse(connection.connectedAt) <= Date.now() + FUTURE_TOLERANCE_MS, {
    message: 'A entrada não pode estar no futuro',
    path: ['connectedAt'],
  })
  .refine(
    (connection) =>
      !connection.disconnectedAt ||
      Date.parse(connection.disconnectedAt) <= Date.now() + FUTURE_TOLERANCE_MS,
    {
      message: 'A saída não pode estar no futuro',
      path: ['disconnectedAt'],
    },
  )
  .refine(
    (connection) =>
      !connection.disconnectedAt ||
      Date.parse(connection.disconnectedAt) >= Date.parse(connection.connectedAt),
    {
      message: 'A saída deve ser depois da entrada',
      path: ['disconnectedAt'],
    },
  );
/** Conexão do portal Wi-Fi já validada por `connectionInputSchema`. */
export type ConnectionInput = z.infer<typeof connectionInputSchema>;
/** Resultado da ingestão: a visita afetada e se a conexão foi fundida numa visita existente. */
export type IngestResult = { visitId: string; merged: boolean };

/** Credenciais do login do dono da loja. */
export const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});
/** Credenciais já validadas por `loginSchema`. */
export type LoginInput = z.infer<typeof loginSchema>;

/** Período do painel: últimos 7, 30 ou 90 dias. */
export const rangeSchema = z.enum(['7d', '30d', '90d']);
/** Período do painel (`7d`, `30d` ou `90d`). */
export type Range = z.infer<typeof rangeSchema>;
/** Dias de cada período do painel (o período atual vai até agora, em dias locais). */
export const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };

/** Período usado quando a query não informa `range`. */
export const DEFAULT_RANGE: Range = '30d';

/** Query de `GET /metrics`: período (padrão `DEFAULT_RANGE`). */
export const metricsQuerySchema = z.object({ range: rangeSchema.default(DEFAULT_RANGE) });
/** Query de métricas já validada. */
export type MetricsQuery = z.infer<typeof metricsQuerySchema>;

/** Corpo de `POST /simulate`: quantas visitas gerar (1 a 200). */
export const simulateInputSchema = z.object({ visits: z.int().min(1).max(SIMULATE_MAX_VISITS) });
/** Corpo da simulação já validado. */
export type SimulateInput = z.infer<typeof simulateInputSchema>;

/** Query de `GET /metrics/weekday`: período e dia da semana (0 = domingo … 6 = sábado). */
export const weekdayQuerySchema = z.object({
  range: rangeSchema.default(DEFAULT_RANGE),
  weekday: z.coerce
    .number()
    .int()
    .min(0, 'Dia da semana de 0 a 6')
    .max(6, 'Dia da semana de 0 a 6'),
});
/** Query do detalhe de um dia da semana já validada. */
export type WeekdayQuery = z.infer<typeof weekdayQuerySchema>;

/** Número de página (a partir de 1) das listas paginadas. */
export const pageSchema = z.coerce.number().int().min(1).default(1);

/** Períodos aceitos pela lista de visitas. */
export const VISIT_RANGES = ['today', '7d', '30d'] as const;
/** Situações aceitas pela lista de visitas. */
export const VISIT_STATUSES = ['all', 'in-store', 'closed'] as const;
/** Tipos de cliente aceitos pela lista de visitas. */
export const VISIT_KINDS = ['all', 'new', 'returning'] as const;
/** Filtros de lead aceitos pela lista de visitas. */
export const VISIT_LEADS = ['all', 'optin'] as const;

/** Lista de visitas: filtros na URL. q = começo do apelido do cliente (hexadecimal). */
export const visitsQuerySchema = z.object({
  range: z.enum(VISIT_RANGES).default('today'),
  status: z.enum(VISIT_STATUSES).default('all'),
  kind: z.enum(VISIT_KINDS).default('all'),
  lead: z.enum(VISIT_LEADS).default('all'),
  q: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      new RegExp(`^[0-9a-f]{0,${ALIAS_LENGTH}}$`),
      `Use até ${ALIAS_LENGTH} letras (a-f) ou números do apelido`,
    )
    .optional(),
  page: pageSchema,
});
/** Query da lista de visitas já validada. */
export type VisitsQuery = z.infer<typeof visitsQuerySchema>;

/**
 * delta: variação vs. período anterior.
 * - contagens e minutos: variação relativa em % ((atual - anterior) / anterior)
 * - taxas (returningRate, optInRate, newReturnRate): diferença em pontos percentuais
 * null quando não há base de comparação.
 */
export type Kpi = { value: number | null; previous: number | null; delta: number | null };

/** Métricas do painel no período, contra o período anterior, com os insights em linguagem de negócio. */
/** Período analisado: instantes ISO 8601 e quantidade de dias locais. */
export type PeriodRange = { from: string; to: string; days: number };

/** Faixa de permanência (rótulo em português) e quantas visitas caíram nela. */
export type DwellBucket = { label: string; count: number };

/** Página de uma lista paginada (`page` a partir de 1). */
export type Page<Item> = { items: Item[]; total: number; page: number; pageSize: number };

export type Metrics = {
  range: PeriodRange;
  kpis: {
    uniqueVisitors: Kpi;
    visits: Kpi;
    returningRate: Kpi;
    medianDwellMinutes: Kpi;
    optInRate: Kpi;
    /** Dos clientes vistos pela primeira vez no período, % que voltou em outro dia (pontos percentuais no delta). */
    newReturnRate: Kpi;
  };
  /** Um item por dia local do período, em ordem. */
  daily: { date: string; newVisitors: number; returningVisitors: number }[];
  /** 168 células, ordenadas: índice = weekday * 24 + hour (weekday 0 = domingo). */
  heatmap: { weekday: number; hour: number; avgVisits: number }[];
  /** Média de visitas num dia de cada dia da semana (índice = weekday). Conta exata, sem somar células arredondadas. */
  weekdayAvgVisits: number[];
  dwellBuckets: DwellBucket[];
  insights: string[];
};
/** Métricas sem os insights (o que o cálculo puro devolve). */
export type MetricsCore = Omit<Metrics, 'insights'>;

/**
 * Análise de um dia da semana no período. Nos KPIs, `previous` é a média dos outros dias
 * do mesmo período (não o período anterior); o delta segue as mesmas unidades dos KPIs do painel.
 */
export type WeekdayDetail = {
  weekday: number;
  range: PeriodRange;
  /** Ocorrências desse dia no período, da mais recente para a mais antiga; today = dia em andamento. */
  dates: {
    date: string;
    newVisitors: number;
    returningVisitors: number;
    visits: number;
    today: boolean;
  }[];
  /** Média de visitas por hora nesse dia (mesma conta do mapa de calor) e a média de todos os dias. */
  hourly: { hour: number; avgVisits: number; allDaysAvgVisits: number }[];
  kpis: { visitsPerDay: Kpi; returningRate: Kpi; medianDwellMinutes: Kpi; optInRate: Kpi };
  dwellBuckets: DwellBucket[];
};

/** Segmento do cliente: novo (1 visita), fiel (`LOYAL_MIN_VISITS`+ visitas em `LOYAL_WINDOW_DAYS` dias), sumido (não volta há mais de `LAPSED_DAYS` dias), recorrente (o resto). */
export type CustomerSegment = 'novo' | 'recorrente' | 'fiel' | 'sumido';

/**
 * Cliente pseudonimizado (LGPD): apelido estável derivado do hash do MAC; primeiro nome só de quem
 * se cadastrou e aceitou contato; e-mail nunca sai da API.
 */
export type CustomerRef = {
  id: string;
  alias: string;
  firstName: string | null;
  optIn: boolean;
  totalVisits: number;
};

/** Uma visita na lista, com o cliente pseudonimizado. Duração em minutos inteiros; datas em ISO 8601. */
export type VisitListItem = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  /** Visita aberta que começou há menos de `IN_STORE_MAX_HOURS`: o cliente ainda está na loja. */
  inStore: boolean;
  returning: boolean;
  customer: CustomerRef;
};

/** Página da lista de visitas, com os contadores ao vivo do dia (mediana de permanência em minutos). */
export type VisitList = Page<VisitListItem> & {
  live: { inStore: number; visitsToday: number; medianDwellTodayMinutes: number | null };
};

/** Ficha do cliente: segmento, frequência (em dias), permanência mediana (em minutos) e últimas visitas. */
export type CustomerDetail = CustomerRef & {
  segment: CustomerSegment;
  firstSeenAt: string;
  lastSeenAt: string;
  medianDwellMinutes: number | null;
  avgDaysBetweenVisits: number | null;
  /** Últimas visitas, da mais recente para a mais antiga. */
  visits: Pick<VisitListItem, 'id' | 'startedAt' | 'endedAt' | 'durationMinutes' | 'inStore'>[];
};

/**
 * Retenção por turma: clientes vistos pela primeira vez em cada semana (segunda a domingo, dia local)
 * e quantos % voltaram em outro dia dentro de 7, 30 e 60 dias. null = a turma ainda não completou o prazo.
 */
export type RetentionCohort = {
  weekStart: string;
  newCustomers: number;
  d7: number | null;
  d30: number | null;
  d60: number | null;
};
/** Turmas semanais de retenção e a média de cada prazo (em %), considerando só as turmas que já completaram o prazo. */
export type Retention = {
  cohorts: RetentionCohort[];
  avg: { d7: number | null; d30: number | null; d60: number | null };
};

/** Query da lista de sumidos: página (a partir de 1). */
export const lapsedQuerySchema = z.object({ page: pageSchema });
/** Query de sumidos já validada. */
export type LapsedQuery = z.infer<typeof lapsedQuerySchema>;

/** Cliente sumido que aceitou contato: já voltou antes, mas não aparece há mais de `LAPSED_DAYS` dias. */
export type LapsedCustomer = Pick<CustomerRef, 'id' | 'alias' | 'firstName' | 'totalVisits'> & {
  lastVisitAt: string;
  daysAway: number;
};
/** Página da lista de clientes sumidos. */
export type LapsedList = Page<LapsedCustomer>;

/** Resposta do login: token de acesso (JWT) do painel. */
export type LoginResult = { accessToken: string };

/** Resposta da simulação: quantas visitas foram criadas. */
export type SimulateResult = { created: number };
