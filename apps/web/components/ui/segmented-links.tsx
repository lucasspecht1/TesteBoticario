import Link from 'next/link';
import { cx } from '@/lib/cx';
import { PILL_ACTIVE, PILL_INACTIVE } from './styles';

/** Uma opção do seletor: o link e se é a escolhida. */
type SegmentedItem = { key: string; label: string; href: string; isActive: boolean };

const KINDS = {
  nav: { Tag: 'nav', current: 'page', className: 'w-fit justify-self-start lg:justify-self-end' },
  group: { Tag: 'div', current: 'true', className: 'flex-wrap' },
} as const;

type SegmentedLinksProps = {
  label: string;
  items: SegmentedItem[];
  /** `nav` navega entre telas/URLs; `group` filtra a lista da própria tela. */
  kind: keyof typeof KINDS;
  /** Respiro lateral de cada opção, que muda entre os seletores. */
  itemClassName: string;
};

/** Seletor em pílula feito de links: o ativo fica verde, os outros mudam no hover. */
export function SegmentedLinks({
  label,
  items,
  kind,
  itemClassName,
}: SegmentedLinksProps): React.JSX.Element {
  const { Tag, current, className } = KINDS[kind];
  return (
    <Tag
      aria-label={label}
      role={kind === 'group' ? 'group' : undefined}
      className={cx(
        'inline-flex rounded-full bg-card p-1 text-sm shadow-[var(--shadow-card)]',
        className,
      )}
    >
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.isActive ? current : undefined}
          className={cx(
            'rounded-full py-1.5 font-medium transition-colors',
            itemClassName,
            item.isActive ? PILL_ACTIVE : PILL_INACTIVE,
          )}
        >
          {item.label}
        </Link>
      ))}
    </Tag>
  );
}
