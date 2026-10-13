import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import type { VisitList } from '@wifi/shared';
import Link from 'next/link';
import { LiveDot } from '@/components/ui/live-dot';
import { SectionCard } from '@/components/ui/section-card';
import { CARD_EMPTY_TEXT, SECTION_TITLE } from '@/components/ui/styles';
import { cx } from '@/lib/cx';
import { isStoreCrowded } from '@/lib/crowd';
import { formatCurrentTime, formatInteger } from '@/lib/format';
import { RANGE_LABEL } from '@/lib/ranges';
import { getRiseStyle } from '@/lib/rise';
import { buildVisitsHref, DEFAULT_VISIT_FILTERS, RECENT_VISITS_RANGE } from '@/lib/visit-filters';
import { CrowdAlert } from './crowd-alert';
import { VisitsTable } from './visits-table';

/** Quantas visitas o painel mostra antes do link para a lista completa. */
const RECENT_VISITS_COUNT = 6;

const SEE_ALL_HREF = buildVisitsHref(DEFAULT_VISIT_FILTERS, { range: '7d' });
const SEE_ALL_LINK = cx(
  'inline-flex items-center gap-2 rounded-full border border-line px-4 py-2',
  'text-sm font-semibold text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft',
);

type RecentVisitsProps = {
  list: VisitList;
  riseIndex?: number;
};

/** Painel: últimas visitas no formato da tela Visitas, com o "agora na loja" e o link para a lista completa. */
export function RecentVisits({ list, riseIndex = 0 }: RecentVisitsProps): React.JSX.Element {
  return (
    <SectionCard labelledBy="ultimas" style={getRiseStyle(riseIndex)}>
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
        <div>
          <h2 id="ultimas" className={SECTION_TITLE}>
            Últimas visitas
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-3">
            <LiveDot size="small" />
            {formatInteger(list.live.inStore)} na loja agora, atualizado às {formatCurrentTime()}
          </p>
        </div>
        <Link href={SEE_ALL_HREF} className={SEE_ALL_LINK}>
          Ver todas <ArrowRight size={14} weight="bold" aria-hidden />
        </Link>
      </div>
      {isStoreCrowded(list.live.inStore) && (
        <div className="px-5 pb-4 sm:px-6">
          <CrowdAlert inStore={list.live.inStore} />
        </div>
      )}
      {list.items.length === 0 ? (
        <p className={CARD_EMPTY_TEXT}>
          Nenhuma visita nos últimos {RANGE_LABEL[RECENT_VISITS_RANGE]}.
        </p>
      ) : (
        <VisitsTable visits={list.items.slice(0, RECENT_VISITS_COUNT)} shouldShowDay isEmbedded />
      )}
    </SectionCard>
  );
}
