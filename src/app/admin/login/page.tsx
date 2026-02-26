'use client';

// Página de Login - TEMA HACKER / Terminal

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootText, setBootText] = useState<string[]>([]);
  const [booted, setBooted] = useState(false);

  // Boot sequence effect
  useEffect(() => {
    const lines = [
      '> Inicializando CTRL_PARENTAL...',
      '> Carregando módulos de segurança...',
      '> Estabelecendo conexão criptografada...',
      '> Verificando integridade do sistema...',
      '> Sistema pronto. Aguardando autenticação.',
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < lines.length) {
        setBootText((prev) => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => setBooted(true), 300);
      }
    }, 400);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'ERRO: Credenciais inválidas');
        return;
      }

      router.push('/admin');
    } catch {
      setError('ERRO: Falha na conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hacker-bg flex items-center justify-center p-4 matrix-bg relative overflow-hidden">
      {/* Matrix rain background effect */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30'%3E%3Ctext x='5' y='20' fill='%2300ff41' font-size='14' font-family='monospace'%3E0%3C/text%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px',
        }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Boot sequence */}
        <div className={`mb-6 transition-all duration-500 ${booted ? 'opacity-40 max-h-20 overflow-hidden' : 'opacity-100'}`}>
          <div className="bg-hacker-card border border-hacker-border rounded p-4 font-mono text-xs">
            {bootText.map((line, i) => (
              <div key={i} className="text-hacker-dim leading-relaxed">
                {line}
                {i === bootText.length - 1 && !booted && (
                  <span className="inline-block w-2 h-3 bg-hacker-glow ml-1 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Terminal login box */}
        <div className={`transition-all duration-500 ${booted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Terminal title bar */}
          <div className="bg-hacker-surface border border-hacker-border border-b-0 rounded-t px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-hacker-glow/80" />
            </div>
            <span className="text-hacker-dim text-[10px] ml-2">root@ctrl_parental:~</span>
          </div>

          {/* Login form */}
          <div className="bg-hacker-card border border-hacker-border rounded-b p-6">
            <div className="text-center mb-6">
              <div className="text-hacker-glow text-3xl font-bold text-glow animate-flicker mb-2 tracking-wider">
                {'{>'} LOGIN
              </div>
              <div className="text-hacker-dim text-xs">
                // autenticação requerida
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs text-hacker-dim mb-1.5 font-mono">
                  <span className="text-hacker-glow">$</span> email:
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@system.com"
                  required
                  className="w-full px-4 py-2.5 rounded bg-hacker-input border border-hacker-border text-hacker-glow
                           placeholder-hacker-muted focus:outline-none focus:ring-1 focus:ring-hacker-glow
                           focus:border-hacker-glow transition-all font-mono text-sm caret-hacker-glow"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs text-hacker-dim mb-1.5 font-mono">
                  <span className="text-hacker-glow">$</span> senha:
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded bg-hacker-input border border-hacker-border text-hacker-glow
                           placeholder-hacker-muted focus:outline-none focus:ring-1 focus:ring-hacker-glow
                           focus:border-hacker-glow transition-all font-mono text-sm caret-hacker-glow"
                />
              </div>

              {error && (
                <div className="p-3 rounded bg-red-900/30 border border-red-800/50">
                  <p className="text-red-400 text-xs text-center font-mono">[!] {error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded bg-hacker-glow/10 hover:bg-hacker-glow/20 text-hacker-glow font-medium
                         transition-all duration-200 border border-hacker-glow/40 hover:border-hacker-glow
                         hover:shadow-neon disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 text-sm font-mono"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-3 h-3 border border-hacker-glow border-t-transparent rounded-full animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>{'>>'} Acessar Sistema</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-hacker-muted mt-6 font-mono">
          [CTRL_PARENTAL] // Acesso restrito // Todas as ações são registradas
        </p>
      </div>
    </div>
  );
}
