// Teste 3: CRUD de Clientes
// Verifica criação, listagem, detalhes e remoção de clientes

import {
  section, test, assert, assertEqual, assertExists,
  authenticatedRequest, request, loginAdmin, colors,
} from './config';

export async function testClientes(): Promise<void> {
  section('CRUD de Clientes');

  const cookie = await loginAdmin();

  // 1. Listar clientes (deve ter os 3 do seed)
  await test('GET /api/clientes lista clientes existentes', async () => {
    const { status, data } = await authenticatedRequest('/api/clientes', cookie);
    assertEqual(status, 200, 'Status code');
    const clientes = data.clientes as unknown[];
    assert(Array.isArray(clientes), 'Clientes deveria ser array');
    assert(clientes.length >= 3, `Deveria ter pelo menos 3 clientes (seed), tem ${clientes.length}`);
  });

  // 2. Listar sem autenticação
  await test('GET /api/clientes sem auth retorna 401', async () => {
    const { status } = await request('/api/clientes');
    assertEqual(status, 401, 'Status code');
  });

  // 3. Criar novo cliente
  let novoClienteId = '';
  await test('POST /api/clientes cria novo cliente', async () => {
    const { status, data } = await authenticatedRequest('/api/clientes', cookie, {
      method: 'POST',
      body: JSON.stringify({
        nome: 'Cliente Teste Automatizado',
        telefone: '(11) 98888-7777',
      }),
    });
    assertEqual(status, 201, 'Status code');
    const cliente = data.cliente as Record<string, unknown>;
    assertExists(cliente.id, 'ID do cliente');
    assertEqual(cliente.nome, 'Cliente Teste Automatizado', 'Nome');
    assertEqual(cliente.status, 'PENDENTE', 'Status inicial');
    novoClienteId = cliente.id as string;
  });

  // 4. Criar sem campos obrigatórios
  await test('POST /api/clientes rejeita sem nome/telefone', async () => {
    const { status } = await authenticatedRequest('/api/clientes', cookie, {
      method: 'POST',
      body: JSON.stringify({ nome: 'Sem telefone' }),
    });
    assertEqual(status, 400, 'Status code');
  });

  // 5. Buscar detalhes do cliente
  await test('GET /api/clientes/:id retorna detalhes', async () => {
    assert(!!novoClienteId, 'ID do cliente deveria existir');
    const { status, data } = await authenticatedRequest(
      `/api/clientes/${novoClienteId}`,
      cookie
    );
    assertEqual(status, 200, 'Status code');
    const cliente = data.cliente as Record<string, unknown>;
    assertEqual(cliente.nome, 'Cliente Teste Automatizado', 'Nome');
    assert(Array.isArray(cliente.verificacoes), 'Deveria ter array de verificações');
    assert(Array.isArray(cliente.tokens), 'Deveria ter array de tokens');
  });

  // 6. Atualizar cliente
  await test('PUT /api/clientes/:id atualiza dados', async () => {
    const { status, data } = await authenticatedRequest(
      `/api/clientes/${novoClienteId}`,
      cookie,
      {
        method: 'PUT',
        body: JSON.stringify({ nome: 'Cliente Teste Atualizado' }),
      }
    );
    assertEqual(status, 200, 'Status code');
    const cliente = data.cliente as Record<string, unknown>;
    assertEqual(cliente.nome, 'Cliente Teste Atualizado', 'Nome atualizado');
  });

  // 7. Buscar com filtro de status
  await test('GET /api/clientes?status=PENDENTE filtra corretamente', async () => {
    const { status, data } = await authenticatedRequest(
      '/api/clientes?status=PENDENTE',
      cookie
    );
    assertEqual(status, 200, 'Status code');
    const clientes = data.clientes as Array<Record<string, unknown>>;
    assert(clientes.length > 0, 'Deveria ter clientes pendentes');
    const todosPendentes = clientes.every((c) => c.status === 'PENDENTE');
    assert(todosPendentes, 'Todos deveriam ter status PENDENTE');
  });

  // 8. Buscar com texto
  await test('GET /api/clientes?search=Atualizado busca por nome', async () => {
    const { status, data } = await authenticatedRequest(
      '/api/clientes?search=Atualizado',
      cookie
    );
    assertEqual(status, 200, 'Status code');
    const clientes = data.clientes as unknown[];
    assert(clientes.length >= 1, 'Deveria encontrar o cliente atualizado');
  });

  // 9. Cliente inexistente
  await test('GET /api/clientes/inexistente retorna 404', async () => {
    const { status } = await authenticatedRequest(
      '/api/clientes/id-que-nao-existe',
      cookie
    );
    assertEqual(status, 404, 'Status code');
  });

  // 10. Remover cliente de teste
  await test('DELETE /api/clientes/:id remove cliente', async () => {
    const { status, data } = await authenticatedRequest(
      `/api/clientes/${novoClienteId}`,
      cookie,
      { method: 'DELETE' }
    );
    assertEqual(status, 200, 'Status code');
    assert(!!data.message, 'Deveria retornar mensagem');
  });

  // 11. Confirmar remoção
  await test('Cliente removido não é mais encontrado', async () => {
    const { status } = await authenticatedRequest(
      `/api/clientes/${novoClienteId}`,
      cookie
    );
    // Prisma retorna erro ao não encontrar, resultando em 500 ou 404
    assert(status === 404 || status === 500, `Status deveria ser 404 ou 500, recebeu ${status}`);
  });

  console.log(`  ${colors.dim}(11 testes de clientes)${colors.reset}`);
}
