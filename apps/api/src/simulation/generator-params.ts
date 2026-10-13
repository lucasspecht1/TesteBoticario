import { HOUR_MS } from '../common/time';

/*
 * Parâmetros do gerador de movimento sintético (seed, preenchimento da demo e "Gerar movimento").
 * Mudar um valor muda os dados de demonstração; o seed é determinístico pela `DEFAULT_SEED`.
 */

/** Deslocamento do fuso da loja em relação ao UTC, em ms. */
// trade-off: UTC-3 fixo (Brasil sem horário de verão desde 2019); usar getLocalParts se houver lojas em outros fusos
export const STORE_OFFSET_MS = -3 * HOUR_MS;
/** Hora local em que a loja abre; o peso de cada hora de funcionamento vem de `HOUR_WEIGHTS`. */
export const OPEN_HOUR = 10;
/** Peso relativo do movimento em cada hora, das 10h às 21h. */
export const HOUR_WEIGHTS = [
  0.4, 0.6, 0.9, 0.8, 0.7, 0.8, 1.0, 1.2, 1.3, 1.1, 0.8, 0.5,
];
/** Multiplicador do movimento por dia da semana, de domingo a sábado. */
export const WEEKDAY_FACTOR = [0.6, 0.7, 0.8, 0.85, 0.95, 1.2, 1.5];
/** Fração das visitas geradas que vêm de aparelhos já vistos. */
export const RETURNING_SHARE = 0.3;
/** Fração das visitas longas; as demais são curtas. */
export const LONG_STAY_SHARE = 0.1;
/** Visita curta: `SHORT_STAY_MIN_MINUTES` mais até `SHORT_STAY_SPREAD_MINUTES` (concentrada nas mais curtas). */
export const SHORT_STAY_MIN_MINUTES = 2;
export const SHORT_STAY_SPREAD_MINUTES = 28;
/** Visita longa: `LONG_STAY_MIN_MINUTES` mais até `LONG_STAY_SPREAD_MINUTES`. */
export const LONG_STAY_MIN_MINUTES = 30;
export const LONG_STAY_SPREAD_MINUTES = 30;
/** Variação aleatória do movimento de cada dia: entre `DAILY_FACTOR_MIN` e esse valor mais `DAILY_FACTOR_SPREAD`. */
export const DAILY_FACTOR_MIN = 0.85;
export const DAILY_FACTOR_SPREAD = 0.3;
/** Um MAC tem `MAC_BYTES` bytes, cada um com `BYTE_VALUES` valores possíveis. */
export const MAC_BYTES = 6;
export const BYTE_VALUES = 256;
/** O e-mail gerado termina com um número de 0 a `EMAIL_SUFFIX_RANGE - 1`. */
export const EMAIL_SUFFIX_RANGE = 1000;
/** Semente padrão do histórico, para o seed e os testes serem reprodutíveis. */
export const DEFAULT_SEED = 42;
/** Datas que puxam o movimento: no `month` (1 a 12), de `fromDay` a `toDay`, multiplica por `factor`. */
export const SEASONAL_BOOSTS = [
  { label: 'Dia das Mães', month: 5, fromDay: 1, toDay: 10, factor: 1.8 },
  { label: 'Dia dos Pais', month: 8, fromDay: 1, toDay: 9, factor: 1.3 },
  { label: 'Natal', month: 12, fromDay: 10, toDay: 24, factor: 1.7 },
];
/** Fração das visitas de aparelho novo que se cadastra (lead). */
export const LEAD_SHARE = 0.45;
/** Fração dos leads que informa e-mail. */
export const EMAIL_SHARE = 0.8;
/** Fração dos leads que aceita receber comunicações. */
export const OPT_IN_SHARE = 0.55;
/** Primeiros nomes sorteados para os cadastros gerados. */
export const NAMES = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Elisa',
  'Fernanda',
  'Gabriel',
  'Helena',
  'Igor',
  'Juliana',
  'Larissa',
  'Marcos',
  'Natália',
  'Otávio',
  'Paula',
  'Rafael',
  'Sofia',
  'Tiago',
];
