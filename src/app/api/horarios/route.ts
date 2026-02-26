// API de Horários Programados
// GET /api/horarios?filhoId=xxx - Listar horários
// POST /api/horarios - Criar novo horário
// DELETE /api/horarios?id=xxx - Remover horário

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

    const filho = await prisma.filho.findUnique({
      where: { id: filhoId, responsavelId: admin.userId },
    });
    if (!filho) return errorResponse('Filho(a) não encontrado(a)', 404);

    const horarios = await prisma.horarioProgramado.findMany({
      where: { filhoId },
      orderBy: [{ diaSemana: 'asc' }, { horario: 'asc' }],
    });

    return successResponse({ horarios });
  } catch (error) {
    console.error('Erro ao listar horários:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) return errorResponse('Não autenticado', 401);

    const body = await request.json();
    const { filhoId, diaSemana, horario } = body;

    if (!filhoId || !diaSemana || !horario) {
      return errorResponse('filhoId, diaSemana e horario são obrigatórios', 400);
    }

    const diasValidos = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
    if (!diasValidos.includes(diaSemana)) {
      return errorResponse('Dia da semana inválido', 400);
    }

    // Validar formato do horário
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!horaRegex.test(horario)) {
      return errorResponse('Horário deve estar no formato HH:mm', 400);
    }

    const filho = await prisma.filho.findUnique({
      where: { id: filhoId, responsavelId: admin.userId },
    });
    if (!filho) return errorResponse('Filho(a) não encontrado(a)', 404);

    // Verificar duplicata
    const existente = await prisma.horarioProgramado.findFirst({
      where: { filhoId, diaSemana: diaSemana as any, horario },
    });
    if (existente) return errorResponse('Já existe um horário programado para este dia e hora', 400);

    const horarioProgramado = await prisma.horarioProgramado.create({
      data: {
        filhoId,
        diaSemana: diaSemana as any,
        horario,
      },
    });

    return successResponse({ horario: horarioProgramado }, 201);
  } catch (error) {
    console.error('Erro ao criar horário:', error);
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

    const horario = await prisma.horarioProgramado.findUnique({
      where: { id },
      include: { filho: true },
    });

    if (!horario || horario.filho.responsavelId !== admin.userId) {
      return errorResponse('Horário não encontrado', 404);
    }

    await prisma.horarioProgramado.delete({ where: { id } });

    return successResponse({ message: 'Horário removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover horário:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
