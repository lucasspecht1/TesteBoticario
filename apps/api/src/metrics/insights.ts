import type { MetricsCore } from '@wifi/shared';

const WEEKDAYS_PT = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Leituras em linguagem de negócio, cada uma com a ação sugerida. */
export function buildInsights(m: MetricsCore): string[] {
  if (m.kpis.visits.value === 0) {
    return ['Ainda não há visitas neste período. Gere movimento na página “Simular dados” ou aguarde as primeiras conexões.'];
  }
  const out: string[] = [];

  const peak = m.heatmap.reduce((a, b) => (b.avgVisits > a.avgVisits ? b : a));
  out.push(
    `Pico de movimento: ${WEEKDAYS_PT[peak.weekday]} das ${peak.hour}h às ${peak.hour + 1}h (média de ${num(peak.avgVisits)} visitas). Reforce a equipe nesse horário.`,
  );

  const byWeekday = WEEKDAYS_PT.map((_, w) => ({
    w,
    total: m.heatmap.filter((c) => c.weekday === w).reduce((s, c) => s + c.avgVisits, 0),
  })).filter((d) => d.total > 0);
  if (byWeekday.length > 1) {
    const weakest = byWeekday.reduce((a, b) => (b.total < a.total ? b : a));
    out.push(`${capitalize(WEEKDAYS_PT[weakest.w])} é o dia mais fraco da semana — boa janela para ações promocionais.`);
  }

  const trend = m.kpis.uniqueVisitors.delta;
  if (trend !== null && trend >= 10) out.push(`Visitantes únicos subiram ${num(trend)}% em relação ao período anterior.`);
  if (trend !== null && trend <= -10) {
    out.push(`Visitantes únicos caíram ${num(Math.abs(trend))}% em relação ao período anterior — vale investigar o que mudou.`);
  }

  const returning = m.kpis.returningRate.value;
  if (returning !== null && returning < 25) {
    out.push(`Só ${num(returning)}% dos visitantes já tinham vindo antes — um cupom de retorno ou programa de fidelidade pode ajudar.`);
  }

  const optIn = m.kpis.optInRate.value;
  if (optIn !== null && optIn < 30) {
    out.push(`Apenas ${num(optIn)}% aceitaram receber comunicações — revise o incentivo do cadastro no Wi-Fi.`);
  }
  return out;
}
