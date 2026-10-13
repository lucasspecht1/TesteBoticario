import { cx } from '@/lib/cx';
import { capitalize, formatDecimal, formatHourRange } from '@/lib/format';
import { NEUTRAL_VARIATION_PERCENT } from '@/lib/kpis';
import { getRiseStyle } from '@/lib/rise';
import type { DayReading } from '@/lib/day';
import type { WeekdayLabels } from '@/lib/weekdays';

const SCHEDULE_READING_RISE_INDEX = 2;
const DIVIDED_ITEM = 'border-t border-white/20 pt-5';

type ReadingItemProps = {
  label: string;
  hours: string;
  description: string;
  hasDivider?: boolean;
};

/** Um bloco da leitura: rótulo, faixa de horas em destaque e a explicação. */
function ReadingItem({ label, hours, description, hasDivider = false }: ReadingItemProps) {
  return (
    <li className={hasDivider ? DIVIDED_ITEM : undefined}>
      <p className="text-white/85">{label}</p>
      <p className="mt-1 font-display text-3xl leading-tight">{hours}</p>
      <p className="mt-1 text-white/90">{description}</p>
    </li>
  );
}

/** Quanto das visitas do dia a faixa de reforço concentra e a que horas é o pico. */
function describeStaffing({ staffing, peak }: DayReading): string {
  const peakAverage = formatDecimal(peak.averageVisits);
  const share = `Essas horas concentram ${staffing.share}% das visitas do dia.`;
  return `${share} Pico às ${peak.hour}h, com ${peakAverage} visitas em média.`;
}

/** Compara o dia com a média dos outros dias numa frase; "o mesmo movimento" perto de zero. */
function describeVersusOtherDays(labels: WeekdayLabels, delta: number): string {
  const subject = `${capitalize(labels.indefiniteArticle)} ${labels.name}`;
  if (Math.abs(delta) < NEUTRAL_VARIATION_PERCENT)
    return `${subject} recebe o mesmo movimento que a média dos outros dias.`;
  const comparison = delta > 0 ? 'mais' : 'menos';
  return `${subject} recebe ${formatDecimal(Math.abs(delta))}% ${comparison} visitas que a média dos outros dias.`;
}

type ScheduleReadingProps = {
  labels: WeekdayLabels;
  /** Leitura do dia; null quando ele não teve movimento no período. */
  reading: DayReading | null;
  /** Variação das visitas do dia contra a média dos outros dias, em %. */
  visitsDelta: number | null;
};

/** Cartão verde "Para a escala de…": faixa de reforço, janela mais vazia e comparação com os outros dias. */
export function ScheduleReading({
  labels,
  reading,
  visitsDelta,
}: ScheduleReadingProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="leitura-dia"
      className="rise rounded-[var(--radius-card)] bg-brand p-5 text-white sm:p-6"
      style={getRiseStyle(SCHEDULE_READING_RISE_INDEX)}
    >
      <h2 id="leitura-dia" className="text-base font-semibold">
        Para a escala de {labels.name}
      </h2>
      {reading ? (
        <ul className="mt-5 space-y-5 text-sm leading-relaxed">
          <ReadingItem
            label="Reforço de equipe"
            hours={formatHourRange(reading.staffing.from, reading.staffing.to)}
            description={describeStaffing(reading)}
          />
          {reading.idle && (
            <ReadingItem
              hasDivider
              label="Mais vazio"
              hours={formatHourRange(reading.idle.from, reading.idle.to)}
              description="Bom para treinamento, reposição ou uma ação de horário."
            />
          )}
          {visitsDelta !== null && (
            <li className={cx(DIVIDED_ITEM, 'text-white/90')}>
              {describeVersusOtherDays(labels, visitsDelta)}
            </li>
          )}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-white/90">Ainda sem movimento nesse dia no período.</p>
      )}
    </section>
  );
}
