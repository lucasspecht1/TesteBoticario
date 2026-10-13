/** Quantos números de página aparecem de uma vez. */
const VISIBLE_PAGES = 5;

/** Total de páginas de uma lista (no mínimo 1). */
export const countPages = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / pageSize));

/** Janela de até 5 números de página em volta da página atual, sem sair de 1..pages. */
export function listVisiblePages(currentPage: number, pages: number): number[] {
  const first = Math.max(1, Math.min(currentPage - 2, pages - (VISIBLE_PAGES - 1)));
  return Array.from({ length: Math.min(VISIBLE_PAGES, pages) }, (_, offset) => first + offset);
}
