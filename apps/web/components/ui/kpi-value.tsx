import { EMPTY_VALUE, type NumberStyle } from '@/lib/format';
import { cx } from '@/lib/cx';
import { CountUp } from './count-up';

type KpiValueProps = {
  value: number | null;
  format: NumberStyle;
  suffix?: string;
  className?: string;
};

/** Valor com contagem animada; o sufixo (%, min) fica menor ao lado do número. */
export function KpiValue({ value, format, suffix, className }: KpiValueProps): React.JSX.Element {
  return (
    <p className={cx('font-display tracking-tight text-ink tabular-nums', className)}>
      {value === null ? EMPTY_VALUE : <CountUp value={value} format={format} />}
      {value !== null && suffix && (
        <span className="ml-0.5 text-[0.55em] font-medium text-ink-3">{suffix}</span>
      )}
    </p>
  );
}
