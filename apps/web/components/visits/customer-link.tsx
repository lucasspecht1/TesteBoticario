import Link from 'next/link';
import { cx } from '@/lib/cx';
import { formatCustomerAlias, formatCustomerName } from '@/lib/format';
import { customerHref } from '@/lib/routes';

/** Como o nome e o apelido se organizam: um sobre o outro (tabela) ou lado a lado (lista de sumidos). */
const LAYOUTS = {
  stacked: 'inline-flex min-w-0 flex-col',
  inline: 'flex min-w-0 items-baseline gap-2',
} as const;

type CustomerLinkProps = {
  customer: { id: string; alias: string; firstName: string | null };
  layout: keyof typeof LAYOUTS;
};

/** Nome do cliente (ou o apelido) como link para o perfil; com nome, o apelido vem junto. */
export function CustomerLink({ customer, layout }: CustomerLinkProps): React.JSX.Element {
  return (
    <Link
      href={customerHref(customer.id)}
      prefetch={false}
      className={cx('group/c', LAYOUTS[layout])}
    >
      <span className="font-medium text-ink group-hover/c:text-brand-strong group-hover/c:underline">
        {formatCustomerName(customer)}
      </span>
      {(customer.firstName || layout === 'inline') && (
        <span className="text-xs text-ink-3 tabular-nums">
          {formatCustomerAlias(customer.alias)}
        </span>
      )}
    </Link>
  );
}
