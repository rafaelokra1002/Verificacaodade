'use client';

// Página de gerenciamento de clientes
// CRUD completo + geração de tokens de verificação

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';

interface ClienteItem {
  id: string;
  nome: string;
  telefone: string;
  status: 'PENDENTE' | 'VERIFICADO';
  createdAt: string;
  verificacoes: Array<{ id: string; createdAt: string; foto: string; latitude: number; longitude: number }>;
  tokens: Array<{ id: string; token: string; expiracao: string; usado: boolean }>;
  _count: { verificacoes: number; tokens: number };
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [generatedLink, setGeneratedLink] = useState<{ clienteId: string; url: string } | null>(null);
  const [editableUrl, setEditableUrl] = useState('');
  const [linkImage, setLinkImage] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (filterStatus) params.set('status', filterStatus);

      const response = await fetch(`/api/clientes?${params}`);
      const data = await response.json();
      if (response.ok) {
        setClientes(data.clientes);
      }
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar com debounce
  useEffect(() => {
    const timeout = setTimeout(() => fetchClientes(), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus]);

  const handleCreateCliente = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, telefone }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Erro ao criar cliente');
        return;
      }

      setNome('');
      setTelefone('');
      setShowCreateForm(false);
      await fetchClientes();
    } catch {
      setError('Erro de conexão');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateToken = async (clienteId: string) => {
    setGeneratingToken(clienteId);
    setGeneratedLink(null);

    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Erro ao gerar token');
        return;
      }

      setGeneratedLink({ clienteId, url: data.url });
      setEditableUrl(data.url);
      setLinkImage(null);
      setCopied(false);
    } catch {
      alert('Erro de conexão');
    } finally {
      setGeneratingToken(null);
    }
  };

  const handleDeleteCliente = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja remover o cliente "${nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchClientes();
      } else {
        alert('Erro ao remover cliente');
      }
    } catch {
      alert('Erro de conexão');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLinkImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Gerencie clientes e gere links de verificação
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary text-sm flex items-center gap-2 w-fit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Cliente
        </button>
      </div>

      {/* Formulário de criação */}
      {showCreateForm && (
        <div className="card border-primary-200 dark:border-primary-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Cadastrar Novo Cliente</h3>
          <form onSubmit={handleCreateCliente} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-0000"
                  required
                  className="input-field"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="btn-primary text-sm">
                {creating ? 'Criando...' : 'Criar Cliente'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setError(''); }}
                className="btn-secondary text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="input-field"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field w-full sm:w-48"
        >
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="VERIFICADO">Verificado</option>
        </select>
      </div>

      {/* Link gerado */}
      {generatedLink && (
        <div className="card border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                Link de verificação gerado com sucesso!
              </p>

              {/* Link editável */}
              <div className="mt-2">
                <label className="block text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                  URL do link (editável):
                </label>
                <input
                  type="text"
                  value={editableUrl}
                  onChange={(e) => setEditableUrl(e.target.value)}
                  className="w-full text-xs font-mono bg-white dark:bg-zinc-800 border border-green-300 dark:border-green-700 rounded-md px-3 py-2 text-green-800 dark:text-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Upload de imagem para preview do link */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                  Imagem de preview (aparece ao compartilhar o link):
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer text-xs bg-white dark:bg-zinc-800 border border-green-300 dark:border-green-700 hover:border-green-500 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {linkImage ? 'Trocar imagem' : 'Escolher imagem'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {linkImage && (
                    <button
                      onClick={() => setLinkImage(null)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remover
                    </button>
                  )}
                </div>
                {linkImage && (
                  <div className="mt-2 relative">
                    <img
                      src={linkImage}
                      alt="Preview do link"
                      className="w-full max-w-md h-32 object-cover rounded-md border border-green-300 dark:border-green-700"
                    />
                  </div>
                )}
              </div>

              {/* Preview simulado de como o link aparece no WhatsApp/redes sociais */}
              <div className="mt-3">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Preview ao compartilhar:</p>
                <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden max-w-sm shadow-sm">
                  {linkImage && (
                    <img
                      src={linkImage}
                      alt="OG preview"
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {(() => { try { return new URL(editableUrl).hostname; } catch { return 'link'; } })()}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                      Verificação de Identidade
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Complete sua verificação de identidade de forma rápida e segura.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => copyToClipboard(editableUrl)}
                  className={`text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                    copied
                      ? 'bg-green-800 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copiado!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditableUrl(generatedLink.url);
                    setCopied(false);
                  }}
                  className="text-xs text-green-700 dark:text-green-400 hover:underline"
                >
                  Restaurar original
                </button>
                <button
                  onClick={() => setGeneratedLink(null)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de clientes */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <svg className="w-8 h-8 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : clientes.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-2">Nenhum cliente encontrado</p>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary text-sm">
            Cadastrar primeiro cliente
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {clientes.map((cliente) => (
            <div key={cliente.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Info do cliente */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {cliente.nome}
                    </h3>
                    <span className={cliente.status === 'VERIFICADO' ? 'badge-verificado' : 'badge-pendente'}>
                      {cliente.status === 'VERIFICADO' ? '✓ Verificado' : '⏳ Pendente'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {cliente.telefone}
                    </span>
                    <span>Criado: {formatDate(cliente.createdAt)}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/clientes/${cliente.id}`}
                    className="btn-secondary text-xs py-2 px-3"
                  >
                    Detalhes
                  </Link>

                  {cliente.status === 'PENDENTE' && (
                    <button
                      onClick={() => handleGenerateToken(cliente.id)}
                      disabled={generatingToken === cliente.id}
                      className="btn-primary text-xs py-2 px-3 flex items-center gap-1"
                    >
                      {generatingToken === cliente.id ? (
                        'Gerando...'
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Gerar Link
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteCliente(cliente.id, cliente.nome)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remover cliente"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
