// API de Filho individual
// GET /api/filhos/[id] - Detalhes do filho
// PUT /api/filhos/[id] - Atualizar filho
// DELETE /api/filhos/[id] - Remover filho

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return errorResponse('Não autenticado', 401);
    }

    const { id } = await params;

    const filho = await prisma.filho.findUnique({
      where: { id, responsavelId: admin.userId },
      include: {
        checkins: {
          orderBy: { createdAt: 'desc' },
        },
        tokens: {
          orderBy: { createdAt: 'desc' },
        },
        cercas: {
          orderBy: { createdAt: 'desc' },
        },
        horarios: {
          orderBy: { diaSemana: 'asc' },
        },
        alertas: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            checkin: {
              select: { latitude: true, longitude: true, endereco: true },
            },
          },
        },
      },
    });

    if (!filho) {
      return errorResponse('Filho(a) não encontrado(a)', 404);
    }

    return successResponse({ filho });
  } catch (error) {
    console.error('Erro ao buscar filho:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return errorResponse('Não autenticado', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { nome, idade, dispositivo, ativo } = body;

    const filho = await prisma.filho.update({
      where: { id, responsavelId: admin.userId },
      data: {
        ...(nome && { nome }),
        ...(idade !== undefined && { idade: idade ? parseInt(idade, 10) : null }),
        ...(dispositivo !== undefined && { dispositivo }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    return successResponse({ filho });
  } catch (error) {
    console.error('Erro ao atualizar filho:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return errorResponse('Não autenticado', 401);
    }

    const { id } = await params;

    await prisma.filho.delete({ where: { id, responsavelId: admin.userId } });

    await prisma.logAcesso.create({
      data: {
        acao: 'REMOVER_FILHO',
        detalhes: `Removeu filho(a) ID: ${id}`,
        userId: admin.userId,
      },
    });

    return successResponse({ message: 'Filho(a) removido(a) com sucesso' });
  } catch (error) {
    console.error('Erro ao remover filho:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
