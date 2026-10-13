import { cx } from '@/lib/cx';

const PING_RING =
  'absolute inline-flex size-full rounded-full bg-primavera opacity-75 motion-safe:animate-ping';

const SIZES = { small: 'size-2', medium: 'size-2.5' } as const;

/** Bolinha pulsante de "ao vivo" (o pulso respeita prefers-reduced-motion). */
export function LiveDot({ size }: { size: keyof typeof SIZES }): React.JSX.Element {
  return (
    <span className={cx('relative flex', SIZES[size])} aria-hidden>
      <span className={PING_RING} />
      <span className={cx('relative inline-flex rounded-full bg-primavera', SIZES[size])} />
    </span>
  );
}
