'use client';

import { CaretDown, Check, Funnel } from '@phosphor-icons/react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { PILL_INACTIVE, ROUNDED_INNER } from '@/components/ui/styles';
import { cx } from '@/lib/cx';

/** Um grupo do menu de filtros: o nome e as opções, cada uma com seu link e se está ativa. */
export type FilterGroup = {
  label: string;
  options: { label: string; href: string; isActive: boolean }[];
};

type FilterMenuProps = {
  groups: FilterGroup[];
  activeCount: number;
  clearHref: string;
};

const TRIGGER_BASE = cx(
  'inline-flex cursor-pointer list-none items-center gap-2 rounded-full px-4 py-2.5',
  'text-sm font-medium shadow-[var(--shadow-card)] transition-colors',
  '[&::-webkit-details-marker]:hidden',
);
const PANEL = cx(
  'absolute left-0 z-30 mt-2 w-80 max-sm:fixed max-sm:inset-x-4 max-sm:w-auto',
  'rounded-[var(--radius-card)] bg-card p-2',
  'shadow-[0_2px_4px_rgb(73_81_65/0.06),0_16px_40px_-12px_rgb(73_81_65/0.3)]',
);
const ACTIVE_COUNT_BADGE = cx(
  'grid size-5 place-items-center rounded-full bg-white text-xs font-semibold',
  'text-brand-strong tabular-nums',
);
const CLEAR_LINK = cx(
  'block rounded-full px-3 py-2 text-center text-sm font-medium',
  PILL_INACTIVE,
);

/** Botão "Filtros" com painel de opções; fecha ao clicar fora, com Esc ou ao escolher. */
export function FilterMenu({ groups, activeCount, clearHref }: FilterMenuProps): React.JSX.Element {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const hasActiveFilters = activeCount > 0;

  useEffect(() => {
    const closeOnOutsideAction = (event: Event) => {
      const menu = menuRef.current;
      if (!menu?.open) return;
      const isEscape = event instanceof KeyboardEvent && event.key === 'Escape';
      const isOutsideClick =
        !(event instanceof KeyboardEvent) && !menu.contains(event.target as Node);
      if (isEscape || isOutsideClick) menu.open = false;
    };
    document.addEventListener('pointerdown', closeOnOutsideAction);
    document.addEventListener('keydown', closeOnOutsideAction);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideAction);
      document.removeEventListener('keydown', closeOnOutsideAction);
    };
  }, []);

  const closeMenu = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  return (
    <details ref={menuRef} className="group relative">
      <summary
        className={cx(
          TRIGGER_BASE,
          hasActiveFilters ? 'bg-brand text-white' : 'bg-card text-ink-2 hover:text-ink',
        )}
      >
        <Funnel size={16} weight={hasActiveFilters ? 'fill' : 'regular'} aria-hidden />
        Filtros
        {hasActiveFilters && <span className={ACTIVE_COUNT_BADGE}>{activeCount}</span>}
        <CaretDown size={14} className="transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className={PANEL}>
        {groups.map((group) => (
          <div
            key={group.label}
            role="group"
            aria-label={group.label}
            className="border-b border-line px-2 py-3 last:border-0"
          >
            <p className="mb-2 px-1 text-xs font-medium text-ink-3">{group.label}</p>
            <ul className="space-y-0.5">
              {group.options.map((option) => (
                <li key={option.label}>
                  <Link
                    href={option.href}
                    onClick={closeMenu}
                    aria-current={option.isActive ? 'true' : undefined}
                    className={cx(
                      'flex items-center justify-between px-2.5 py-2 text-sm transition-colors',
                      ROUNDED_INNER,
                      option.isActive
                        ? 'bg-brand-soft font-semibold text-brand-strong'
                        : PILL_INACTIVE,
                    )}
                  >
                    {option.label}
                    {option.isActive && <Check size={16} weight="bold" aria-hidden />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {hasActiveFilters && (
          <div className="px-2 pt-2 pb-1">
            <Link href={clearHref} onClick={closeMenu} className={CLEAR_LINK}>
              Limpar filtros
            </Link>
          </div>
        )}
      </div>
    </details>
  );
}
