'use client';

// Página de Alertas - TEMA HACKER

import { useEffect, useState } from 'react';

interface Alerta {
  id: string;
  tipo: string;
  mensagem: string;
  lido: boolean;
  createdAt: string;
  filho: { nome: string };
  checkin: {
    latitude: number;
    longitude: number;
    endereco: string | null;
    foto: string;
  } | null;
}

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [totalNaoLidos, setTotalNaoLidos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'naoLidos'>('todos');

  useEffect(() => {
    fetchAlertas();
  }, [filtro]);

  const fetchAlertas = async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filtro === 'naoLidos') params.set('naoLidos', 'true');
      const res = await fetch(`/api/alertas?${params}`);
      const data = await res.json();
      if (res.ok) {
        setAlertas(data.alertas);
        setTotalNaoLidos(data.totalNaoLidos);
      }
    } catch (err) {
      console.error('Erro ao buscar alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  const marcarTodosLidos = async () => {
    await fetch('/api/alertas?action=marcar-todos', { method: 'PUT' });
    fetchAlertas();
  };

  const marcarLido = async (id: string) => {
    await fetch(`/api/alertas?action=marcar-lido&id=${id}`, { method: 'PUT' });
    fetchAlertas();
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const getAlertaStyle = (tipo: string) => {
    switch (tipo) {
      case 'FORA_CERCA': return { icon: '[!!!]', color: 'border-l-red-500 bg-red-900/10', badge: 'bg-red-900/30 text-red-400 border-red-800/50', label: 'BREACH' };
      case 'CHECKIN_REALIZADO': return { icon: '[OK]', color: 'border-l-hacker-glow bg-hacker-glow/5', badge: 'bg-hacker-glow/10 text-hacker-glow border-hacker-glow/30', label: 'PING' };
      case 'CHECKIN_ATRASADO': return { icon: '[LATE]', color: 'border-l-yellow-500 bg-yellow-900/10', badge: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50', label: 'TIMEOUT' };
      case 'NOVO_DISPOSITIVO': return { icon: '[DEV]', color: 'border-l-purple-500 bg-purple-900/10', badge: 'bg-purple-900/30 text-purple-400 border-purple-800/50', label: 'NEW_DEV' };
      default: return { icon: '[>>]', color: 'border-l-hacker-border', badge: 'bg-hacker-surface text-hacker-dim border-hacker-border', label: 'INFO' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-hacker-glow text-2xl animate-flicker mb-3 font-mono">&#9608;</div>
          <p className="text-hacker-dim text-sm font-mono">Carregando alertas...</p>
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
            {'>'} alertas
            {totalNaoLidos > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold
                             text-red-400 bg-red-900/30 border border-red-800/50 rounded font-mono">
                {totalNaoLidos} novo{totalNaoLidos !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-hacker-dim text-xs mt-1 font-mono">// notificações do sistema</p>
        </div>
        {totalNaoLidos > 0 && (
          <button onClick={marcarTodosLidos} className="btn-secondary text-xs font-mono">
            $ mark_all --read
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['todos', 'naoLidos'] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded text-xs font-mono transition-all border ${
              filtro === f
                ? 'bg-hacker-glow/10 text-hacker-glow border-hacker-glow/30 shadow-neon'
                : 'bg-hacker-surface text-hacker-dim border-hacker-border hover:border-hacker-glow/20'
            }`}>
            {f === 'todos' ? '$ --all' : '$ --unread'}
          </button>
        ))}
      </div>

      {/* Lista de alertas */}
      {alertas.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-hacker-dim font-mono text-sm">
            <p>$ tail ~/alerts</p>
            <p className="text-hacker-muted mt-2">
              {filtro === 'naoLidos' ? '// sem alertas pendentes' : '// nenhum alerta registrado'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {alertas.map((alerta) => {
            const style = getAlertaStyle(alerta.tipo);
            return (
              <div key={alerta.id}
                className={`card border-l-4 ${style.color} ${!alerta.lido ? 'border border-hacker-glow/20' : 'opacity-60'}`}>
                <div className="flex items-start gap-3 font-mono">
                  <span className={`text-xs font-bold mt-0.5 ${
                    alerta.tipo === 'FORA_CERCA' ? 'text-red-400' :
                    alerta.tipo === 'CHECKIN_ATRASADO' ? 'text-yellow-400' : 'text-hacker-glow'
                  }`}>
                    {style.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-hacker-glow">{alerta.filho.nome}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${style.badge}`}>
                        {style.label}
                      </span>
                      {!alerta.lido && (
                        <span className="w-1.5 h-1.5 rounded-full bg-hacker-glow animate-pulse flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-hacker-dim">{alerta.mensagem}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[10px] text-hacker-muted">{formatDate(alerta.createdAt)}</p>
                      {alerta.checkin && (
                        <a href={`https://www.google.com/maps?q=${alerta.checkin.latitude},${alerta.checkin.longitude}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-cyan-400 hover:text-cyan-300">
                          $ open_map
                        </a>
                      )}
                      {!alerta.lido && (
                        <button onClick={() => marcarLido(alerta.id)}
                          className="text-[10px] text-hacker-muted hover:text-hacker-glow transition-colors">
                          $ mark --read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
