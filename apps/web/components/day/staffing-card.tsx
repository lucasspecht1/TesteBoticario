import { User } from '@phosphor-icons/react/dist/ssr';
import type { WeekdayDetail } from '@wifi/shared';
import { Card } from '@/components/ui/card';
import { cx } from '@/lib/cx';
import { ROUNDED_INNER } from '@/components/ui/styles';
import { CLIENTS_PER_ATTENDANT, planStaffing, type StaffingBlock } from '@/lib/day';
import { formatDecimal, formatHourRange, pluralize } from '@/lib/format';
import { getRiseStyle } from '@/lib/rise';

const STAFFING_CARD_RISE_INDEX = 3;

/** Cor da faixa na linha do tempo: quanto mais gente, mais escura (a partir de 4 pessoas é a mesma). */
const PEOPLE_TONES = [
  'bg-paper text-ink-2',
  'bg-brand-soft text-brand-strong',
  'bg-quartzo text-white',
  'bg-brand text-white',
];

const getPeopleTone = (people: number): string =>
  PEOPLE_TONES[Math.min(people, PEOPLE_TONES.length) - 1];

/** Linha do tempo colorida: uma faixa por bloco de horas, com a largura proporcional à duração. */
function StaffingTimeline({ plan }: { plan: StaffingBlock[] }) {
  const firstHour = plan[0].from;
  const span = plan[plan.length - 1].to - firstHour;
  return (
    <>
      <div className={cx('flex h-10 overflow-hidden', ROUNDED_INNER)} aria-hidden>
        {plan.map((block) => (
          <div
            key={block.from}
            className={cx(
              'grid min-w-0 place-items-center border-r-2 border-card text-xs font-semibold last:border-r-0',
              getPeopleTone(block.people),
            )}
            style={{ width: `${((block.to - block.from) / span) * 100}%` }}
          >
            <span className="flex items-center gap-0.5">
              {block.people}
              <User size={12} weight="fill" />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink-3 tabular-nums" aria-hidden>
        <span>{firstHour}h</span>
        <span>{firstHour + span}h</span>
      </div>
    </>
  );
}

/** Lista das faixas de horário com o número de pessoas e o pico de clientes de cada uma. */
function StaffingList({ plan }: { plan: StaffingBlock[] }) {
  return (
    <ul className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
      {plan.map((block) => (
        <li
          key={block.from}
          className="flex items-baseline justify-between gap-3 border-b border-line/60 py-2 text-sm"
        >
          <span className="text-ink tabular-nums">{formatHourRange(block.from, block.to)}</span>
          <span className="text-right">
            <strong className="font-semibold text-ink">
              {block.people} {pluralize(block.people, 'pessoa', 'pessoas')}
            </strong>
            <span className="block text-xs text-ink-3">
              até {formatDecimal(block.peakClients)}{' '}
              {pluralize(block.peakClients, 'cliente', 'clientes')} ao mesmo tempo
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

type StaffingCardProps = {
  hourly: WeekdayDetail['hourly'];
  /** Permanência típica em minutos; sem ela não há como estimar a escala. */
  medianDwellMinutes: number | null;
  dayName: string;
};

/** Escala sugerida: faixas de horário com o número de pessoas, numa linha do tempo e em lista. */
export function StaffingCard({
  hourly,
  medianDwellMinutes,
  dayName,
}: StaffingCardProps): React.JSX.Element | null {
  const plan = planStaffing(hourly, medianDwellMinutes);
  if (plan.length === 0 || medianDwellMinutes === null) return null;
  return (
    <Card
      className="rise"
      style={getRiseStyle(STAFFING_CARD_RISE_INDEX)}
      title={`Escala sugerida para ${dayName}`}
      subtitle="Quantas pessoas pôr no atendimento em cada faixa de horário"
    >
      <StaffingTimeline plan={plan} />
      <StaffingList plan={plan} />
      <p className="mt-4 text-xs leading-relaxed text-ink-3">
        Estimativa: clientes ao mesmo tempo = visitas por hora × permanência típica (
        {formatDecimal(medianDwellMinutes)} min), com 1 pessoa para cada {CLIENTS_PER_ATTENDANT}{' '}
        clientes e pelo menos 1 nas horas com movimento.
      </p>
    </Card>
  );
}
