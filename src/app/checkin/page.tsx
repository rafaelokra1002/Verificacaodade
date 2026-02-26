'use client';

// Página pública de check-in do filho - TEMA HACKER / Terminal
// Fluxo: Validar token → Consentimento → Câmera (selfie) → Revisão → Localização → Envio → Sucesso

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

type Step = 'loading' | 'invalid' | 'consent' | 'camera' | 'review' | 'location' | 'sending' | 'success' | 'error';

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-hacker-glow text-2xl animate-flicker mb-3 font-mono">&#9608;</div>
          <p className="text-hacker-dim text-sm font-mono">$ loading...</p>
        </div>
      </div>
    }>
      <CheckinContent />
    </Suspense>
  );
}

function CheckinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<Step>('loading');
  const [filhoNome, setFilhoNome] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState('');

  // Location
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState('');

  // Result
  const [foraPerimetro, setForaPerimetro] = useState(false);

  // Validar token
  useEffect(() => {
    if (!token) {
      setErrorMsg('Link inválido. Nenhum token fornecido.');
      setStep('invalid');
      return;
    }
    validateToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/checkin?token=${token}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setFilhoNome(data.filho?.nome || '');
        setStep('consent');
      } else {
        setErrorMsg(data.reason || data.error || 'Link inválido.');
        setStep('invalid');
      }
    } catch {
      setErrorMsg('Erro ao validar o link.');
      setStep('invalid');
    }
  };

  // Camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    setFoto(dataUrl);
    stopCamera();
    setStep('review');
  };

  const retakePhoto = () => {
    setFoto(null);
    setStep('camera');
    startCamera();
  };

  // Location
  const getLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada neste navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        submitCheckin(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError('Permissão de localização negada. Ative nas configurações do navegador.');
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError('Localização indisponível.');
            break;
          case err.TIMEOUT:
            setLocationError('Tempo esgotado ao obter localização.');
            break;
          default:
            setLocationError('Erro ao obter localização.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Submit
  const submitCheckin = async (lat: number, lng: number) => {
    setStep('sending');
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, foto, latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (res.ok) {
        setForaPerimetro(data.foraPerimetro || false);
        setStep('success');
      } else {
        setErrorMsg(data.error || 'Erro ao enviar check-in.');
        setStep('error');
      }
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.');
      setStep('error');
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect: start camera when step is 'camera'
  useEffect(() => {
    if (step === 'camera') startCamera();
  }, [step, startCamera]);

  // Effect: get location when step is 'location'
  useEffect(() => {
    if (step === 'location') getLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Terminal spinner
  const TerminalSpinner = ({ text }: { text: string }) => (
    <div className="text-center py-4">
      <div className="text-hacker-glow text-3xl animate-flicker mb-3 font-mono">&#9608;</div>
      <p className="text-hacker-dim text-sm font-mono">{text}</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-hacker-card border border-hacker-border rounded-none max-w-md w-full overflow-hidden shadow-neon font-mono">

        {/* Terminal title bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-hacker-surface border-b border-hacker-border">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-hacker-glow/80" />
          </div>
          <span className="text-[10px] text-hacker-dim ml-2">target@ctrl_parental:~/checkin</span>
        </div>

        {/* Loading */}
        {step === 'loading' && (
          <div className="p-8">
            <TerminalSpinner text="$ validando token..." />
          </div>
        )}

        {/* Invalid */}
        {step === 'invalid' && (
          <div className="p-8 text-center">
            <div className="text-red-400 text-4xl mb-4 font-mono">[DENIED]</div>
            <h2 className="text-lg font-bold text-red-400 mb-2 font-mono">{'>'} ACCESS_DENIED</h2>
            <p className="text-hacker-dim text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Consent */}
        {step === 'consent' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="text-hacker-glow text-3xl mb-3 font-mono text-glow">{'{>'}</div>
              <h2 className="text-lg font-bold text-hacker-glow font-mono">
                {'>'} target: {filhoNome || 'identificado'}
              </h2>
              <p className="text-hacker-dim mt-2 text-sm">
                // check-in solicitado pelo operador
              </p>
            </div>

            <div className="border border-cyan-800/50 bg-cyan-900/10 p-4 mb-4 text-sm text-cyan-400">
              <p className="font-bold mb-2 text-cyan-300">$ cat /proc/checkin/info</p>
              <ul className="space-y-1 text-cyan-400/80">
                <li>{'>'} captura de imagem (selfie)</li>
                <li>{'>'} coordenadas GPS atuais</li>
              </ul>
            </div>

            <div className="border border-hacker-border bg-hacker-surface p-3 mb-6 text-xs text-hacker-muted">
              <p>
                // ao prosseguir, seus dados de localização e imagem serão
                enviados ao operador para fins de monitoramento.
              </p>
            </div>

            <button onClick={() => setStep('camera')}
              className="w-full btn-primary py-3 text-base font-bold font-mono">
              {'>>>'} INICIAR CHECK-IN
            </button>
          </div>
        )}

        {/* Camera */}
        {step === 'camera' && (
          <div className="p-6">
            <h2 className="text-sm font-bold text-hacker-glow text-center mb-4 font-mono">
              $ capture --device=camera --mode=selfie
            </h2>

            {cameraError ? (
              <div className="text-center py-8">
                <div className="text-red-400 text-3xl mb-3 font-mono">[ERR]</div>
                <p className="text-red-400 text-sm mb-4">{cameraError}</p>
                <button onClick={startCamera} className="btn-primary text-sm font-mono">$ retry</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden bg-black aspect-[4/3] border border-hacker-border">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover hacker-video" />
                  {/* Scan line effect */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px)',
                    }} />
                  {/* Face guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-52 border border-hacker-glow/40 rounded-[50%]" />
                  </div>
                  {/* Corner markers */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-hacker-glow/60" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-hacker-glow/60" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-hacker-glow/60" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-hacker-glow/60" />
                </div>
                <p className="text-center text-xs text-hacker-dim">
                  // posicione o rosto no perímetro de captura
                </p>
                <button onClick={capturePhoto}
                  className="w-full btn-primary py-3 text-base font-bold font-mono">
                  [CAPTURE]
                </button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Review */}
        {step === 'review' && foto && (
          <div className="p-6">
            <h2 className="text-sm font-bold text-hacker-glow text-center mb-4 font-mono">
              $ review --preview
            </h2>
            <div className="overflow-hidden bg-black aspect-[4/3] mb-4 border border-hacker-border relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt="Captura" className="w-full h-full object-cover hacker-video" />
              <div className="absolute top-2 left-2 text-[10px] text-hacker-glow/60 font-mono bg-black/60 px-1">
                IMG_CAPTURED
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={retakePhoto} className="btn-secondary flex-1 py-2.5 font-mono text-sm">
                $ retake
              </button>
              <button onClick={() => setStep('location')} className="btn-primary flex-1 py-2.5 font-mono text-sm">
                $ confirm
              </button>
            </div>
          </div>
        )}

        {/* Location */}
        {step === 'location' && (
          <div className="p-8 text-center">
            {!locationError ? (
              <>
                <TerminalSpinner text="$ gps --locate --high-accuracy" />
                <p className="text-xs text-hacker-muted mt-2">
                  // permita acesso à localização
                </p>
              </>
            ) : (
              <>
                <div className="text-yellow-400 text-3xl mb-3 font-mono">[GPS_ERR]</div>
                <p className="text-red-400 text-sm mb-4">{locationError}</p>
                <button onClick={getLocation} className="btn-primary text-sm font-mono">$ retry --gps</button>
              </>
            )}
          </div>
        )}

        {/* Sending */}
        {step === 'sending' && (
          <div className="p-8">
            <TerminalSpinner text="$ upload --data=checkin --encrypt..." />
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="text-hacker-glow text-4xl mb-4 font-mono text-glow">[OK]</div>
            <h2 className="text-lg font-bold text-hacker-glow mb-2 font-mono">{'>'} CHECKIN_COMPLETE</h2>
            <p className="text-hacker-dim mb-4 text-sm">
              // dados transmitidos ao operador
            </p>
            {foraPerimetro && (
              <div className="border border-yellow-500/50 bg-yellow-900/10 p-3 mb-4">
                <p className="text-sm text-yellow-400 font-mono">
                  [WARN] Posição fora do perímetro seguro. Alerta enviado.
                </p>
              </div>
            )}
            <p className="text-xs text-hacker-muted">// sessão finalizada. feche esta janela.</p>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="p-8 text-center">
            <div className="text-red-400 text-4xl mb-4 font-mono">[FAIL]</div>
            <h2 className="text-lg font-bold text-red-400 mb-2 font-mono">{'>'} CHECKIN_ERROR</h2>
            <p className="text-hacker-dim mb-4 text-sm">{errorMsg}</p>
            <button onClick={() => { setStep('camera'); retakePhoto(); }}
              className="btn-primary text-sm font-mono">
              $ retry --full
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
