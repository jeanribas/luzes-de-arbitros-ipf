export type Judge = 'left' | 'center' | 'right';
export type VoteValue = 'white' | 'red' | null;
export type CardValue = 1 | 2 | 3 | null;
export type Phase = 'idle' | 'revealed';

export interface AppState {
  phase: Phase;
  votes: Record<Judge, VoteValue>;
  cards: Record<Judge, CardValue[]>;
  timerMs: number;
  running: boolean;
  connected: Record<Judge, boolean>;
  intervalMs: number;
  intervalConfiguredMs: number;
  intervalRunning: boolean;
  intervalVisible: boolean;
}

const DEFAULT_TIMER_MS = 60_000;
const AUTO_CLEAR_MS = 10_000;
const INTERVAL_TICK_RATE_MS = 200;

const state: AppState & { lastTickAt?: number } = {
  phase: 'idle',
  votes: {
    left: null,
    center: null,
    right: null
  },
  cards: {
    left: [],
    center: [],
    right: []
  },
  timerMs: DEFAULT_TIMER_MS,
  running: false,
  connected: {
    left: false,
    center: false,
    right: false
  },
  intervalMs: 0,
  intervalConfiguredMs: 0,
  intervalRunning: false,
  intervalVisible: false,
  lastTickAt: undefined
};

let tickInterval: NodeJS.Timeout | null = null;
let autoClearTimeout: NodeJS.Timeout | null = null;
let subscriber: ((snapshot: AppState) => void) | null = null;
let intervalTickHandle: NodeJS.Timeout | null = null;
let intervalLastTickAt: number | undefined;

export function setStateListener(listener: (snapshot: AppState) => void) {
  subscriber = listener;
  notify();
}

export function getState(): AppState {
  return {
    phase: state.phase,
    votes: { ...state.votes },
    cards: { ...state.cards },
    timerMs: state.timerMs,
    running: state.running,
    connected: { ...state.connected },
    intervalMs: state.intervalMs,
    intervalConfiguredMs: state.intervalConfiguredMs,
    intervalRunning: state.intervalRunning,
    intervalVisible: state.intervalVisible
  };
}

export function setVote(judge: Judge, vote: Exclude<VoteValue, null>) {
  if (state.phase === 'revealed') return;
  state.votes[judge] = vote;
  if (vote === 'white') {
    state.cards[judge] = [];
  }
  notify();
  if (allVotesCast()) {
    triggerReveal();
  }
}

export function setCard(judge: Judge, card: CardValue) {
  if (card === null) {
    state.cards[judge] = [];
    notify();
    return;
  }
  state.votes[judge] = 'red';
  const cards = state.cards[judge];
  if (cards.includes(card)) {
    state.cards[judge] = cards.filter((value) => value !== card);
    notify();
    return;
  }
  if (cards.length >= 3) {
    return;
  }
  state.cards[judge] = [...cards, card];
  notify();
}

export function triggerReveal(force = false) {
  if (!force && !allVotesCast()) return;
  if (state.phase === 'revealed') return;
  state.phase = 'revealed';
  scheduleAutoClear();
  notify();
}

export function clearDecision() {
  resetForNextAttempt();
}

export function releaseDecision() {
  triggerReveal(true);
}

export function startTimer() {
  if (state.running) return;
  state.running = true;
  state.lastTickAt = Date.now();
  tickInterval = setInterval(tick, 200);
  notify();
}

export function startTimerWithSeconds(seconds: number) {
  state.timerMs = Math.max(0, seconds * 1000);
  startTimer();
}

export function stopTimer() {
  if (!state.running) return;
  stopTimerInternal();
  notify();
}

export function resetTimer() {
  stopTimerInternal();
  state.timerMs = DEFAULT_TIMER_MS;
  notify();
}

export function configureInterval(seconds: number) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  stopIntervalInternal();
  state.intervalConfiguredMs = ms;
  state.intervalMs = ms;
  state.intervalVisible = ms > 0;
  notify();
}

export function startInterval() {
  if (state.intervalRunning || state.intervalMs <= 0) return;
  state.intervalRunning = true;
  state.intervalVisible = true;
  intervalLastTickAt = Date.now();
  if (!intervalTickHandle) {
    intervalTickHandle = setInterval(runIntervalTick, INTERVAL_TICK_RATE_MS);
  }
  notify();
}

export function stopInterval() {
  if (!state.intervalRunning) return;
  stopIntervalInternal();
  notify();
}

export function resetInterval() {
  stopIntervalInternal();
  state.intervalMs = state.intervalConfiguredMs;
  state.intervalVisible = state.intervalConfiguredMs > 0;
  notify();
}

export function setIntervalVisible(visible: boolean) {
  state.intervalVisible = visible;
  notify();
}

export function setPhaseReady() {
  resetForNextAttempt();
}

export function setConnected(judge: Judge, value: boolean) {
  state.connected[judge] = value;
  notify();
}

function resetForNextAttempt() {
  cancelAutoClear();
  state.phase = 'idle';
  resetVotesAndCards();
  state.timerMs = DEFAULT_TIMER_MS;
  stopTimerInternal();
  notify();
}

function stopTimerInternal() {
  state.running = false;
  state.lastTickAt = undefined;
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function stopIntervalInternal() {
  state.intervalRunning = false;
  intervalLastTickAt = undefined;
  if (intervalTickHandle) {
    clearInterval(intervalTickHandle);
    intervalTickHandle = null;
  }
}

function scheduleAutoClear() {
  cancelAutoClear();
  autoClearTimeout = setTimeout(() => {
    autoClearTimeout = null;
    resetForNextAttempt();
  }, AUTO_CLEAR_MS);
}

function cancelAutoClear() {
  if (autoClearTimeout) {
    clearTimeout(autoClearTimeout);
    autoClearTimeout = null;
  }
}

function tick() {
  if (!state.running) return;
  const now = Date.now();
  const last = state.lastTickAt ?? now;
  const delta = now - last;
  state.lastTickAt = now;
  state.timerMs = Math.max(0, state.timerMs - delta);
  if (state.timerMs === 0) {
    stopTimerInternal();
  }
  notify();
}

function runIntervalTick() {
  if (!state.intervalRunning) return;
  const now = Date.now();
  const last = intervalLastTickAt ?? now;
  const delta = now - last;
  intervalLastTickAt = now;
  state.intervalMs = Math.max(0, state.intervalMs - delta);
  if (state.intervalMs === 0) {
    stopIntervalInternal();
    state.intervalVisible = false;
  }
  notify();
}

function resetVotesAndCards() {
  (['left', 'center', 'right'] as Judge[]).forEach((judge) => {
    state.votes[judge] = null;
    state.cards[judge] = [];
  });
}

function allVotesCast() {
  return (['left', 'center', 'right'] as Judge[]).every((judge) => state.votes[judge] !== null);
}

function notify() {
  if (subscriber) {
    subscriber(getState());
  }
}
