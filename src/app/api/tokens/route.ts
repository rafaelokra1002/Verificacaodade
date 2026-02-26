// API de Tokens de Verificação
// POST /api/tokens - Gerar novo token para um cliente

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { generateVerificationToken, getTokenExpiration, errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return errorResponse('Não autenticado', 401);
    }

    const body = await request.json();
    const { clienteId } = body;

    if (!clienteId) {
      return errorResponse('ID do cliente é obrigatório', 400);
    }

    // Verificar se o cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return errorResponse('Cliente não encontrado', 404);
    }

    // Verificar se o cliente já foi verificado
    if (cliente.status === 'VERIFICADO') {
      return errorResponse('Este cliente já foi verificado', 400);
    }

    // Invalidar tokens anteriores não utilizados
    await prisma.tokenVerificacao.updateMany({
      where: {
        clienteId,
        usado: false,
      },
      data: {
        usado: true,
      },
    });

    // Gerar novo token
    const token = generateVerificationToken();
    const expiracao = getTokenExpiration();

    const tokenRecord = await prisma.tokenVerificacao.create({
      data: {
        clienteId,
        token,
        expiracao,
      },
    });

    // Construir URL de verificação
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verificar?token=${token}`;

    // Registrar log
    await prisma.logAcesso.create({
      data: {
        acao: 'GERAR_TOKEN',
        detalhes: `Token gerado para cliente: ${cliente.nome}`,
        userId: admin.userId,
      },
    });

    return successResponse({
      token: tokenRecord,
      url: verificationUrl,
      expiracao: tokenRecord.expiracao,
    }, 201);
  } catch (error) {
    console.error('Erro ao gerar token:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
