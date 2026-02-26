import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vídeo Compartilhado',
  description: 'kkkkk mano olha isso não tankei 😂😂',
  openGraph: {
    title: 'Vídeo Compartilhado',
    description: 'kkkkk mano olha isso não tankei 😂😂',
  },
};

export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {children}
    </div>
  );
}
