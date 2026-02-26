'use client';

// Página de gestão dos filhos - TEMA HACKER

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Filho {
  id: string;
  nome: string;
  idade: number | null;
  dispositivo: string | null;
  ativo: boolean;
  createdAt: string;
  checkins: Array<{
    id: string;
    createdAt: string;
    endereco: string | null;
    latitude: number;
    longitude: number;
  }>;
  _count: {
    checkins: number;
    alertas: number;
    cercas: number;
  };
}

export default function FilhosPage() {
  const [filhos, setFilhos] = useState<Filho[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form novo filho
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [dispositivo, setDispositivo] = useState('');
  const [saving, setSaving] = useState(false);

  // Link de check-in
  const [linkData, setLinkData] = useState<{ url: string; filhoNome: string } | null>(null);
  const [gerandoLink, setGerandoLink] = useState<string | null>(null);

  useEffect(() => {
    fetchFilhos();
  }, [search]);

  const fetchFilhos = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/filhos?${params}`);
      const data = await res.json();
      if (res.ok) setFilhos(data.filhos);
    } catch (err) {
      console.error('Erro ao carregar filhos:', err);
    } finally {
      setLoading(false);
    }
  };

  const criarFilho = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/filhos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, idade: idade || null, dispositivo: dispositivo || null }),
      });
      if (res.ok) {
        setNome(''); setIdade(''); setDispositivo(''); setShowForm(false);
        fetchFilhos();
      }
    } catch (err) {
      console.error('Erro ao criar filho:', err);
    } finally {
      setSaving(false);
    }
  };

  const removerFilho = async (id: string, filhoNome: string) => {
    if (!confirm(`Tem certeza que deseja remover ${filhoNome}? Todos os dados serão perdidos.`)) return;
    try {
      await fetch(`/api/filhos/${id}`, { method: 'DELETE' });
      fetchFilhos();
    } catch (err) {
      console.error('Erro ao remover:', err);
    }
  };

  const gerarLink = async (filhoId: string, filhoNome: string) => {
    setGerandoLink(filhoId);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filhoId }),
      });
      const data = await res.json();
      if (res.ok) {
        setLinkData({ url: data.url, filhoNome });
      }
    } catch (err) {
      console.error('Erro ao gerar link:', err);
    } finally {
      setGerandoLink(null);
    }
  };

  const copiarLink = () => {
    if (linkData) {
      navigator.clipboard.writeText(linkData.url);
      alert('Link copiado!');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-hacker-glow text-2xl animate-flicker mb-3 font-mono">&#9608;</div>
          <p className="text-hacker-dim text-sm font-mono">Carregando alvos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-hacker-glow text-glow font-mono">
            {'>'} filhos
          </h1>
          <p className="text-hacker-dim text-xs mt-1 font-mono">// {filhos.length} registrado(s)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs font-mono">
          {showForm ? '$ cancelar' : '+ adicionar'}
        </button>
      </div>

      {/* Form novo filho */}
      {showForm && (
        <form onSubmit={criarFilho} className="card space-y-4">
          <h3 className="text-sm font-bold text-hacker-glow font-mono">
            <span className="text-hacker-dim">$</span> adicionar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-hacker-dim mb-1 font-mono">
                <span className="text-hacker-glow">$</span> nome *
              </label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required
                className="input-field text-sm" placeholder="Nome do filho(a)" />
            </div>
            <div>
              <label className="block text-xs text-hacker-dim mb-1 font-mono">
                <span className="text-hacker-glow">$</span> idade
              </label>
              <input type="number" value={idade} onChange={(e) => setIdade(e.target.value)} min="0" max="18"
                className="input-field text-sm" placeholder="Idade" />
            </div>
            <div>
              <label className="block text-xs text-hacker-dim mb-1 font-mono">
                <span className="text-hacker-glow">$</span> dispositivo
              </label>
              <input type="text" value={dispositivo} onChange={(e) => setDispositivo(e.target.value)}
                className="input-field text-sm" placeholder="Ex: iPhone, Samsung" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-success text-xs font-mono">
            {saving ? 'Processando...' : '>> Cadastrar'}
          </button>
        </form>
      )}

      {/* Busca */}
      <div className="flex gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field flex-1 text-sm" placeholder="$ buscar ..." />
      </div>

      {/* Modal link */}
      {linkData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLinkData(null)}>
          <div className="bg-hacker-card border border-hacker-glow/30 rounded p-6 max-w-lg w-full shadow-neon-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-hacker-glow font-mono mb-2 text-glow">
              [LINK] Token Gerado
            </h3>
            <p className="text-xs text-hacker-dim mb-4 font-mono">
              {'>'} target: <span className="text-hacker-glow">{linkData.filhoNome}</span>
            </p>
            <div className="bg-hacker-bg border border-hacker-border p-3 rounded mb-4 break-all text-xs font-mono text-hacker-glow">
              {linkData.url}
            </div>
            <div className="flex gap-3">
              <button onClick={copiarLink} className="btn-primary flex-1 text-xs font-mono">$ copiar_link</button>
              <button onClick={() => setLinkData(null)} className="btn-secondary text-xs font-mono">$ fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de filhos */}
      {filhos.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-hacker-dim font-mono text-sm mb-3">
            <p>$ ls ~/filhos</p>
            <p className="text-hacker-muted mt-2">// nenhum filho encontrado</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary text-xs font-mono mt-4">
            + primeiro_filho
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filhos.map((filho) => (
            <div key={filho.id} className="card hover:border-hacker-glow/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded border flex items-center justify-center text-lg font-bold font-mono
                    ${filho.ativo
                      ? 'border-hacker-glow/30 bg-hacker-glow/5 text-hacker-glow'
                      : 'border-red-800/30 bg-red-900/5 text-red-400'}`}>
                    {filho.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-hacker-glow text-sm font-mono group-hover:text-glow">{filho.nome}</h3>
                    <p className="text-[10px] text-hacker-dim font-mono">
                      {filho.idade ? `idade:${filho.idade}` : ''}
                      {filho.idade && filho.dispositivo ? ' | ' : ''}
                      {filho.dispositivo ? `disp:${filho.dispositivo}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                  filho.ativo
                    ? 'border-hacker-glow/30 bg-hacker-glow/10 text-hacker-glow'
                    : 'border-red-800/30 bg-red-900/10 text-red-400'
                }`}>
                  {filho.ativo ? '[ATIVO]' : '[INATIVO]'}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'registros', value: filho._count.checkins, color: 'text-cyan-400 border-cyan-800/30' },
                  { label: 'cercas', value: filho._count.cercas, color: 'text-yellow-400 border-yellow-800/30' },
                  { label: 'alertas', value: filho._count.alertas, color: 'text-red-400 border-red-800/30' },
                ].map((stat) => (
                  <div key={stat.label} className={`text-center p-2 bg-hacker-surface rounded border ${stat.color.split(' ')[1]}`}>
                    <p className={`text-sm font-bold font-mono ${stat.color.split(' ')[0]}`}>{stat.value}</p>
                    <p className="text-[10px] text-hacker-muted font-mono">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Último check-in */}
              {filho.checkins[0] && (
                <div className="text-[10px] text-hacker-dim mb-3 p-2 bg-hacker-bg rounded border border-hacker-border font-mono">
                  {'>'} último: {filho.checkins[0].endereco || 'sem endereço'} — {formatDate(filho.checkins[0].createdAt)}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={`/admin/filhos/${filho.id}`} className="btn-primary text-[10px] flex-1 text-center font-mono">
                  $ ver
                </Link>
                <button onClick={() => gerarLink(filho.id, filho.nome)} disabled={gerandoLink === filho.id}
                  className="btn-success text-[10px] flex-1 font-mono">
                  {gerandoLink === filho.id ? '...' : '$ gerar_link'}
                </button>
                <button onClick={() => removerFilho(filho.id, filho.nome)} className="btn-danger text-[10px] px-3 font-mono">
                  remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
