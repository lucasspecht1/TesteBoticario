import { ArrowSquareOut, CaretDown } from '@phosphor-icons/react/dist/ssr';
import { CARD_SURFACE, TEXT_LINK_UNDERLINE } from '@/components/ui/styles';
import { cx } from '@/lib/cx';
import { getRiseStyle } from '@/lib/rise';
import { ConnectionForm } from './connection-form';

const MANUAL_REGISTRATION_RISE_INDEX = 3;
const SUMMARY = cx(
  'flex cursor-pointer list-none items-center justify-between gap-3',
  'rounded-[var(--radius-card)] p-5 sm:p-6 [&::-webkit-details-marker]:hidden',
);
const DOCS_LINK = cx(
  'inline-flex items-center gap-1.5 text-sm font-medium text-brand',
  TEXT_LINK_UNDERLINE,
);

/** Bloco recolhível "Cadastro manual (avançado)", com o formulário e o link para a documentação da API. */
export function ManualRegistration({ docsUrl }: { docsUrl: string | null }): React.JSX.Element {
  return (
    <details
      className={cx('rise group', CARD_SURFACE)}
      style={getRiseStyle(MANUAL_REGISTRATION_RISE_INDEX)}
    >
      <summary className={SUMMARY}>
        <span>
          <span className="block text-base font-semibold text-ink">Cadastro manual (avançado)</span>
          <span className="mt-0.5 block text-sm text-ink-3">
            Uma conexão com MAC, horários e cadastro do cliente, para testar a validação campo a
            campo.
          </span>
        </span>
        <CaretDown
          size={18}
          className="shrink-0 text-ink-3 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-5 border-t border-line px-5 pt-5 pb-6 sm:px-6">
        <ConnectionForm />
        {docsUrl && (
          <a href={docsUrl} target="_blank" rel="noopener noreferrer" className={DOCS_LINK}>
            Documentação da API (Swagger) <ArrowSquareOut size={14} aria-hidden />
          </a>
        )}
      </div>
    </details>
  );
}
