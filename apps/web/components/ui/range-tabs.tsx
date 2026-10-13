import { rangeSchema, type Range } from '@wifi/shared';
import { RANGE_LABEL } from '@/lib/ranges';
import { SegmentedLinks } from './segmented-links';

type RangeTabsProps = {
  current: Range;
  /** Caminho da tela; cada aba leva `?range=` para ele. */
  basePath?: string;
};

/** Abas de período (7, 30 e 90 dias) que trocam o `?range=` da tela. */
export function RangeTabs({ current, basePath = '/' }: RangeTabsProps): React.JSX.Element {
  const items = rangeSchema.options.map((range) => ({
    key: range,
    label: RANGE_LABEL[range],
    href: `${basePath}?range=${range}`,
    isActive: range === current,
  }));
  return (
    <SegmentedLinks label="Período" items={items} kind="nav" itemClassName="px-4 duration-200" />
  );
}
