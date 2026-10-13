import { cx } from '@/lib/cx';
import { CARD_SURFACE_CLIPPED } from './styles';

type SectionCardProps = {
  /** Id do título da seção, ligado por aria-labelledby. */
  labelledBy: string;
  style: React.CSSProperties;
  children: React.ReactNode;
};

/** Seção de cartão que corta o excesso e entra com a animação `.rise`; o título fica por conta de quem usa. */
export function SectionCard({ labelledBy, style, children }: SectionCardProps): React.JSX.Element {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cx('rise', CARD_SURFACE_CLIPPED)}
      style={style}
    >
      {children}
    </section>
  );
}
