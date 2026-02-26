'use client';

// Página de Verificação de Identidade (acesso via link único)
// O cliente acessa esta página para tirar selfie e compartilhar localização

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

/** Estados possíveis do fluxo de verificação */
type VerificationStep =
  | 'loading'       // Validando token
  | 'invalid'       // Token inválido ou expirado
  | 'consent'       // Exibindo consentimento LGPD
  | 'camera'        // Capturando foto
  | 'review'        // Revisando foto capturada
  | 'location'      // Capturando localização
  | 'submitting'    // Enviando dados
  | 'success'       // Verificação concluída
  | 'error';        // Erro no processo

interface ClienteInfo {
  nome: string;
}

// Componente wrapper com Suspense para useSearchParams
export default function VerificarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    }>
      <VerificarContent />
    </Suspense>
  );
}

function VerificarContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Estados
  const [step, setStep] = useState<VerificationStep>('loading');
  const [cliente, setCliente] = useState<ClienteInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Validar token ao carregar a página
  useEffect(() => {
    if (!token) {
      setErrorMessage('Link de verificação inválido. Nenhum token fornecido.');
      setStep('invalid');
      return;
    }

    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /** Validar se o token é válido */
  const validateToken = async () => {
    try {
      const response = await fetch(`/api/verificacao?token=${token}`);
      const data = await response.json();

      if (!response.ok || !data.valid) {
        setErrorMessage(data.reason || data.error || 'Link de verificação inválido.');
        setStep('invalid');
        return;
      }

      setCliente(data.cliente);
      setStep('consent');
    } catch {
      setErrorMessage('Erro ao validar o link. Tente novamente.');
      setStep('invalid');
    }
  };

  /** Iniciar câmera do dispositivo */
  const startCamera = useCallback(async () => {
    try {
      setStep('camera');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Câmera frontal (selfie)
          width: { ideal: 480, max: 640 },
          height: { ideal: 360, max: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setErrorMessage(
        'Não foi possível acessar a câmera. Verifique as permissões do navegador e tente novamente.'
      );
      setStep('error');
    }
  }, []);

  /** Capturar foto da câmera */
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Limitar resolução máxima a 480x360 para manter base64 pequeno
    const maxW = 480;
    const maxH = 360;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > maxW || h > maxH) {
      const ratio = Math.min(maxW / w, maxH / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    canvas.width = w;
    canvas.height = h;

    // Espelhar a imagem (selfie)
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para base64 com qualidade reduzida
    const photoData = canvas.toDataURL('image/jpeg', 0.6);
    setPhoto(photoData);

    // Parar câmera
    stopCamera();
    setStep('review');
  };

  /** Parar stream da câmera */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  /** Refazer foto */
  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  /** Capturar localização do dispositivo */
  const captureLocation = () => {
    setStep('location');

    if (!navigator.geolocation) {
      setErrorMessage('Geolocalização não suportada pelo seu navegador.');
      setStep('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        // Enviar automaticamente após capturar localização
        submitVerification(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        console.error('Erro ao obter localização:', err);
        let msg = 'Não foi possível obter sua localização.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Permissão de localização negada. Habilite nas configurações do navegador.';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'Localização indisponível no momento.';
            break;
          case err.TIMEOUT:
            msg = 'Tempo esgotado ao obter localização. Tente novamente.';
            break;
        }
        setErrorMessage(msg);
        setStep('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  /** Enviar verificação para a API */
  const submitVerification = async (lat: number, lng: number) => {
    setStep('submitting');

    try {
      const payload = JSON.stringify({
        token,
        foto: photo,
        latitude: lat,
        longitude: lng,
      });

      // Verificar tamanho do payload (limite ~4MB no Vercel)
      const payloadSize = new Blob([payload]).size;
      console.log(`Tamanho do payload: ${(payloadSize / 1024).toFixed(1)}KB`);

      if (payloadSize > 4 * 1024 * 1024) {
        setErrorMessage('A foto é muito grande. Tente novamente com melhor iluminação.');
        setStep('error');
        return;
      }

      const response = await fetch('/api/verificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = { error: `Erro do servidor (${response.status})` };
      }

      if (!response.ok) {
        setErrorMessage(data.error || 'Erro ao enviar verificação.');
        setStep('error');
        return;
      }

      setStep('success');
    } catch (err) {
      console.error('Erro ao enviar:', err);
      setErrorMessage('Erro de conexão. Verifique sua internet e tente novamente.');
      setStep('error');
    }
  };

  // Limpar câmera ao desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verificação de Identidade
          </h1>
          {cliente && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Olá, <span className="font-medium text-gray-700 dark:text-gray-300">{cliente.nome}</span>
            </p>
          )}
        </div>

        {/* Card principal */}
        <div className="card">
          {/* LOADING - Validando token */}
          {step === 'loading' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4 animate-pulse">
                <svg className="w-6 h-6 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Validando seu link...</p>
            </div>
          )}

          {/* INVALID - Token inválido */}
          {step === 'invalid' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Link Inválido</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* CONSENT - Consentimento LGPD */}
          {step === 'consent' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Verificação Necessária
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Para validar sua identidade, precisamos capturar uma foto do seu rosto e sua localização atual.
                </p>
              </div>

              {/* Passos do processo */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Foto do rosto</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tire uma selfie para confirmação</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Localização</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Compartilhe sua localização atual</p>
                  </div>
                </div>
              </div>

              {/* Aviso LGPD */}
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>Aviso de Consentimento (LGPD):</strong> Ao continuar, você autoriza a coleta de
                    imagem e localização para verificação de identidade. Seus dados serão tratados de
                    acordo com a Lei Geral de Proteção de Dados.
                  </p>
                </div>
              </div>

              <button onClick={startCamera} className="btn-primary w-full text-center">
                Iniciar Verificação
              </button>
            </div>
          )}

          {/* CAMERA - Capturando foto */}
          {step === 'camera' && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Tire sua selfie
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Posicione seu rosto no centro da câmera
                </p>
              </div>

              {/* Preview da câmera */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Overlay com guia para posicionar o rosto */}
                {cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-60 border-2 border-white/50 rounded-[50%]" />
                  </div>
                )}

                {/* Loading da câmera */}
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <svg className="w-8 h-8 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="text-sm">Abrindo câmera...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Canvas oculto para captura */}
              <canvas ref={canvasRef} className="hidden" />

              <button
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Capturar Foto
              </button>
            </div>
          )}

          {/* REVIEW - Revisando foto */}
          {step === 'review' && photo && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Confira sua foto
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Certifique-se de que seu rosto está visível
                </p>
              </div>

              {/* Preview da foto */}
              <div className="rounded-xl overflow-hidden bg-black aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt="Sua selfie"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={retakePhoto} className="btn-secondary text-center">
                  Tirar Outra
                </button>
                <button onClick={captureLocation} className="btn-primary text-center">
                  Confirmar
                </button>
              </div>
            </div>
          )}

          {/* LOCATION - Capturando localização */}
          {step === 'location' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
                <svg className="w-6 h-6 text-primary-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Obtendo localização...
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Por favor, permita o acesso à sua localização
              </p>
            </div>
          )}

          {/* SUBMITTING - Enviando dados */}
          {step === 'submitting' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
                <svg className="w-6 h-6 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Enviando verificação...
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aguarde enquanto processamos seus dados
              </p>
            </div>
          )}

          {/* SUCCESS - Concluído */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Verificação Concluída!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Sua identidade foi registrada com sucesso. Você pode fechar esta página.
              </p>
              <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-medium">Identidade verificada</span>
              </div>
            </div>
          )}

          {/* ERROR - Erro */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ocorreu um erro
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{errorMessage}</p>
              <button
                onClick={() => {
                  setStep('consent');
                  setErrorMessage('');
                  setPhoto(null);
                  setLocation(null);
                }}
                className="btn-secondary"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Sistema de Verificação de Identidade &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
