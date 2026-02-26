'use client';

// Página de detalhes do filho - Check-ins, cercas virtuais, horários programados

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Checkin {
  id: string;
  foto: string;
  latitude: number;
  longitude: number;
  endereco: string | null;
  ip: string;
  userAgent: string;
  createdAt: string;
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
        body: JSON.stringify({ filhoId: params.id }),
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
                {filho.idade ? `age: ${filho.idade}` : ''}
                {filho.idade && filho.dispositivo ? ' | ' : ''}
                {filho.dispositivo ? `dev: ${filho.dispositivo}` : ''}
                {' | since: '}{formatDate(filho.createdAt)}
              </p>
            </div>
          </div>
          <button onClick={gerarLink} className="btn-success text-sm font-mono">$ gen_link</button>
        </div>

        {/* Link modal */}
        {linkData && (
          <div className="mt-4 p-4 border border-hacker-glow/30 bg-hacker-glow/5">
            <p className="text-sm font-bold text-hacker-glow mb-2 font-mono">{'>'} link gerado para {filho.nome}:</p>
            <div className="flex gap-2">
              <input type="text" value={linkData} readOnly className="input-field flex-1 text-xs font-mono" />
              <button onClick={() => { navigator.clipboard.writeText(linkData); alert('Copiado!'); }}
                className="btn-primary text-xs font-mono">$ copy</button>
              <button onClick={() => setLinkData(null)} className="btn-secondary text-xs font-mono">x</button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-hacker-surface border border-hacker-border p-1">
        {[
          { key: 'checkins' as const, label: 'pings', count: filho.checkins.length },
          { key: 'cercas' as const, label: 'fences', count: filho.cercas.length },
          { key: 'horarios' as const, label: 'schedule', count: filho.horarios.length },
          { key: 'alertas' as const, label: 'alerts', count: filho.alertas.filter(a => !a.lido).length },
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
              <p className="text-hacker-dim font-mono text-sm">// nenhum ping registrado</p>
              <p className="text-hacker-muted text-xs mt-1 font-mono">$ gen_link para iniciar rastreamento</p>
            </div>
          ) : (
            filho.checkins.map((checkin) => (
              <div key={checkin.id} className="card">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Foto */}
                  <div className="w-full md:w-48 h-48 overflow-hidden bg-hacker-surface border border-hacker-border flex-shrink-0 relative">
                    {checkin.foto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={checkin.foto} alt="Ping" className="w-full h-full object-cover hacker-video" />
                    )}
                    <div className="absolute top-1 left-1 text-[9px] text-hacker-glow/50 font-mono bg-black/70 px-1">
                      IMG_CAPTURE
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-hacker-glow">{formatDate(checkin.createdAt)}</p>
                      <a href={`https://www.google.com/maps?q=${checkin.latitude},${checkin.longitude}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-mono">
                        $ open_map
                      </a>
                    </div>
                    {checkin.endereco && (
                      <p className="text-hacker-dim">
                        addr: {checkin.endereco}
                      </p>
                    )}
                    <p className="text-hacker-muted">
                      coords: {checkin.latitude.toFixed(6)}, {checkin.longitude.toFixed(6)}
                    </p>
                    <p className="text-hacker-muted">ip: {checkin.ip}</p>
                    <p className="text-hacker-muted truncate">ua: {checkin.userAgent}</p>
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
              {showCercaForm ? '$ cancel' : '$ add --fence'}
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
                  $ gps --current
                </button>
                <button type="submit" className="btn-success text-xs font-mono">$ create --fence</button>
              </div>
            </form>
          )}

          {filho.cercas.length === 0 && !showCercaForm ? (
            <div className="card text-center py-8">
              <div className="text-hacker-muted text-3xl mb-3 font-mono">[~~]</div>
              <p className="text-hacker-dim font-mono text-sm">// nenhuma cerca configurada</p>
              <p className="text-hacker-muted text-xs mt-1 font-mono">$ add --fence para criar perímetro</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filho.cercas.map((cerca) => (
                <div key={cerca.id} className={`card border-l-2 ${cerca.ativa ? 'border-l-hacker-glow' : 'border-l-hacker-muted'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-hacker-glow font-mono text-sm">{cerca.nome}</h4>
                    <span className={`text-xs font-mono ${cerca.ativa ? 'text-hacker-glow' : 'text-red-400'}`}>
                      [{cerca.ativa ? 'ACTIVE' : 'OFF'}]
                    </span>
                  </div>
                  <p className="text-xs text-hacker-dim font-mono mb-1">
                    coords: {cerca.latitude.toFixed(6)}, {cerca.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-hacker-dim font-mono mb-3">
                    radius: {cerca.raio}m
                  </p>
                  <div className="flex gap-2">
                    <a href={`https://www.google.com/maps?q=${cerca.latitude},${cerca.longitude}`}
                      target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs flex-1 text-center font-mono">
                      $ map
                    </a>
                    <button onClick={() => toggleCerca(cerca.id, cerca.ativa)}
                      className="btn-secondary text-xs font-mono">
                      {cerca.ativa ? '$ off' : '$ on'}
                    </button>
                    <button onClick={() => removerCerca(cerca.id)} className="btn-danger text-xs font-mono">rm</button>
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
              {showHorarioForm ? '$ cancel' : '$ add --schedule'}
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
              <button type="submit" className="btn-success text-xs font-mono">$ save --cron</button>
            </form>
          )}

          {filho.horarios.length === 0 && !showHorarioForm ? (
            <div className="card text-center py-8">
              <div className="text-hacker-muted text-3xl mb-3 font-mono">[..]</div>
              <p className="text-hacker-dim font-mono text-sm">// nenhum cron configurado</p>
              <p className="text-hacker-muted text-xs mt-1 font-mono">$ add --schedule para programar pings</p>
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
                            [{h.ativo ? 'ON' : 'OFF'}]
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removerHorario(h.id)} className="text-red-400 hover:text-red-300 text-xs font-mono">
                            $ rm
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
                  <th className="text-left px-4 py-2 text-hacker-dim uppercase">hash</th>
                  <th className="text-left px-4 py-2 text-hacker-dim uppercase">created</th>
                  <th className="text-left px-4 py-2 text-hacker-dim uppercase">expires</th>
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
                          [{t.usado ? 'USED' : expirado ? 'EXPIRED' : 'ACTIVE'}]
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
    </div>
  );
}
