import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { getWsUrl } from '@/lib/config';
import { AppState, CardValue, ClientRole, VoteValue } from '@/types/state';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface UseRoomSocketResult {
  status: ConnectionStatus;
  state: AppState | null;
  sendVote: (vote: VoteValue) => void;
  sendCard: (card: CardValue) => void;
  ready: () => void;
  release: () => void;
  clear: () => void;
  timerStart: () => void;
  timerStop: () => void;
  timerReset: () => void;
  timerSet: (seconds: number) => void;
  intervalSet: (seconds: number) => void;
  intervalStart: () => void;
  intervalStop: () => void;
  intervalReset: () => void;
  intervalShow: () => void;
  intervalHide: () => void;
}

export function useRoomSocket(role: ClientRole): UseRoomSocketResult {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [state, setState] = useState<AppState | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(getWsUrl(), {
      transports: ['websocket'],
      autoConnect: false
    });

    socket.on('connect', () => {
      setStatus('connected');
      socket.emit('client:register', { role });
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setStatus('disconnected');
    });

    socket.on('state:update', (snapshot: AppState) => {
      setState(snapshot);
    });

    setStatus('connecting');
    socket.connect();
    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [role]);

  const send = useMemo(() => {
    return (event: string, payload?: unknown) => {
      const socket = socketRef.current;
      if (!socket) return;
      socket.emit(event, payload); // fire-and-forget for simplicidade
    };
  }, []);

  const sendVote = (vote: VoteValue) => {
    send('ref:vote', { vote });
  };

  const sendCard = (card: CardValue) => {
    send('ref:card', { card });
  };

  const ready = () => send('admin:ready');
  const release = () => send('admin:release');
  const clear = () => send('admin:clear');
  const timerStart = () => send('timer:command', { action: 'start' });
  const timerStop = () => send('timer:command', { action: 'stop' });
  const timerReset = () => send('timer:command', { action: 'reset' });
  const timerSet = (seconds: number) => send('timer:command', { action: 'set', seconds });
  const intervalSet = (seconds: number) => send('interval:command', { action: 'set', seconds });
  const intervalStart = () => send('interval:command', { action: 'start' });
  const intervalStop = () => send('interval:command', { action: 'stop' });
  const intervalReset = () => send('interval:command', { action: 'reset' });
  const intervalShow = () => send('interval:command', { action: 'show' });
  const intervalHide = () => send('interval:command', { action: 'hide' });

  return {
    status,
    state,
    sendVote,
    sendCard,
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
  };
}
