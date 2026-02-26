// API de Verificação de Identidade
// POST /api/verificacao - Receber foto + localização do cliente

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getClientIP,
  getUserAgent,
  saveBase64Image,
  isTokenValid,
  errorResponse,
  successResponse,
} from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, foto, latitude, longitude } = body;

    // Validar campos obrigatórios
    if (!token) {
      return errorResponse('Token de verificação é obrigatório', 400);
    }
    if (!foto) {
      return errorResponse('Foto é obrigatória', 400);
    }
    if (latitude === undefined || longitude === undefined) {
      return errorResponse('Localização é obrigatória', 400);
    }

    // Buscar token no banco
    const tokenRecord = await prisma.tokenVerificacao.findUnique({
      where: { token },
      include: { cliente: true },
    });

    if (!tokenRecord) {
      return errorResponse('Link de verificação inválido', 404);
    }

    // Validar token (não usado e não expirado)
    const validacao = isTokenValid(tokenRecord.expiracao, tokenRecord.usado);
    if (!validacao.valid) {
      return errorResponse(validacao.reason || 'Link inválido', 400);
    }

    // Verificar se o cliente já possui verificação
    const verificacaoExistente = await prisma.verificacao.findFirst({
      where: { clienteId: tokenRecord.clienteId },
    });

    if (verificacaoExistente) {
      return errorResponse('Este cliente já foi verificado anteriormente', 400);
    }

    // Salvar a foto como base64
    const fotoPath = await saveBase64Image(foto, tokenRecord.clienteId);

    // Obter dados do request
    const ip = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Geocodificação reversa - obter endereço a partir das coordenadas
    let endereco: string | null = null;
    try {
      const lat = parseFloat(String(latitude));
      const lng = parseFloat(String(longitude));
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'User-Agent': 'VerificacaoIdentidade/1.0' },
        }
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.address) {
          const a = geoData.address;
          const parts = [];
          // Rua e número
          if (a.road) {
            let rua = a.road;
            if (a.house_number) rua += `, ${a.house_number}`;
            parts.push(rua);
          }
          // Bairro
          if (a.suburb || a.neighbourhood) {
            parts.push(a.suburb || a.neighbourhood);
          }
          // Cidade
          if (a.city || a.town || a.village || a.municipality) {
            parts.push(a.city || a.town || a.village || a.municipality);
          }
          // Estado
          if (a.state) {
            parts.push(a.state);
          }
          // CEP
          if (a.postcode) {
            parts.push(`CEP: ${a.postcode}`);
          }
          endereco = parts.join(' - ');
        }
      }
    } catch (geoErr) {
      console.error('Erro na geocodificação reversa:', geoErr);
      // Não bloquear a verificação se geocoding falhar
    }

    // Criar verificação e atualizar token/cliente em uma transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar registro de verificação
      const verificacao = await tx.verificacao.create({
        data: {
          clienteId: tokenRecord.clienteId,
          foto: fotoPath,
          latitude: parseFloat(String(latitude)),
          longitude: parseFloat(String(longitude)),
          endereco,
          ip,
          userAgent,
        },
      });

      // Marcar token como usado
      await tx.tokenVerificacao.update({
        where: { id: tokenRecord.id },
        data: { usado: true },
      });

      // Atualizar status do cliente para VERIFICADO
      await tx.cliente.update({
        where: { id: tokenRecord.clienteId },
        data: { status: 'VERIFICADO' },
      });

      // Registrar log de acesso
      await tx.logAcesso.create({
        data: {
          acao: 'VERIFICACAO_IDENTIDADE',
          detalhes: `Cliente ${tokenRecord.cliente.nome} realizou verificação de identidade`,
          ip,
          userAgent,
        },
      });

      return verificacao;
    });

    return successResponse({
      message: 'Verificação realizada com sucesso!',
      verificacaoId: resultado.id,
    }, 201);
  } catch (error) {
    console.error('Erro na verificação:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return errorResponse(`Erro interno do servidor: ${message}`, 500);
  }
}

// GET /api/verificacao?token=xxx - Validar se o token é válido (sem enviar dados)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return errorResponse('Token é obrigatório', 400);
    }

    const tokenRecord = await prisma.tokenVerificacao.findUnique({
      where: { token },
      include: {
        cliente: {
          select: { id: true, nome: true, status: true },
        },
      },
    });

    if (!tokenRecord) {
      return errorResponse('Link de verificação inválido', 404);
    }

    const validacao = isTokenValid(tokenRecord.expiracao, tokenRecord.usado);

    return successResponse({
      valid: validacao.valid,
      reason: validacao.reason,
      cliente: validacao.valid ? {
        nome: tokenRecord.cliente.nome,
      } : undefined,
    });
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
