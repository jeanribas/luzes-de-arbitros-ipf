import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import QRCode from 'react-qr-code';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';

import { DecisionLights } from '@/components/DecisionLights';
import TimerDisplay from '@/components/TimerDisplay';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { createRoom, accessRoom, refreshRefereeTokens, type JoinQrCodesResponse } from '@/lib/api';
import type { Judge } from '@/types/state';

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

interface QrTarget {
  judge: Judge;
  label: string;
  href: string;
}

export default function AdminPage({ networkIps }: AdminPageProps) {
  const router = useRouter();
  const roomId = typeof router.query.roomId === 'string' ? router.query.roomId : undefined;
  const adminPin = typeof router.query.pin === 'string' ? router.query.pin : undefined;

  const [roomAccess, setRoomAccess] = useState<JoinQrCodesResponse | null>(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomErrorCode, setRoomErrorCode] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [tokenRefreshing, setTokenRefreshing] = useState(false);
  const lastAttemptRef = useRef<string | null>(null);

  const [customMinutes, setCustomMinutes] = useState(1);
  const [intervalHours, setIntervalHours] = useState(0);
  const [intervalMinutes, setIntervalMinutes] = useState(10);
  const [intervalSeconds, setIntervalSeconds] = useState(0);

  const [qrMenuOpen, setQrMenuOpen] = useState(false);
  const [appOrigin, setAppOrigin] = useState('');
  const configuredQrOrigin = process.env.NEXT_PUBLIC_QR_ORIGIN?.trim();

  const credentialsReady = Boolean(router.isReady && roomId && adminPin);
  const roomReady = Boolean(roomAccess && roomAccess.roomId === roomId);

  useEffect(() => {
    if (!credentialsReady) {
      return;
    }
    if (roomAccess && roomAccess.roomId === roomId) {
      return;
    }

    const attemptKey = `${roomId}:${adminPin}`;
    if (lastAttemptRef.current === attemptKey && roomErrorCode) {
      return;
    }

    lastAttemptRef.current = attemptKey;
    setRoomLoading(true);
    accessRoom(roomId!, adminPin!)
      .then((data) => {
        setRoomAccess(data);
        setRoomErrorCode(null);
      })
      .catch((error) => {
        setRoomAccess(null);
        setRoomErrorCode(getErrorCode(error));
      })
      .finally(() => {
        setRoomLoading(false);
      });
  }, [credentialsReady, roomId, adminPin, roomAccess, roomErrorCode]);

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

  const socketOptions = useMemo(() => {
    if (roomReady && roomId && adminPin) {
      return { roomId, adminPin } as const;
    }
    return {} as const;
  }, [roomReady, roomId, adminPin]);

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
    intervalHide,
    error: socketError
  } = useRoomSocket('admin', socketOptions);

  const setMinutes = () => {
    const seconds = Math.max(0, Math.round(customMinutes * 60));
    timerSet(seconds);
  };

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

  const qrTargets = useMemo<QrTarget[]>(() => {
    if (!appOrigin || !roomId || !roomAccess) return [];
    return [
      {
        judge: 'left',
        label: 'Árbitro Esquerdo',
        href: buildRefHref(appOrigin, roomId, roomAccess.joinQRCodes.left.token, 'left')
      },
      {
        judge: 'center',
        label: 'Árbitro Central',
        href: buildRefHref(appOrigin, roomId, roomAccess.joinQRCodes.center.token, 'center')
      },
      {
        judge: 'right',
        label: 'Árbitro Direito',
        href: buildRefHref(appOrigin, roomId, roomAccess.joinQRCodes.right.token, 'right')
      }
    ];
  }, [appOrigin, roomId, roomAccess]);

  const displayLink = roomId && adminPin
    ? `/?roomId=${encodeURIComponent(roomId)}&pin=${encodeURIComponent(adminPin)}`
    : '/';

  const legendLink = roomId && adminPin
    ? `/legend?roomId=${encodeURIComponent(roomId)}&pin=${encodeURIComponent(adminPin)}`
    : '/legend';

  const roomErrorMessage = formatApiError(roomErrorCode);
  const socketErrorMessage = formatApiError(socketError);

  const handleCreateSession = useCallback(async () => {
    setMutationLoading(true);
    try {
      const data = await createRoom();
      setRoomAccess(data);
      setRoomErrorCode(null);
      await router.replace({ pathname: '/admin', query: { roomId: data.roomId, pin: data.adminPin } });
    } catch (error) {
      setRoomErrorCode(getErrorCode(error));
    } finally {
      setMutationLoading(false);
    }
  }, [router]);

  const handleJoinSession = useCallback(
    async (id: string, pin: string) => {
      setMutationLoading(true);
      try {
        const targetId = id.trim().toUpperCase();
        const targetPin = pin.trim();
        const data = await accessRoom(targetId, targetPin);
        setRoomAccess(data);
        setRoomErrorCode(null);
        await router.replace({ pathname: '/admin', query: { roomId: data.roomId, pin: data.adminPin } });
      } catch (error) {
        setRoomAccess(null);
        setRoomErrorCode(getErrorCode(error));
      } finally {
        setMutationLoading(false);
      }
    },
    [router]
  );

  const handleRefreshTokens = useCallback(async () => {
    if (!roomId || !adminPin) return;
    setTokenRefreshing(true);
    try {
      const data = await refreshRefereeTokens(roomId, adminPin);
      setRoomAccess(data);
      setRoomErrorCode(null);
    } catch (error) {
      setRoomErrorCode(getErrorCode(error));
    } finally {
      setTokenRefreshing(false);
    }
  }, [roomId, adminPin]);

  const pageHead = (
    <Head>
      <title>Referee Lights · Admin</title>
    </Head>
  );

  const hasCredentials = Boolean(roomId && adminPin);
  const hasAccess = Boolean(roomAccess && roomAccess.roomId === roomId);

  const shouldShowSetup =
    !hasCredentials ||
    (!hasAccess && !roomLoading && (roomErrorMessage || !credentialsReady));

  const shouldShowConnecting = hasCredentials && roomLoading && !hasAccess;

  if (!router.isReady) {
    return (
      <>
        {pageHead}
        <FullPageMessage title="Carregando" description="Preparando painel..." />
      </>
    );
  }

  if (shouldShowSetup) {
    return (
      <>
        {pageHead}
        <RoomSetup
          onCreate={handleCreateSession}
          onJoin={handleJoinSession}
          loading={mutationLoading}
          error={roomErrorMessage}
          initialRoomId={roomId}
          initialPin={adminPin}
        />
      </>
    );
  }

  if (shouldShowConnecting) {
    return (
      <>
        {pageHead}
        <FullPageMessage title="Conectando" description="Sincronizando dados da plataforma..." />
      </>
    );
  }

  if (!hasAccess || !roomAccess) {
    return (
      <>
        {pageHead}
        <RoomSetup
          onCreate={handleCreateSession}
          onJoin={handleJoinSession}
          loading={mutationLoading}
          error={roomErrorMessage ?? socketErrorMessage}
          initialRoomId={roomId}
          initialPin={adminPin}
        />
      </>
    );
  }

  return (
    <>
      {pageHead}
      <main className="flex min-h-screen flex-col gap-10 bg-slate-950 px-10 py-10 text-slate-100">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold uppercase tracking-[0.45em]">Platform Admin</h1>
            {roomId && adminPin && (
              <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.35em] text-slate-400">
                <span>Sala: {roomId}</span>
                <span>PIN admin: {adminPin}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-start gap-1 text-sm uppercase tracking-[0.35em] text-slate-400">
            <span>Status: {status}</span>
            {tokenRefreshing && <span>Gerando novos links…</span>}
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
                  <div style={timerPreviewStyle} className="mx-auto flex flex-col items-center gap-6">
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
                href={displayLink}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                Ir para Display
              </Link>
              <Link
                href={legendLink}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                Legenda
              </Link>
            </div>
          </section>
        </section>
      </main>
      {(roomErrorMessage || socketErrorMessage) && (
        <StatusBanner message={roomErrorMessage ?? socketErrorMessage ?? ''} />
      )}
      {qrMenuOpen && (
        <QrMenu
          targets={qrTargets}
          onClose={() => setQrMenuOpen(false)}
          originReady={Boolean(appOrigin)}
          onRefreshTokens={handleRefreshTokens}
          refreshing={tokenRefreshing}
        />
      )}
    </>
  );
}

function RoomSetup(props: {
  onCreate: () => Promise<void>;
  onJoin: (roomId: string, pin: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  initialRoomId?: string;
  initialPin?: string;
}) {
  const { onCreate, onJoin, loading, error, initialRoomId, initialPin } = props;
  const [roomId, setRoomId] = useState(initialRoomId ?? '');
  const [pin, setPin] = useState(initialPin ?? '');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId || !pin) return;
    await onJoin(roomId, pin);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 text-white">
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#0B1220] via-[#0C1526] to-[#020617]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-indigo-500/30 via-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-700/20 blur-3xl" />

      <div className="w-full max-w-6xl space-y-14">
        <header className="max-w-3xl space-y-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
            Painel Administrativo
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Configurar plataforma</h1>
          <p className="text-lg leading-relaxed text-slate-200">
            Gerencie as sessões do sistema em um só lugar. Gere novas salas com PIN administrativo e QR Codes exclusivos
            ou retome o controle de uma sessão existente informando o identificador e o PIN correspondente.
          </p>
        </header>

        <section className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
          <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101b2f] via-[#0d1728] to-[#091120] p-10 shadow-[0_26px_90px_rgba(6,11,24,0.6)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/6 via-transparent to-transparent" />

            <div className="relative z-10 space-y-6">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold tracking-tight text-white">Criar nova sessão</h2>
                <p className="text-base leading-relaxed text-slate-200">
                  Configure uma sala completa em segundos com PIN administrativo, QR Codes para cada árbitro e um link de
                  display pronto para compartilhar.
                </p>
              </div>

              <div className="grid gap-4 text-sm text-slate-200">
                <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/10 p-4 backdrop-blur">
                  <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sm font-semibold text-sky-100">
                    01
                  </span>
                  <p className="leading-relaxed">
                    Compartilhe o PIN com a equipe e distribua automaticamente os QR Codes gerados para cada árbitro.
                  </p>
                </div>
                <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/10 p-4 backdrop-blur">
                  <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-100">
                    02
                  </span>
                  <p className="leading-relaxed">
                    Inicie a sessão com timers, cartões e votos sincronizados em tempo real a partir deste painel.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCreate}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-500 px-6 py-3 text-base font-semibold tracking-tight text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Gerar sessão agora
                </button>
                <span className="text-sm text-slate-200">
                  Tokens podem ser rotacionados sempre que necessário após a criação da sala.
                </span>
              </div>
            </div>
          </article>

          <form
            onSubmit={handleSubmit}
            className="flex h-full flex-col gap-7 rounded-3xl border border-white/10 bg-slate-900/80 p-10 shadow-[0_30px_90px_rgba(15,23,42,0.55)] backdrop-blur"
          >
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-white">Entrar em sessão existente</h2>
              <p className="text-base leading-relaxed text-slate-300">
                Informe os dados da sala para reconectar este painel a uma sessão ativa e continuar a operação sem
                interrupções.
              </p>
            </div>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100">
              Sala
              <input
                value={roomId}
                onChange={(event) => setRoomId(event.target.value.toUpperCase())}
                placeholder="ABCD"
                className="rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-lg font-medium uppercase tracking-[0.22em] text-white placeholder:text-slate-500 shadow-inner transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              />
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100">
              PIN Administrativo
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="1234"
                className="rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-lg font-medium text-white placeholder:text-slate-500 shadow-inner transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              disabled={loading || !roomId || !pin}
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-400 to-sky-400 px-6 py-3 text-base font-semibold tracking-tight text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Entrar no painel
            </button>
          </form>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/15 px-6 py-4 text-center text-sm font-semibold tracking-tight text-red-100">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}

function QrMenu({
  targets,
  onClose,
  originReady,
  onRefreshTokens,
  refreshing
}: {
  targets: QrTarget[];
  onClose: () => void;
  originReady: boolean;
  onRefreshTokens: () => Promise<void>;
  refreshing: boolean;
}) {
  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      onClose();
    }
  };

  const handleRefreshClick = () => {
    if (refreshing) return;

    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(
          'Gerar novos links desconecta árbitros conectados. Deseja continuar?'
        );

    if (!confirmed) return;

    void onRefreshTokens();
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
            Escaneie o QR Code correspondente para abrir o console do árbitro em um dispositivo conectado à mesma sessão.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={refreshing}
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? 'Gerando…' : 'Gerar novos links'}
            </button>
          </div>
        </div>

        {!originReady || targets.length === 0 ? (
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

function FullPageMessage({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 py-12 text-center text-white">
      <h1 className="text-2xl font-semibold uppercase tracking-[0.45em]">{title}</h1>
      <p className="max-w-md text-sm text-slate-300">{description}</p>
    </main>
  );
}

function StatusBanner({ message }: { message: string }) {
  return (
    <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full border border-white/20 bg-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
      {message}
    </div>
  );
}

function buildRefHref(origin: string, roomId: string, token: string, judge: Judge) {
  const encodedRoom = encodeURIComponent(roomId);
  const encodedToken = encodeURIComponent(token);
  return `${origin}/ref/${judge}?roomId=${encodedRoom}&token=${encodedToken}`;
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

function getErrorCode(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string') {
    return (error as any).code as string;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'request_failed';
}

function formatApiError(code: string | null | undefined) {
  if (!code) return null;
  const map: Record<string, string> = {
    invalid_pin: 'PIN inválido para esta sala.',
    room_not_found: 'Sala não encontrada.',
    invalid_token: 'Token expirado ou inválido.',
    not_authorised: 'Acesso não autorizado.',
    request_failed: 'Falha ao comunicar com o servidor.',
    unknown_error: 'Erro inesperado.',
    token_revoked: 'Links antigos foram revogados. Gere novos QR Codes.',
    invalid_payload: 'Dados inválidos enviados ao servidor.'
  };
  return map[code] ?? code;
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
