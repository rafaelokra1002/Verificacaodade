// API de Check-in de Localização
// POST /api/checkin - Filho envia foto + localização
// GET /api/checkin?token=xxx - Validar token

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getClientIP,
  getUserAgent,
  parseUserAgent,
  saveBase64Image,
  isTokenValid,
  dentroDoPerimetro,
  errorResponse,
  successResponse,
} from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, foto, latitude, longitude, tela, bateria, carregando, rede, idioma, timezone } = body;

    if (!token) {
      return errorResponse('Token de check-in é obrigatório', 400);
    }
    if (!foto) {
      return errorResponse('Foto é obrigatória', 400);
    }
    if (latitude === undefined || longitude === undefined) {
      return errorResponse('Localização é obrigatória', 400);
    }

    // Buscar token no banco
    const tokenRecord = await prisma.tokenCheckin.findUnique({
      where: { token },
      include: {
        filho: {
          include: {
            cercas: { where: { ativa: true } },
          },
        },
      },
    });

    if (!tokenRecord) {
      return errorResponse('Link de check-in inválido', 404);
    }

    const validacao = isTokenValid(tokenRecord.expiracao, tokenRecord.usado);
    if (!validacao.valid) {
      return errorResponse(validacao.reason || 'Link inválido', 400);
    }

    // Salvar a foto
    const fotoPath = await saveBase64Image(foto, tokenRecord.filhoId);

    const ip = getClientIP(request);
    const userAgent = getUserAgent(request);

    const lat = parseFloat(String(latitude));
    const lng = parseFloat(String(longitude));

    // Geocodificação reversa
    let endereco: string | null = null;
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'ControleParental/1.0' } }
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.address) {
          const a = geoData.address;
          const parts = [];
          if (a.road) {
            let rua = a.road;
            if (a.house_number) rua += `, ${a.house_number}`;
            parts.push(rua);
          }
          if (a.suburb || a.neighbourhood) {
            parts.push(a.suburb || a.neighbourhood);
          }
          if (a.city || a.town || a.village || a.municipality) {
            parts.push(a.city || a.town || a.village || a.municipality);
          }
          if (a.state) parts.push(a.state);
          if (a.postcode) parts.push(`CEP: ${a.postcode}`);
          endereco = parts.join(' - ');
        }
      }
    } catch (geoErr) {
      console.error('Erro na geocodificação reversa:', geoErr);
    }

    // Verificar cercas virtuais
    const alertasFora: { cercaNome: string }[] = [];
    for (const cerca of tokenRecord.filho.cercas) {
      if (!dentroDoPerimetro(lat, lng, cerca.latitude, cerca.longitude, cerca.raio)) {
        alertasFora.push({ cercaNome: cerca.nome });
      }
    }

    // Transação: criar check-in + alertas + marcar token
    const resultado = await prisma.$transaction(async (tx) => {
      // Parsear plataforma e navegador do User-Agent
      const { plataforma, navegador } = parseUserAgent(userAgent);

      const checkin = await tx.checkin.create({
        data: {
          filhoId: tokenRecord.filhoId,
          foto: fotoPath,
          latitude: lat,
          longitude: lng,
          endereco,
          ip,
          userAgent,
          plataforma,
          navegador,
          tela: tela || null,
          bateria: bateria !== undefined ? parseInt(String(bateria), 10) : null,
          carregando: carregando !== undefined ? Boolean(carregando) : null,
          rede: rede || null,
          idioma: idioma || null,
          timezone: timezone || null,
        },
      });

      // Marcar token como usado
      await tx.tokenCheckin.update({
        where: { id: tokenRecord.id },
        data: { usado: true },
      });

      // Alerta de check-in realizado
      await tx.alerta.create({
        data: {
          filhoId: tokenRecord.filhoId,
          tipo: 'CHECKIN_REALIZADO',
          mensagem: `${tokenRecord.filho.nome} fez check-in${endereco ? ` em ${endereco}` : ''}`,
          checkinId: checkin.id,
        },
      });

      // Alertas de fora da cerca
      for (const fora of alertasFora) {
        await tx.alerta.create({
          data: {
            filhoId: tokenRecord.filhoId,
            tipo: 'FORA_CERCA',
            mensagem: `⚠️ ${tokenRecord.filho.nome} está FORA da cerca "${fora.cercaNome}"`,
            checkinId: checkin.id,
          },
        });
      }

      // Log
      await tx.logAcesso.create({
        data: {
          acao: 'CHECKIN_REALIZADO',
          detalhes: `${tokenRecord.filho.nome} realizou check-in`,
          ip,
          userAgent,
        },
      });

      return checkin;
    });

    return successResponse({
      message: 'Check-in realizado com sucesso!',
      checkinId: resultado.id,
      foraPerimetro: alertasFora.length > 0,
      cercasVioladas: alertasFora.map(a => a.cercaNome),
    }, 201);
  } catch (error) {
    console.error('Erro no check-in:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return errorResponse(`Erro interno do servidor: ${message}`, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return errorResponse('Token é obrigatório', 400);
    }

    const tokenRecord = await prisma.tokenCheckin.findUnique({
      where: { token },
      include: {
        filho: {
          select: { id: true, nome: true },
        },
      },
    });

    if (!tokenRecord) {
      return errorResponse('Link de check-in inválido', 404);
    }

    const validacao = isTokenValid(tokenRecord.expiracao, tokenRecord.usado);

    return successResponse({
      valid: validacao.valid,
      reason: validacao.reason,
      videoTipo: tokenRecord.videoTipo || 'youtube_funny',
      redirectUrl: tokenRecord.redirectUrl || null,
      filho: validacao.valid ? {
        nome: tokenRecord.filho.nome,
      } : undefined,
    });
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}
