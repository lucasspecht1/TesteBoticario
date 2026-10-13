/** Estilo com o atraso de entrada escalonado da classe `.rise` (globals.css); `index` é a posição na sequência. */
export const getRiseStyle = (index: number): React.CSSProperties =>
  ({ '--i': index }) as React.CSSProperties;
