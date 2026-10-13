import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { cx } from '@/lib/cx';

const BACK_LINK = cx(
  '-ml-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5',
  'text-sm font-medium text-ink-2 transition-colors hover:bg-card hover:text-ink',
);

/** Link "Voltar para…" em pílula, alinhado à margem do conteúdo. */
export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Link href={href} className={BACK_LINK}>
      <ArrowLeft size={16} aria-hidden /> {children}
    </Link>
  );
}
