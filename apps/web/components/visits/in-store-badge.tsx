import { Chip } from '@/components/ui/chip';
import { formatDuration, countMinutesSince } from '@/lib/format';

/** Selo "Na loja há X" de quem ainda não saiu; `now` evita recalcular o relógio a cada linha. */
export function InStoreBadge({
  startedAt,
  now,
}: {
  startedAt: string;
  now: number;
}): React.JSX.Element {
  return <Chip tone="live">Na loja há {formatDuration(countMinutesSince(startedAt, now))}</Chip>;
}
