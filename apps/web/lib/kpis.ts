import { MERGE_GAP_MINUTES, type Metrics, type WeekdayDetail } from '@wifi/shared';
import type { NumberStyle } from './format';

/** Unidade da variação: porcentagem ou pontos percentuais (a string já traz o espaço de separação). */
export const DELTA_UNIT = { percent: '%', points: ' p.p.' } as const;

/** Unidade em que uma variação é mostrada. */
export type DeltaUnit = (typeof DELTA_UNIT)[keyof typeof DELTA_UNIT];

/** Variação abaixo disso (em %) conta como "o mesmo movimento" nas frases de leitura. */
export const NEUTRAL_VARIATION_PERCENT = 5;

/** Um indicador pronto para a régua: valor, variação e, no painel, a dica de leitura. */
export type KpiItem = {
  key: string;
  label: string;
  value: number | null;
  format: NumberStyle;
  suffix?: string;
  delta: number | null;
  deltaUnit: DeltaUnit;
  hint?: string;
};

type KpiReading = { value: number | null; delta: number | null };

type KpiDefinition = Omit<KpiItem, 'value' | 'delta'> & { reading: KpiReading };

const toKpiItem = ({ reading, ...definition }: KpiDefinition): KpiItem => ({
  ...definition,
  value: reading.value,
  delta: reading.delta,
});

/** Os seis indicadores do painel, na ordem das perguntas do dono. */
export function buildKpiList({ kpis }: Metrics): KpiItem[] {
  const definitions: KpiDefinition[] = [
    {
      key: 'unique',
      label: 'Visitantes únicos',
      reading: kpis.uniqueVisitors,
      format: 'integer',
      deltaUnit: DELTA_UNIT.percent,
      hint: 'Aparelhos diferentes que se conectaram.',
    },
    {
      key: 'visits',
      label: 'Visitas',
      reading: kpis.visits,
      format: 'integer',
      deltaUnit: DELTA_UNIT.percent,
      hint: `Idas à loja. Reconexões em até ${MERGE_GAP_MINUTES} min contam como uma.`,
    },
    {
      key: 'returning',
      label: 'Clientes que voltaram',
      reading: kpis.returningRate,
      format: 'decimal',
      suffix: '%',
      deltaUnit: DELTA_UNIT.points,
      hint: 'Já tinham vindo à loja em outro dia.',
    },
    {
      key: 'dwell',
      label: 'Permanência típica',
      reading: kpis.medianDwellMinutes,
      format: 'decimal',
      suffix: 'min',
      deltaUnit: DELTA_UNIT.percent,
      hint: 'Mediana do tempo conectado.',
    },
    {
      key: 'newreturn',
      label: 'Novos que voltaram',
      reading: kpis.newReturnRate,
      format: 'decimal',
      suffix: '%',
      deltaUnit: DELTA_UNIT.points,
      hint: 'Dos que vieram pela primeira vez no período, voltaram em outro dia.',
    },
    {
      key: 'optin',
      label: 'Aceitaram comunicações',
      reading: kpis.optInRate,
      format: 'decimal',
      suffix: '%',
      deltaUnit: DELTA_UNIT.points,
      hint: 'Cadastro no Wi-Fi com consentimento (LGPD).',
    },
  ];
  return definitions.map(toKpiItem);
}

/** Os indicadores de um dia da semana, cada um contra os outros dias do período. */
export function buildDayKpiList({ kpis }: WeekdayDetail): KpiItem[] {
  const definitions: KpiDefinition[] = [
    {
      key: 'visits',
      label: 'Visitas por dia',
      reading: kpis.visitsPerDay,
      format: 'decimal',
      deltaUnit: DELTA_UNIT.percent,
    },
    {
      key: 'returning',
      label: 'Clientes que voltaram',
      reading: kpis.returningRate,
      format: 'decimal',
      suffix: '%',
      deltaUnit: DELTA_UNIT.points,
    },
    {
      key: 'dwell',
      label: 'Permanência típica',
      reading: kpis.medianDwellMinutes,
      format: 'decimal',
      suffix: 'min',
      deltaUnit: DELTA_UNIT.percent,
    },
    {
      key: 'optin',
      label: 'Aceitaram comunicações',
      reading: kpis.optInRate,
      format: 'decimal',
      suffix: '%',
      deltaUnit: DELTA_UNIT.points,
    },
  ];
  return definitions.map(toKpiItem);
}
