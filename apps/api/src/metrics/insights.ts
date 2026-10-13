import type { MetricsCore } from '@wifi/shared';
import { DAYS_PER_WEEK, HOURS_PER_DAY } from '../common/time';

const WEEKDAYS_PT = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

/** Variação (em %) de visitantes únicos a partir da qual vale comentar a tendência. */
const TREND_THRESHOLD_PERCENT = 10;
/** Abaixo disso (% de visitantes que já tinham vindo), sugere-se programa de retorno. */
const LOW_RETURNING_RATE_PERCENT = 25;
/** Abaixo disso (% de aceite de comunicações), sugere-se rever o incentivo do cadastro. */
const LOW_OPT_IN_RATE_PERCENT = 30;
/** Largura, em horas, da janela usada para achar o horário mais vazio (todas as horas dela precisam ter movimento). */
const IDLE_WINDOW_HOURS = 2;

type HeatmapCell = MetricsCore['heatmap'][number];

/** Janela mais vazia: dia da semana, hora inicial e média de visitas por hora na janela. */
type IdleWindow = { weekday: number; hour: number; avgVisits: number };

const formatNumber = (value: number): string =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const capitalize = (text: string): string =>
  text[0].toUpperCase() + text.slice(1);

/** Célula do mapa de calor com mais visitas (a primeira, em empate). */
function findPeakCell(heatmap: HeatmapCell[]): HeatmapCell {
  return heatmap.reduce((peak, cell) =>
    cell.avgVisits > peak.avgVisits ? cell : peak,
  );
}

/** Dia da semana com menor total de visitas, entre os dias com movimento; nulo se há só um. */
function findWeakestWeekday(heatmap: HeatmapCell[]): number | null {
  const totals = Array.from({ length: DAYS_PER_WEEK }, (_, weekday) => ({
    weekday,
    total: heatmap
      .filter((cell) => cell.weekday === weekday)
      .reduce((sum, cell) => sum + cell.avgVisits, 0),
  })).filter((day) => day.total > 0);
  if (totals.length <= 1) return null;
  return totals.reduce((weakest, day) =>
    day.total < weakest.total ? day : weakest,
  ).weekday;
}

/** Janela de `IDLE_WINDOW_HOURS` mais vazia, só entre horas em que a loja costuma ter movimento. */
function findIdleWindow(heatmap: HeatmapCell[]): IdleWindow | null {
  let idle: IdleWindow | null = null;
  for (let weekday = 0; weekday < DAYS_PER_WEEK; weekday++) {
    const hours = heatmap.filter((cell) => cell.weekday === weekday);
    for (let hour = 0; hour <= HOURS_PER_DAY - IDLE_WINDOW_HOURS; hour++) {
      const windowVisits = hours
        .slice(hour, hour + IDLE_WINDOW_HOURS)
        .map((cell) => cell.avgVisits);
      const avgVisits =
        windowVisits.reduce((sum, visits) => sum + visits, 0) /
        IDLE_WINDOW_HOURS;
      if (
        windowVisits.every((visits) => visits > 0) &&
        (!idle || avgVisits < idle.avgVisits)
      )
        idle = { weekday, hour, avgVisits };
    }
  }
  return idle;
}

/** Frases sobre a tendência de visitantes únicos (alta ou queda forte); vazio se estável. */
function buildTrendInsights(trendPercent: number | null): string[] {
  if (trendPercent === null) return [];
  if (trendPercent >= TREND_THRESHOLD_PERCENT)
    return [
      `Visitantes únicos subiram ${formatNumber(trendPercent)}% em relação ao período anterior.`,
    ];
  if (trendPercent <= -TREND_THRESHOLD_PERCENT)
    return [
      `Visitantes únicos caíram ${formatNumber(Math.abs(trendPercent))}% em relação ao período anterior. Vale investigar o que mudou.`,
    ];
  return [];
}

/** Leituras em linguagem de negócio, cada uma com a ação sugerida. */
export function buildInsights(metrics: MetricsCore): string[] {
  if (metrics.kpis.visits.value === 0) {
    return [
      'Ainda não há visitas neste período. Gere movimento na página “Simular dados” ou aguarde as primeiras conexões.',
    ];
  }
  const insights: string[] = [];

  const peak = findPeakCell(metrics.heatmap);
  insights.push(
    `Pico de movimento: ${WEEKDAYS_PT[peak.weekday]} das ${peak.hour}h às ${(peak.hour + 1) % HOURS_PER_DAY}h (média de ${formatNumber(peak.avgVisits)} visitas). Reforce a equipe nesse horário.`,
  );

  const weakestWeekday = findWeakestWeekday(metrics.heatmap);
  if (weakestWeekday !== null) {
    insights.push(
      `${capitalize(WEEKDAYS_PT[weakestWeekday])} é o dia mais fraco da semana. Boa janela para ações promocionais.`,
    );
  }

  const idle = findIdleWindow(metrics.heatmap);
  if (idle) {
    insights.push(
      `Horário mais vazio: ${WEEKDAYS_PT[idle.weekday]} das ${idle.hour}h às ${idle.hour + IDLE_WINDOW_HOURS}h (média de ${formatNumber(idle.avgVisits)} ${idle.avgVisits === 1 ? 'visita' : 'visitas'} por hora). Bom para treinamento da equipe, reposição ou uma ação de horário.`,
    );
  }

  insights.push(...buildTrendInsights(metrics.kpis.uniqueVisitors.delta));

  const returningRate = metrics.kpis.returningRate.value;
  if (returningRate !== null && returningRate < LOW_RETURNING_RATE_PERCENT) {
    insights.push(
      `Só ${formatNumber(returningRate)}% dos visitantes já tinham vindo antes. Um cupom de retorno ou programa de fidelidade pode ajudar.`,
    );
  }

  const optInRate = metrics.kpis.optInRate.value;
  if (optInRate !== null && optInRate < LOW_OPT_IN_RATE_PERCENT) {
    insights.push(
      `Apenas ${formatNumber(optInRate)}% aceitaram receber comunicações. Revise o incentivo do cadastro no Wi-Fi.`,
    );
  }
  return insights;
}
