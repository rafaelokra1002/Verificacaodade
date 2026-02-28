// Layout raiz da aplicação - Tema Hacker
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SHADOW_NET // Sistema de Vigilância',
  description: 'Sistema de monitoramento shadow para rastreamento de targets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-hacker-bg font-mono antialiased matrix-bg">
        {children}
      </body>
    </html>
  );
}
