// Funções utilitárias gerais do sistema - Controle Parental

import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';

/** Gerar token único para link de check-in */
export function generateCheckinToken(): string {
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
export async function saveBase64Image(base64Data: string, _filhoId: string): Promise<string> {
  if (base64Data.startsWith('data:image/')) {
    return base64Data;
  }
  return `data:image/jpeg;base64,${base64Data}`;
}

/** Verificar se um token de check-in é válido */
export function isTokenValid(expiracao: Date, usado: boolean): { valid: boolean; reason?: string } {
  if (usado) {
    return { valid: false, reason: 'Este link já foi utilizado.' };
  }

  if (new Date() > new Date(expiracao)) {
    return { valid: false, reason: 'Este link expirou.' };
  }

  return { valid: true };
}

/**
 * Calcular distância entre dois pontos geográficos (fórmula Haversine)
 * Retorna distância em metros
 */
export function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Verificar se coordenadas estão dentro de uma cerca virtual */
export function dentroDoPerimetro(
  lat: number, lng: number,
  cercaLat: number, cercaLng: number, raio: number
): boolean {
  const distancia = calcularDistancia(lat, lng, cercaLat, cercaLng);
  return distancia <= raio;
}

/** Mapear dia da semana para enum */
export function getDiaSemanaAtual(): string {
  const dias = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
  return dias[new Date().getDay()];
}

/** Formatar hora atual HH:mm */
export function getHoraAtual(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Resposta padronizada de erro */
export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

/** Resposta padronizada de sucesso */
export function successResponse(data: unknown, status: number = 200) {
  return Response.json(data, { status });
}
