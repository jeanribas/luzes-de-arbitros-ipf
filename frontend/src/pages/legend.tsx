import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import { DecisionLights } from '@/components/DecisionLights';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { useWakeLock } from '@/hooks/useWakeLock';
import { getMessages } from '@/lib/i18n/messages';

export default function LegendPage() {
  const router = useRouter();
  const roomId = typeof router.query.roomId === 'string' ? router.query.roomId.toUpperCase() : undefined;
  const adminPin = typeof router.query.pin === 'string' ? router.query.pin : undefined;
  const locale = typeof router.locale === 'string' ? router.locale : undefined;
  const messages = useMemo(() => getMessages(locale), [locale]);
  const legendMessages = messages.legend;
  const displayMessages = messages.display;
  const commonMessages = messages.common;

  const { state, status, error: socketError } = useRoomSocket('display', { roomId, adminPin });
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

  useEffect(() => {
    if (!router.isReady) return;
    const targetLocale = state?.locale;
    if (!targetLocale) return;
    if (router.locale === targetLocale) return;
    document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000`;
    void router.replace({ pathname: router.pathname, query: router.query }, undefined, { locale: targetLocale });
  }, [router, state?.locale]);
  const statusSuffix = roomId ? legendMessages.statusRoomSuffix.replace('{roomId}', roomId) : '';
  const digitsModeLabel = digitMode === 'hhmmss' ? legendMessages.digitsModes.hhmmss : legendMessages.digitsModes.mmss;
  const digitsButtonLabel = legendMessages.buttons.digits.replace('{mode}', digitsModeLabel);
  const wakeButtonLabel = legendMessages.buttons.wake.replace(
    '{state}',
    keepAwake ? displayMessages.wake.on : displayMessages.wake.off
  );

  return (
    <>
      <Head>
        <title>{`Referee Lights · ${legendMessages.title}`}</title>
      </Head>

      <main
        className="flex min-h-screen flex-col gap-12 px-8 py-10 text-slate-100"
        style={{ backgroundColor: bgColor }}
      >
        <div className="rounded-3xl border border-white/10 bg-black/40 px-6 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold uppercase tracking-[0.45em] text-white">
                {legendMessages.title}
              </h1>
              <span className="text-xs uppercase tracking-[0.35em] text-slate-300">
                {commonMessages.labels.status}: {status}
                {statusSuffix}
              </span>
              {!roomId || !adminPin ? (
                <span className="text-[10px] uppercase tracking-[0.3em] text-amber-200">
                  {legendMessages.missingCredentials}
                </span>
              ) : null}
              {socketError ? (
                <span className="text-[10px] uppercase tracking-[0.3em] text-red-300">
                  {legendMessages.errorPrefix} {socketError}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                {menuOpen ? legendMessages.buttons.paletteClose : legendMessages.buttons.paletteOpen}
              </button>
              <button
                type="button"
                onClick={() => setShowPlaceholders((prev) => !prev)}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                {showPlaceholders
                  ? legendMessages.buttons.placeholdersHide
                  : legendMessages.buttons.placeholdersShow}
              </button>
              <button
                type="button"
                onClick={() => setDigitMode((prev) => (prev === 'hhmmss' ? 'mmss' : 'hhmmss'))}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                {digitsButtonLabel}
              </button>
              <button
                type="button"
                onClick={() => setKeepAwake((prev) => !prev)}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
              >
                {wakeButtonLabel}
              </button>
            </div>
          </header>
        </div>

        {menuOpen && (
          <section className="flex flex-wrap gap-4 rounded-3xl border border-white/10 bg-black/40 p-6">
            <h2 className="w-full text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
              {legendMessages.palette.title}
            </h2>
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
                  <span className="sr-only">
                    {legendMessages.palette.selectColor.replace('{color}', color.toUpperCase())}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-300">
              <label className="flex items-center gap-3">
                <span>{legendMessages.palette.customColor}</span>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(event) => setBgColor(event.target.value)}
                  className="h-9 w-20 cursor-pointer rounded border border-white/30 bg-transparent"
                />
                <span className="text-[10px] text-slate-400">{bgColor.toUpperCase()}</span>
              </label>
              <label className="flex items-center gap-3">
                <span>{legendMessages.palette.timerColor}</span>
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
                  {legendMessages.wakeWarning}
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
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center text-sm text-slate-400">
              {legendMessages.waiting}
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
  const hours = Math.floor(totalSeconds / 3600).toString();
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
