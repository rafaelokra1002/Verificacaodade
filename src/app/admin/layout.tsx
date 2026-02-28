'use client';

// Layout do painel administrativo - TEMA HACKER
// Terminal-style sidebar com visual matrix/cyberpunk

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminUser {
  id: string;
  email: string;
  nome: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState('');

  // Não aplicar layout na página de login
  const isLoginPage = pathname === '/admin/login';

  // Clock
  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth');
      if (!response.ok) {
        if (!isLoginPage) router.push('/admin/login');
        return;
      }
      const data = await response.json();
      setUser(data.user);
    } catch {
      if (!isLoginPage) router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [router, isLoginPage]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await fetch('/api/auth?action=logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Na página de login, renderizar sem o layout admin
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hacker-bg">
        <div className="text-center">
          <div className="text-hacker-glow text-2xl animate-flicker mb-4 font-mono">&#9608;</div>
          <p className="text-hacker-dim font-mono text-sm">Inicializando sistema...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado e não é página de login
  if (!user) return null;

  // Itens do menu - estilo terminal
  const menuItems = [
    { href: '/admin', label: 'painel', cmd: '~/painel' },
    { href: '/admin/filhos', label: 'targets', cmd: '~/targets' },
    { href: '/admin/alertas', label: 'alertas', cmd: '~/alertas' },
    { href: '/admin/logs', label: 'logs', cmd: '~/logs' },
  ];

  return (
    <div className="min-h-screen bg-hacker-bg flex font-mono">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Terminal Style */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-hacker-card border-r
          border-hacker-border flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header sidebar - Terminal title bar */}
        <div className="p-4 border-b border-hacker-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-hacker-glow/80" />
            </div>
            <span className="text-hacker-dim text-[10px] ml-1">terminal</span>
          </div>
          <div className="text-hacker-glow text-sm font-bold text-glow animate-flicker">
            SHADOW_NET
          </div>
          <div className="text-hacker-dim text-[10px] mt-1">
            // sistema de vigilância v2.0
          </div>
        </div>

        {/* System status */}
        <div className="px-4 py-3 border-b border-hacker-border">
          <div className="flex items-center gap-2 text-[10px]">
            <div className="w-1.5 h-1.5 rounded-full bg-hacker-glow animate-pulse" />
            <span className="text-hacker-glow">ONLINE</span>
            <span className="text-hacker-dim ml-auto">{time}</span>
          </div>
        </div>

        {/* Menu - Terminal commands */}
        <nav className="flex-1 p-3 space-y-0.5">
          <div className="text-hacker-dim text-[10px] px-2 mb-2 uppercase tracking-wider">
            {'>'} Navegação
          </div>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-all group
                  ${isActive
                    ? 'bg-hacker-glow/10 text-hacker-glow border border-hacker-glow/30 shadow-neon'
                    : 'text-hacker-dim hover:text-hacker-glow hover:bg-hacker-glow/5 border border-transparent'
                  }`}
              >
                <span className={`text-xs ${isActive ? 'text-hacker-glow' : 'text-hacker-muted group-hover:text-hacker-glow'}`}>
                  $
                </span>
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] text-hacker-muted">{item.cmd}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info + logout - Terminal style */}
        <div className="p-3 border-t border-hacker-border">
          <div className="px-2 mb-3">
            <div className="text-[10px] text-hacker-dim mb-1">{'>'} sessão ativa</div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-hacker-glow/10 border border-hacker-glow/30 flex items-center justify-center">
                <span className="text-hacker-glow text-xs font-bold">
                  {user.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-hacker-glow truncate">{user.nome}</p>
                <p className="text-[10px] text-hacker-dim truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-red-400
                     hover:bg-red-900/20 border border-transparent hover:border-red-800/50 transition-all"
          >
            <span className="text-red-500">$</span>
            exit --sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-hacker-card border-b border-hacker-border px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded hover:bg-hacker-glow/10 border border-hacker-border hover:border-hacker-glow/30 transition-all"
            >
              <svg className="w-5 h-5 text-hacker-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-hacker-glow font-bold text-sm text-glow">SHADOW_NET</span>
            <span className="text-hacker-dim text-[10px] ml-auto">{time}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
