import fastifyCors from '@fastify/cors';
import Fastify from 'fastify';
import type { FastifyPluginCallback } from 'fastify';
import fastifySocketIO from 'fastify-socket.io';
import type { Server as SocketIOServer, Socket } from 'socket.io';

import { config } from './config.js';
import { RoomManager } from './rooms.js';
import {
  RoomState,
  type AppState,
  type CardValue,
  type Judge,
  type VoteValue
} from './state.js';

type Role = 'admin' | 'display' | Judge | 'viewer';

const ADMIN_ROLE: Role = 'admin';
const DISPLAY_ROLE: Role = 'display';
const VIEWER_ROLE: Role = 'viewer';
const JUDGE_ROLES: Judge[] = ['left', 'center', 'right'];

interface ClientData {
  role: Role;
  roomId?: string;
  adminPin?: string;
  refereeToken?: string;
  judgeRole?: Judge;
}

type RegistrationPayload = {
  role: Role;
  roomId: string;
  pin?: string;
  token?: string;
};

type VotePayload = {
  vote: VoteValue;
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

type ClientToServerEvents = {
  'client:register': (payload: RegistrationPayload, ack?: (response: AckResponse) => void) => void;
  'ref:vote': (payload: VotePayload, ack?: (response: AckResponse) => void) => void;
  'ref:card': (payload: CardPayload, ack?: (response: AckResponse) => void) => void;
  'admin:ready': (ack?: (response: AckResponse) => void) => void;
  'admin:release': (ack?: (response: AckResponse) => void) => void;
  'admin:clear': (ack?: (response: AckResponse) => void) => void;
  'timer:command': (payload: TimerPayload, ack?: (response: AckResponse) => void) => void;
  'interval:command': (payload: IntervalPayload, ack?: (response: AckResponse) => void) => void;
};

type ServerToClientEvents = {
  'state:update': (snapshot: AppState) => void;
};

type InterServerEvents = Record<string, never>;

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, ClientData>;

type AppSocketServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, ClientData>;

interface SocketIOPluginOptions {
  cors?: {
    origin: string | string[];
  };
}

type SocketIOPlugin = FastifyPluginCallback<SocketIOPluginOptions>;

const ROOM_CHANNEL_PREFIX = 'room:';

function roomChannel(roomId: string) {
  return `${ROOM_CHANNEL_PREFIX}${roomId}`;
}

function isAdmin(role: Role): role is typeof ADMIN_ROLE {
  return role === ADMIN_ROLE;
}

function isDisplay(role: Role): role is typeof DISPLAY_ROLE {
  return role === DISPLAY_ROLE;
}

function isJudge(role: Role): role is Judge {
  return (JUDGE_ROLES as string[]).includes(role);
}

export async function createServer() {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL
    }
  });

  await app.register(fastifyCors, {
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  });

  const socketPlugin = fastifySocketIO as unknown as SocketIOPlugin;

  await app.register(socketPlugin, {
    cors: {
      origin: config.CORS_ORIGIN === '*' ? '*' : config.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    }
  });

  const io = app.io as AppSocketServer;

  const roomManager = new RoomManager((roomId, snapshot) => {
    io.to(roomChannel(roomId)).emit('state:update', snapshot);
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.post('/rooms', async (_, reply) => {
    const data = roomManager.createRoom();
    reply.code(201);
    return data;
  });

  app.post<{
    Params: { roomId: string };
    Body: { adminPin?: string };
  }>('/rooms/:roomId/access', async (request, reply) => {
    const { roomId } = request.params;
    const { adminPin } = request.body ?? {};

    const state = roomManager.getRoomState(roomId);
    if (!state) {
      reply.code(404);
      return { error: 'room_not_found' };
    }

    if (!roomManager.verifyAdminPin(roomId, adminPin)) {
      reply.code(403);
      return { error: 'invalid_pin' };
    }

    const payload = roomManager.getRoomAccess(roomId, adminPin!);
    if (!payload) {
      reply.code(500);
      return { error: 'unknown_error' };
    }

    return payload;
  });

  app.post<{
    Params: { roomId: string };
    Body: { adminPin?: string };
  }>('/rooms/:roomId/refresh-ref-tokens', async (request, reply) => {
    const { roomId } = request.params;
    const { adminPin } = request.body ?? {};

    const state = roomManager.getRoomState(roomId);
    if (!state) {
      reply.code(404);
      return { error: 'room_not_found' };
    }

    if (!roomManager.verifyAdminPin(roomId, adminPin)) {
      reply.code(403);
      return { error: 'invalid_pin' };
    }

    const payload = roomManager.rotateRefereeTokens(roomId);
    if (!payload) {
      reply.code(500);
      return { error: 'unknown_error' };
    }

    return payload;
  });

  io.on('connection', (socket: AppSocket) => {
    socket.data = { role: VIEWER_ROLE };

    socket.on('client:register', (payload, ack) => {
      if (!payload || !payload.roomId || !payload.role) {
        ack?.({ error: 'invalid_payload' });
        return;
      }

      const state = roomManager.getRoomState(payload.roomId);
      if (!state) {
        ack?.({ error: 'room_not_found' });
        return;
      }

      if (isAdmin(payload.role) || isDisplay(payload.role)) {
        if (!roomManager.verifyAdminPin(payload.roomId, payload.pin)) {
          ack?.({ error: 'invalid_pin' });
          return;
        }
      }

      if (isJudge(payload.role)) {
        if (!roomManager.isValidRefToken(payload.roomId, payload.role, payload.token)) {
          ack?.({ error: 'invalid_token' });
          return;
        }
      }

      if (isJudge(socket.data.role) && socket.data.roomId) {
        const previousState = roomManager.getRoomState(socket.data.roomId);
        if (previousState && socket.data.judgeRole) {
          previousState.setConnected(socket.data.judgeRole, false);
        }
      }

      if (socket.data.roomId) {
        socket.leave(roomChannel(socket.data.roomId));
      }

      socket.join(roomChannel(payload.roomId));
      socket.data.role = payload.role;
      socket.data.roomId = payload.roomId;
      socket.data.adminPin = payload.pin;
      socket.data.refereeToken = payload.token;
      socket.data.judgeRole = isJudge(payload.role) ? payload.role : undefined;

      if (socket.data.judgeRole) {
        state.setConnected(socket.data.judgeRole, true);
      }

      ack?.({ ok: true });
      socket.emit('state:update', state.getSnapshot());
    });

    socket.on('ref:vote', (payload, ack) => {
      const judgeContext = ensureJudgeContext(socket, roomManager);
      if (!judgeContext.ok) {
        ack?.({ error: judgeContext.error });
        return;
      }
      judgeContext.state.setVote(judgeContext.judge, payload.vote);
      ack?.({ ok: true });
    });

    socket.on('ref:card', (payload, ack) => {
      const judgeContext = ensureJudgeContext(socket, roomManager);
      if (!judgeContext.ok) {
        ack?.({ error: judgeContext.error });
        return;
      }
      judgeContext.state.setCard(judgeContext.judge, payload.card);
      ack?.({ ok: true });
    });

    socket.on('admin:ready', (ack) => {
      const adminContext = ensureAdminContext(socket, roomManager);
      if (!adminContext.ok) {
        ack?.({ error: adminContext.error });
        return;
      }
      adminContext.state.setPhaseReady();
      ack?.({ ok: true });
    });

    socket.on('admin:release', (ack) => {
      const adminContext = ensureAdminContext(socket, roomManager);
      if (!adminContext.ok) {
        ack?.({ error: adminContext.error });
        return;
      }
      adminContext.state.releaseDecision();
      ack?.({ ok: true });
    });

    socket.on('admin:clear', (ack) => {
      const adminContext = ensureAdminContext(socket, roomManager);
      if (!adminContext.ok) {
        ack?.({ error: adminContext.error });
        return;
      }
      adminContext.state.clearDecision();
      ack?.({ ok: true });
    });

    socket.on('timer:command', (payload, ack) => {
      const timerContext = ensureTimerControllerContext(socket, roomManager);
      if (!timerContext.ok) {
        ack?.({ error: timerContext.error });
        return;
      }

      switch (payload.action) {
        case 'start':
          timerContext.state.startTimer();
          break;
        case 'stop':
          timerContext.state.stopTimer();
          break;
        case 'reset':
          timerContext.state.resetTimer();
          break;
        case 'set':
          timerContext.state.startTimerWithSeconds(payload.seconds ?? 60);
          break;
        default:
          ack?.({ error: 'unknown_action' });
          return;
      }

      ack?.({ ok: true });
    });

    socket.on('interval:command', (payload, ack) => {
      const adminContext = ensureAdminContext(socket, roomManager);
      if (!adminContext.ok) {
        ack?.({ error: adminContext.error });
        return;
      }

      switch (payload.action) {
        case 'start':
          adminContext.state.startInterval();
          break;
        case 'stop':
          adminContext.state.stopInterval();
          break;
        case 'reset':
          adminContext.state.resetInterval();
          break;
        case 'set':
          adminContext.state.configureInterval(payload.seconds ?? 0);
          break;
        case 'show':
          adminContext.state.setIntervalVisible(true);
          break;
        case 'hide':
          adminContext.state.setIntervalVisible(false);
          break;
        default:
          ack?.({ error: 'unknown_action' });
          return;
      }

      ack?.({ ok: true });
    });

    socket.on('disconnect', (reason: string) => {
      app.log.info({ event: 'disconnect', role: socket.data.role, reason });
      const { roomId, judgeRole } = socket.data;
      if (roomId && judgeRole) {
        const state = roomManager.getRoomState(roomId);
        state?.setConnected(judgeRole, false);
      }
    });
  });

  return app;
}

function ensureJudgeContext(socket: AppSocket, roomManager: RoomManager) {
  const { role, roomId, refereeToken, judgeRole } = socket.data;
  if (!roomId || !judgeRole || !isJudge(role)) {
    return { ok: false as const, error: 'not_authorised' };
  }
  if (!roomManager.isValidRefToken(roomId, judgeRole, refereeToken)) {
    return { ok: false as const, error: 'invalid_token' };
  }
  const state = roomManager.getRoomState(roomId);
  if (!state) {
    return { ok: false as const, error: 'room_not_found' };
  }
  return { ok: true as const, state, judge: judgeRole };
}

function ensureAdminContext(socket: AppSocket, roomManager: RoomManager) {
  const { role, roomId, adminPin } = socket.data;
  if (!roomId || !(isAdmin(role) || isDisplay(role))) {
    return { ok: false as const, error: 'not_authorised' };
  }
  if (!roomManager.verifyAdminPin(roomId, adminPin)) {
    return { ok: false as const, error: 'invalid_pin' };
  }
  const state = roomManager.getRoomState(roomId);
  if (!state) {
    return { ok: false as const, error: 'room_not_found' };
  }
  return { ok: true as const, state };
}

function ensureTimerControllerContext(socket: AppSocket, roomManager: RoomManager) {
  const { role, roomId, adminPin, refereeToken, judgeRole } = socket.data;
  if (!roomId) {
    return { ok: false as const, error: 'not_authorised' };
  }

  if (isAdmin(role) || isDisplay(role)) {
    if (!roomManager.verifyAdminPin(roomId, adminPin)) {
      return { ok: false as const, error: 'invalid_pin' };
    }
    const state = roomManager.getRoomState(roomId);
    if (!state) {
      return { ok: false as const, error: 'room_not_found' };
    }
    return { ok: true as const, state };
  }

  if (isJudge(role) && judgeRole === 'center') {
    if (!roomManager.isValidRefToken(roomId, judgeRole, refereeToken)) {
      return { ok: false as const, error: 'invalid_token' };
    }
    const state = roomManager.getRoomState(roomId);
    if (!state) {
      return { ok: false as const, error: 'room_not_found' };
    }
    return { ok: true as const, state };
  }

  return { ok: false as const, error: 'not_authorised' };
}
