'use client';

// Dashboard principal - TEMA HACKER
// Terminal-style dashboard com visual matrix

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalFilhos: number;
  ativos: number;
  alertasNaoLidos: number;
  totalCheckins: number;
}

interface FilhoResumo {
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
  alertas: Array<{
    id: string;
    tipo: string;
    mensagem: string;
    createdAt: string;
  }>;
}

interface AlertaResumo {
  id: string;
  tipo: string;
  mensagem: string;
  lido: boolean;
  createdAt: string;
  filho: { nome: string };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ totalFilhos: 0, ativos: 0, alertasNaoLidos: 0, totalCheckins: 0 });
  const [filhos, setFilhos] = useState<FilhoResumo[]>([]);
  const [alertas, setAlertas] = useState<AlertaResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [filhosRes, alertasRes] = await Promise.all([
        fetch('/api/filhos'),
        fetch('/api/alertas?limit=10&naoLidos=true'),
      ]);
      const filhosData = await filhosRes.json();
      const alertasData = await alertasRes.json();

      if (filhosRes.ok) {
        const lista = filhosData.filhos as FilhoResumo[];
        setFilhos(lista);
        setStats({
          totalFilhos: lista.length,
          ativos: lista.filter((f) => f.ativo).length,
          alertasNaoLidos: alertasData.totalNaoLidos || 0,
          totalCheckins: lista.reduce((acc, f) => acc + f._count.checkins, 0),
        });
      }
      if (alertasRes.ok) {
        setAlertas(alertasData.alertas || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const getAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'FORA_CERCA': return '[!!!]';
      case 'CHECKIN_REALIZADO': return '[OK]';
      case 'CHECKIN_ATRASADO': return '[ATRASO]';
      case 'NOVO_DISPOSITIVO': return '[DEV]';
      default: return '[>>]';
    }
  };

  const getAlertaColor = (tipo: string) => {
    switch (tipo) {
      case 'FORA_CERCA': return 'border-red-800/50 bg-red-900/10';
      case 'CHECKIN_ATRASADO': return 'border-yellow-800/50 bg-yellow-900/10';
      default: return 'border-hacker-border bg-hacker-surface';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-hacker-glow text-2xl animate-flicker mb-3 font-mono">&#9608;</div>
          <p className="text-hacker-dim text-sm font-mono">Carregando dados...</p>
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
            {'>'} dashboard
          </h1>
          <p className="text-hacker-dim text-xs mt-1 font-mono">// visão geral do sistema</p>
        </div>
        <Link href="/admin/filhos" className="btn-primary text-xs font-mono">
          + novo_filho
        </Link>
      </div>

      {/* Cards de estatísticas - Terminal style */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[
          { label: 'FILHOS', value: stats.totalFilhos, prefix: 'total:', color: 'text-hacker-glow' },
          { label: 'ATIVOS', value: stats.ativos, prefix: 'ativos:', color: 'text-hacker-glow' },
          { label: 'REGISTROS', value: stats.totalCheckins, prefix: 'registros:', color: 'text-cyan-400' },
          { label: 'ALERTAS', value: stats.alertasNaoLidos, prefix: 'alertas:', color: stats.alertasNaoLidos > 0 ? 'text-red-400' : 'text-hacker-dim' },
        ].map((stat) => (
          <div key={stat.label} className="card border-hacker-border hover:border-hacker-glow/30 transition-all">
            <div className="text-[10px] text-hacker-muted uppercase tracking-wider mb-1">
              {'>'} {stat.label}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-hacker-dim">{stat.prefix}</span>
              <span className={`text-2xl font-bold ${stat.color} font-mono`}>{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Filhos / Targets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-hacker-glow font-mono">
              <span className="text-hacker-dim">$</span> ls ~/filhos
            </h2>
            <Link href="/admin/filhos" className="text-xs text-hacker-dim hover:text-hacker-glow font-mono transition-colors">
              ver_todos →
            </Link>
          </div>

          {filhos.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-hacker-dim text-sm font-mono">
                <p className="mb-2">$ ls ~/filhos</p>
                <p className="text-hacker-muted">nenhum filho encontrado</p>
              </div>
              <Link href="/admin/filhos" className="text-hacker-glow text-xs mt-3 inline-block font-mono hover:underline">
                $ adicionar →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {filhos.slice(0, 5).map((filho) => (
                <Link key={filho.id} href={`/admin/filhos/${filho.id}`}
                  className="flex items-center justify-between p-3 rounded border border-hacker-border
                           hover:border-hacker-glow/30 hover:bg-hacker-glow/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded border flex items-center justify-center text-xs font-bold font-mono
                      ${filho.ativo
                        ? 'border-hacker-glow/30 bg-hacker-glow/5 text-hacker-glow'
                        : 'border-red-800/30 bg-red-900/5 text-red-400'}`}>
                      {filho.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-hacker-glow font-mono group-hover:text-glow">{filho.nome}</p>
                      <p className="text-[10px] text-hacker-dim font-mono">
                        {filho.idade ? `idade:${filho.idade}` : ''}
                        {filho.idade && filho.dispositivo ? ' | ' : ''}
                        {filho.dispositivo ? `disp:${filho.dispositivo}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {filho.checkins[0] ? (
                      <div className="font-mono">
                        <p className="text-[10px] text-hacker-dim">último:</p>
                        <p className="text-[10px] text-hacker-glow">{formatDate(filho.checkins[0].createdAt)}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-hacker-muted font-mono">sem_dados</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alertas Recentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-hacker-glow font-mono">
              <span className="text-hacker-dim">$</span> ver ~/alertas
              {stats.alertasNaoLidos > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold
                               text-red-400 bg-red-900/30 border border-red-800/50 rounded font-mono">
                  {stats.alertasNaoLidos}
                </span>
              )}
            </h2>
            <Link href="/admin/alertas" className="text-xs text-hacker-dim hover:text-hacker-glow font-mono transition-colors">
              ver_todos →
            </Link>
          </div>

          {alertas.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-hacker-dim text-sm font-mono">
                <p className="mb-2">$ ver ~/alertas</p>
                <p className="text-hacker-muted">sem alertas pendentes</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {alertas.slice(0, 8).map((alerta) => (
                <div key={alerta.id}
                  className={`p-2.5 rounded border ${getAlertaColor(alerta.tipo)} transition-all`}>
                  <div className="flex items-start gap-2 font-mono">
                    <span className={`text-[10px] font-bold ${
                      alerta.tipo === 'FORA_CERCA' ? 'text-red-400' :
                      alerta.tipo === 'CHECKIN_ATRASADO' ? 'text-yellow-400' : 'text-hacker-glow'
                    }`}>
                      {getAlertaIcon(alerta.tipo)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-hacker-glow">{alerta.filho.nome}</p>
                      <p className="text-[10px] text-hacker-dim truncate">{alerta.mensagem}</p>
                      <p className="text-[10px] text-hacker-muted mt-0.5">{formatDate(alerta.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
