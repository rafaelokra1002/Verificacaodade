// Teste 1: Conexão com banco de dados e servidor
// Verifica se o servidor está respondendo e se o banco está acessível

import { BASE_URL, section, test, assert, colors } from './config';

export async function testConexao(): Promise<void> {
  section('Conexão & Saúde do Sistema');

  // 1. Servidor respondendo
  await test('Servidor Next.js está online', async () => {
    const response = await fetch(BASE_URL, { redirect: 'manual' });
    // A raiz redireciona para /admin/login (307) — isso é comportamento esperado
    assert(
      response.status >= 200 && response.status < 500,
      `Servidor retornou status ${response.status}`
    );
  });

  // 2. Página de login acessível
  await test('Página /admin/login está acessível', async () => {
    const response = await fetch(`${BASE_URL}/admin/login`);
    assert(response.status === 200, `Status: ${response.status}`);
    const html = await response.text();
    assert(html.includes('Painel Administrativo'), 'Página não contém texto esperado');
  });

  // 3. Página de verificação acessível
  await test('Página /verificar está acessível', async () => {
    const response = await fetch(`${BASE_URL}/verificar`);
    assert(response.status === 200, `Status: ${response.status}`);
    const html = await response.text();
    assert(html.includes('Verificação'), 'Página não contém texto esperado');
  });

  // 4. Middleware protegendo rotas admin
  await test('Middleware redireciona /admin sem autenticação', async () => {
    const response = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
    assert(
      response.status === 307 || response.status === 302,
      `Esperado redirect (307/302), recebeu ${response.status}`
    );
    const location = response.headers.get('location');
    assert(
      location !== null && location.includes('/admin/login'),
      `Redirect deveria ir para /admin/login, foi para: ${location}`
    );
  });

  // 5. APIs retornam JSON
  await test('API /api/auth retorna JSON', async () => {
    const response = await fetch(`${BASE_URL}/api/auth`);
    const contentType = response.headers.get('content-type');
    assert(
      contentType !== null && contentType.includes('application/json'),
      `Content-Type esperado application/json, recebeu: ${contentType}`
    );
  });

  console.log(`  ${colors.dim}(5 testes de conexão)${colors.reset}`);
}
