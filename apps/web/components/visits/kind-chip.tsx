import { Chip } from '@/components/ui/chip';

/** Selo "Recorrente" ou "Novo" conforme o cliente já tinha vindo antes. */
export function KindChip({ isReturning }: { isReturning: boolean }): React.JSX.Element {
  return (
    <Chip tone={isReturning ? 'brand' : 'neutral'}>{isReturning ? 'Recorrente' : 'Novo'}</Chip>
  );
}
