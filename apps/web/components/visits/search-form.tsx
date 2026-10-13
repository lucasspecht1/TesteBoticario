import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import { ALIAS_LENGTH } from '@wifi/shared';
import Link from 'next/link';
import { INPUT_FOCUS, PRIMARY_BUTTON } from '@/components/ui/styles';
import { cx } from '@/lib/cx';
import { DEFAULT_VISIT_FILTERS, buildVisitsHref, type VisitFilters } from '@/lib/visit-filters';

/**
 * Filtros que a busca leva junto como campos ocultos quando fogem do padrão: são exatamente os que
 * têm valor padrão (a busca `q` e a página ficam de fora).
 */
const CARRIED_FILTERS = Object.keys(
  DEFAULT_VISIT_FILTERS,
) as (keyof typeof DEFAULT_VISIT_FILTERS)[];

const SEARCH_INPUT = cx(
  'w-60 rounded-full border bg-card py-2 pr-4 pl-9 text-sm text-ink',
  INPUT_FOCUS,
);

/** Id da mensagem de erro da busca, ligado ao campo por aria-describedby. */
const QUERY_ERROR_ID = 'q-erro';

type SearchFormProps = {
  current: VisitFilters;
  /** Mensagem de erro da busca (apelido inválido); undefined quando está tudo certo. */
  queryError?: string;
};

/** Busca de cliente pelo apelido, que preserva os filtros atuais ao enviar. */
export function SearchForm({ current, queryError }: SearchFormProps): React.JSX.Element {
  return (
    <form action="/visitas" className="flex flex-wrap items-start gap-2">
      {CARRIED_FILTERS.map(
        (name) =>
          current[name] !== DEFAULT_VISIT_FILTERS[name] && (
            <input key={name} type="hidden" name={name} value={current[name]} />
          ),
      )}
      <label className="relative block">
        <span className="sr-only">Buscar cliente pelo apelido</span>
        <MagnifyingGlass
          size={16}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
          aria-hidden
        />
        <input
          name="q"
          defaultValue={current.q}
          placeholder="Apelido do cliente, ex.: 7B3D…"
          maxLength={ALIAS_LENGTH}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={!!queryError}
          aria-describedby={queryError ? QUERY_ERROR_ID : undefined}
          className={cx(SEARCH_INPUT, queryError ? 'border-down' : 'border-line')}
        />
      </label>
      <button className={cx(PRIMARY_BUTTON, 'px-4 py-2')}>Buscar</button>
      {current.q && (
        <Link
          href={buildVisitsHref(current, { q: undefined })}
          className="rounded-full px-3 py-2 text-sm font-medium text-ink-2 hover:bg-card hover:text-ink"
        >
          Limpar busca
        </Link>
      )}
      {queryError && (
        <p id={QUERY_ERROR_ID} role="alert" className="w-full pl-4 text-xs text-down">
          {queryError}
        </p>
      )}
    </form>
  );
}
