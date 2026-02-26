'use client';

// Página de Logs - TEMA HACKER / Terminal output

import { useEffect, useState } from 'react';

interface LogItem {
  id: string;
  acao: string;
  detalhes: string | null;
  ip: string | null;
  userAgent: string | null;
  userId: string | null;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs?limit=100');
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(dateStr));
  };

  const getActionTag = (acao: string) => {
    const tags: Record<string, { color: string; label: string }> = {
      LOGIN: { color: 'text-cyan-400', label: 'ACESSO' },
      CHECKIN_REALIZADO: { color: 'text-hacker-glow', label: 'REGISTRO' },
      GERAR_TOKEN_CHECKIN: { color: 'text-purple-400', label: 'TOKEN' },
      CADASTRAR_FILHO: { color: 'text-green-400', label: 'NOVO' },
      REMOVER_FILHO: { color: 'text-red-400', label: 'REMOVER' },
      CRIAR_CERCA: { color: 'text-yellow-400', label: 'CERCA' },
    };
    return tags[acao] || { color: 'text-hacker-dim', label: 'SYS' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-hacker-glow text-2xl animate-flicker mb-3 font-mono">&#9608;</div>
          <p className="text-hacker-dim text-sm font-mono">Carregando logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-hacker-glow text-glow font-mono">
          {'>'} logs
        </h1>
        <p className="text-hacker-dim text-xs mt-1 font-mono">// registro de atividades do sistema</p>
      </div>

      {/* Terminal output style */}
      <div className="card">
        {/* Terminal header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-hacker-border">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/80" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
            <div className="w-2 h-2 rounded-full bg-hacker-glow/80" />
          </div>
          <span className="text-[10px] text-hacker-dim font-mono ml-1">$ tail -f /var/log/system.log</span>
          <span className="text-[10px] text-hacker-muted font-mono ml-auto">{logs.length} entradas</span>
        </div>

        {logs.length === 0 ? (
          <p className="text-center text-hacker-muted py-8 font-mono text-sm">// nenhum log registrado</p>
        ) : (
          <div className="space-y-0 font-mono text-xs">
            {logs.map((log, index) => {
              const tag = getActionTag(log.acao);
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 py-2 hover:bg-hacker-glow/5 px-2 -mx-2 rounded transition-colors
                    ${index !== logs.length - 1 ? 'border-b border-hacker-border/50' : ''}`}
                >
                  <span className="text-hacker-muted shrink-0 w-36">
                    {formatDate(log.createdAt)}
                  </span>
                  <span className={`shrink-0 w-14 text-right font-bold ${tag.color}`}>
                    [{tag.label}]
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-hacker-glow">
                      {log.detalhes || log.acao}
                    </span>
                    {log.ip && (
                      <span className="text-hacker-muted ml-2">
                        @{log.ip}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Blinking cursor at bottom */}
            <div className="pt-2 px-2">
              <span className="text-hacker-glow">{'>'}</span>
              <span className="inline-block w-2 h-3.5 bg-hacker-glow ml-1 animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
