// API de Autenticação do Responsável
// POST /api/auth - Login / Logout
// GET /api/auth - Verificar sessão

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken, setAuthCookie, getAuthenticatedAdmin, removeAuthCookie } from '@/lib/auth';
import { errorResponse, successResponse, getClientIP, getUserAgent } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // Logout
    if (action === 'logout') {
      await removeAuthCookie();
      return successResponse({ message: 'Logout realizado com sucesso' });
    }

    // Login
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email e senha são obrigatórios', 400);
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse('Credenciais inválidas', 401);
    }

    // Verificar senha
    const senhaValida = await verifyPassword(password, user.password);
    if (!senhaValida) {
      return errorResponse('Credenciais inválidas', 401);
    }

    // Gerar token JWT
    const token = generateToken({ userId: user.id, email: user.email });

    // Definir cookie
    await setAuthCookie(token);

    // Registrar log de acesso
    await prisma.logAcesso.create({
      data: {
        acao: 'LOGIN',
        detalhes: `Responsável ${user.nome} fez login`,
        ip: getClientIP(request),
        userAgent: getUserAgent(request),
        userId: user.id,
      },
    });

    return successResponse({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!admin) {
      return errorResponse('Não autenticado', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: admin.userId },
      select: { id: true, email: true, nome: true },
    });

    if (!user) {
      return errorResponse('Usuário não encontrado', 404);
    }

    return successResponse({ user });
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
