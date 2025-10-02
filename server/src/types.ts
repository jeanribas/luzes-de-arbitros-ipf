export type Role =
  | 'admin'
  | 'chief_ref'
  | 'side_ref_left'
  | 'side_ref_right'
  | 'display'
  | 'jury';

export type RefPosition = 'left' | 'center' | 'right';

export type DecisionPhase =
  | 'IDLE'
  | 'READY'
  | 'ARMED'
  | 'DECISION_RELEASED'
  | 'LATCHED';

export type VoteValue = 'white' | 'red' | null;

export type CardValue = 1 | 2 | 3 | null;

export interface VoteState {
  value: VoteValue;
  at?: number;
  card: CardValue;
}

export interface DecisionState {
  phase: DecisionPhase;
  votes: Record<RefPosition, VoteState>;
  result: 'good' | 'no' | null;
  revealedAt?: number;
}

export interface TimerState {
  running: boolean;
  remainingMs: number;
  lastTickAt?: number;
}

export interface RoomConfig {
  showTimer: boolean;
  showLogo: boolean;
  showQRCodes: boolean;
  fullscreenHint: boolean;
  autoRelease: boolean;
}

export interface RoomMember {
  socketId: string;
  role: Role;
  joinedAt: number;
  lastSeenAt: number;
}

export interface RoomEntity {
  id: string;
  pin: string;
  createdAt: number;
  config: RoomConfig;
  decision: DecisionState;
  timer: TimerState;
  members: Map<string, RoomMember>;
  joinTokens: Map<Role, string>;
  webhookUrl?: string;
}

export interface RoomSnapshot {
  roomId: string;
  config: RoomConfig;
  decision: DecisionState;
  timer: TimerState;
  members: Array<Pick<RoomMember, 'role' | 'joinedAt' | 'lastSeenAt'>>;
  createdAt: number;
}

export interface JwtPayload {
  roomId: string;
  role: Role;
  exp: number;
}
