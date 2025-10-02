import fastifyCors from '@fastify/cors';
import Fastify from 'fastify';
import fastifySocketIO from 'fastify-socket.io';

import { config } from './config.js';
import {
  CardValue,
  Judge,
  clearDecision,
  getState,
  releaseDecision,
  resetTimer,
  configureInterval,
  resetInterval,
  setIntervalVisible,
  setCard,
  setConnected,
  setPhaseReady,
  setStateListener,
  setVote,
  startInterval,
  startTimer,
  startTimerWithSeconds,
  stopInterval,
  stopTimer
} from './state.js';

const ADMIN_ROLE = 'admin';
const DISPLAY_ROLE = 'display';
const JUDGE_ROLES: Judge[] = ['left', 'center', 'right'];

interface ClientData {
  role: typeof ADMIN_ROLE | typeof DISPLAY_ROLE | Judge | 'viewer';
}

type RegistrationPayload = {
  role: ClientData['role'];
};

type VotePayload = {
  vote: 'white' | 'red';
};

type CardPayload = {
  card: CardValue;
};

type TimerPayload = {
  action: 'start' | 'stop' | 'reset' | 'set';
  seconds?: number;
};

type IntervalPayload = {
  action: 'start' | 'stop' | 'reset' | 'set' | 'show' | 'hide';
  seconds?: number;
};

type AckResponse = { ok: true } | { error: string };

export async function createServer() {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL
    }
  });

  await app.register(fastifyCors, {
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  });

  await app.register(fastifySocketIO as unknown as any, {
    cors: {
      origin: config.CORS_ORIGIN === '*' ? '*' : config.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    }
  });

  setStateListener((snapshot) => {
    app.io.emit('state:update', snapshot);
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.io.on('connection', (socket: any) => {
    socket.data = { role: 'viewer' } as ClientData;

    socket.emit('state:update', getState());

    socket.on('client:register', (payload: RegistrationPayload) => {
      socket.data.role = payload.role;
      if (isJudge(payload.role)) {
        setConnected(payload.role, true);
      }
      socket.emit('state:update', getState());
    });

    socket.on('ref:vote', (payload: VotePayload, ack?: (response: AckResponse) => void) => {
      const judge = socket.data.role;
      if (!isJudge(judge)) {
        return ack?.({ error: 'not_authorised' });
      }
      setVote(judge, payload.vote);
      ack?.({ ok: true });
    });

    socket.on('ref:card', (payload: CardPayload, ack?: (response: AckResponse) => void) => {
      const judge = socket.data.role;
      if (!isJudge(judge)) {
        return ack?.({ error: 'not_authorised' });
      }
      setCard(judge, payload.card);
      ack?.({ ok: true });
    });

    socket.on('admin:ready', (ack?: (response: AckResponse) => void) => {
      if (!isAdmin(socket.data.role)) {
        return ack?.({ error: 'not_authorised' });
      }
      setPhaseReady();
      ack?.({ ok: true });
    });

    socket.on('admin:release', (ack?: (response: AckResponse) => void) => {
      if (!isAdmin(socket.data.role)) {
        return ack?.({ error: 'not_authorised' });
      }
      releaseDecision();
      ack?.({ ok: true });
    });

    socket.on('admin:clear', (ack?: (response: AckResponse) => void) => {
      if (!isAdmin(socket.data.role)) {
        return ack?.({ error: 'not_authorised' });
      }
      clearDecision();
      ack?.({ ok: true });
    });

    socket.on('timer:command', (payload: TimerPayload, ack?: (response: AckResponse) => void) => {
      if (!canControlTimer(socket.data.role)) {
        return ack?.({ error: 'not_authorised' });
      }
      switch (payload.action) {
        case 'start':
          startTimer();
          break;
        case 'stop':
          stopTimer();
          break;
        case 'reset':
          resetTimer();
          break;
        case 'set':
          startTimerWithSeconds(payload.seconds ?? 60);
          break;
        default:
          return ack?.({ error: 'unknown_action' });
      }
      ack?.({ ok: true });
    });

    socket.on('interval:command', (payload: IntervalPayload, ack?: (response: AckResponse) => void) => {
      if (!isAdmin(socket.data.role)) {
        return ack?.({ error: 'not_authorised' });
      }

      switch (payload.action) {
        case 'start':
          startInterval();
          break;
        case 'stop':
          stopInterval();
          break;
        case 'reset':
          resetInterval();
          break;
        case 'set':
          configureInterval(payload.seconds ?? 0);
          break;
        case 'show':
          setIntervalVisible(true);
          break;
        case 'hide':
          setIntervalVisible(false);
          break;
        default:
          return ack?.({ error: 'unknown_action' });
      }

      ack?.({ ok: true });
    });

    socket.on('disconnect', (reason: string) => {
      app.log.info({ event: 'disconnect', role: socket.data.role, reason });
      const role = socket.data.role;
      if (isJudge(role)) {
        setConnected(role, false);
      }
    });
  });

  return app;
}

function isAdmin(role: ClientData['role']): role is typeof ADMIN_ROLE {
  return role === ADMIN_ROLE;
}

function isJudge(role: ClientData['role']): role is Judge {
  return (JUDGE_ROLES as string[]).includes(role);
}

function canControlTimer(role: ClientData['role']) {
  return role === ADMIN_ROLE || role === 'center';
}
