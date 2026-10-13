import type { Range, VisitsQuery } from '@wifi/shared';

/** Filtros da tela de visitas; a página é opcional porque filtro novo volta para a primeira. */
export type VisitFilters = Omit<VisitsQuery, 'page'> & { page?: number };

/** Valores que não aparecem na URL por serem o padrão da tela. */
export const DEFAULT_VISIT_FILTERS: VisitFilters = {
  range: 'today',
  status: 'all',
  kind: 'all',
  lead: 'all',
};

/** Período das visitas recentes do painel (e do texto "nos últimos…" que as acompanha). */
export const RECENT_VISITS_RANGE = '30d' satisfies Range;

/** Filtros que o botão "Limpar filtros" zera (o período e a busca ficam). */
export const CLEARED_REFINEMENTS = { status: 'all', kind: 'all', lead: 'all' } as const;

/** Grupos de filtro do menu: cada um troca um campo de `VisitFilters`. */
export const VISIT_FILTER_GROUPS = [
  {
    name: 'status',
    label: 'Situação',
    options: [
      { value: 'all', label: 'Todas' },
      { value: 'in-store', label: 'Na loja agora' },
      { value: 'closed', label: 'Encerradas' },
    ],
  },
  {
    name: 'kind',
    label: 'Tipo de cliente',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'new', label: 'Novos' },
      { value: 'returning', label: 'Recorrentes' },
    ],
  },
  {
    name: 'lead',
    label: 'Cadastro',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'optin', label: 'Aceitaram contato' },
    ],
  },
] as const;

/** Opções do seletor de período da tela de visitas. */
export const VISIT_RANGE_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
] as const;

/** URL de /visitas com os filtros atuais trocados pelo patch; filtro novo volta para a página 1. */
export function buildVisitsHref(current: VisitFilters, patch: Partial<VisitFilters>): string {
  const next = { ...current, page: undefined, ...patch };
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(next)) {
    const isDefault =
      value === undefined ||
      value === '' ||
      value === DEFAULT_VISIT_FILTERS[name as keyof VisitFilters] ||
      (name === 'page' && value === 1);
    if (!isDefault) params.set(name, String(value));
  }
  const queryString = params.toString();
  return queryString ? `/visitas?${queryString}` : '/visitas';
}
