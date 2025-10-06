import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import QRCode from 'react-qr-code';
import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';

import { DecisionLights } from '@/components/DecisionLights';
import TimerDisplay from '@/components/TimerDisplay';
import { useRoomSocket } from '@/hooks/useRoomSocket';

interface AdminPageProps {
  networkIps: string[];
}

const previewLayout = {
  gapClass: 'gap-0',
  lights: { scale: 0.7, maxWidth: 'min(88vw, 1200px)' },
  timer: {
    scale: 0.78,
    maxWidth: 'min(88vw, 960px)',
    translateX: 'calc(-1 * min(5vw, 80px))'
  }
} as const;

export default function AdminPage({ networkIps }: AdminPageProps) {
  const [customMinutes, setCustomMinutes] = useState(1);
  const [intervalHours, setIntervalHours] = useState(0);
  const [intervalMinutes, setIntervalMinutes] = useState(10);
  const [intervalSeconds, setIntervalSeconds] = useState(0);
  const {
    state,
    status,
    ready,
    release,
    clear,
    timerStart,
    timerStop,
    timerReset,
    timerSet,
    intervalSet,
    intervalStart,
    intervalStop,
    intervalReset,
    intervalShow,
    intervalHide
  } = useRoomSocket('admin');

  const setMinutes = () => {
    const seconds = Math.max(0, Math.round(customMinutes * 60));
    timerSet(seconds);
  };

  const [qrMenuOpen, setQrMenuOpen] = useState(false);
  const [appOrigin, setAppOrigin] = useState('');
  const configuredQrOrigin = process.env.NEXT_PUBLIC_QR_ORIGIN?.trim();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol || 'https:';
      const protocolWithSlashes = protocol.endsWith(':') ? `${protocol}//` : 'https://';
      const port = window.location.port ? `:${window.location.port}` : '';
      const fallbackHost = window.location.hostname;
      const normalizedConfiguredOrigin = normalizeConfiguredOrigin(
        configuredQrOrigin,
        protocolWithSlashes
      );

      if (normalizedConfiguredOrigin) {
        setAppOrigin(normalizedConfiguredOrigin);
        return;
      }

      const ipHost = selectUsefulIp(networkIps);
      const host = ipHost ?? fallbackHost;
      setAppOrigin(`${protocolWithSlashes}${host}${port}`);
    }
  }, [networkIps, configuredQrOrigin]);

  const qrTargets = useMemo(() => {
    if (!appOrigin) return [] as Array<{ judge: string; label: string; href: string }>;

    return [
      { judge: 'left', label: 'Árbitro Esquerdo', href: `${appOrigin}/ref/left` },
      { judge: 'center', label: 'Árbitro Central', href: `${appOrigin}/ref/center` },
      { judge: 'right', label: 'Árbitro Direito', href: `${appOrigin}/ref/right` }
    ];
  }, [appOrigin]);

  const totalIntervalSeconds = useMemo(() => {
    const hours = Math.max(0, intervalHours);
    const minutes = Math.max(0, intervalMinutes);
    const seconds = Math.max(0, intervalSeconds);
    return hours * 3600 + minutes * 60 + seconds;
  }, [intervalHours, intervalMinutes, intervalSeconds]);

  const handleIntervalSet = () => {
    intervalSet(totalIntervalSeconds);
  };

  const intervalDisplay = useMemo(() => formatHMS(state?.intervalMs ?? 0), [state?.intervalMs]);

  const intervalConfiguredDisplay = useMemo(
    () => formatHMS(state?.intervalConfiguredMs ?? 0),
    [state?.intervalConfiguredMs]
  );

  const lightsPreviewStyle = useMemo(
    () => ({
      transform: `scale(${previewLayout.lights.scale})`,
      transformOrigin: 'top center',
      maxWidth: previewLayout.lights.maxWidth,
      margin: '0 auto',
      display: 'inline-block'
    }),
    []
  );

  const timerPreviewStyle = useMemo(
    () => ({
      transform: `translateX(${previewLayout.timer.translateX}) scale(${previewLayout.timer.scale})`,
      transformOrigin: 'top center',
      maxWidth: previewLayout.timer.maxWidth,
      display: 'inline-block'
    }),
    []
  );

  return (
    <>
      <Head>
        <title>Referee Lights · Admin</title>
      </Head>
      <main className="flex min-h-screen flex-col gap-10 bg-slate-950 px-10 py-10 text-slate-100">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold uppercase tracking-[0.45em]">Platform Admin</h1>
          <div className="flex flex-col items-start gap-1 text-sm uppercase tracking-[0.35em] text-slate-400">
            <span>Status: {status}</span>
          </div>
        </header>

        <section className="grid w-full gap-6 md:grid-cols-[320px_1fr]">
          <aside className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0F141F] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Timer</h3>
              <TimerDisplay remainingMs={state?.timerMs ?? 60_000} running={state?.running ?? false} variant="panel" />
              <div className="grid grid-cols-3 gap-2 text-sm">
                <button className="rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-slate-900" onClick={timerStart}>
                  Start
                </button>
                <button className="rounded-lg bg-amber-400 px-3 py-2 font-semibold text-slate-900" onClick={timerStop}>
                  Stop
                </button>
                <button className="rounded-lg bg-slate-700 px-3 py-2 font-semibold text-white" onClick={timerReset}>
                  Reset 1:00
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Minutos</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={customMinutes}
                    onChange={(event) => setCustomMinutes(Number(event.target.value))}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </label>
                <button className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-900" onClick={setMinutes}>
                  Set
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0F141F] p-5">
              <header className="flex flex-col gap-1">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Intervalo</h3>
                <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Configurado: {intervalConfiguredDisplay}</span>
                <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Restante: {intervalDisplay}</span>
              </header>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Horas</span>
                  <input
                    type="number"
                    min={0}
                    value={intervalHours}
                    onChange={(event) => setIntervalHours(Number(event.target.value))}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Minutos</span>
                  <input
                    type="number"
                    min={0}
                    value={intervalMinutes}
                    onChange={(event) => setIntervalMinutes(Number(event.target.value))}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Segundos</span>
                  <input
                    type="number"
                    min={0}
                    value={intervalSeconds}
                    onChange={(event) => setIntervalSeconds(Number(event.target.value))}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <button className="rounded-lg bg-slate-200 px-3 py-2 font-semibold text-slate-900" onClick={handleIntervalSet}>
                  Definir
                </button>
                <button className="rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-slate-900" onClick={intervalStart}>
                  Iniciar intervalo
                </button>
                <button className="rounded-lg bg-amber-400 px-3 py-2 font-semibold text-slate-900" onClick={intervalStop}>
                  Pausar
                </button>
                <button className="rounded-lg bg-slate-700 px-3 py-2 font-semibold text-white" onClick={intervalReset}>
                  Reset intervalo
                </button>
                <button className="col-span-2 rounded-lg bg-white/20 px-3 py-2 font-semibold text-white" onClick={intervalShow}>
                  Mostrar intervalo
                </button>
                <button className="col-span-2 rounded-lg bg-white/20 px-3 py-2 font-semibold text-white" onClick={intervalHide}>
                  Mostrar luzes
                </button>
              </div>
              <p className="text-xs text-slate-500">
                O display exibirá um aviso em vermelho três minutos antes do término.
              </p>
            </div>
          </aside>

          <section className="relative flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-slate-800 bg-[#0B1019] p-6 shadow-2xl">
            {state ? (
              <div className={`flex w-full flex-1 flex-col items-center justify-center ${previewLayout.gapClass}`}>
                <div className="flex w-full justify-center">
                  <div style={lightsPreviewStyle}>
                    <DecisionLights state={state} showLightPlaceholders={false} forceConnectedPlaceholders />
                  </div>
                </div>
                <div className="flex w-full justify-center">
                  <div style={timerPreviewStyle} className="flex flex-col items-center gap-6 mx-auto">
                    <TimerDisplay
                      variant="display"
                      remainingMs={state.timerMs}
                      running={state.running}
                      phase={state.phase}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Waiting for state…</p>
            )}
            <div className="pointer-events-none absolute bottom-6 right-6 flex flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setQrMenuOpen(true)}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                Mostrar QR Codes
              </button>
              <Link
                href="/"
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                Ir para Display
              </Link>
            </div>
          </section>
        </section>
      </main>
      {qrMenuOpen && (
        <QrMenu targets={qrTargets} onClose={() => setQrMenuOpen(false)} originReady={Boolean(appOrigin)} />
      )}
    </>
  );
}

function QrMenu({
  targets,
  onClose,
  originReady
}: {
  targets: Array<{ judge: string; label: string; href: string }>;
  onClose: () => void;
  originReady: boolean;
}) {
  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6 py-10"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="QR Codes para árbitros"
    >
      <div className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0F141F] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <span className="sr-only">Fechar</span>
          ×
        </button>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold uppercase tracking-[0.4em] text-white">Compartilhar com árbitros</h2>
          <p className="text-xs text-slate-400">
            Escaneie o QR Code correspondente para abrir o console do árbitro em um dispositivo móvel conectado à mesma rede.
          </p>
        </div>

        {!originReady ? (
          <div className="mt-10 text-center text-sm text-slate-400">Carregando QR Codes…</div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {targets.map((target) => (
              <div
                key={target.judge}
                className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-center"
              >
                <div className="rounded-2xl bg-white/5 p-4">
                  <QRCode value={target.href} size={196} bgColor="transparent" fgColor="#ffffff" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-200">{target.label}</span>
                  <span className="text-[10px] text-slate-500 break-all">{target.href}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeConfiguredOrigin(value: string | undefined, defaultProtocol: string) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed);
  const input = hasProtocol ? trimmed : `${defaultProtocol}${trimmed.replace(/^\/+/, '')}`;

  try {
    const url = new URL(input);
    return url.origin;
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_QR_ORIGIN provided:', error);
    return '';
  }
}

function selectUsefulIp(candidates: string[]) {
  return candidates.find((candidate) => {
    if (!candidate) return false;
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(candidate)) return false;

    const [a, b] = candidate.split('.').map(Number);
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;

    return false;
  });
}

export const getServerSideProps: GetServerSideProps<AdminPageProps> = async () => {
  const os = await import('os');
  const nets = os.networkInterfaces();
  const ips = new Set<string>();

  Object.values(nets).forEach((entries) => {
    (entries ?? []).forEach((entry) => {
      if (entry && entry.family === 'IPv4' && !entry.internal) {
        ips.add(entry.address);
      }
    });
  });

  return {
    props: {
      networkIps: Array.from(ips)
    }
  };
};

function formatHMS(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
