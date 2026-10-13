import { cx } from '@/lib/cx';
import { CARD_PADDING, CARD_SURFACE, SECTION_TITLE } from './styles';

type CardProps = {
  title: string;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/** Cartão com título, subtítulo opcional e o conteúdo logo abaixo. */
export function Card({
  title,
  subtitle,
  className,
  style,
  children,
}: CardProps): React.JSX.Element {
  return (
    <section style={style} className={cx('min-w-0', CARD_SURFACE, CARD_PADDING, className)}>
      <h2 className={SECTION_TITLE}>{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-ink-3">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
