import { CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { cx } from '@/lib/cx';

type NoticeIcon = React.ComponentType<{
  size?: number;
  weight?: 'fill';
  className?: string;
  'aria-hidden'?: boolean;
}>;

const NOTICE_BASE = 'flex items-start rounded-[var(--radius-card)] text-sm';

const NOTICE_KINDS = {
  error: { role: 'alert', tone: 'bg-down-soft text-down', Icon: WarningCircle, iconTone: '' },
  success: {
    role: 'status',
    tone: 'bg-brand-soft text-brand-deep',
    Icon: CheckCircle,
    iconTone: 'text-brand',
  },
} as const;

const SPACING = {
  compact: 'gap-2 px-3.5 py-3',
  roomy: 'gap-2.5 px-4 py-3',
} as const;

type NoticeProps = {
  kind: keyof typeof NOTICE_KINDS;
  /** Troca o ícone padrão do tipo (ex.: o alerta de loja cheia). */
  icon?: NoticeIcon;
  /** Troca o papel ARIA do tipo (`alert` para erro, `status` para sucesso). */
  role?: 'alert' | 'status';
  spacing?: keyof typeof SPACING;
  children: React.ReactNode;
};

/** Aviso em linha com ícone: erro (role=alert) ou sucesso (role=status). */
export function Notice({
  kind,
  icon,
  role,
  spacing = 'compact',
  children,
}: NoticeProps): React.JSX.Element {
  const { role: defaultRole, tone, Icon: DefaultIcon, iconTone } = NOTICE_KINDS[kind];
  const Icon = icon ?? DefaultIcon;
  return (
    <p role={role ?? defaultRole} className={cx(NOTICE_BASE, SPACING[spacing], tone)}>
      <Icon size={18} weight="fill" className={cx('mt-px shrink-0', iconTone)} aria-hidden />
      {children}
    </p>
  );
}
