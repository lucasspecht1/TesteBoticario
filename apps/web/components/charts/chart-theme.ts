import type { CSSProperties } from 'react';

/**
 * O SVG do Recharts não lê as variáveis do Tailwind em tempo de build, então os tons ficam aqui
 * (mesmos do tema em globals.css).
 */
export const CHART_COLORS = {
  brand: '#4c765f',
  brandLight: '#b5cdbf',
  musk: '#b6a19b',
  mauve: '#6e5853',
  grid: '#e3e3e3',
  axis: '#666666',
  hoverBackground: '#f2f2f2',
  tooltipLabel: '#212121',
} as const;

/** Séries de visitantes (novos e recorrentes): nome e cor iguais nos gráficos e nas legendas. */
export const VISITOR_SERIES = {
  new: { label: 'Novos', color: CHART_COLORS.brand },
  returning: { label: 'Recorrentes', color: CHART_COLORS.musk },
} as const;

/** Legenda das duas séries de visitantes. */
export const VISITOR_LEGEND_ITEMS = [VISITOR_SERIES.new, VISITOR_SERIES.returning];

/** Cartão da dica flutuante (tooltip), com os cantos e a sombra dos cartões do painel. */
export const TOOLTIP_CONTENT_STYLE: CSSProperties = {
  borderRadius: 12,
  border: 'none',
  boxShadow: '0 8px 24px -8px rgb(73 81 65 / .28)',
  fontSize: 12,
};

/** Título da dica flutuante. */
export const TOOLTIP_LABEL_STYLE: CSSProperties = {
  fontWeight: 600,
  color: CHART_COLORS.tooltipLabel,
};

/** Margens do gráfico: o eixo Y cola na borda esquerda do cartão. */
export const CHART_MARGIN = { left: -8, right: 4, top: 4 };

/** Estilo do texto dos eixos, na cor de apoio do tema. */
export const buildAxisTick = (fontSize: number): { fontSize: number; fill: string } => ({
  fontSize,
  fill: CHART_COLORS.axis,
});
