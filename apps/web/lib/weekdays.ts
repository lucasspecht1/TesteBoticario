/** Nome de cada dia da semana em minúsculas (índice 0 = domingo). */
export const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Abreviação de cada dia da semana (índice 0 = domingo). */
export const WEEKDAY_SHORT_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Endereço de cada dia da semana na URL (índice 0 = domingo). */
export const WEEKDAY_SLUGS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

/** Nome no plural, para o título da análise do dia (índice 0 = domingo). */
const WEEKDAY_PLURAL_NAMES = [
  'Domingos',
  'Segundas-feiras',
  'Terças-feiras',
  'Quartas-feiras',
  'Quintas-feiras',
  'Sextas-feiras',
  'Sábados',
];

/** Dias da semana que levam artigo masculino em português (domingo e sábado). */
const MASCULINE_WEEKDAYS = [0, 6];

/** Nome de um dia da semana e as formas que dependem do gênero ("o sábado", "uma segunda"). */
export type WeekdayLabels = {
  name: string;
  plural: string;
  slug: string;
  /** "o" ou "a". */
  article: 'o' | 'a';
  /** "um" ou "uma". */
  indefiniteArticle: 'um' | 'uma';
  /** "fraco" ou "fraca". */
  weak: 'fraco' | 'fraca';
};

/** Reúne nome, endereço e concordância de gênero de um dia da semana (0 = domingo). */
export function describeWeekday(weekday: number): WeekdayLabels {
  const isMasculine = MASCULINE_WEEKDAYS.includes(weekday);
  return {
    name: WEEKDAY_NAMES[weekday],
    plural: WEEKDAY_PLURAL_NAMES[weekday],
    slug: WEEKDAY_SLUGS[weekday],
    article: isMasculine ? 'o' : 'a',
    indefiniteArticle: isMasculine ? 'um' : 'uma',
    weak: isMasculine ? 'fraco' : 'fraca',
  };
}
