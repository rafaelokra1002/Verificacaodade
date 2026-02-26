// API de Clientes (CRUD)
// GET /api/clientes - Listar todos os clientes
// POST /api/clientes - Criar novo cliente

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return errorResponse('Não autenticado', 401);
    }

    // Parâmetros de busca
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Construir filtro
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { telefone: { contains: search } },
      ];
    }

    if (status && (status === 'PENDENTE' || status === 'VERIFICADO')) {
      where.status = status;
    }

    // Buscar clientes com contagem de verificações e tokens
    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        verificacoes: {
          select: {
            id: true,
            createdAt: true,
            foto: true,
            latitude: true,
            longitude: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        tokens: {
          select: {
            id: true,
            token: true,
            expiracao: true,
            usado: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            verificacoes: true,
            tokens: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ clientes });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return errorResponse('Não autenticado', 401);
    }

    const body = await request.json();
    const { nome, telefone } = body;

    if (!nome || !telefone) {
      return errorResponse('Nome e telefone são obrigatórios', 400);
    }

    // Criar cliente
    const cliente = await prisma.cliente.create({
      data: { nome, telefone },
    });

    // Registrar log
    await prisma.logAcesso.create({
      data: {
        acao: 'CRIAR_CLIENTE',
        detalhes: `Admin criou cliente: ${nome}`,
        userId: admin.userId,
      },
    });

    return successResponse({ cliente }, 201);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
