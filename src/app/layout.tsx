// Layout raiz da aplicação - Tema Hacker
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CTRL_PARENTAL // Sistema de Monitoramento',
  description: 'Sistema de controle parental para monitoramento de localização dos filhos',
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
