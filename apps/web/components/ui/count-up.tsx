'use client';

import { useEffect, useRef } from 'react';
import { FORMATTERS, type NumberStyle } from '@/lib/format';

/** Duração da contagem até o valor final. */
const COUNT_UP_DURATION_MS = 900;
/** Potência da curva de desaceleração: quanto maior, mais rápido no começo e mais suave no fim. */
const EASE_OUT_POWER = 4;

/** Número que sobe até o valor ao montar. Começa já com o valor final no HTML (SSR e reduced-motion). */
export function CountUp({
  value,
  format,
}: {
  value: number;
  format: NumberStyle;
}): React.JSX.Element {
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = numberRef.current;
    if (!element || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / COUNT_UP_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, EASE_OUT_POWER);
      element.textContent = FORMATTERS[format](value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, format]);

  return <span ref={numberRef}>{FORMATTERS[format](value)}</span>;
}
