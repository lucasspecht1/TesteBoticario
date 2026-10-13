import { UsersThree } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { MessagePanel } from '@/components/ui/message-panel';
import { PRIMARY_BUTTON_BASE } from '@/components/ui/styles';
import { cx } from '@/lib/cx';
import { getRiseStyle } from '@/lib/rise';
import { CLEARED_REFINEMENTS, buildVisitsHref, type VisitFilters } from '@/lib/visit-filters';

const NO_VISITS_RISE_INDEX = 3;

/** Estado vazio da lista de visitas: sugere afrouxar os filtros e ver os últimos 7 dias. */
export function NoVisitsPanel({ filters }: { filters: VisitFilters }): React.JSX.Element {
  const widenedHref = buildVisitsHref(
    { ...filters, q: undefined },
    { range: '7d', ...CLEARED_REFINEMENTS },
  );
  return (
    <MessagePanel
      icon={UsersThree}
      title="Nenhuma visita com esses filtros"
      description="Tente outro período ou tire algum filtro."
      isCompact
      className="rise"
      style={getRiseStyle(NO_VISITS_RISE_INDEX)}
      action={
        <Link
          href={widenedHref}
          className={cx('mt-6 inline-flex px-5 py-2.5', PRIMARY_BUTTON_BASE)}
        >
          Ver os últimos 7 dias
        </Link>
      }
    />
  );
}
