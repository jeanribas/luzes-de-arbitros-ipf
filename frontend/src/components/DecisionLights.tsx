import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import { AppState, CardValue, Judge, VoteValue } from '@/types/state';

interface Props {
  state: AppState;
  showCardPlaceholders?: boolean;
  showLightPlaceholders?: boolean;
  showPendingRing?: boolean;
  delayReveal?: boolean;
}

export function DecisionLights({
  state,
  showCardPlaceholders = false,
  showLightPlaceholders = true,
  showPendingRing = true,
  delayReveal = true
}: Props) {
  const [delayedVotes, setDelayedVotes] = useState(state.votes);
  const [delayedCards, setDelayedCards] = useState(state.cards);
  const [delayedPhase, setDelayedPhase] = useState(state.phase);

  const votesKey = useMemo(() => JSON.stringify(state.votes), [state.votes]);
  const cardsKey = useMemo(() => JSON.stringify(state.cards), [state.cards]);

  useEffect(() => {
    if (!delayReveal) {
      setDelayedVotes(state.votes);
      setDelayedCards(state.cards);
      setDelayedPhase(state.phase);
      return;
    }

    const timer = window.setTimeout(() => {
      setDelayedVotes(state.votes);
      setDelayedCards(state.cards);
      setDelayedPhase(state.phase);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [votesKey, cardsKey, state.phase, delayReveal]);

  return (
    <div className="flex w-full max-w-6xl flex-col items-center gap-10">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-center sm:gap-16">
        {(Object.keys(state.votes) as Judge[]).map((judge) => (
          <JudgeLight
            key={judge}
            connected={state.connected?.[judge] ?? false}
            vote={delayedVotes[judge]}
            cards={delayedCards[judge]}
            revealed={delayedPhase === 'revealed'}
            showCardPlaceholders={showCardPlaceholders}
            showLightPlaceholders={showLightPlaceholders}
            showPendingRing={showPendingRing}
          />
        ))}
      </div>
    </div>
  );
}

function JudgeLight({
  connected,
  vote,
  cards,
  revealed,
  showCardPlaceholders,
  showLightPlaceholders,
  showPendingRing
}: {
  connected: boolean;
  vote: VoteValue;
  cards: CardValue[];
  revealed: boolean;
  showCardPlaceholders: boolean;
  showLightPlaceholders: boolean;
  showPendingRing: boolean;
}) {
  const squareStyle: CSSProperties = {
    width: 'clamp(12.32rem, 24.64vw, 28.16rem)',
    height: 'clamp(12.32rem, 24.64vw, 28.16rem)',
    fontSize: 'clamp(5.28rem, 10.56vw, 14.08rem)'
  };

  if (!connected) {
    if (!showLightPlaceholders) {
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="invisible" style={squareStyle} />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center justify-center rounded-[3rem] bg-[#0F1216]" style={squareStyle} />
      </div>
    );
  }

  const displayVote: VoteValue = revealed ? vote : null;
  const hasVote = vote !== null;
  const pending = hasVote && !revealed && showPendingRing;

  const squareClass = clsx(
    'flex items-center justify-center rounded-[3rem] text-center font-bold transition-all duration-200',
    displayVote === 'white' && 'bg-white text-slate-900 shadow-xl',
    displayVote === 'red' && 'bg-red-500 text-white shadow-xl',
    displayVote === null &&
      (showLightPlaceholders
        ? 'bg-[#0F1216] text-transparent shadow-xl'
        : 'bg-transparent text-transparent shadow-none'),
    pending && 'ring-4 ring-slate-500/60'
  );

  const showCardStrip = showCardPlaceholders || (revealed && vote === 'red' && cards.length > 0);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative" style={{ width: squareStyle.width }}>
        <div className={squareClass} style={squareStyle}>
          {renderSymbol(displayVote)}
        </div>
        {showCardStrip && (
          <div className="absolute top-full mt-6 grid w-full grid-cols-3 gap-4 px-4">
            {[1, 2, 3].map((slot) => (
              <CardSlot
                key={`card-${slot}`}
                card={cards.find((value) => value === slot) ?? null}
                showPlaceholder={showCardPlaceholders}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderSymbol(vote: VoteValue) {
  if (vote === 'white') return '✓';
  if (vote === 'red') return '✕';
  return '—';
}

function CardSlot({ card, showPlaceholder }: { card: CardValue; showPlaceholder: boolean }) {
  if (!card) {
    if (!showPlaceholder) {
      return <div className="h-20 rounded-xl bg-transparent" />;
    }
    return <div className="h-20 rounded-xl bg-[#0F1216]" />;
  }

  const map: Record<Exclude<CardValue, null>, string> = {
    1: 'bg-red-500 text-white',
    2: 'bg-blue-500 text-white',
    3: 'bg-yellow-400 text-slate-900'
  };

  return <div className={`h-20 w-full rounded-xl shadow-lg ${map[card]}`} />;
}
