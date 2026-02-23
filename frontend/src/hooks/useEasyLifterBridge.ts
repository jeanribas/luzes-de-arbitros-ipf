import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import type { AppLocale } from '@/lib/i18n/config';
import type { AppState, Phase } from '@/types/state';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

type EasyLifterDecision = [number, number, number, number];

interface EasyLifterRefsPayload {
  left?: unknown;
  center?: unknown;
  right?: unknown;
}

interface EasyLifterConnectionPayload {
  uiConfigs?: {
    uiMode?: number;
  };
  refLights?: {
    refs?: EasyLifterRefsPayload;
  };
}

interface UseEasyLifterBridgeOptions {
  enabled: boolean;
  origin?: string;
  meetCode?: string;
  locale?: AppLocale;
  revealDelayMs?: number;
  crossTabSync?: boolean;
}

interface UseEasyLifterBridgeResult {
  status: ConnectionStatus;
  state: AppState | null;
  error: string | null;
}

type EasyLifterUiMode = 'competition' | 'between';

const JUDGES = ['left', 'center', 'right'] as const;
const DEFAULT_ORIGIN = 'https://easyliftersoftware.com';
const DEFAULT_TIMER_MS = 60_000;
const BETWEEN_ROUNDS_TIMER_MS = 10 * 60_000;
const DEFAULT_REVEAL_DELAY_MS = 750;
const EASYLIFTER_UI_MODE_BETWEEN = 2;
const BRIDGE_SYNC_MAX_AGE_MS = 30_000;
const EASYLIFTER_TIMER_STATUS_STOPPED = 0;
const EASYLIFTER_TIMER_STATUS_RUNNING = 1;
const EASYLIFTER_TIMER_STATUS_PAUSED = 2;
const EASYLIFTER_TIMER_STATUS_EXPIRED = 3;

const EMPTY_DECISION: EasyLifterDecision = [0, 0, 0, 0];

type Judge = (typeof JUDGES)[number];

type DecisionsByJudge = Record<Judge, EasyLifterDecision>;

interface TimerState {
  remainingMs: number;
  running: boolean;
  endAt: number | null;
}

interface BridgeSyncSnapshot {
  updatedAt: number;
  uiMode: EasyLifterUiMode;
  intervalConfiguredMs: number;
  timerRemainingMs: number;
  timerRunning: boolean;
  decisions: DecisionsByJudge;
  phase: Phase;
}

const EMPTY_DECISIONS: DecisionsByJudge = {
  left: EMPTY_DECISION,
  center: EMPTY_DECISION,
  right: EMPTY_DECISION
};

function parseDecision(input: unknown): EasyLifterDecision {
  if (!Array.isArray(input)) return EMPTY_DECISION;
  return [
    input[0] === 1 ? 1 : 0,
    input[1] === 1 ? 1 : 0,
    input[2] === 1 ? 1 : 0,
    input[3] === 1 ? 1 : 0
  ];
}

function parseRefs(payload: unknown): DecisionsByJudge {
  const refs = (payload ?? {}) as EasyLifterRefsPayload;
  return {
    left: parseDecision(refs.left),
    center: parseDecision(refs.center),
    right: parseDecision(refs.right)
  };
}

function hasDecision(decision: EasyLifterDecision) {
  return decision.includes(1);
}

function decisionToVote(decision: EasyLifterDecision): 'white' | 'red' | null {
  if (decision[0] === 1) return 'white';
  if (decision[1] === 1 || decision[2] === 1 || decision[3] === 1) return 'red';
  return null;
}

function decisionToCards(decision: EasyLifterDecision): Array<1 | 2 | 3> {
  const cards: Array<1 | 2 | 3> = [];
  if (decision[1] === 1) cards.push(1);
  if (decision[2] === 1) cards.push(2);
  if (decision[3] === 1) cards.push(3);
  return cards;
}

function normalizeTimerMs(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return DEFAULT_TIMER_MS;
  return Math.max(0, Math.round(numeric));
}

function parseTimerTextToMs(value: unknown): number | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(':');
  if (parts.length !== 2 && parts.length !== 3) return null;

  if (parts.some((part) => !/^\d+$/.test(part))) return null;

  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
    return Math.max(0, Math.round((minutes * 60 + seconds) * 1000));
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
  return Math.max(0, Math.round((hours * 3600 + minutes * 60 + seconds) * 1000));
}

function resolveTimerRunning(status: unknown, previousRunning: boolean, remainingMs: number) {
  const numericStatus = Number(status);
  if (numericStatus === EASYLIFTER_TIMER_STATUS_RUNNING) {
    return remainingMs > 0;
  }
  if (
    numericStatus === EASYLIFTER_TIMER_STATUS_STOPPED ||
    numericStatus === EASYLIFTER_TIMER_STATUS_PAUSED ||
    numericStatus === EASYLIFTER_TIMER_STATUS_EXPIRED
  ) {
    return false;
  }
  return previousRunning && remainingMs > 0;
}

function resolveDefaultTimer(payload: EasyLifterConnectionPayload | undefined) {
  const uiMode = Number(payload?.uiConfigs?.uiMode ?? 1);
  if (uiMode === EASYLIFTER_UI_MODE_BETWEEN) {
    return BETWEEN_ROUNDS_TIMER_MS;
  }
  return DEFAULT_TIMER_MS;
}

function parseUiMode(value: unknown): EasyLifterUiMode {
  const numeric = Number(value);
  return numeric === EASYLIFTER_UI_MODE_BETWEEN ? 'between' : 'competition';
}

function getBridgeSyncStorageKey(origin: string, meetCode: string) {
  return `easyLifterBridge:${origin}:${meetCode}`;
}

function parseBridgeSyncSnapshot(value: string | null): BridgeSyncSnapshot | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<BridgeSyncSnapshot>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.updatedAt !== 'number') return null;
    if (parsed.uiMode !== 'competition' && parsed.uiMode !== 'between') return null;
    if (typeof parsed.intervalConfiguredMs !== 'number') return null;
    if (typeof parsed.timerRemainingMs !== 'number') return null;
    if (typeof parsed.timerRunning !== 'boolean') return null;
    if (parsed.phase !== 'idle' && parsed.phase !== 'revealed') return null;

    const decisions = parsed.decisions as DecisionsByJudge | undefined;
    if (!decisions) return null;

    const validDecisions = JUDGES.every((judge) => {
      const decision = decisions[judge];
      return Array.isArray(decision) && decision.length === 4;
    });

    if (!validDecisions) return null;

    return {
      updatedAt: parsed.updatedAt,
      uiMode: parsed.uiMode,
      intervalConfiguredMs: Math.max(0, Math.round(parsed.intervalConfiguredMs)),
      timerRemainingMs: Math.max(0, Math.round(parsed.timerRemainingMs)),
      timerRunning: parsed.timerRunning,
      decisions: {
        left: parseDecision(decisions.left),
        center: parseDecision(decisions.center),
        right: parseDecision(decisions.right)
      },
      phase: parsed.phase
    };
  } catch {
    return null;
  }
}

export function useEasyLifterBridge(options: UseEasyLifterBridgeOptions): UseEasyLifterBridgeResult {
  const {
    enabled,
    origin = DEFAULT_ORIGIN,
    meetCode,
    locale = 'pt-BR',
    revealDelayMs = DEFAULT_REVEAL_DELAY_MS,
    crossTabSync = true
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<DecisionsByJudge>(EMPTY_DECISIONS);
  const [phase, setPhase] = useState<Phase>('idle');
  const [uiMode, setUiMode] = useState<EasyLifterUiMode>('competition');
  const [timerState, setTimerState] = useState<TimerState>({
    remainingMs: DEFAULT_TIMER_MS,
    running: false,
    endAt: null
  });
  const [intervalConfiguredMs, setIntervalConfiguredMs] = useState(BETWEEN_ROUNDS_TIMER_MS);
  const [remoteTimerDriven, setRemoteTimerDriven] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const uiModeRef = useRef<EasyLifterUiMode>(uiMode);
  const lastSyncUpdatedAtRef = useRef(0);
  const statusRef = useRef<ConnectionStatus>(status);
  const lastRemoteTimerUpdateAtRef = useRef(0);

  useEffect(() => {
    uiModeRef.current = uiMode;
  }, [uiMode]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!crossTabSync || !enabled || !meetCode || typeof window === 'undefined') return;
    const key = getBridgeSyncStorageKey(origin, meetCode);
    const applySnapshot = (snapshot: BridgeSyncSnapshot) => {
      if (snapshot.updatedAt <= lastSyncUpdatedAtRef.current) return;
      if (Date.now() - snapshot.updatedAt > BRIDGE_SYNC_MAX_AGE_MS) return;

      lastSyncUpdatedAtRef.current = snapshot.updatedAt;
      setUiMode(snapshot.uiMode);
      setDecisions(snapshot.decisions);
      setPhase(snapshot.phase);
      setIntervalConfiguredMs(snapshot.intervalConfiguredMs);
      setRemoteTimerDriven(false);

      const now = Date.now();
      const elapsedMs = Math.max(0, now - snapshot.updatedAt);
      const remainingMs = snapshot.timerRunning
        ? Math.max(0, snapshot.timerRemainingMs - elapsedMs)
        : snapshot.timerRemainingMs;
      const running = snapshot.timerRunning && remainingMs > 0;

      setTimerState({
        remainingMs,
        running,
        endAt: running ? now + remainingMs : null
      });
    };

    const initialSnapshot = parseBridgeSyncSnapshot(window.localStorage.getItem(key));
    if (initialSnapshot) {
      applySnapshot(initialSnapshot);
    }

    const onStorage = (event: StorageEvent) => {
      if (statusRef.current === 'connected') return;
      if (event.key !== key) return;
      const nextSnapshot = parseBridgeSyncSnapshot(event.newValue);
      if (!nextSnapshot) return;
      applySnapshot(nextSnapshot);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [crossTabSync, enabled, meetCode, origin]);

  useEffect(() => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    const allReady = JUDGES.every((judge) => hasDecision(decisions[judge]));
    const anyReady = JUDGES.some((judge) => hasDecision(decisions[judge]));

    if (!anyReady || !allReady) {
      setPhase('idle');
      return;
    }

    revealTimeoutRef.current = window.setTimeout(() => {
      setPhase('revealed');
      revealTimeoutRef.current = null;
    }, revealDelayMs);

    return () => {
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = null;
      }
    };
  }, [decisions, revealDelayMs]);

  useEffect(() => {
    if (remoteTimerDriven || !timerState.running || timerState.endAt === null) return;

    const interval = window.setInterval(() => {
      setTimerState((previous) => {
        if (!previous.running || previous.endAt === null) {
          return previous;
        }
        const remainingMs = Math.max(0, previous.endAt - Date.now());
        if (remainingMs === 0) {
          return {
            remainingMs: 0,
            running: false,
            endAt: null
          };
        }
        return {
          ...previous,
          remainingMs
        };
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [remoteTimerDriven, timerState.running, timerState.endAt]);

  const timerRemainingSeconds = useMemo(
    () => Math.round(timerState.remainingMs / 1000),
    [timerState.remainingMs]
  );
  const roundedTimerRemainingMs = useMemo(
    () => Math.max(0, timerRemainingSeconds * 1000),
    [timerRemainingSeconds]
  );

  useEffect(() => {
    if (!crossTabSync || !enabled || !meetCode || typeof window === 'undefined') return;

    const updatedAt = Date.now();
    if (updatedAt <= lastSyncUpdatedAtRef.current) return;

    const snapshot: BridgeSyncSnapshot = {
      updatedAt,
      uiMode,
      intervalConfiguredMs,
      timerRemainingMs: roundedTimerRemainingMs,
      timerRunning: timerState.running,
      decisions,
      phase
    };

    const key = getBridgeSyncStorageKey(origin, meetCode);
    window.localStorage.setItem(key, JSON.stringify(snapshot));
    lastSyncUpdatedAtRef.current = updatedAt;
  }, [
    crossTabSync,
    decisions,
    enabled,
    intervalConfiguredMs,
    meetCode,
    origin,
    phase,
    roundedTimerRemainingMs,
    timerState.running,
    uiMode,
    timerRemainingSeconds
  ]);

  useEffect(() => {
    if (!remoteTimerDriven || !timerState.running) return;

    const watchdog = window.setInterval(() => {
      const staleMs = Date.now() - lastRemoteTimerUpdateAtRef.current;
      if (staleMs < 1_500) return;

      setRemoteTimerDriven(false);
      setTimerState((previous) => {
        if (!previous.running) {
          return {
            ...previous,
            endAt: null
          };
        }

        return {
          ...previous,
          endAt: Date.now() + Math.max(0, previous.remainingMs)
        };
      });
    }, 300);

    return () => window.clearInterval(watchdog);
  }, [remoteTimerDriven, timerState.running]);

  useEffect(() => {
    if (!enabled || !meetCode) {
      setStatus('disconnected');
      setError(null);
      setDecisions(EMPTY_DECISIONS);
      setPhase('idle');
      setUiMode('competition');
      setIntervalConfiguredMs(BETWEEN_ROUNDS_TIMER_MS);
      setRemoteTimerDriven(false);
      lastRemoteTimerUpdateAtRef.current = 0;
      setTimerState({
        remainingMs: DEFAULT_TIMER_MS,
        running: false,
        endAt: null
      });
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(origin, {
      transports: ['websocket'],
      autoConnect: false,
      query: { meet: meetCode }
    });

    socket.on('connect', () => {
      setStatus('connected');
      setError(null);
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('connect_error', (err: Error) => {
      setStatus('disconnected');
      setError(err.message);
    });

    socket.on('connectionSuccessful', (_message: string, payload?: EasyLifterConnectionPayload) => {
      setError(null);
      const nextMode = parseUiMode(payload?.uiConfigs?.uiMode);
      const defaultTimer = resolveDefaultTimer(payload);
      setUiMode(nextMode);
      setDecisions(parseRefs(payload?.refLights?.refs));
      setIntervalConfiguredMs(defaultTimer);
      setRemoteTimerDriven(false);
      lastRemoteTimerUpdateAtRef.current = 0;
      setTimerState({
        remainingMs: defaultTimer,
        running: false,
        endAt: null
      });
    });

    socket.on('notifyClientDecisions', (payload: EasyLifterRefsPayload) => {
      setDecisions(parseRefs(payload));
    });

    socket.on('newUiConfigs', (configs: { uiMode?: number } | undefined) => {
      const nextMode = parseUiMode(configs?.uiMode);
      setUiMode((previousMode) => {
        if (previousMode !== nextMode) {
          if (nextMode === 'between') {
            setDecisions(EMPTY_DECISIONS);
            setRemoteTimerDriven(false);
            lastRemoteTimerUpdateAtRef.current = 0;
            setTimerState({
              remainingMs: BETWEEN_ROUNDS_TIMER_MS,
              running: false,
              endAt: null
            });
            setIntervalConfiguredMs(BETWEEN_ROUNDS_TIMER_MS);
          } else {
            setRemoteTimerDriven(false);
            lastRemoteTimerUpdateAtRef.current = 0;
            setTimerState({
              remainingMs: DEFAULT_TIMER_MS,
              running: false,
              endAt: null
            });
          }
        }
        return nextMode;
      });
    });

    socket.on('updateTimer', (...args: unknown[]) => {
      const firstArgTextMs = parseTimerTextToMs(args[0]);
      const secondArgTextMs = parseTimerTextToMs(args[1]);

      const remainingMs = secondArgTextMs ?? firstArgTextMs;
      if (remainingMs === null) return;
      setRemoteTimerDriven(true);
      lastRemoteTimerUpdateAtRef.current = Date.now();

      const status = secondArgTextMs !== null ? args[0] : undefined;

      setTimerState((previous) => {
        const running = resolveTimerRunning(status, previous.running, remainingMs);
        return {
          remainingMs,
          running,
          endAt: running ? Date.now() + remainingMs : null
        };
      });
    });

    socket.on('startNewTimer', (millis: unknown) => {
      const normalizedMs = normalizeTimerMs(millis);
      setRemoteTimerDriven(false);
      lastRemoteTimerUpdateAtRef.current = 0;
      if (uiModeRef.current === 'between') {
        setIntervalConfiguredMs(normalizedMs);
      }
      setTimerState({
        remainingMs: normalizedMs,
        running: true,
        endAt: Date.now() + normalizedMs
      });
    });

    const stopTimer = () => {
      setTimerState((previous) => {
        if (!previous.running && previous.endAt === null) return previous;
        return {
          ...previous,
          running: false,
          endAt: null
        };
      });
    };

    socket.on('pauseTimer', stopTimer);
    socket.on('stopTimer', stopTimer);
    socket.on('timerPaused', stopTimer);
    socket.on('timerStopped', stopTimer);

    setStatus('connecting');
    socket.connect();
    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, meetCode, origin]);

  const state = useMemo<AppState | null>(() => {
    if (!enabled || !meetCode) return null;

    return {
      phase,
      votes: {
        left: decisionToVote(decisions.left),
        center: decisionToVote(decisions.center),
        right: decisionToVote(decisions.right)
      },
      cards: {
        left: decisionToCards(decisions.left),
        center: decisionToCards(decisions.center),
        right: decisionToCards(decisions.right)
      },
      timerMs: Math.max(0, Math.round(timerState.remainingMs)),
      running: timerState.running,
      connected: {
        left: status === 'connected',
        center: status === 'connected',
        right: status === 'connected'
      },
      intervalMs: uiMode === 'between' ? Math.max(0, Math.round(timerState.remainingMs)) : 0,
      intervalConfiguredMs: uiMode === 'between' ? intervalConfiguredMs : 0,
      intervalRunning: uiMode === 'between' ? timerState.running : false,
      intervalVisible: uiMode === 'between',
      locale,
      legendConfig: {
        bgColor: 'transparent',
        timerColor: '#FFFFFF',
        digitMode: 'hhmmss',
        showPlaceholders: true,
        showDashedFrame: true,
        keepAwake: true
      }
    };
  }, [
    decisions,
    enabled,
    intervalConfiguredMs,
    locale,
    meetCode,
    phase,
    status,
    timerState.remainingMs,
    timerState.running,
    uiMode
  ]);

  return {
    status,
    state,
    error
  };
}
