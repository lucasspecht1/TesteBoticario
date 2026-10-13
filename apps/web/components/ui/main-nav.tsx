'use client';

import { ChartLineUp, Flask, HeartStraight, UsersThree } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/lib/cx';
import { PILL_INACTIVE } from './styles';

const isPathUnder = (prefix: string) => (path: string) => path.startsWith(prefix);

const NAV_LINKS = [
  {
    href: '/',
    label: 'Painel',
    Icon: ChartLineUp,
    isCurrent: (path: string) => path === '/' || path.startsWith('/semana'),
  },
  { href: '/visitas', label: 'Visitas', Icon: UsersThree, isCurrent: isPathUnder('/visitas') },
  {
    href: '/clientes',
    label: 'Clientes',
    Icon: HeartStraight,
    isCurrent: isPathUnder('/clientes'),
  },
  { href: '/simular', label: 'Simular dados', Icon: Flask, isCurrent: isPathUnder('/simular') },
];

/** Navegação principal do cabeçalho; só o ícone aparece no celular (o rótulo fica para leitores de tela). */
export function MainNav(): React.JSX.Element {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex items-center gap-0.5 sm:gap-1">
      {NAV_LINKS.map(({ href, label, Icon, isCurrent }) => {
        const isActive = isCurrent(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cx(
              'inline-flex items-center gap-2 rounded-full px-2.5 py-2 text-sm font-medium transition-colors sm:px-3.5',
              isActive ? 'bg-brand-soft text-brand-strong' : PILL_INACTIVE,
            )}
          >
            <Icon size={18} weight={isActive ? 'fill' : 'regular'} aria-hidden />
            <span className="sr-only sm:not-sr-only">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
