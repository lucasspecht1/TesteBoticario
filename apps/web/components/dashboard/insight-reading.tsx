import { getRiseStyle } from '@/lib/rise';
import { SECTION_TITLE } from '@/components/ui/styles';

type InsightReadingProps = {
  insights: string[];
  riseIndex?: number;
};

/** Insights do período como frases de leitura. */
export function InsightReading({
  insights,
  riseIndex = 0,
}: InsightReadingProps): React.JSX.Element {
  return (
    <section aria-labelledby="leitura" className="rise max-w-3xl" style={getRiseStyle(riseIndex)}>
      <h2 id="leitura" className={SECTION_TITLE}>
        A leitura do período
      </h2>
      <ol className="mt-2 divide-y divide-line">
        {insights.map((insight) => (
          <li key={insight} className="py-4 text-lg leading-relaxed text-ink-2">
            {insight}
          </li>
        ))}
      </ol>
    </section>
  );
}
