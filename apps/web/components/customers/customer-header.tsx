import { CheckCircle } from '@phosphor-icons/react/dist/ssr';
import type { CustomerDetail } from '@wifi/shared';
import { BackLink } from '@/components/ui/back-link';
import { Chip } from '@/components/ui/chip';
import { formatCustomerAlias, formatCustomerName } from '@/lib/format';
import { SEGMENTS } from './segments';

/** Linha de consentimento: aceitou comunicações ou, sem cadastro, por que o nome não aparece. */
function ConsentLine({ hasOptedIn }: { hasOptedIn: boolean }) {
  return (
    <p className="mt-2 flex items-center gap-1.5 text-sm">
      {hasOptedIn ? (
        <>
          <CheckCircle size={16} weight="fill" className="text-brand" aria-hidden />
          <span className="text-brand-strong">Aceitou receber comunicações da loja</span>
        </>
      ) : (
        <span className="text-ink-3">Sem cadastro com consentimento: o nome não aparece.</span>
      )}
    </p>
  );
}

/** Topo do perfil do cliente: voltar, nome (ou apelido), segmento e consentimento. */
export function CustomerHeader({ customer }: { customer: CustomerDetail }): React.JSX.Element {
  const segment = SEGMENTS[customer.segment];
  return (
    <header className="rise space-y-5">
      <BackLink href="/visitas">Voltar para visitas</BackLink>
      <div>
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
          {formatCustomerName(customer)}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {customer.firstName && (
            <span className="text-ink-3 tabular-nums">{formatCustomerAlias(customer.alias)}</span>
          )}
          <Chip tone={segment.tone}>{segment.label}</Chip>
          <span className="text-ink-3">{segment.hint}</span>
        </div>
        <ConsentLine hasOptedIn={customer.optIn} />
      </div>
    </header>
  );
}
