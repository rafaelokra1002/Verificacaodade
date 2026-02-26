// Teste 4: Tokens de Verificação e Fluxo de Verificação completo
// Verifica geração de tokens, validação e envio de verificação

import {
  section, test, assert, assertEqual, assertExists,
  authenticatedRequest, request, loginAdmin, colors,
} from './config';

export async function testVerificacao(): Promise<void> {
  section('Tokens & Fluxo de Verificação');

  const cookie = await loginAdmin();

  // Criar um cliente de teste para o fluxo completo
  let clienteId = '';
  await test('Setup: criar cliente para verificação', async () => {
    const { status, data } = await authenticatedRequest('/api/clientes', cookie, {
      method: 'POST',
      body: JSON.stringify({
        nome: 'Cliente Verificação Test',
        telefone: '(11) 91111-2222',
      }),
    });
    assertEqual(status, 201, 'Status code');
    clienteId = (data.cliente as Record<string, unknown>).id as string;
    assertExists(clienteId, 'Cliente ID');
  });

  // 1. Gerar token sem autenticação
  await test('POST /api/tokens sem auth retorna 401', async () => {
    const { status } = await request('/api/tokens', {
      method: 'POST',
      body: JSON.stringify({ clienteId }),
    });
    assertEqual(status, 401, 'Status code');
  });

  // 2. Gerar token sem clienteId
  await test('POST /api/tokens sem clienteId retorna 400', async () => {
    const { status } = await authenticatedRequest('/api/tokens', cookie, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assertEqual(status, 400, 'Status code');
  });

  // 3. Gerar token para cliente inexistente
  await test('POST /api/tokens para cliente inexistente retorna 404', async () => {
    const { status } = await authenticatedRequest('/api/tokens', cookie, {
      method: 'POST',
      body: JSON.stringify({ clienteId: 'id-falso-inexistente' }),
    });
    assertEqual(status, 404, 'Status code');
  });

  // 4. Gerar token válido
  let tokenValue = '';
  let verificationUrl = '';
  await test('POST /api/tokens gera token com sucesso', async () => {
    const { status, data } = await authenticatedRequest('/api/tokens', cookie, {
      method: 'POST',
      body: JSON.stringify({ clienteId }),
    });
    assertEqual(status, 201, 'Status code');
    assertExists(data.token, 'Token object');
    assertExists(data.url, 'URL de verificação');
    assertExists(data.expiracao, 'Data de expiração');

    const tokenObj = data.token as Record<string, unknown>;
    tokenValue = tokenObj.token as string;
    verificationUrl = data.url as string;
    assert(tokenValue.length > 10, 'Token deveria ter pelo menos 10 caracteres');
    assert(verificationUrl.includes('/verificar?token='), 'URL deveria conter /verificar?token=');
  });

  // 5. Validar token via GET
  await test('GET /api/verificacao?token=xxx valida token existente', async () => {
    const { status, data } = await request(`/api/verificacao?token=${tokenValue}`);
    assertEqual(status, 200, 'Status code');
    assertEqual(data.valid, true, 'Token deveria ser válido');
    const cliente = data.cliente as Record<string, unknown>;
    assertExists(cliente, 'Dados do cliente');
    assertEqual(cliente.nome, 'Cliente Verificação Test', 'Nome do cliente');
  });

  // 6. Validar token inexistente
  await test('GET /api/verificacao?token=falso retorna inválido', async () => {
    const { status } = await request('/api/verificacao?token=token-que-nao-existe');
    assertEqual(status, 404, 'Status code');
  });

  // 7. Validar sem token
  await test('GET /api/verificacao sem token retorna 400', async () => {
    const { status } = await request('/api/verificacao');
    assertEqual(status, 400, 'Status code');
  });

  // 8. Enviar verificação sem campos obrigatórios
  await test('POST /api/verificacao sem foto retorna 400', async () => {
    const { status } = await request('/api/verificacao', {
      method: 'POST',
      body: JSON.stringify({
        token: tokenValue,
        latitude: -23.5505,
        longitude: -46.6333,
      }),
    });
    assertEqual(status, 400, 'Status code');
  });

  // 9. Enviar verificação com token inválido
  await test('POST /api/verificacao com token inválido retorna 404', async () => {
    const { status } = await request('/api/verificacao', {
      method: 'POST',
      body: JSON.stringify({
        token: 'token-invalido-abc123',
        foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        latitude: -23.5505,
        longitude: -46.6333,
      }),
    });
    assertEqual(status, 404, 'Status code');
  });

  // 10. Enviar verificação completa com sucesso
  // Usando uma imagem base64 mínima válida (1x1 pixel JPEG)
  const miniJpegBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=';

  await test('POST /api/verificacao envia verificação com sucesso', async () => {
    const { status, data } = await request('/api/verificacao', {
      method: 'POST',
      body: JSON.stringify({
        token: tokenValue,
        foto: miniJpegBase64,
        latitude: -23.5505199,
        longitude: -46.6333094,
      }),
    });
    assertEqual(status, 201, 'Status code');
    assert(!!data.message, 'Deveria retornar mensagem de sucesso');
    assertExists(data.verificacaoId, 'ID da verificação');
  });

  // 11. Token marcado como usado (não pode reutilizar)
  await test('Token usado não pode ser reutilizado', async () => {
    const { status, data } = await request(`/api/verificacao?token=${tokenValue}`);
    assertEqual(status, 200, 'Status code');
    assertEqual(data.valid, false, 'Token deveria ser inválido');
    assert(
      typeof data.reason === 'string' && (data.reason as string).toLowerCase().includes('utilizado'),
      'Motivo deveria mencionar que já foi utilizado'
    );
  });

  // 12. Múltiplo envio bloqueado
  await test('Múltiplo envio para mesmo token é bloqueado', async () => {
    const { status } = await request('/api/verificacao', {
      method: 'POST',
      body: JSON.stringify({
        token: tokenValue,
        foto: miniJpegBase64,
        latitude: -23.5505,
        longitude: -46.6333,
      }),
    });
    assertEqual(status, 400, 'Status code');
  });

  // 13. Verificar que o status do cliente mudou
  await test('Cliente atualizado para VERIFICADO após verificação', async () => {
    const { status, data } = await authenticatedRequest(
      `/api/clientes/${clienteId}`,
      cookie
    );
    assertEqual(status, 200, 'Status code');
    const cliente = data.cliente as Record<string, unknown>;
    assertEqual(cliente.status, 'VERIFICADO', 'Status do cliente');
  });

  // 14. Verificar que a verificação foi gravada
  await test('Verificação aparece nos detalhes do cliente', async () => {
    const { status, data } = await authenticatedRequest(
      `/api/clientes/${clienteId}`,
      cookie
    );
    assertEqual(status, 200, 'Status code');
    const cliente = data.cliente as Record<string, unknown>;
    const verificacoes = cliente.verificacoes as Array<Record<string, unknown>>;
    assert(verificacoes.length === 1, `Deveria ter 1 verificação, tem ${verificacoes.length}`);
    assertExists(verificacoes[0].foto, 'Foto');
    assertExists(verificacoes[0].latitude, 'Latitude');
    assertExists(verificacoes[0].longitude, 'Longitude');
    assertExists(verificacoes[0].ip, 'IP');
  });

  // 15. Gerar token para cliente já verificado deve falhar
  await test('Não permite gerar token para cliente já verificado', async () => {
    const { status } = await authenticatedRequest('/api/tokens', cookie, {
      method: 'POST',
      body: JSON.stringify({ clienteId }),
    });
    assertEqual(status, 400, 'Status code');
  });

  // Cleanup: remover cliente de teste
  await test('Cleanup: remover cliente de teste', async () => {
    const { status } = await authenticatedRequest(
      `/api/clientes/${clienteId}`,
      cookie,
      { method: 'DELETE' }
    );
    assertEqual(status, 200, 'Status code');
  });

  console.log(`  ${colors.dim}(16 testes de verificação)${colors.reset}`);
}
