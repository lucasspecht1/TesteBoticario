import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel Wi-Fi da Loja",
  description: "Fluxo de clientes a partir do Wi-Fi de visitantes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
