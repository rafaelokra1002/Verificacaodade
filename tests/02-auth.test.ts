// Teste 2: Autenticação do administrador
// Verifica login, sessão e logout

import {
  section, test, assert, assertEqual,
  request, authenticatedRequest, loginAdmin, colors,
  ADMIN_CREDENTIALS,
} from './config';

export async function testAutenticacao(): Promise<void> {
  section('Autenticação do Admin');

  // 1. Login com credenciais inválidas
  await test('Rejeita credenciais inválidas', async () => {
    const { status, data } = await request('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ email: 'errado@test.com', password: 'senhaerrada' }),
    });
    assertEqual(status, 401, 'Status code');
    assert(!!data.error, 'Deveria retornar erro');
  });

  // 2. Login sem campos obrigatórios
  await test('Rejeita login sem email/senha', async () => {
    const { status, data } = await request('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ email: '' }),
    });
    assertEqual(status, 400, 'Status code');
    assert(!!data.error, 'Deveria retornar erro');
  });

  // 3. Login com credenciais válidas
  let adminCookie = '';
  await test('Login com credenciais válidas retorna sucesso', async () => {
    adminCookie = await loginAdmin();
    assert(adminCookie.includes('admin_token='), 'Cookie deveria conter admin_token');
  });

  // 4. Verificar sessão autenticada
  await test('GET /api/auth retorna dados do admin autenticado', async () => {
    const { status, data } = await authenticatedRequest('/api/auth', adminCookie);
    assertEqual(status, 200, 'Status code');
    const user = data.user as Record<string, unknown>;
    assert(!!user, 'Deveria retornar user');
    assertEqual(user.email, ADMIN_CREDENTIALS.email, 'Email do admin');
    assert(!!user.nome, 'Admin deveria ter nome');
  });

  // 5. Acesso sem autenticação
  await test('GET /api/auth sem cookie retorna 401', async () => {
    const { status } = await request('/api/auth');
    assertEqual(status, 401, 'Status code');
  });

  // 6. Logout
  await test('POST /api/auth?action=logout realiza logout', async () => {
    const { status, data } = await authenticatedRequest(
      '/api/auth?action=logout',
      adminCookie,
      { method: 'POST' }
    );
    assertEqual(status, 200, 'Status code');
    assert(!!data.message, 'Deveria retornar mensagem de sucesso');
  });

  console.log(`  ${colors.dim}(6 testes de autenticação)${colors.reset}`);
}
