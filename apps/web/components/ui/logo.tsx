import { cx } from '@/lib/cx';

const LOGO_MASK = 'url(/logo-boticario.svg) center / contain no-repeat';

/** Logo oficial (public/logo-boticario.svg) pintado com currentColor via máscara. */
export function Logo({ className }: { className?: string }): React.JSX.Element {
  return (
    <span
      role="img"
      aria-label="O Boticário"
      className={cx('inline-block aspect-[436/57] bg-current', className)}
      style={{ mask: LOGO_MASK, WebkitMask: LOGO_MASK }}
    />
  );
}
