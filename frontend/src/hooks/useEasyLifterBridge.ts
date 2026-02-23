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

const EMPTY_DECISION: EasyLifterDecision = [0, 0, 0, 0];

type Judge = (typeof JUDGES)[number];

type DecisionsByJudge = Record<Judge, EasyLifterDecision>;

interface TimerState {
  remainingMs: number;
  running: boolean;
  endAt: number | null;
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

export function useEasyLifterBridge(options: UseEasyLifterBridgeOptions): UseEasyLifterBridgeResult {
  const {
    enabled,
    origin = DEFAULT_ORIGIN,
    meetCode,
    locale = 'pt-BR',
    revealDelayMs = DEFAULT_REVEAL_DELAY_MS
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

  const socketRef = useRef<Socket | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const uiModeRef = useRef<EasyLifterUiMode>(uiMode);

  useEffect(() => {
    uiModeRef.current = uiMode;
  }, [uiMode]);

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
    if (!timerState.running || timerState.endAt === null) return;

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
  }, [timerState.running, timerState.endAt]);

  useEffect(() => {
    if (!enabled || !meetCode) {
      setStatus('disconnected');
      setError(null);
      setDecisions(EMPTY_DECISIONS);
      setPhase('idle');
      setUiMode('competition');
      setIntervalConfiguredMs(BETWEEN_ROUNDS_TIMER_MS);
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
      const shouldRunByDefault = nextMode === 'between';
      setTimerState({
        remainingMs: defaultTimer,
        running: shouldRunByDefault,
        endAt: shouldRunByDefault ? Date.now() + defaultTimer : null
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
            setTimerState({
              remainingMs: BETWEEN_ROUNDS_TIMER_MS,
              running: true,
              endAt: Date.now() + BETWEEN_ROUNDS_TIMER_MS
            });
            setIntervalConfiguredMs(BETWEEN_ROUNDS_TIMER_MS);
          } else {
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

    socket.on('startNewTimer', (millis: unknown) => {
      const normalizedMs = normalizeTimerMs(millis);
      if (uiModeRef.current === 'between') {
        setIntervalConfiguredMs(normalizedMs);
      }
      setTimerState({
        remainingMs: normalizedMs,
        running: true,
        endAt: Date.now() + normalizedMs
      });
    });

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
      locale
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
