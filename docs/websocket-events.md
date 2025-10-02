# WebSocket Events (Socket.IO)

Namespace: `/`  •  Rooms are joined via `room:<roomId>`

## Client → Server

| Event              | Payload                                         | Roles                           | Notes |
| ------------------ | ----------------------------------------------- | --------------------------------| ----- |
| `room:join`        | `{ roomId, role, token?, pin? }`               | all                             | Validates JWT (refs) + PIN (admin/display/jury) |
| `ref:vote`         | `{ vote: 'white' | 'red' }`                    | `side_ref_left/right`, `chief_ref` | Allowed only in `READY/ARMED`; throttled (250 ms) |
| `ref:card`         | `{ card: 1 | 2 | 3 | null }`                   | referee roles                   | After `NO LIFT`; clears with `null` |
| `control:ready`    | `null`                                         | `admin`, `chief_ref`            | Resets votes + timer state |
| `control:armed`    | `null`                                         | `admin`, `chief_ref`            | Optional pre-arm stage |
| `decision:release` | `null`                                         | `admin`, `chief_ref`            | Forces reveal (simultaneous lights) |
| `decision:clear`   | `null`                                         | `admin`                         | Clears lights + timer reset |
| `timer:action`     | `{ action: 'start' | 'stop' | 'reset' | 'set', seconds? }` | `admin`, `chief_ref` | `set` stops timer and applies new value |
| `config:update`    | Partial `RoomConfig`                           | `admin`                         | Toggle UI / autoRelease |
| `jury:override`    | `{ result: 'good' | 'no' }`                    | `jury`                          | Forces decision + stores `revealedAt` |
| `heartbeat`        | `null`                                         | any                             | Optional keep-alive every 10s |

## Server → Client

| Event          | Payload        | Description |
| -------------- | -------------- | ----------- |
| `state:update` | `RoomSnapshot` | Full room snapshot (config, decision, timer, members) |

`RoomSnapshot` structure matches TypeScript interface in `server/src/types.ts` and `frontend/src/types/room.ts`.

## Tokens & Security

- Referee tokens are JWTs (`HS256`) with 15 min expiration, generated per role.
- Display/admin/jury require PIN validation over the socket; display also receives fresh referee tokens to render QR codes.
- Rate limiting applied per socket: votes (250 ms), state controls (300–500 ms), timer (200 ms), jury override (1 s).

## Error codes

Errors returned via ACK `{ error: string }`:

- `invalid_payload`
- `token_required`
- `invalid_token`
- `pin_required`
- `invalid_pin`
- `not_allowed`
- `voting_not_allowed`
- `cards_not_available`
- `card_only_for_red`
- `rate_limited`
- `room_not_found`

Clients should surface the error to the user or retry after cooldown (`rate_limited`).
