import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check-in de Localização - Controle Parental',
  description: 'Faça seu check-in de localização com seu responsável.',
};

export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-hacker-bg matrix-bg">
      {children}
    </div>
  );
}
