import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';

import { DecisionLights } from '@/components/DecisionLights';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { useWakeLock } from '@/hooks/useWakeLock';

export default function LegendPage() {
  const { state, status } = useRoomSocket('display');
  const [menuOpen, setMenuOpen] = useState(false);
  const [bgColor, setBgColor] = useState('#000B1E');
  const [showPlaceholders, setShowPlaceholders] = useState(true);
  const [digitMode, setDigitMode] = useState<'mmss' | 'hhmmss'>('hhmmss');
  const [timerColor, setTimerColor] = useState('#FFFFFF');
  const [hydrated, setHydrated] = useState(false);
  const [keepAwake, setKeepAwake] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('legendKeepAwake');
    if (stored === 'false') return false;
    return true;
  });

  const intervalPrimary = useMemo(
    () => formatHms(state?.intervalMs ?? 0, digitMode === 'hhmmss'),
    [state?.intervalMs, digitMode]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('legendBg');
    if (stored) {
      setBgColor(stored);
    }
    const storedPlaceholders = window.localStorage.getItem('legendPlaceholders');
    if (storedPlaceholders === 'true' || storedPlaceholders === 'false') {
      setShowPlaceholders(storedPlaceholders === 'true');
    }
    const storedDigits = window.localStorage.getItem('legendDigits');
    if (storedDigits === 'mmss' || storedDigits === 'hhmmss') {
      setDigitMode(storedDigits);
    }
    const storedColor = window.localStorage.getItem('legendTimerColor');
    if (storedColor) {
      setTimerColor(storedColor);
    }
    const storedWake = window.localStorage.getItem('legendKeepAwake');
    if (storedWake === 'false') {
      setKeepAwake(false);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem('legendBg', bgColor);
  }, [bgColor, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem('legendPlaceholders', showPlaceholders ? 'true' : 'false');
  }, [showPlaceholders, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem('legendDigits', digitMode);
  }, [digitMode, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem('legendTimerColor', timerColor);
  }, [timerColor, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem('legendKeepAwake', keepAwake ? 'true' : 'false');
  }, [keepAwake, hydrated]);

  const wakeActive = useWakeLock(keepAwake);

  return (
    <>
      <Head>
        <title>Referee Lights · Legenda</title>
      </Head>

      <main
        className="flex min-h-screen flex-col gap-12 px-8 py-10 text-slate-100"
        style={{ backgroundColor: bgColor }}
      >
        <div className="rounded-3xl border border-white/10 bg-black/40 px-6 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold uppercase tracking-[0.45em] text-white">Legenda</h1>
              <span className="text-xs uppercase tracking-[0.35em] text-slate-300">Status: {status}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                {menuOpen ? 'Fechar Cor' : 'Cor de Fundo'}
              </button>
              <button
                type="button"
                onClick={() => setShowPlaceholders((prev) => !prev)}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                {showPlaceholders ? 'Ocultar Molduras' : 'Mostrar Molduras'}
              </button>
              <button
                type="button"
                onClick={() => setDigitMode((prev) => (prev === 'hhmmss' ? 'mmss' : 'hhmmss'))}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                Dígitos: {digitMode === 'hhmmss' ? 'HH:MM:SS' : 'MM:SS'}
              </button>
              <button
                type="button"
                onClick={() => setKeepAwake((prev) => !prev)}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                Tela ativa: {keepAwake ? 'ON' : 'OFF'}
              </button>
            </div>
          </header>
        </div>

        {menuOpen && (
          <section className="flex flex-wrap gap-4 rounded-3xl border border-white/10 bg-black/40 p-6">
            <h2 className="w-full text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">Paleta rápida</h2>
            <div className="flex flex-wrap gap-3">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBgColor(color)}
                  className={`h-10 w-10 rounded-full border-2 transition ${
                    bgColor === color ? 'border-white' : 'border-white/30'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  <span className="sr-only">Selecionar {color}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-300">
              <label className="flex items-center gap-3">
                <span>Cor custom</span>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(event) => setBgColor(event.target.value)}
                  className="h-9 w-20 cursor-pointer rounded border border-white/30 bg-transparent"
                />
                <span className="text-[10px] text-slate-400">{bgColor.toUpperCase()}</span>
              </label>
              <label className="flex items-center gap-3">
                <span>Cronômetro</span>
                <input
                  type="color"
                  value={timerColor}
                  onChange={(event) => setTimerColor(event.target.value)}
                  className="h-9 w-20 cursor-pointer rounded border border-white/30 bg-transparent"
                />
                <span className="text-[10px] text-slate-400">{timerColor.toUpperCase()}</span>
              </label>
              {!wakeActive && keepAwake && (
                <span className="text-[10px] text-amber-300">
                  Não foi possível ativar o modo sem descanso. Toque na tela ou tente novamente.
                </span>
              )}
            </div>
          </section>
        )}

        <section className="flex flex-1 items-center justify-center">
          {state ? (
            <div className="scale-[0.7] origin-top md:scale-75">
              <DecisionLights
                state={state}
                showCardPlaceholders={showPlaceholders}
                showLightPlaceholders={showPlaceholders}
                showPendingRing={false}
                delayReveal={false}
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center text-sm text-slate-400">
              Aguardando conexão…
            </div>
          )}
        </section>

        <section className="flex justify-center">
          <LegendIntervalCard intervalLabel={intervalPrimary} color={timerColor} />
        </section>
      </main>
    </>
  );
}

function LegendIntervalCard({ intervalLabel, color }: { intervalLabel: string; color: string }) {
  return (
    <div
      className="font-display text-[clamp(3rem,14vw,9rem)] font-black leading-none tracking-tight"
      style={{ color }}
    >
      {intervalLabel}
    </div>
  );
}

const COLOR_PRESETS = ['#000B1E', '#000000', '#0B0B0B', '#012A4A', '#111723', '#1A1A20'];

function formatHms(ms: number, includeHours: boolean) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  if (!includeHours) {
    const totalMinutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    return `${totalMinutes}:${seconds}`;
  }
  return `${hours}:${minutes}:${seconds}`;
}
