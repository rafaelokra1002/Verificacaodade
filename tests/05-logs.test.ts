// Teste 5: Logs de Acesso
// Verifica se as ações estão sendo registradas

import {
  section, test, assert, assertEqual,
  authenticatedRequest, request, loginAdmin, colors,
} from './config';

export async function testLogs(): Promise<void> {
  section('Logs de Acesso');

  const cookie = await loginAdmin();

  // 1. Listar logs sem autenticação
  await test('GET /api/logs sem auth retorna 401', async () => {
    const { status } = await request('/api/logs');
    assertEqual(status, 401, 'Status code');
  });

  // 2. Listar logs autenticado
  await test('GET /api/logs retorna lista de logs', async () => {
    const { status, data } = await authenticatedRequest('/api/logs', cookie);
    assertEqual(status, 200, 'Status code');
    const logs = data.logs as unknown[];
    assert(Array.isArray(logs), 'Logs deveria ser array');
    assert(logs.length > 0, 'Deveria ter pelo menos 1 log (login)');
  });

  // 3. Verificar que login foi logado
  await test('Login é registrado nos logs', async () => {
    const { data } = await authenticatedRequest('/api/logs', cookie);
    const logs = data.logs as Array<Record<string, unknown>>;
    const loginLog = logs.find((l) => l.acao === 'LOGIN');
    assertExists(loginLog, 'Log de LOGIN');
  });

  // 4. Logs têm campos necessários
  await test('Logs contêm campos obrigatórios', async () => {
    const { data } = await authenticatedRequest('/api/logs', cookie);
    const logs = data.logs as Array<Record<string, unknown>>;
    const log = logs[0];
    assertExists(log.id, 'ID do log');
    assertExists(log.acao, 'Ação');
    assertExists(log.createdAt, 'Data de criação');
  });

  // 5. Limitar quantidade de logs
  await test('GET /api/logs?limit=2 limita resultados', async () => {
    const { status, data } = await authenticatedRequest('/api/logs?limit=2', cookie);
    assertEqual(status, 200, 'Status code');
    const logs = data.logs as unknown[];
    assert(logs.length <= 2, `Deveria ter no máximo 2 logs, tem ${logs.length}`);
  });

  console.log(`  ${colors.dim}(5 testes de logs)${colors.reset}`);
}

function assertExists(value: unknown, label: string): void {
  if (value === null || value === undefined) {
    throw new Error(`${label}: valor é ${value}`);
  }
}
