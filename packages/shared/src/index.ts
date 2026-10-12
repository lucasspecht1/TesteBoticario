import { z } from 'zod';

const MAC_RE = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i;
const FUTURE_TOLERANCE_MS = 5 * 60_000;

const isoDate = z.iso.datetime({ offset: true, message: 'Data/hora inválida (ISO 8601 com fuso)' });

export const connectionInputSchema = z
  .object({
    mac: z.string().regex(MAC_RE, 'MAC inválido (formato AA:BB:CC:DD:EE:FF)'),
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
  .refine((v) => Date.parse(v.connectedAt) <= Date.now() + FUTURE_TOLERANCE_MS, {
    message: 'A entrada não pode estar no futuro',
    path: ['connectedAt'],
  })
  .refine((v) => !v.disconnectedAt || Date.parse(v.disconnectedAt) <= Date.now() + FUTURE_TOLERANCE_MS, {
    message: 'A saída não pode estar no futuro',
    path: ['disconnectedAt'],
  })
  .refine((v) => !v.disconnectedAt || Date.parse(v.disconnectedAt) >= Date.parse(v.connectedAt), {
    message: 'A saída deve ser depois da entrada',
    path: ['disconnectedAt'],
  });
export type ConnectionInput = z.infer<typeof connectionInputSchema>;
export type IngestResult = { visitId: string; merged: boolean };

export const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const rangeSchema = z.enum(['7d', '30d', '90d']);
export type Range = z.infer<typeof rangeSchema>;
export const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };

export const metricsQuerySchema = z.object({ range: rangeSchema.default('30d') });
export type MetricsQuery = z.infer<typeof metricsQuerySchema>;

export const simulateInputSchema = z.object({ visits: z.int().min(1).max(200) });
export type SimulateInput = z.infer<typeof simulateInputSchema>;

/**
 * delta: variação vs. período anterior.
 * - contagens e minutos: variação relativa em % ((atual - anterior) / anterior)
 * - taxas (returningRate, optInRate): diferença em pontos percentuais
 * null quando não há base de comparação.
 */
export type Kpi = { value: number | null; previous: number | null; delta: number | null };

export type Metrics = {
  range: { from: string; to: string; days: number };
  kpis: {
    uniqueVisitors: Kpi;
    visits: Kpi;
    returningRate: Kpi;
    medianDwellMinutes: Kpi;
    optInRate: Kpi;
  };
  /** Um item por dia local do período, em ordem. */
  daily: { date: string; newVisitors: number; returningVisitors: number }[];
  /** 168 células, ordenadas: índice = weekday * 24 + hour (weekday 0 = domingo). */
  heatmap: { weekday: number; hour: number; avgVisits: number }[];
  dwellBuckets: { label: string; count: number }[];
  insights: string[];
};
export type MetricsCore = Omit<Metrics, 'insights'>;
