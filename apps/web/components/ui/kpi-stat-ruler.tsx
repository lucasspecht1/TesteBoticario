import type { KpiItem } from '@/lib/kpis';
import { KpiValue } from './kpi-value';
import { KPI_NUMBER } from './styles';
import { StatRuler, StatRulerItem } from './stat-ruler';

type KpiStatRulerProps = {
  title: { id: string; text: string };
  columns: string;
  style: React.CSSProperties;
  items: KpiItem[];
  /** Linhas abaixo do valor de cada indicador (variação, dica...), como `<dd>`. */
  renderFooter: (kpi: KpiItem) => React.ReactNode;
};

/** Régua de indicadores: rótulo, valor animado e o rodapé que cada tela escolhe. */
export function KpiStatRuler({
  title,
  columns,
  style,
  items,
  renderFooter,
}: KpiStatRulerProps): React.JSX.Element {
  return (
    <StatRuler title={title} columns={columns} style={style}>
      {items.map((kpi) => (
        <StatRulerItem key={kpi.key} label={kpi.label} hasTallLabel>
          <dd className="mt-2">
            <KpiValue
              value={kpi.value}
              format={kpi.format}
              suffix={kpi.suffix}
              className={KPI_NUMBER}
            />
          </dd>
          {renderFooter(kpi)}
        </StatRulerItem>
      ))}
    </StatRuler>
  );
}
