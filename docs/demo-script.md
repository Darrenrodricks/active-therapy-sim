# Demo script

A walkthrough for presenting the simulator. Three scenarios, ~7 minutes total.

## Setup (before the demo)

1. Three terminals running, all green:
   - `cd server && npm start` — should print "SENSORA server listening on :3001"
   - `cd patient-sim && npm run dev` — should print a `:5173` URL
   - `cd nurse-dashboard && npm run dev` — should print a `:5174` URL
2. Two browser windows open side by side:
   - Left: patient app at `http://localhost:5173`
   - Right: nurse dashboard at `http://localhost:5174`
3. The dashboard should already show "Idle" in the sidebar and a live
   scrolling chart with baseline vitals (~72 bpm).

If you're on an iPad for the dashboard, the `.env` URL trick described in
the README applies. Make sure the firewall is open before the demo starts.

## Scenario 1 — Normal therapy session (~2 min)

**Frame it:** "This is a patient sitting down for a 5-minute SENSORA session.
The device starts in IDLE — nothing happens until the patient is ready."

1. Show the dashboard. Point out:
   - The "Idle" status with the dimmed dot.
   - The vitals chart already showing live baseline data — the device is
     awake, just not actively running therapy.
2. Switch to the patient app. Show the "Begin" screen.
3. Click **Begin**.
   - Patient app: scene starts fading in. The sphere appears at zero
     opacity and slowly resolves over 30 seconds.
   - Dashboard: status flips to "Ramp-up" (blue). An INFO event appears
     in the log: "Session started. Ramp-up in progress."
4. Wait about 5 seconds, then point out:
   - The sphere is becoming visible.
   - Vitals on the dashboard are starting to drift downward — heart rate
     trending from ~72 toward 64. *This is the calming response built into
     the simulation, not random noise.*
5. Wait for the 30-second mark.
   - Dashboard status flips to "Active therapy" (green).
   - Log entry: "Therapy active. Ramp-up complete."

**Talking point:** "Notice that nothing about the patient experience announces
the state change. The sphere doesn't pop or flash. The transition from
ramp-up to active is invisible from the patient's perspective — by design.
The dashboard is informed; the patient is undisturbed."

## Scenario 2 — Stress escalation (~2 min)

**Frame it:** "Now let's simulate something happening clinically — maybe the
patient hears a code page in the hallway, maybe a memory surfaces. Their
vitals start climbing."

1. On the dashboard, click **⚡ Inject Stress** in the top-right.
2. Watch the chart for 5-10 seconds:
   - Heart rate climbs from the high 60s into the 80s and possibly 90s.
   - The HR readout strip transitions from green → yellow → possibly red.
   - The stress index card spikes.
   - A WARNING event appears in the log: "Stress event detected."
3. Point out the patient app:
   - The sphere is *visibly pulsing faster* — biofeedback in action.
   - The surface distortion is more turbulent.
4. Wait 10-15 seconds. The boost decays on the server side, and the system
   self-regulates back toward calm targets.

**Talking point:** "The patient never saw a number. They saw their physical
state reflected in a form that's already calming them. As they breathe with
the sphere, the sphere returns to a calm rhythm, and the dashboard shows
their vitals doing the same."

## Scenario 3 — Panic, grounding, and the reset protocol (~3 min)

**Frame it:** "Now the critical one. The patient becomes overwhelmed and
needs out, immediately. This is the panic flow."

1. On the patient app, press **spacebar**.
   - Scene fades out within ~600ms.
   - Grounding Mode overlay appears: warm tones, pulsing dot, "Resume" /
     "End session" buttons.
2. **Immediately point the audience at the dashboard.** What they'll see:
   - Full-screen flashing red overlay.
   - Modal: "Patient Interrupted Therapy — Room 4"
   - A soft ping sound (this is the audio cue — make sure your speakers
     are on).
   - Status sidebar flips to "Patient paused" with a red dot.
3. Click **Acknowledge** on the dashboard modal.
   - Modal dismisses but the underlying state stays "Paused."
4. Back on the patient app, click **End session**.
   - Dashboard status → "Session ended."
   - The Reset Protocol panel takes over the sidebar.
   - INFO event: "Device in Triage. Awaiting Sanitization Protocol."
5. **Try to cheat** — click "Sanitization Verified" immediately.
   - The button is grayed out, showing a countdown: "Awaiting protocol — Ns"
   - A WARNING event fires: "Reset protocol incomplete. Wait Ns."

   *This is the infection-control gate. The system refuses to allow a new
   session until the minimum protocol time has passed.*
6. Wait for the countdown to finish (3 seconds in the demo). The button
   turns green.
7. Click **Sanitization Verified**.
   - Status → "Sanitizing" → "Ready" → "Idle" over ~3 seconds.
   - INFO event: "Sanitization verified. Ready for next patient."
8. Patient app: the "Begin" screen returns automatically.

**Talking point — this is the punchline:** "The reset protocol is the part of
this system that maps directly to our infection control stakeholder concern
from the BIOE 107 research. The patient can't start another session. The
nurse can't accept a verification before the protocol has actually had time
to happen. The lockout isn't a UI suggestion — it's a state-machine
guarantee on the server. There's no path through this system where a
contaminated device meets a new patient."

## If something goes wrong mid-demo

| Symptom                                          | Fix                                                                |
|--------------------------------------------------|--------------------------------------------------------------------|
| Dashboard shows "Offline"                        | Server crashed. Restart it and refresh both browsers.              |
| Patient clicks "Begin" but nothing happens       | Same as above — check the server terminal for errors.              |
| Spacebar does nothing                            | Click into the patient app first so it has keyboard focus.         |
| No audio ping on critical alert                  | Browser blocks audio without user interaction. Click anywhere on the dashboard first. |
| Stress injection button is disabled              | Therapy isn't active. Get the patient to "Begin" first.            |

## After the demo

If asked "what's next" or "what would you do for v2":

- Replace the synthetic vitals generator with input from a real wearable
  (the simulator's `vitals:update` schema is the contract; a real sensor
  module just needs to emit that shape).
- Add a multi-patient mode — the room-based socket architecture already
  supports this; one server can run multiple `sessionN` rooms in parallel.
- Persistence — log every event to a time-series store so sessions can be
  reviewed clinically.
- Authentication, audit trails, EHR integration — none of which are in
  the BIOE 107 scope but all of which the architecture is ready for.
