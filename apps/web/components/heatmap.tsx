import type { Metrics } from '@wifi/shared';
import { fmtDecimal } from '@/lib/format';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Tabela real (acessível) colorida por intensidade. Mostra só as horas com movimento. */
export function Heatmap({ cells }: { cells: Metrics['heatmap'] }) {
  const active = cells.filter((c) => c.avgVisits > 0).map((c) => c.hour);
  if (active.length === 0) return <p className="text-sm text-zinc-600">Sem movimento no período.</p>;
  const first = Math.min(...active);
  const hours = Array.from({ length: Math.max(...active) - first + 1 }, (_, i) => first + i);
  const max = Math.max(...cells.map((c) => c.avgVisits));

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-xs">
        <caption className="sr-only">Média de visitas por dia da semana e hora</caption>
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">Dia</span></th>
            {hours.map((h) => <th key={h} scope="col" className="font-normal text-zinc-500">{h}h</th>)}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, w) => (
            <tr key={day}>
              <th scope="row" className="pr-2 text-left font-medium">{day}</th>
              {hours.map((h) => {
                const v = cells[w * 24 + h].avgVisits;
                const intensity = max ? Math.round((v / max) * 100) : 0;
                return (
                  <td
                    key={h}
                    title={`${day} ${h}h: ${fmtDecimal(v)} visitas em média`}
                    className={`h-8 min-w-8 rounded text-center tabular-nums ${intensity > 55 ? 'text-white' : 'text-zinc-700'}`}
                    style={{ backgroundColor: `color-mix(in oklab, var(--color-brand) ${intensity}%, #f4f4f5)` }}
                  >
                    {v ? Math.round(v) : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
