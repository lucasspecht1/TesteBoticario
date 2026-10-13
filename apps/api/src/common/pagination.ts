/** Itens por página nas listas paginadas da API (visitas e clientes sumidos). */
export const PAGE_SIZE = 25;

/** Quantos itens pular para chegar à página `page` (começa em 1). */
export const computePageOffset = (page: number): number =>
  (page - 1) * PAGE_SIZE;
