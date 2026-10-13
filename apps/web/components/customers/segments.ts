import {
  LAPSED_DAYS,
  LOYAL_MIN_VISITS,
  LOYAL_WINDOW_DAYS,
  type CustomerSegment,
} from '@wifi/shared';
import type { ChipTone } from '@/components/ui/chip';

/** Como cada segmento de cliente é mostrado: rótulo, cor do selo e a regra por trás dele. */
export const SEGMENTS: Record<CustomerSegment, { label: string; hint: string; tone: ChipTone }> = {
  novo: { label: 'Novo', hint: 'Veio uma vez só.', tone: 'neutral' },
  recorrente: {
    label: 'Recorrente',
    hint: `Já voltou, mas menos de ${LOYAL_MIN_VISITS} vezes em ${LOYAL_WINDOW_DAYS} dias.`,
    tone: 'brand',
  },
  fiel: {
    label: 'Fiel',
    hint: `${LOYAL_MIN_VISITS} visitas ou mais nos últimos ${LOYAL_WINDOW_DAYS} dias.`,
    tone: 'strong',
  },
  sumido: {
    label: 'Sumido',
    hint: `Já voltou antes, mas não aparece há mais de ${LAPSED_DAYS} dias.`,
    tone: 'rose',
  },
};
