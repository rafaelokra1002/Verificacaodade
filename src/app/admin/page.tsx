'use client';

// Dashboard principal do admin
// Exibe resumo com estatísticas e lista recente de clientes

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalClientes: number;
  pendentes: number;
  verificados: number;
}

interface ClienteResumo {
  id: string;
  nome: string;
  telefone: string;
  status: 'PENDENTE' | 'VERIFICADO';
  createdAt: string;
  verificacoes: Array<{
    id: string;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ totalClientes: 0, pendentes: 0, verificados: 0 });
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/clientes');
      const data = await response.json();

      if (response.ok) {
        const lista = data.clientes as ClienteResumo[];
        setClientes(lista);
        setStats({
          totalClientes: lista.length,
          pendentes: lista.filter((c) => c.status === 'PENDENTE').length,
          verificados: lista.filter((c) => c.status === 'VERIFICADO').length,
        });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visão geral do sistema</p>
        </div>
        <Link href="/admin/clientes" className="btn-primary text-sm">
          Gerenciar Clientes
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total de Clientes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClientes}</p>
          </div>
        </div>

        {/* Pendentes */}
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
          </div>
        </div>

        {/* Verificados */}
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Verificados</p>
            <p className="text-2xl font-bold text-green-600">{stats.verificados}</p>
          </div>
        </div>
      </div>

      {/* Lista recente de clientes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Clientes Recentes</h2>
          <Link href="/admin/clientes" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver todos →
          </Link>
        </div>

        {clientes.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Nenhum cliente cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {clientes.slice(0, 10).map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-900 dark:text-white">
                      {cliente.nome}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                      {cliente.telefone}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={cliente.status === 'VERIFICADO' ? 'badge-verificado' : 'badge-pendente'}>
                        {cliente.status === 'VERIFICADO' ? '✓ Verificado' : '⏳ Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(cliente.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/admin/clientes/${cliente.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Detalhes
                      </Link>
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
