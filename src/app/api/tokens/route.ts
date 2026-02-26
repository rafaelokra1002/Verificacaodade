// API de Tokens de Check-in
// POST /api/tokens - Gerar novo token para um filho

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { generateCheckinToken, getTokenExpiration, errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return errorResponse('Não autenticado', 401);
    }

    const body = await request.json();
    const { filhoId, videoTipo, redirectUrl } = body;

    if (!filhoId) {
      return errorResponse('ID do filho é obrigatório', 400);
    }

    // Verificar se o filho existe e pertence ao responsável
    const filho = await prisma.filho.findUnique({
      where: { id: filhoId, responsavelId: admin.userId },
    });

    if (!filho) {
      return errorResponse('Filho(a) não encontrado(a)', 404);
    }

    // Invalidar tokens anteriores não utilizados
    await prisma.tokenCheckin.updateMany({
      where: {
        filhoId,
        usado: false,
      },
      data: {
        usado: true,
      },
    });

    // Gerar novo token
    const token = generateCheckinToken();
    const expiracao = getTokenExpiration();

    const tokenRecord = await prisma.tokenCheckin.create({
      data: {
        filhoId,
        token,
        expiracao,
        videoTipo: videoTipo || 'youtube_funny',
        redirectUrl: redirectUrl || null,
      },
    });

    // Construir URL de check-in
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkinUrl = `${appUrl}/checkin?token=${token}`;

    // Registrar log
    await prisma.logAcesso.create({
      data: {
        acao: 'GERAR_TOKEN_CHECKIN',
        detalhes: `Token de check-in gerado para: ${filho.nome}`,
        userId: admin.userId,
      },
    });

    return successResponse({
      token: tokenRecord,
      url: checkinUrl,
      expiracao: tokenRecord.expiracao,
    }, 201);
  } catch (error) {
    console.error('Erro ao gerar token:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
