// API de Cliente individual
// GET /api/clientes/[id] - Detalhes do cliente
// PUT /api/clientes/[id] - Atualizar cliente
// DELETE /api/clientes/[id] - Remover cliente

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

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        verificacoes: {
          orderBy: { createdAt: 'desc' },
        },
        tokens: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cliente) {
      return errorResponse('Cliente não encontrado', 404);
    }

    return successResponse({ cliente });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
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
    const { nome, telefone } = body;

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(telefone && { telefone }),
      },
    });

    return successResponse({ cliente });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
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

    await prisma.cliente.delete({ where: { id } });

    // Registrar log
    await prisma.logAcesso.create({
      data: {
        acao: 'REMOVER_CLIENTE',
        detalhes: `Admin removeu cliente ID: ${id}`,
        userId: admin.userId,
      },
    });

    return successResponse({ message: 'Cliente removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover cliente:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
