# Event schema

Every socket event flowing through the system. Defined in
`shared/types/therapyEvents.js` and imported by server, patient app, and
dashboard so naming is impossible to get wrong.

## Naming convention

| Prefix      | Direction              | Example              |
|-------------|------------------------|----------------------|
| `patient:`  | patient app → server   | `patient:panic`      |
| `nurse:`    | dashboard → server     | `nurse:inject_stress`|
| `session:`  | server → all clients   | `session:state`      |
| `vitals:`   | server → all clients   | `vitals:update`      |

## Patient → server

### `patient:join`
Sent immediately on connect. Tags the socket as a patient client. No payload.

### `patient:start_therapy`
Patient pressed "Begin" on the start screen. Server transitions `IDLE → RAMP_UP`.
Also used to resume from `PAUSED`. No payload.

### `patient:panic`
Patient pressed spacebar during therapy. Server transitions
`RAMP_UP | ACTIVE → PAUSED`. Fires a CRITICAL alert to the dashboard. No payload.

### `patient:end_therapy`
Patient ended the session voluntarily (from grounding mode or via the exit
button). Server transitions to `ENDED`, fires the "Device in Triage" info
alert. No payload.

## Nurse → server

### `nurse:join`
Sent on connect. Tags the socket as a nurse client. No payload.

### `nurse:inject_stress`
Demo control — bumps the vitals generator's internal stress boost. The boost
decays over ~5 seconds. Fires a WARNING alert. No payload.

### `nurse:verify_sanitization`
Confirms the SENSORA Reset Protocol is complete. Only legal from `ENDED`
state, and only after `SESSION.RESET_PROTOCOL_MIN_WAIT_MS` has elapsed.
Triggers `ENDED → SANITIZING → READY → IDLE` with timed delays. No payload.

## Server → all

### `vitals:update`
Sent every `SESSION.VITALS_INTERVAL_MS` (1000ms by default). Payload:

```js
{
  heartRate: 72,           // bpm, integer
  respiration: 14.8,       // breaths/min, one decimal
  stress: 23,              // 0..100 normalized
  therapyState: "ACTIVE",  // one of THERAPY_STATE
  timestamp: 1717000000000 // ms since epoch
}
```

### `session:state`
Sent on every state transition, and once when a client connects so it has
the current state immediately. Payload:

```js
{
  state: "RAMP_UP",        // one of THERAPY_STATE
  timestamp: 1717000000000,
  patient: {
    name: "Patient A",
    room: "Room 4",
    sessionId: "session-1"
  }
}
```

### `session:alert`
Sent when something the nurse should know about happens. Payload:

```js
{
  level: "CRITICAL",                              // INFO | WARNING | CRITICAL
  message: "Patient Interrupted Therapy — Room 4",
  room: "Room 4",
  timestamp: 1717000000000
}
```

## Therapy state values

Defined in `THERAPY_STATE`:

| State        | Meaning                                                       |
|--------------|---------------------------------------------------------------|
| `IDLE`       | No active session. Ready for a patient to start.              |
| `RAMP_UP`    | First 30s of therapy. Scene fading in.                        |
| `ACTIVE`     | Full therapy in progress.                                     |
| `PAUSED`     | Patient hit panic. Critical alert on dashboard.               |
| `ENDED`      | Session ended. Awaiting nurse confirmation of sanitization.   |
| `SANITIZING` | Nurse acknowledged; final reset step in progress.             |
| `READY`      | Cleared for next patient. Transitions to `IDLE` automatically. |

## Alert levels

| Level      | Visual                              | Sound        |
|------------|-------------------------------------|--------------|
| `INFO`     | Blue dot in event log               | none         |
| `WARNING`  | Yellow dot in event log             | none         |
| `CRITICAL` | Full-screen flashing modal + dot    | soft ping    |
