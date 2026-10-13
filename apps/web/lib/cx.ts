/** Junta nomes de classe ignorando valores falsos; troca os templates longos com condicionais. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
