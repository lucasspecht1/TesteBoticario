/** A partir de quantas pessoas ao mesmo tempo a loja conta como cheia. Ajuste ao tamanho da loja. */
const CROWDED_MIN_PEOPLE = 40;

/** Indica se há gente suficiente na loja para chamar reforço. */
export const isStoreCrowded = (inStore: number): boolean => inStore >= CROWDED_MIN_PEOPLE;
