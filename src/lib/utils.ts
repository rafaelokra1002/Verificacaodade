// Funções utilitárias gerais do sistema

import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';

/** Gerar token único para link de verificação */
export function generateVerificationToken(): string {
  return uuidv4();
}

/** Obter IP do usuário a partir do request */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return '127.0.0.1';
}

/** Obter User-Agent do request */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'Desconhecido';
}

/** Formatar data para exibição */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

/** Gerar link do Google Maps a partir de coordenadas */
export function googleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** Calcular data de expiração do token */
export function getTokenExpiration(): Date {
  const hours = parseInt(process.env.TOKEN_EXPIRATION_HOURS || '1', 10);
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + hours);
  return expiration;
}

/** Processar imagem base64 para armazenamento */
export async function saveBase64Image(base64Data: string, _clienteId: string): Promise<string> {
  // Em produção (Vercel), o filesystem é read-only, então armazenamos como base64 no banco
  // Garantir que o prefixo data URI esteja presente
  if (base64Data.startsWith('data:image/')) {
    return base64Data;
  }
  // Se veio sem prefixo, adicionar
  return `data:image/jpeg;base64,${base64Data}`;
}

/** Verificar se um token de verificação é válido */
export function isTokenValid(expiracao: Date, usado: boolean): { valid: boolean; reason?: string } {
  if (usado) {
    return { valid: false, reason: 'Este link já foi utilizado.' };
  }

  if (new Date() > new Date(expiracao)) {
    return { valid: false, reason: 'Este link expirou.' };
  }

  return { valid: true };
}

/** Resposta padronizada de erro */
export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

/** Resposta padronizada de sucesso */
export function successResponse(data: unknown, status: number = 200) {
  return Response.json(data, { status });
}
