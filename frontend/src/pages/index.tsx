import Head from 'next/head';
import Link from 'next/link';

import { DecisionLights } from '@/components/DecisionLights';
import { FullscreenButton } from '@/components/FullscreenButton';
import TimerDisplay from '@/components/TimerDisplay';
import IntervalCountdown from '@/components/IntervalCountdown';
import IntervalFull from '@/components/IntervalFull';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWakeLock } from '@/hooks/useWakeLock';

export default function DisplayPage() {
  const { state } = useRoomSocket('display');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [keepAwake, setKeepAwake] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('displayKeepAwake');
    if (stored === 'false') return false;
    return true;
  });

  const intervalVisible = Boolean(
    state && state.intervalVisible && state.intervalConfiguredMs > 0 && state.intervalMs > 0
  );

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        closeMenu();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('displayZoom');
    if (!stored) return;
    const value = Number(stored);
    if (!Number.isNaN(value) && value >= 0.5 && value <= 2) {
      setZoom(Number(value.toFixed(2)));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('displayZoom', zoom.toString());
  }, [zoom]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('displayKeepAwake', keepAwake ? 'true' : 'false');
  }, [keepAwake]);

  const zoomLabel = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);

  const zoomStyle = useMemo(() => ({
    transform: `scale(${zoom})`,
    transformOrigin: 'top center'
  }), [zoom]);

  const wakeActive = useWakeLock(keepAwake);

  const increaseZoom = useCallback(() => {
    setZoom((prev) => Math.min(2, Number((prev + 0.1).toFixed(2))));
  }, []);

  const decreaseZoom = useCallback(() => {
    setZoom((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))));
  }, []);

  const resetZoom = useCallback(() => setZoom(1), []);

  return (
    <>
      <Head>
        <title>Referee Lights · Display</title>
      </Head>
      <main className="relative flex min-h-screen flex-col bg-black px-6 py-12 text-white">
        <div className="fixed bottom-6 left-6 z-30 flex flex-col items-start gap-3" ref={menuRef}>
          {menuOpen && (
            <div className="w-64 rounded-3xl border border-white/10 bg-[#141820]/95 p-5 shadow-2xl backdrop-blur">
              <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">Opções</h2>
              <div className="mt-4 flex flex-col gap-5">
                <section className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-slate-400">Ações rápidas</span>
                  <FullscreenButton className="w-full !rounded-xl bg-white/15 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/25" />
                  <Link
                    href="/admin"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-white/15 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/25"
                  >
                    Ir para Admin
                  </Link>
                </section>

                <section className="flex flex-col gap-3 border-t border-white/10 pt-4">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-slate-400">Zoom ({zoomLabel})</span>
                  <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2">
                    <button
                      type="button"
                      onClick={decreaseZoom}
                      className="flex h-10 items-center justify-center rounded-lg bg-white/15 text-lg font-semibold text-white transition hover:bg-white/25"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={resetZoom}
                      className="flex h-10 items-center justify-center rounded-lg bg-white/15 text-[10px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/25"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={increaseZoom}
                      className="flex h-10 items-center justify-center rounded-lg bg-white/15 text-lg font-semibold text-white transition hover:bg-white/25"
                    >
                      +
                    </button>
                  </div>
                </section>

                <section className="flex flex-col gap-3 border-t border-white/10 pt-4">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-slate-400">Tela ativa</span>
                  <button
                    type="button"
                    onClick={() => setKeepAwake((prev) => !prev)}
                    className="flex items-center justify-between rounded-xl bg-white/15 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/25"
                  >
                    <span>Manter tela ativa</span>
                    <span className="text-xs">{keepAwake ? 'ON' : 'OFF'}</span>
                  </button>
                  {!wakeActive && keepAwake && (
                    <span className="text-[10px] text-amber-300">
                      Não foi possível ativar o modo sem descanso. Toque na tela ou tente novamente.
                    </span>
                  )}
                </section>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white shadow-lg hover:bg-white/20"
          >
            <span className="sr-only">Toggle display menu</span>
            <div className="flex flex-col gap-[5px]">
              <span className="block h-[3px] w-6 rounded bg-white"></span>
              <span className="block h-[3px] w-6 rounded bg-white"></span>
              <span className="block h-[3px] w-6 rounded bg-white"></span>
            </div>
          </button>
        </div>

        {intervalVisible && state ? (
          <div className="flex flex-1 items-center justify-center">
            <div style={zoomStyle}>
              <IntervalFull
                intervalMs={state.intervalMs}
                configuredMs={state.intervalConfiguredMs}
                running={state.intervalRunning}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-48">
            <div className="flex w-full justify-center">
              {state ? (
                <div style={zoomStyle}>
                  <DecisionLights
                    state={state}
                    showLightPlaceholders={false}
                    forceConnectedPlaceholders
                  />
                </div>
              ) : (
                <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Waiting for connection…</p>
              )}
            </div>
            <div className="flex flex-col items-center gap-10" style={zoomStyle}>
              {state && (state.intervalConfiguredMs > 0 || state.intervalMs > 0) && state.intervalVisible && (
                <IntervalCountdown
                  intervalMs={state.intervalMs}
                  configuredMs={state.intervalConfiguredMs}
                  running={state.intervalRunning}
                />
              )}
              <TimerDisplay
                variant="display"
                remainingMs={state?.timerMs ?? 60_000}
                running={state?.running ?? false}
                phase={state?.phase}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
