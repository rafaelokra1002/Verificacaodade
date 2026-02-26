// Layout da página de verificação com Open Graph metadata
// Quando o link é compartilhado no WhatsApp/redes sociais, mostra preview com imagem

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verificação de Identidade',
  description: 'Complete sua verificação de identidade de forma rápida e segura. Tire uma selfie e confirme sua localização.',
  openGraph: {
    title: 'Verificação de Identidade',
    description: 'Complete sua verificação de identidade de forma rápida e segura.',
    type: 'website',
    siteName: 'Sistema de Verificação',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Verificação de Identidade',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verificação de Identidade',
    description: 'Complete sua verificação de identidade de forma rápida e segura.',
    images: ['/og-image.png'],
  },
};

export default function VerificarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
