import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRoomSocket } from '@/hooks/useRoomSocket';
import { CardValue, Judge, VoteValue } from '@/types/state';
import { useWakeLock } from '@/hooks/useWakeLock';

const CARD_OPTIONS: Array<{ value: Exclude<CardValue, null>; color: string; glyph: string }> = [
  { value: 1, color: 'bg-red-500 text-white', glyph: '1' },
  { value: 2, color: 'bg-blue-500 text-white', glyph: '2' },
  { value: 3, color: 'bg-yellow-400 text-slate-900', glyph: '3' }
];

export default function RefereeConsole() {
  const router = useRouter();
  const judge = router.query.judge;

  if (typeof judge !== 'string' || !['left', 'center', 'right'].includes(judge)) {
    return <p className="min-h-screen bg-black p-6 text-slate-100">Invalid referee route.</p>;
  }

  return <RefereeView judge={judge as Judge} />;
}

function RefereeView({ judge }: { judge: Judge }) {
  const { state, status, sendVote, sendCard, timerStart, timerStop, timerReset } = useRoomSocket(judge);
  const isCenter = judge === 'center';
  const timerSeconds = useMemo(() => Math.round((state?.timerMs ?? 0) / 1000), [state?.timerMs]);
  const storageKey = `refKeepAwake-${judge}`;
  const [keepAwake, setKeepAwake] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'false') {
      setKeepAwake(false);
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, keepAwake ? 'true' : 'false');
  }, [keepAwake, hydrated, storageKey]);

  const wakeActive = useWakeLock(hydrated && keepAwake);

  const vibrate = useHapticFeedback();

  const handleValid = useCallback(() => {
    vibrate();
    sendVote('white');
  }, [sendVote, vibrate]);

  const toggleCard = useCallback(
    (card: Exclude<CardValue, null>) => {
      vibrate();
      const currentCards = state?.cards[judge] ?? [];
      const isActive = currentCards.includes(card);
      sendVote('red');
      sendCard(isActive ? null : card);
    },
    [judge, sendCard, sendVote, state?.cards, vibrate]
  );

  const handleStart = useCallback(() => {
    vibrate();
    timerStart();
  }, [timerStart, vibrate]);

  const handlePause = useCallback(() => {
    vibrate();
    timerStop();
  }, [timerStop, vibrate]);

  const handleReset = useCallback(() => {
    vibrate();
    timerReset();
  }, [timerReset, vibrate]);

  const handleToggleWake = useCallback(() => {
    vibrate();
    setKeepAwake((prev) => !prev);
  }, [vibrate]);

  const vote = state?.votes[judge] ?? null;
  const cards = state?.cards[judge] ?? [];

  return (
    <>
      <Head>
        <title>{`Referee · ${judge.toUpperCase()}`}</title>
      </Head>
      {isCenter ? (
        <CenterLayout
          status={status}
          timerSeconds={timerSeconds}
          running={state?.running ?? false}
          vote={vote}
          cards={cards}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          onValid={handleValid}
          onToggleCard={toggleCard}
          keepAwake={keepAwake}
          onToggleWake={handleToggleWake}
          wakeActive={wakeActive}
        />
      ) : (
        <SideLayout
          judge={judge}
          status={status}
          vote={vote}
          cards={cards}
          onValid={handleValid}
          onToggleCard={toggleCard}
          keepAwake={keepAwake}
          onToggleWake={handleToggleWake}
          wakeActive={wakeActive}
        />
      )}
    </>
  );
}

function CenterLayout(props: {
  status: string;
  timerSeconds: number;
  running: boolean;
  vote: VoteValue;
  cards: CardValue[];
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onValid: () => void;
  onToggleCard: (card: Exclude<CardValue, null>) => void;
  keepAwake: boolean;
  onToggleWake: () => void;
  wakeActive: boolean;
}) {
  const {
    status,
    timerSeconds,
    running,
    vote,
    cards,
    onStart,
    onPause,
    onReset,
    onValid,
    onToggleCard,
    keepAwake,
    onToggleWake,
    wakeActive
  } = props;
  const isValidActive = vote === 'white';
  const isPaused = !running;

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-950 px-5 py-6 text-white">
      <header className="flex flex-col items-center gap-1 text-xs uppercase tracking-[0.5em] text-slate-400">
        <span>Árbitro Central</span>
        <span>Status: {status}</span>
        <button
          type="button"
          onClick={onToggleWake}
          className="mt-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
        >
          Tela ativa: {keepAwake ? 'ON' : 'OFF'}
        </button>
        {!wakeActive && keepAwake && (
          <span className="text-[10px] text-amber-300">
            Toque na tela ou tente novamente para evitar o bloqueio automático.
          </span>
        )}
      </header>

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-[#1F232A] p-5 shadow-xl">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Tempo oficial</span>
          <div className="text-4xl font-bold text-white">{formatSeconds(timerSeconds)}</div>
        </div>
        <div className="flex w-full flex-wrap justify-center gap-3">
          <button
            className={`flex-1 transform rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 transition duration-150 active:scale-95 active:brightness-95 ${
              running ? 'ring-4 ring-emerald-300/60' : 'opacity-80'
            }`}
            onClick={onStart}
          >
            Start
          </button>
          <button
            className={`flex-1 transform rounded-xl bg-amber-400 px-4 py-3 font-semibold text-slate-900 transition duration-150 active:scale-95 active:brightness-95 ${
              isPaused ? 'ring-4 ring-amber-200/70' : 'opacity-80'
            }`}
            onClick={onPause}
          >
            Pause
          </button>
          <button
            className="flex-1 transform rounded-xl bg-red-500 px-4 py-3 font-semibold text-white transition duration-150 active:scale-95 active:brightness-95"
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <button
          className={`w-full rounded-2xl bg-white py-9 text-2xl font-bold uppercase tracking-[0.3em] text-slate-900 shadow-xl transition ${
            isValidActive ? 'ring-4 ring-white/70' : 'opacity-80'
          }`}
          onClick={onValid}
        >
          Válido
        </button>
        {CARD_OPTIONS.map((option) => {
          const isActive = cards.includes(option.value);
          return (
            <button
              key={option.value}
              className={`flex w-full items-center justify-center rounded-2xl py-9 text-2xl font-bold uppercase tracking-[0.3em] shadow-xl transition ${
                option.color
              } ${isActive ? 'ring-4 ring-white/70' : 'opacity-80'}`}
              onClick={() => onToggleCard(option.value)}
            >
              {isActive ? '✓' : option.glyph}
            </button>
          );
        })}
      </section>

    </main>
  );
}

function SideLayout(props: {
  judge: Judge;
  status: string;
  vote: VoteValue;
  cards: CardValue[];
  onValid: () => void;
  onToggleCard: (card: Exclude<CardValue, null>) => void;
  keepAwake: boolean;
  onToggleWake: () => void;
  wakeActive: boolean;
}) {
  const { judge, status, vote, cards, onValid, onToggleCard, keepAwake, onToggleWake, wakeActive } = props;
  const isValidActive = vote === 'white';
  const sideLabel = judge === 'left' ? 'Árbitro Lateral Esquerdo' : 'Árbitro Lateral Direito';

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-950 px-6 py-8 text-slate-100">
      <header className="flex flex-col items-center gap-1 text-center text-xs uppercase tracking-[0.4em] text-slate-400">
        <span>{sideLabel}</span>
        <span>Status: {status}</span>
        <button
          type="button"
          onClick={onToggleWake}
          className="mt-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
        >
          Tela ativa: {keepAwake ? 'ON' : 'OFF'}
        </button>
        {!wakeActive && keepAwake && (
          <span className="text-[10px] text-amber-300">
            Toque na tela ou tente novamente para evitar o bloqueio automático.
          </span>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <button
          className={`w-full rounded-2xl bg-white py-9 text-2xl font-bold uppercase tracking-[0.3em] text-slate-900 shadow-xl transition ${
            isValidActive ? 'ring-4 ring-white/70' : 'opacity-80'
          }`}
          onClick={onValid}
          disabled={status !== 'connected'}
        >
          Válido
        </button>
        {CARD_OPTIONS.map((option) => {
          const isActive = cards.includes(option.value);
          return (
            <button
              key={option.value}
              className={`flex w-full items-center justify-center rounded-2xl py-9 text-2xl font-bold uppercase tracking-[0.3em] shadow-xl transition ${
                option.color
              } ${isActive ? 'ring-4 ring-white/70' : 'opacity-80'}`}
              onClick={() => onToggleCard(option.value)}
              disabled={status !== 'connected'}
            >
              {isActive ? '✓' : option.glyph}
            </button>
          );
        })}
      </section>
    </main>
  );
}

function useHapticFeedback() {
  return useCallback((pattern: number | number[] = [30]) => {
    if (typeof window === 'undefined') return;
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('vibration_failed', error);
    }
  }, []);
}

function formatSeconds(seconds: number) {
  const mins = Math.floor(seconds / 60).toString();
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}
