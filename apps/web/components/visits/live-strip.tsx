import type { VisitList } from '@wifi/shared';
import { LiveDot } from '@/components/ui/live-dot';
import { CARD_SURFACE_CLIPPED, KPI_NUMBER } from '@/components/ui/styles';
import { cx } from '@/lib/cx';
import { formatCurrentTime, formatInteger, formatWithUnit } from '@/lib/format';
import { REFRESH_INTERVAL_SECONDS } from '@/lib/refresh';
import { getRiseStyle } from '@/lib/rise';
import { CrowdAlert } from './crowd-alert';

type LiveCounters = VisitList['live'];

const LIVE_NUMBERS_RISE_INDEX = 1;
const LIVE_NUMBERS_DIVIDERS =
  'sm:grid-cols-3 sm:divide-x sm:divide-line max-sm:divide-y max-sm:divide-line';

/** Os três números do agora (na loja, visitas e permanência de hoje); o primeiro tem a bolinha ao vivo. */
function LiveNumbers({ live }: { live: LiveCounters }) {
  const numbers = [
    { label: 'Na loja agora', value: formatInteger(live.inStore), isLive: true },
    { label: 'Visitas hoje', value: formatInteger(live.visitsToday), isLive: false },
    {
      label: 'Permanência típica hoje',
      value: formatWithUnit(live.medianDwellTodayMinutes, ' min'),
      isLive: false,
    },
  ];
  return (
    <dl
      className={cx('rise grid', CARD_SURFACE_CLIPPED, LIVE_NUMBERS_DIVIDERS)}
      style={getRiseStyle(LIVE_NUMBERS_RISE_INDEX)}
    >
      {numbers.map(({ label, value, isLive }) => (
        <div key={label} className="flex items-center justify-between gap-4 p-5 sm:block">
          <dt className="flex items-center gap-2 text-sm text-ink-3">
            {isLive && <LiveDot size="medium" />}
            {label}
          </dt>
          <dd className={cx('font-display text-ink tabular-nums sm:mt-2', KPI_NUMBER)}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Faixa do agora na tela de visitas: alerta de loja cheia, números ao vivo e hora da última leitura. */
export function LiveStrip({ live }: { live: LiveCounters }): React.JSX.Element {
  return (
    <div className="space-y-3">
      <CrowdAlert inStore={live.inStore} />
      <LiveNumbers live={live} />
      <p className="text-right text-xs text-ink-3">
        Atualizado às {formatCurrentTime()}, a cada {REFRESH_INTERVAL_SECONDS} segundos.
      </p>
    </div>
  );
}
