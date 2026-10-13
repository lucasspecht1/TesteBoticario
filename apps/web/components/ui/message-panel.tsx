import { cx } from '@/lib/cx';
import { CARD_SURFACE, PRIMARY_BUTTON_LARGE } from './styles';

const ICON_TONES = { brand: 'bg-brand-soft text-brand', down: 'bg-down-soft text-down' } as const;

const TITLE_TAGS = {
  paragraph: { Tag: 'p', size: 'text-2xl' },
  heading: { Tag: 'h1', size: 'text-3xl' },
} as const;

type PanelIcon = React.ComponentType<{
  size?: number;
  weight?: 'duotone';
  'aria-hidden'?: boolean;
}>;

/** Botão ou link de ação de um painel de mensagem, com a margem que o separa do texto. */
export const PANEL_ACTION = cx('mt-6', PRIMARY_BUTTON_LARGE);

type MessagePanelProps = {
  icon: PanelIcon;
  tone?: keyof typeof ICON_TONES;
  title: string;
  /** `heading` vira o h1 da página (ex.: página não encontrada); `paragraph` é um aviso dentro dela. */
  titleAs?: keyof typeof TITLE_TAGS;
  /** Menos altura, para quando o painel divide a tela com outros blocos. */
  isCompact?: boolean;
  role?: 'alert';
  className?: string;
  style?: React.CSSProperties;
  /** Texto de apoio abaixo do título. */
  description: string;
  /** Botão ou link (use `PANEL_ACTION`). */
  action?: React.ReactNode;
};

/** Painel centralizado com ícone, título, texto e uma ação: estados vazios, erro e 404. */
export function MessagePanel({
  icon: Icon,
  tone = 'brand',
  title,
  titleAs = 'paragraph',
  isCompact = false,
  role,
  className,
  style,
  description,
  action,
}: MessagePanelProps): React.JSX.Element {
  const { Tag, size } = TITLE_TAGS[titleAs];
  return (
    <div
      role={role}
      style={style}
      className={cx(CARD_SURFACE, 'px-6 text-center', isCompact ? 'py-12' : 'py-14', className)}
    >
      <span
        className={cx('mx-auto grid size-12 place-items-center rounded-full', ICON_TONES[tone])}
      >
        <Icon size={24} weight="duotone" aria-hidden />
      </span>
      <Tag className={cx('mt-4 font-display text-ink', size)}>{title}</Tag>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-3">{description}</p>
      {action}
    </div>
  );
}
