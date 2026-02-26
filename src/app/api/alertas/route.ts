// API de Alertas
// GET /api/alertas - Listar alertas do responsável
// PUT /api/alertas?action=marcar-lido&id=xxx - Marcar alerta como lido
// PUT /api/alertas?action=marcar-todos - Marcar todos como lidos

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) return errorResponse('Não autenticado', 401);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const apenasNaoLidos = searchParams.get('naoLidos') === 'true';

    // Buscar filhos do responsável
    const filhos = await prisma.filho.findMany({
      where: { responsavelId: admin.userId },
      select: { id: true },
    });
    const filhoIds = filhos.map(f => f.id);

    const where: Record<string, unknown> = {
      filhoId: { in: filhoIds },
    };
    if (apenasNaoLidos) {
      where.lido = false;
    }

    const alertas = await prisma.alerta.findMany({
      where,
      include: {
        filho: { select: { nome: true } },
        checkin: {
          select: { latitude: true, longitude: true, endereco: true, foto: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const totalNaoLidos = await prisma.alerta.count({
      where: {
        filhoId: { in: filhoIds },
        lido: false,
      },
    });

    return successResponse({ alertas, totalNaoLidos });
  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) return errorResponse('Não autenticado', 401);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'marcar-todos') {
      const filhos = await prisma.filho.findMany({
        where: { responsavelId: admin.userId },
        select: { id: true },
      });
      const filhoIds = filhos.map(f => f.id);

      await prisma.alerta.updateMany({
        where: { filhoId: { in: filhoIds }, lido: false },
        data: { lido: true },
      });

      return successResponse({ message: 'Todos os alertas foram marcados como lidos' });
    }

    if (action === 'marcar-lido') {
      const id = searchParams.get('id');
      if (!id) return errorResponse('id é obrigatório', 400);

      const alerta = await prisma.alerta.findUnique({
        where: { id },
        include: { filho: true },
      });

      if (!alerta || alerta.filho.responsavelId !== admin.userId) {
        return errorResponse('Alerta não encontrado', 404);
      }

      await prisma.alerta.update({
        where: { id },
        data: { lido: true },
      });

      return successResponse({ message: 'Alerta marcado como lido' });
    }

    return errorResponse('Ação inválida', 400);
  } catch (error) {
    console.error('Erro ao atualizar alerta:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
