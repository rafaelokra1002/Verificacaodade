// API de Cercas Virtuais (Geofencing)
// GET /api/cercas?filhoId=xxx - Listar cercas de um filho
// POST /api/cercas - Criar nova cerca
// PUT /api/cercas?id=xxx - Atualizar cerca
// DELETE /api/cercas?id=xxx - Remover cerca

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
    const filhoId = searchParams.get('filhoId');

    if (!filhoId) return errorResponse('filhoId é obrigatório', 400);

    // Verificar que o filho pertence ao responsável
    const filho = await prisma.filho.findUnique({
      where: { id: filhoId, responsavelId: admin.userId },
    });
    if (!filho) return errorResponse('Filho(a) não encontrado(a)', 404);

    const cercas = await prisma.cercaVirtual.findMany({
      where: { filhoId },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ cercas });
  } catch (error) {
    console.error('Erro ao listar cercas:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) return errorResponse('Não autenticado', 401);

    const body = await request.json();
    const { filhoId, nome, latitude, longitude, raio } = body;

    if (!filhoId || !nome || latitude === undefined || longitude === undefined || !raio) {
      return errorResponse('Todos os campos são obrigatórios: filhoId, nome, latitude, longitude, raio', 400);
    }

    // Verificar que o filho pertence ao responsável
    const filho = await prisma.filho.findUnique({
      where: { id: filhoId, responsavelId: admin.userId },
    });
    if (!filho) return errorResponse('Filho(a) não encontrado(a)', 404);

    const cerca = await prisma.cercaVirtual.create({
      data: {
        filhoId,
        nome,
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        raio: parseFloat(String(raio)),
      },
    });

    await prisma.logAcesso.create({
      data: {
        acao: 'CRIAR_CERCA',
        detalhes: `Cerca "${nome}" criada para ${filho.nome}`,
        userId: admin.userId,
      },
    });

    return successResponse({ cerca }, 201);
  } catch (error) {
    console.error('Erro ao criar cerca:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) return errorResponse('Não autenticado', 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('id é obrigatório', 400);

    const body = await request.json();
    const { nome, latitude, longitude, raio, ativa } = body;

    const cerca = await prisma.cercaVirtual.findUnique({
      where: { id },
      include: { filho: true },
    });

    if (!cerca || cerca.filho.responsavelId !== admin.userId) {
      return errorResponse('Cerca não encontrada', 404);
    }

    const updated = await prisma.cercaVirtual.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(latitude !== undefined && { latitude: parseFloat(String(latitude)) }),
        ...(longitude !== undefined && { longitude: parseFloat(String(longitude)) }),
        ...(raio !== undefined && { raio: parseFloat(String(raio)) }),
        ...(ativa !== undefined && { ativa }),
      },
    });

    return successResponse({ cerca: updated });
  } catch (error) {
    console.error('Erro ao atualizar cerca:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) return errorResponse('Não autenticado', 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('id é obrigatório', 400);

    const cerca = await prisma.cercaVirtual.findUnique({
      where: { id },
      include: { filho: true },
    });

    if (!cerca || cerca.filho.responsavelId !== admin.userId) {
      return errorResponse('Cerca não encontrada', 404);
    }

    await prisma.cercaVirtual.delete({ where: { id } });

    return successResponse({ message: 'Cerca removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover cerca:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
