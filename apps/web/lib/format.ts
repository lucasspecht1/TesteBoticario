const int = new Intl.NumberFormat('pt-BR');
const dec = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const fmtInt = (n: number | null) => (n === null ? '—' : int.format(n));
export const fmtDecimal = (n: number | null) => (n === null ? '—' : dec.format(n));
export const fmtPct = (n: number | null) => (n === null ? '—' : `${dec.format(n)}%`);
export const fmtMin = (n: number | null) => (n === null ? '—' : `${dec.format(n)} min`);
