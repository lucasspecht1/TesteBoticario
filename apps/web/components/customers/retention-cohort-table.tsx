import type { Retention } from '@wifi/shared';
import { TABLE_HEADER_CELL, TABLE_HEADER_ROW_ROUNDED } from '@/components/ui/styles';
import { cx } from '@/lib/cx';
import { formatDateKey, formatDecimal, formatInteger } from '@/lib/format';
import { RETENTION_WINDOWS } from './retention-windows';

/** Intensidade máxima da cor de fundo de uma célula (%), reservada à maior taxa do prazo. */
const MAX_SHADE_PERCENT = 85;
/** A partir de que intensidade o texto da célula passa a ser branco, para manter o contraste. */
const LIGHT_TEXT_SHADE_PERCENT = 50;

type RetentionKey = (typeof RETENTION_WINDOWS)[number]['key'];

type RetentionCellProps = {
  /** Taxa de retorno da turma neste prazo; null enquanto o prazo ainda não passou. */
  rate: number | null;
  /** Maior taxa de qualquer turma neste prazo: é a cor mais forte. */
  maxRate: number;
};

/** Célula de uma turma num prazo: pintada pela taxa, ou "medindo" se o prazo ainda não fechou. */
function RetentionCell({ rate, maxRate }: RetentionCellProps) {
  if (rate === null)
    return (
      <span className="block rounded-[6px] py-1.5 text-center text-xs text-ink-3">
        <span className="max-sm:hidden">ainda </span>medindo
      </span>
    );
  const shade = Math.round((rate / maxRate) * MAX_SHADE_PERCENT);
  return (
    <span
      className={cx(
        'block rounded-[6px] py-1.5 text-center font-medium tabular-nums',
        shade > LIGHT_TEXT_SHADE_PERCENT ? 'text-white' : 'text-ink',
      )}
      style={{
        backgroundColor: `color-mix(in oklab, var(--color-brand) ${shade}%, var(--color-paper))`,
      }}
    >
      {formatDecimal(rate)}%
    </span>
  );
}

/** Tabela de turmas semanais: quantos clientes novos vieram e a taxa de retorno em cada prazo. */
export function RetentionCohortTable({
  cohorts,
}: {
  cohorts: Retention['cohorts'];
}): React.JSX.Element {
  const maxRateByWindow = Object.fromEntries(
    RETENTION_WINDOWS.map(({ key }) => [
      key,
      Math.max(...cohorts.map((cohort) => cohort[key] ?? 0), 1),
    ]),
  ) as Record<RetentionKey, number>;

  return (
    <table className="w-full table-fixed text-xs sm:text-sm">
      <caption className="sr-only">
        Retenção por turma semanal: clientes novos e % que voltou em 7, 30 e 60 dias
      </caption>
      <thead className="text-xs text-ink-3">
        <tr className={TABLE_HEADER_ROW_ROUNDED}>
          <th scope="col" className={cx(TABLE_HEADER_CELL, 'w-[17%] px-2 text-left sm:px-4')}>
            Semana
          </th>
          <th scope="col" className={cx(TABLE_HEADER_CELL, 'w-[15%] px-2 text-right sm:px-4')}>
            Novos
          </th>
          {RETENTION_WINDOWS.map(({ key, label }) => (
            <th key={key} scope="col" className={cx(TABLE_HEADER_CELL, 'px-1 text-center sm:px-4')}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line/60">
        {cohorts.map((cohort) => (
          <tr key={cohort.weekStart}>
            <th
              scope="row"
              className="px-2 py-2.5 text-left font-medium text-ink tabular-nums sm:px-4"
            >
              {formatDateKey(cohort.weekStart)}
            </th>
            <td className="px-2 py-2.5 text-right text-ink-2 tabular-nums sm:px-4">
              {formatInteger(cohort.newCustomers)}
            </td>
            {RETENTION_WINDOWS.map(({ key }) => (
              <td key={key} className="px-0.5 py-1.5 sm:px-1.5">
                <RetentionCell rate={cohort[key]} maxRate={maxRateByWindow[key]} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
