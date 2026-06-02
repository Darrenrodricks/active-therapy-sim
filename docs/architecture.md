# Architecture

## System overview

```
┌─────────────────────┐                                ┌──────────────────────┐
│   patient-sim       │                                │   nurse-dashboard    │
│                     │                                │                      │
│  ┌──────────────┐   │       WebSocket (Socket.io)    │   ┌──────────────┐   │
│  │ 3D scene     │   │   ◀─── vitals:update ──────   │   │ live chart   │   │
│  │ R3F + Three  │   │   ◀─── session:state ──────   │   │ Recharts     │   │
│  └──────────────┘   │   ◀─── session:alert ──────   │   └──────────────┘   │
│  ┌──────────────┐   │                                │   ┌──────────────┐   │
│  │ ramp-up      │   │   ─── patient:start ──────▶   │   │ reset panel  │   │
│  │ grounding    │   │   ─── patient:panic ──────▶   │   │ alert modal  │   │
│  │ exit btn     │   │   ─── patient:end ────────▶   │   │ event log    │   │
│  └──────────────┘   │                                │   └──────────────┘   │
│                     │                                │                      │
│                     │                                │   ─── nurse:inject_stress ──▶
│                     │                                │   ─── nurse:verify_sanitization ──▶
└─────────────────────┘                                └──────────────────────┘
            │                                                       │
            │                                                       │
            └───────────────────┐         ┌─────────────────────────┘
                                ▼         ▼
                        ┌──────────────────────────┐
                        │   server (Node + Express)│
                        │                          │
                        │  ┌────────────────────┐  │
                        │  │ socket.io router   │  │
                        │  └─────────┬──────────┘  │
                        │            │             │
                        │  ┌─────────▼──────────┐  │
                        │  │ therapy state      │  │
                        │  │ machine            │  │
                        │  └─────────┬──────────┘  │
                        │            │             │
                        │  ┌─────────▼──────────┐  │
                        │  │ vitals generator   │  │
                        │  │ (1 Hz tick)        │  │
                        │  └────────────────────┘  │
                        └──────────────────────────┘
                                    :3001
```

## Runtime flow

Every second:

1. Server's vitals generator produces a sample based on current therapy state.
2. Sample is broadcast to the session room (`session-1`) via Socket.io.
3. Both clients receive `vitals:update`. The patient app uses it to modulate
   the sphere's pulse rate; the dashboard pushes it into the rolling chart.

When the patient acts:

1. Patient app emits a domain event (`patient:start`, `patient:panic`, `patient:end`).
2. Server's state machine validates the transition (illegal ones are dropped
   with a warning log) and, if valid, updates state.
3. Server broadcasts the new state on `session:state` plus any side-effect
   alerts on `session:alert`.

When the nurse acts:

- `nurse:inject_stress` — bumps the vitals generator's internal `stressBoost`,
  which decays over a few seconds. Fires a WARNING alert.
- `nurse:verify_sanitization` — only legal from `ENDED` state, and only after
  the minimum protocol wait time has elapsed. Triggers the
  `SANITIZING → READY → IDLE` cascade with timed delays.

## State machine

```
   IDLE ──start──▶ RAMP_UP ──30s──▶ ACTIVE ──end──▶ ENDED
                       │               │              │
                       │               │              ▼
                       ├── panic ──▶ PAUSED         (gated)
                       │               │              ▼
                       │               ├── start ───▶ ACTIVE
                       │               │              │
                       │               └── end ────▶ ENDED
                       │                              │
                       └── panic ──▶ PAUSED       SANITIZING
                                                       │
                                                       ▼
                                                     READY
                                                       │
                                                       ▼
                                                     IDLE
```

Defined in `server/src/simulation/therapyStateMachine.js`. Illegal transitions
log a warning and are rejected — the state machine is the source of truth.

## Why these choices

**Socket.io over raw WebSockets.** Out-of-the-box reconnection, automatic
fallback to long-polling for restrictive networks (think hospital wifi), and
room semantics that map cleanly onto per-session broadcast. The performance
cost is irrelevant at this scale.

**Single source of truth for the event schema.** `shared/types/therapyEvents.js`
is imported by all three apps. If you rename `PATIENT_PANIC`, the rename
propagates everywhere — no silent string mismatches.

**State machine on the server, not the client.** Clients are dumb views. They
emit intent (`patient:panic`) and receive truth (`session:state`). This means
the iPad and the patient laptop can never disagree about what state therapy
is in — there's only one process making that decision.

**Vitals always tick, even during IDLE.** The dashboard shows live numbers
the moment a nurse opens it. There's no "blank screen until something
happens" UX hole.

**Smoothstep ramp-up easing.** Linear interpolation feels mechanical. A
quadratic ease-in-out makes the 30-second fade-in feel like the scene is
"arriving" rather than being scheduled.

## Network boundaries

| Origin                          | Listens on  | Talks to                |
|---------------------------------|-------------|-------------------------|
| `server`                        | `:3001`     | accepts both clients    |
| `patient-sim` (Vite dev)        | `:5173`     | `:3001` over WebSocket  |
| `nurse-dashboard` (Vite dev)    | `:5174`     | `:3001` over WebSocket  |

For local-network demos, both clients read `VITE_SERVER_URL` from their `.env`
file. Setting that to `http://192.168.x.x:3001` lets an iPad on the same wifi
connect to the laptop running the server.
