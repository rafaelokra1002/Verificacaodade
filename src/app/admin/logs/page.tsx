'use client';

// Página de Logs de Acesso
// Exibe o histórico de ações realizadas no sistema

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

  const getActionIcon = (acao: string) => {
    switch (acao) {
      case 'LOGIN':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
        );
      case 'VERIFICACAO_IDENTIDADE':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'GERAR_TOKEN':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            </svg>
          </div>
        );
      case 'CRIAR_CLIENTE':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            </svg>
          </div>
        );
    }
  };

  const getActionLabel = (acao: string) => {
    const labels: Record<string, string> = {
      LOGIN: 'Login',
      VERIFICACAO_IDENTIDADE: 'Verificação',
      GERAR_TOKEN: 'Token Gerado',
      CRIAR_CLIENTE: 'Cliente Criado',
      REMOVER_CLIENTE: 'Cliente Removido',
    };
    return labels[acao] || acao;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logs de Acesso</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Histórico de ações realizadas no sistema
        </p>
      </div>

      {/* Lista de logs */}
      <div className="card">
        {logs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum log registrado</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className={`flex items-start gap-3 py-3 ${index !== logs.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800' : ''
                  }`}
              >
                {getActionIcon(log.acao)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getActionLabel(log.acao)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  {log.detalhes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{log.detalhes}</p>
                  )}
                  {log.ip && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                      IP: {log.ip}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
