import type { Retention } from '@wifi/shared';
import { SectionCard } from '@/components/ui/section-card';
import { CARD_SUBTITLE, SECTION_TITLE } from '@/components/ui/styles';
import { getRiseStyle } from '@/lib/rise';
import { RetentionCohortTable } from './retention-cohort-table';
import { RetentionSummary } from './retention-summary';

type RetentionCardProps = {
  retention: Retention;
  riseIndex?: number;
};

/** Retenção por turma: cada célula pintada pela taxa, relativa à maior taxa do mesmo prazo. */
export function RetentionCard({ retention, riseIndex = 0 }: RetentionCardProps): React.JSX.Element {
  return (
    <SectionCard labelledBy="retencao" style={getRiseStyle(riseIndex)}>
      <div className="p-5 sm:p-6">
        <h2 id="retencao" className={SECTION_TITLE}>
          Clientes novos voltam?
        </h2>
        <p className={CARD_SUBTITLE}>
          Cada linha é a turma de clientes que veio pela primeira vez naquela semana, e quantos
          voltaram em outro dia.
        </p>
        <RetentionSummary averages={retention.avg} />
      </div>
      <div className="px-4 pb-5 sm:px-6 sm:pb-6">
        <RetentionCohortTable cohorts={retention.cohorts} />
      </div>
    </SectionCard>
  );
}
