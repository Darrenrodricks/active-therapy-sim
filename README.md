# SENSORA — Active Therapy Simulator

A distributed real-time simulation of the SENSORA sensory regulation device, built for BIOE 107.
Three pieces talk to each other over WebSockets:

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  patient-sim    │  emits  │   server         │  emits  │  nurse-dashboard │
│  (3D therapy)   │ ──────▶ │   (socket.io)    │ ──────▶ │  (monitoring)    │
│  React + R3F    │ ◀────── │   Node.js        │ ◀────── │  React + Recharts│
└─────────────────┘         └──────────────────┘         └──────────────────┘
```

## What it does

**patient-sim** is the patient-facing experience. A breathing 3D sphere ramps up gently over 30
seconds, pulses in time with simulated vitals, and exits to a calm "Grounding Mode" the moment
the patient hits spacebar.

**nurse-dashboard** is the clinical-facing monitor. It shows live vitals on a scrolling chart,
fires alerts when the patient interrupts therapy, and gates the next session behind a
sanitization-verified check — the SENSORA Reset Protocol from the BIOE 107 rubric.

**server** is the real-time bridge. It generates physiology, runs the therapy state machine,
and broadcasts events to every connected client in a session room.

## Run it

You need Node 18+ and three terminals.

```bash
# Terminal 1 — server
cd server && npm install && npm start

# Terminal 2 — patient app
cd patient-sim && npm install && npm run dev

# Terminal 3 — nurse dashboard
cd nurse-dashboard && npm install && npm run dev
```

The server listens on **3001**, the patient app on **5173**, the nurse dashboard on **5174**.

## Run it across devices (local network)

To put the nurse dashboard on an iPad while the patient app runs on a laptop:

1. Find your laptop's IPv4 address (`ipconfig` on Windows, `ifconfig` on macOS).
2. Edit `nurse-dashboard/.env` and set `VITE_SERVER_URL=http://<your-ip>:3001`.
3. Edit `patient-sim/.env` and do the same.
4. Allow Node through your firewall.
5. From the iPad's browser, go to `http://<your-ip>:5174`.

## The three demo scenarios

1. **Normal therapy** — start a session, let it ramp up, watch vitals stay calm.
2. **Stress escalation** — click "Inject Stress" on the dashboard, watch HR climb past the warning threshold.
3. **Panic / interruption** — press spacebar on the patient app, watch the dashboard flash red and gate the reset.

See `docs/demo-script.md` for the full walkthrough.

## Architecture

See `docs/architecture.md` for the system diagram and `docs/event-schema.md` for the event contract.
