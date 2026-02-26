// Geração dinâmica de imagem OG (Open Graph)
// Usado como preview quando o link de verificação é compartilhado

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Verificação de Identidade';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Ícone de escudo / verificação */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            marginBottom: 30,
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>

        <div
          style={{
            color: 'white',
            fontSize: 52,
            fontWeight: 'bold',
            lineHeight: 1.2,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Verificação de Identidade
        </div>

        <div
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 24,
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          Complete sua verificação de forma rápida e segura
        </div>

        {/* Barra inferior */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)',
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  );
}
