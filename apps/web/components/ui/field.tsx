import { cx } from '@/lib/cx';
import { INPUT_FOCUS } from './styles';

const INPUT_BASE = cx(
  'w-full rounded-[var(--radius-card)] border bg-card px-3.5 py-2.5 text-ink',
  INPUT_FOCUS,
);

type FieldProps = {
  label: string;
  name: string;
  /** Mensagens de erro do campo; a primeira aparece abaixo dele. */
  error?: string[];
  /** Dica mostrada abaixo do campo quando não há erro. */
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

/** Campo com rótulo acima e erro abaixo, no padrão de cantos de 12px. */
export function Field({
  label,
  name,
  error,
  hint,
  className,
  ...inputProps
}: FieldProps): React.JSX.Element {
  const errorId = `${name}-erro`;
  return (
    <label className={cx('block text-sm', className)}>
      <span className="mb-1.5 block font-medium text-ink">{label}</span>
      <input
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cx(INPUT_BASE, error ? 'border-down' : 'border-line hover:border-[#c9c9c9]')}
        {...inputProps}
      />
      {error ? (
        <span id={errorId} className="mt-1.5 block text-xs text-down">
          {error[0]}
        </span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-ink-3">{hint}</span>
      )}
    </label>
  );
}
