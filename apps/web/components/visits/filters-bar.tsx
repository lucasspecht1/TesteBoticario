import { X } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { SegmentedLinks } from '@/components/ui/segmented-links';
import { cx } from '@/lib/cx';
import { getRiseStyle } from '@/lib/rise';
import {
  CLEARED_REFINEMENTS,
  VISIT_FILTER_GROUPS,
  VISIT_RANGE_OPTIONS,
  buildVisitsHref,
  type VisitFilters,
} from '@/lib/visit-filters';
import { FilterMenu, type FilterGroup } from './filter-menu';
import { SearchForm } from './search-form';

const FILTERS_BAR_RISE_INDEX = 2;

const ACTIVE_FILTER_CHIP = cx(
  'inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5',
  'text-sm font-medium text-brand-strong transition-colors hover:bg-brand hover:text-white',
);

/** Grupos do menu de filtros, com o link de cada opção e qual está ativa. */
function buildFilterGroups(current: VisitFilters): FilterGroup[] {
  return VISIT_FILTER_GROUPS.map((group) => ({
    label: group.label,
    options: group.options.map((option) => ({
      label: option.label,
      href: buildVisitsHref(current, { [group.name]: option.value }),
      isActive: current[group.name] === option.value,
    })),
  }));
}

/** Filtros fora do padrão, cada um com o link que o remove. */
function buildActiveFilters(current: VisitFilters) {
  return VISIT_FILTER_GROUPS.flatMap((group) => {
    const option = group.options.find((candidate) => candidate.value === current[group.name]);
    if (!option || option.value === 'all') return [];
    return [
      {
        key: group.name,
        label: option.label,
        removeHref: buildVisitsHref(current, { [group.name]: 'all' }),
      },
    ];
  });
}

type FiltersBarProps = {
  current: VisitFilters;
  /** Mensagem de erro da busca, mostrada abaixo do campo. */
  queryError?: string;
};

/** Barra de filtros da tela de visitas: período, menu de filtros, etiquetas removíveis e busca. */
export function FiltersBar({ current, queryError }: FiltersBarProps): React.JSX.Element {
  const activeFilters = buildActiveFilters(current);
  const rangeItems = VISIT_RANGE_OPTIONS.map((option) => ({
    key: option.value,
    label: option.label,
    href: buildVisitsHref(current, { range: option.value }),
    isActive: current.range === option.value,
  }));

  return (
    <div
      className="rise relative z-20 flex flex-wrap items-start justify-between gap-3"
      style={getRiseStyle(FILTERS_BAR_RISE_INDEX)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedLinks label="Período" items={rangeItems} kind="group" itemClassName="px-3.5" />
        <FilterMenu
          key={JSON.stringify(current)}
          groups={buildFilterGroups(current)}
          activeCount={activeFilters.length}
          clearHref={buildVisitsHref(current, CLEARED_REFINEMENTS)}
        />
        {activeFilters.map((filter) => (
          <Link
            key={filter.key}
            href={filter.removeHref}
            aria-label={`Tirar o filtro ${filter.label}`}
            className={ACTIVE_FILTER_CHIP}
          >
            {filter.label} <X size={13} weight="bold" aria-hidden />
          </Link>
        ))}
      </div>
      <SearchForm current={current} queryError={queryError} />
    </div>
  );
}
