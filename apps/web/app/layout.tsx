import type { Metadata, Viewport } from 'next';
import { Belleza, DM_Sans } from 'next/font/google';
import { cx } from '@/lib/cx';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const belleza = Belleza({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-belleza',
  display: 'swap',
});

/** Título e descrição padrão das páginas. */
export const metadata: Metadata = {
  title: 'Painel da loja | O Boticário',
  description: 'Fluxo de clientes a partir do Wi-Fi de visitantes.',
};

/** Cor da barra do navegador no celular, igual ao fundo da página. */
export const viewport: Viewport = { themeColor: '#f2f2f2' };

/** Estrutura raiz: idioma e fontes. */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html lang="pt-BR" className={cx(dmSans.variable, belleza.variable)}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
