'use client';

// Página de detalhes do cliente
// Mostra informações do cliente, verificações realizadas e tokens gerados

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Verificacao {
  id: string;
  foto: string;
  latitude: number;
  longitude: number;
  endereco: string | null;
  ip: string;
  userAgent: string;
  createdAt: string;
}

interface TokenVerificacao {
  id: string;
  token: string;
  expiracao: string;
  usado: boolean;
  createdAt: string;
}

interface ClienteDetalhes {
  id: string;
  nome: string;
  telefone: string;
  status: 'PENDENTE' | 'VERIFICADO';
  createdAt: string;
  verificacoes: Verificacao[];
  tokens: TokenVerificacao[];
}

export default function ClienteDetalhesPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [cliente, setCliente] = useState<ClienteDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchCliente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCliente = async () => {
    try {
      const response = await fetch(`/api/clientes/${id}`);
      const data = await response.json();
      if (response.ok) {
        setCliente(data.cliente);
      }
    } catch (err) {
      console.error('Erro ao buscar cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = async () => {
    setGeneratingToken(true);
    setGeneratedUrl(null);

    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Erro ao gerar token');
        return;
      }

      setGeneratedUrl(data.url);
      await fetchCliente(); // Atualizar dados
    } catch {
      alert('Erro de conexão');
    } finally {
      setGeneratingToken(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado!');
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(dateStr));
  };

  const googleMapsUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
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

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cliente não encontrado</p>
        <Link href="/admin/clientes" className="btn-primary text-sm mt-4 inline-block">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/admin/clientes" className="hover:text-primary-600 transition-colors">
          Clientes
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 dark:text-white">{cliente.nome}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <span className="text-xl font-bold text-primary-700 dark:text-primary-400">
              {cliente.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {cliente.nome}
              <span className={cliente.status === 'VERIFICADO' ? 'badge-verificado' : 'badge-pendente'}>
                {cliente.status === 'VERIFICADO' ? '✓ Verificado' : '⏳ Pendente'}
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{cliente.telefone}</p>
          </div>
        </div>

        {cliente.status === 'PENDENTE' && (
          <button
            onClick={handleGenerateToken}
            disabled={generatingToken}
            className="btn-primary text-sm flex items-center gap-2 w-fit"
          >
            {generatingToken ? 'Gerando...' : '🔗 Gerar Link de Verificação'}
          </button>
        )}
      </div>

      {/* Link gerado */}
      {generatedUrl && (
        <div className="card border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
          <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
            Link de verificação gerado!
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-green-100 dark:bg-green-900/30 rounded px-3 py-2 break-all text-green-700 dark:text-green-400">
              {generatedUrl}
            </code>
            <button
              onClick={() => copyToClipboard(generatedUrl)}
              className="btn-success text-xs py-2 px-3 flex-shrink-0"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      {/* Informações do cliente */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Nome</p>
            <p className="text-gray-900 dark:text-white font-medium">{cliente.nome}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Telefone</p>
            <p className="text-gray-900 dark:text-white font-medium">{cliente.telefone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</p>
            <span className={cliente.status === 'VERIFICADO' ? 'badge-verificado' : 'badge-pendente'}>
              {cliente.status === 'VERIFICADO' ? '✓ Verificado' : '⏳ Pendente'}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Cadastrado em</p>
            <p className="text-gray-900 dark:text-white font-medium">{formatDate(cliente.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Verificações */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Verificações ({cliente.verificacoes.length})
        </h2>

        {cliente.verificacoes.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Nenhuma verificação realizada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cliente.verificacoes.map((v) => (
              <div key={v.id} className="border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Foto */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Foto</p>
                    <div className="w-full max-w-xs rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={v.foto}
                        alt="Foto de verificação"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>

                  {/* Dados */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Data e Hora</p>
                      <p className="text-gray-900 dark:text-white font-medium">{formatDate(v.createdAt)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Localização</p>
                      {v.endereco && (
                        <div className="mb-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                              {v.endereco}
                            </p>
                          </div>
                        </div>
                      )}
                      <p className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {v.latitude.toFixed(6)}, {v.longitude.toFixed(6)}
                      </p>
                      <a
                        href={googleMapsUrl(v.latitude, v.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ver no Google Maps
                      </a>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">IP</p>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">{v.ip}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Navegador</p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs break-all">{v.userAgent}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tokens gerados */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tokens de Verificação ({cliente.tokens.length})
        </h2>

        {cliente.tokens.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum token gerado</p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800">
                  <th className="text-left px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th className="text-left px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Expiração</th>
                  <th className="text-left px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {cliente.tokens.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">
                      {t.token.substring(0, 16)}...
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(t.expiracao)}
                    </td>
                    <td className="px-6 py-3">
                      {t.usado ? (
                        <span className="inline-flex items-center text-xs text-gray-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5" />
                          Usado
                        </span>
                      ) : new Date(t.expiracao) < new Date() ? (
                        <span className="inline-flex items-center text-xs text-red-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5" />
                          Expirado
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-green-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />
                          Ativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
