// Layout raiz da aplicação
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Verificação de Identidade',
  description: 'Sistema de verificação de identidade para clientes de empréstimos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 dark:bg-zinc-950 antialiased">
        {children}
      </body>
    </html>
  );
}
