// API de Filhos (CRUD)
// GET /api/filhos - Listar filhos do responsável
// POST /api/filhos - Cadastrar novo filho

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
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {
      responsavelId: admin.userId,
    };

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
      ];
    }

    const filhos = await prisma.filho.findMany({
      where,
      include: {
        checkins: {
          select: {
            id: true,
            createdAt: true,
            foto: true,
            latitude: true,
            longitude: true,
            endereco: true,
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
        cercas: {
          where: { ativa: true },
          select: { id: true, nome: true },
        },
        horarios: {
          where: { ativo: true },
          select: { id: true, diaSemana: true, horario: true },
        },
        _count: {
          select: {
            checkins: true,
            tokens: true,
            alertas: true,
            cercas: true,
          },
        },
        alertas: {
          where: { lido: false },
          select: { id: true, tipo: true, mensagem: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ filhos });
  } catch (error) {
    console.error('Erro ao listar filhos:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return errorResponse('Não autenticado', 401);
    }

    const body = await request.json();
    const { nome, idade, dispositivo } = body;

    if (!nome) {
      return errorResponse('Nome é obrigatório', 400);
    }

    const filho = await prisma.filho.create({
      data: {
        nome,
        idade: idade ? parseInt(idade, 10) : null,
        dispositivo: dispositivo || null,
        responsavelId: admin.userId,
      },
    });

    await prisma.logAcesso.create({
      data: {
        acao: 'CADASTRAR_FILHO',
        detalhes: `Cadastrou filho(a): ${nome}`,
        userId: admin.userId,
      },
    });

    return successResponse({ filho }, 201);
  } catch (error) {
    console.error('Erro ao cadastrar filho:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
