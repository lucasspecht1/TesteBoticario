/** Texto que o Excel/Sheets executaria como fórmula ganha um apóstrofo na frente (injeção de CSV). */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Uma célula pronta para o CSV: neutraliza fórmulas e aspa o que contém separador, aspas ou quebra. */
function formatCell(value: string | number): string {
  let text = String(value);
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV com ; (padrão do Excel em pt-BR) e quebra de linha CRLF. */
export function toCsv(header: string[], rows: (string | number)[][]): string {
  return (
    [header, ...rows].map((row) => row.map(formatCell).join(';')).join('\r\n') +
    '\r\n'
  );
}
