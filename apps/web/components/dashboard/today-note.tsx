import { cx } from '@/lib/cx';
import { formatInteger, pluralize } from '@/lib/format';
import { NEUTRAL_VARIATION_PERCENT } from '@/lib/kpis';
import type { TodaySummary } from '@/lib/today';

/** Se a variação é pequena demais para destacar (ou não existe base de comparação). */
const isNeutralVariation = (vsTypicalPercent: number | null): boolean =>
  vsTypicalPercent === null || Math.abs(vsTypicalPercent) < NEUTRAL_VARIATION_PERCENT;

/** Frase de ritmo de hoje contra o típico; null quando não há base de comparação. */
function describePace(vsTypicalPercent: number | null): string | null {
  if (vsTypicalPercent === null) return null;
  if (isNeutralVariation(vsTypicalPercent)) return 'no ritmo de um dia típico';
  const direction = vsTypicalPercent > 0 ? 'acima' : 'abaixo';
  return `${Math.abs(vsTypicalPercent)}% ${direction} do típico até agora`;
}

/** Cor da frase de ritmo: só destaca quando foge do normal; sobre o fundo verde fica branca. */
function getPaceTone(vsTypicalPercent: number | null, isOnBrand: boolean): string {
  if (vsTypicalPercent === null || isNeutralVariation(vsTypicalPercent)) return '';
  if (isOnBrand) return 'text-white';
  return vsTypicalPercent > 0 ? 'text-brand-strong' : 'text-down';
}

type TodayNoteProps = {
  summary: TodaySummary;
  /** A coluna está sobre o fundo verde (dia mais cheio), então o texto é claro. */
  isOnBrand: boolean;
};

/** Linha do cartão de hoje: até agora contra o típico deste horário. */
export function TodayNote({ summary, isOnBrand }: TodayNoteProps): React.JSX.Element {
  const pace = describePace(summary.vsTypicalPercent);
  return (
    <p
      className={cx(
        'mt-3 border-t pt-3 text-xs',
        isOnBrand ? 'border-white/20 text-white/80' : 'border-line text-ink-2',
      )}
    >
      Hoje:{' '}
      <strong className={isOnBrand ? 'text-white' : 'text-ink'}>
        {formatInteger(summary.visitorsToday)}{' '}
        {pluralize(summary.visitorsToday, 'visitante', 'visitantes')}
      </strong>
      {pace && (
        <span
          className={cx('block font-semibold', getPaceTone(summary.vsTypicalPercent, isOnBrand))}
        >
          {pace}
        </span>
      )}
    </p>
  );
}
