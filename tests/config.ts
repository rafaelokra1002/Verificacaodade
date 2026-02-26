// Configuração base para os testes
// Define a URL do servidor e credenciais de teste

export const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

export const ADMIN_CREDENTIALS = {
  email: 'admin@sistema.com',
  password: 'admin123',
};

// Cores para output no terminal
export const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

// Contadores globais
export const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [] as string[],
};

/** Helper para fazer requests */
export async function request(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; data: Record<string, unknown> }> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  let data: Record<string, unknown> = {};
  try {
    data = await response.json();
  } catch {
    // Algumas respostas podem não ter body JSON
  }

  return { status: response.status, data };
}

/** Helper para fazer request autenticado (com cookie) */
export async function authenticatedRequest(
  path: string,
  cookie: string,
  options: RequestInit = {}
): Promise<{ status: number; data: Record<string, unknown> }> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      ...options.headers,
    },
  });

  let data: Record<string, unknown> = {};
  try {
    data = await response.json();
  } catch {
    // Algumas respostas podem não ter body JSON
  }

  return { status: response.status, data };
}

/** Fazer login e retornar o cookie de sessão */
export async function loginAdmin(): Promise<string> {
  const url = `${BASE_URL}/api/auth`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMIN_CREDENTIALS),
    redirect: 'manual',
  });

  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('Login falhou: nenhum cookie retornado');
  }

  // Extrair o cookie admin_token
  const match = setCookie.match(/admin_token=([^;]+)/);
  if (!match) {
    throw new Error('Login falhou: cookie admin_token não encontrado');
  }

  return `admin_token=${match[1]}`;
}

/** Executar um teste e registrar resultado */
export async function test(name: string, fn: () => Promise<void>): Promise<void> {
  stats.total++;
  try {
    await fn();
    stats.passed++;
    console.log(`  ${colors.green}✓${colors.reset} ${name}`);
  } catch (error) {
    stats.failed++;
    const msg = error instanceof Error ? error.message : String(error);
    stats.errors.push(`${name}: ${msg}`);
    console.log(`  ${colors.red}✗${colors.reset} ${name}`);
    console.log(`    ${colors.dim}${msg}${colors.reset}`);
  }
}

/** Assertion simples */
export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/** Assert igualdade */
export function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${JSON.stringify(expected)}, recebeu ${JSON.stringify(actual)}`);
  }
}

/** Assert que valor existe (não é null/undefined) */
export function assertExists(value: unknown, label: string): void {
  if (value === null || value === undefined) {
    throw new Error(`${label}: valor é ${value}`);
  }
}

/** Imprimir header de seção de testes */
export function section(name: string): void {
  console.log(`\n${colors.cyan}${colors.bold}▸ ${name}${colors.reset}`);
}

/** Imprimir resumo final */
export function printSummary(): void {
  console.log(`\n${colors.bold}${'─'.repeat(50)}${colors.reset}`);
  console.log(`${colors.bold}  RESUMO DOS TESTES${colors.reset}`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`  Total:    ${stats.total}`);
  console.log(`  ${colors.green}Passou:   ${stats.passed}${colors.reset}`);

  if (stats.failed > 0) {
    console.log(`  ${colors.red}Falhou:   ${stats.failed}${colors.reset}`);
    console.log(`\n${colors.red}${colors.bold}  FALHAS:${colors.reset}`);
    stats.errors.forEach((err, i) => {
      console.log(`  ${colors.red}${i + 1}. ${err}${colors.reset}`);
    });
  }

  console.log(`${'─'.repeat(50)}\n`);

  if (stats.failed > 0) {
    console.log(`${colors.red}${colors.bold}  ✗ ALGUNS TESTES FALHARAM${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}  ✓ TODOS OS TESTES PASSARAM!${colors.reset}\n`);
    process.exit(0);
  }
}
