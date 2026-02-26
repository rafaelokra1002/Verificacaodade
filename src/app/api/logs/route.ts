// API de Logs de Acesso
// GET /api/logs - Listar logs (somente admin)

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return errorResponse('Não autenticado', 401);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await prisma.logAcesso.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return successResponse({ logs });
  } catch (error) {
    console.error('Erro ao listar logs:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
