import { cx } from '@/lib/cx';

/** Superfície de cartão: fundo branco, cantos de 12px e sombra tingida de verde. */
export const CARD_SURFACE = 'rounded-[var(--radius-card)] bg-card shadow-[var(--shadow-card)]';

/** Cartão que corta o que passa da borda (tabelas, réguas e listas internas). */
export const CARD_SURFACE_CLIPPED = cx(CARD_SURFACE, 'overflow-hidden');

/** Respiro interno padrão de um cartão. */
export const CARD_PADDING = 'p-5 sm:p-6';

/** Título de seção dentro de um cartão. */
export const SECTION_TITLE = 'text-base font-semibold text-ink';

/** Botão pílula verde, sem o efeito de pressionar (usado quando o botão fica sem ele). */
export const PRIMARY_BUTTON_BASE =
  'rounded-full bg-brand text-sm font-semibold text-white transition hover:bg-brand-strong';

/** Botão pílula verde com o efeito de pressionar; o respiro interno vem de quem usa. */
export const PRIMARY_BUTTON = cx(PRIMARY_BUTTON_BASE, 'active:scale-[0.98]');

/** Botão pílula verde grande, com ícone opcional ao lado do texto. */
export const PRIMARY_BUTTON_LARGE = cx(
  PRIMARY_BUTTON,
  'inline-flex items-center justify-center gap-2 px-5 py-2.5',
);

/** Fundo e texto de um item ativo nos seletores em pílula. */
export const PILL_ACTIVE = 'bg-brand text-white';

/** Item inativo dos seletores em pílula: texto discreto que ganha fundo ao passar o mouse. */
export const PILL_INACTIVE = 'text-ink-2 hover:bg-paper hover:text-ink';

/** Foco, cor do texto de dica e transição dos campos de texto. */
export const INPUT_FOCUS =
  'outline-none transition placeholder:text-ink-3 focus:border-brand focus:ring-3 focus:ring-brand-soft';

/** Célula de cabeçalho das tabelas: faixa cinza clara. */
export const TABLE_HEADER_CELL = 'bg-paper/70 py-3 font-medium';

/** Linha de cabeçalho com a faixa cinza de pontas arredondadas (tabela dentro de cartão). */
export const TABLE_HEADER_ROW_ROUNDED =
  '[&>th:first-child]:rounded-l-[8px] [&>th:last-child]:rounded-r-[8px]';

/** Canto arredondado de blocos pequenos dentro de um cartão. */
export const ROUNDED_INNER = 'rounded-[8px]';

/** Tamanho dos números grandes das réguas de indicadores. */
export const KPI_NUMBER = 'text-[2.4rem] leading-none';

/** Sublinhado dos links de texto ao passar o mouse. */
export const TEXT_LINK_UNDERLINE = 'underline-offset-4 hover:underline';

/** Subtítulo abaixo do título de um cartão. */
export const CARD_SUBTITLE = 'mt-0.5 text-sm text-ink-3';

/** Texto de cartão vazio, alinhado ao respiro do cabeçalho do cartão. */
export const CARD_EMPTY_TEXT = 'px-5 pb-6 text-sm text-ink-3 sm:px-6';
