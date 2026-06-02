# Human-centered design requirements

This document maps each feature of the simulator back to the stakeholder need
it addresses, drawn from the BIOE 107 user research and rubric.

## Patient-facing decisions

### The 30-second ramp-up
**Need:** patients with sensory sensitivities cannot tolerate sudden visual or
auditory changes. The clinical literature on sensory regulation is consistent
on this — the *transition* into a stimulus is often what triggers overwhelm,
not the stimulus itself.

**Decision:** the 3D scene fades in from full opacity 0 to opacity 1 over 30
seconds, on a smoothstep curve. There is no point at which the visual
"snaps" into place. The breathing sphere is already breathing at full
amplitude when the user first sees it at very low opacity, so the motion is
already familiar by the time it becomes fully visible.

**Where it lives:** `patient-sim/src/therapy/useRampUp.js`.

### Always-available exit affordance
**Need:** the patient must never feel trapped. Loss of control is a known
trigger for sensory overwhelm and panic.

**Decision:** two independent exit paths.
1. **Spacebar** triggers Grounding Mode — instant pause, scene fades out,
   calm overlay appears. The spacebar was chosen because it's the largest
   single key on the keyboard and requires no fine motor control.
2. **Top-right "End therapy" button** is always visible during the session,
   styled subtly so it doesn't compete with the scene but is always there.

**Where it lives:** `patient-sim/src/App.jsx` (keydown handler) and
`patient-sim/src/ui/Overlays.jsx` (exit button).

### The Grounding Mode overlay
**Need:** when a patient interrupts therapy, the next thing they see cannot
be more stimulation. They need a soft, slow, low-contrast landing zone.

**Decision:** the overlay uses a warm low-saturation palette (deep brown
background, parchment text) — visually opposite to the cool blues of the
therapy scene, so the change of state is immediately legible. A single
slowly-pulsing dot at the center gives the eyes one point of focus. Two
buttons offer "Resume" or "End session" with no time pressure.

**Where it lives:** `patient-sim/src/ui/GroundingOverlay.jsx`.

### Biofeedback through the sphere
**Need:** Patients benefit from seeing their physiology reflected back in a
non-clinical way. A number on a screen is intimidating; a slowly-pulsing
form they're already calmly watching is not.

**Decision:** the sphere's pulse rate is tied directly to the simulated
heart rate. The distortion amplitude tracks the stress index. As the
patient settles in and the simulation drifts toward the calm `ACTIVE`
targets, the sphere visibly settles too. This is *implicit* biofeedback —
no labels, no numbers, just a form that calms as the patient calms.

**Where it lives:** `patient-sim/src/scene/BreathingSphere.jsx`.

## Nurse-facing decisions

### Threshold bands behind the live chart
**Need:** nurses scan vitals in seconds, often while doing something else.
A line on a chart says nothing about whether to be concerned.

**Decision:** the chart background is divided into three faintly tinted
bands — green (resting), yellow (elevated), red (critical) — based on
clinically reasonable thresholds. The nurse doesn't read numbers; they read
*color*. A blue HR line sitting in the green band is fine. A line crossing
into yellow is the visual cue to look closer.

**Where it lives:** `nurse-dashboard/src/components/VitalsChart.jsx`.

### Color-coded readout strips
**Need:** at-a-glance status for each individual vital, independent of the
chart.

**Decision:** each vital has its own card with a colored edge strip
(green/yellow/red) and a large monospaced number. The classification is
re-evaluated on every sample. JetBrains Mono with `font-variant-numeric:
tabular-nums` is used so the numbers don't jump width as they change —
critical for at-a-glance reading.

**Where it lives:** `nurse-dashboard/src/components/VitalsReadout.jsx`.

### Critical alert modal + audio ping
**Need:** when a patient interrupts therapy, the nurse must know now, even
if they're not looking at the screen.

**Decision:** full-screen flashing red overlay with a single
"Acknowledge" action. A short synthesized ping (A5 → C5 sine sweep, 18%
volume, 700ms decay) plays on mount. The sound is intentionally pleasant
rather than alarming — this is a healthcare environment and harsh tones
cause their own problems. It's distinctive enough to catch attention but
won't trigger a stress response in a nurse who's working three rooms over.

**Where it lives:** `nurse-dashboard/src/components/AlertBanner.jsx`.

## Infection-control decisions

### The SENSORA Reset Protocol panel
**Need:** from the BIOE 107 rubric — a stakeholder concern about "validated
cleaning protocols and crevices where bacteria can grow." A device that
cycles between patients needs a workflow gate, not just a checkbox.

**Decision:** when therapy ends, the dashboard locks into a five-step
reset workflow panel showing the SENSORA Reset Protocol developed for the
BIOE 107 turnaround section: Collection & Triage, Disassembly & Liner
Replacement, Hospital-Grade Sanitization, Functional Check & Recharge,
and final Sanitization Verification.

The "Sanitization Verified" button is **time-gated** — clicking it before
the minimum protocol wait has elapsed fires a warning and refuses the
transition. This makes the lockout legible: the system isn't saying "no"
arbitrarily, it's saying "the protocol isn't done yet."

**Where it lives:** `nurse-dashboard/src/components/ResetProtocol.jsx` and
the server-side gate in `server/src/socket.js`.

### Hard lockout of new sessions
**Need:** the previous patient's session cannot bleed into the next
patient's session, no matter what the UI does.

**Decision:** the state machine on the server rejects any `patient:start`
event that doesn't come from `IDLE`. Even if a malicious or buggy client
sent a start event during `ENDED` or `SANITIZING`, the server would drop
it and log a warning. The infection control gate cannot be bypassed by
the client.

**Where it lives:** `server/src/simulation/therapyStateMachine.js`
(the `TRANSITIONS` map).

## What each map exists for at all

Every visible element in both apps maps to a stakeholder need from the
class research. None of the UI is decorative. The breathing sphere
addresses sensory regulation; the chart bands address scan-and-go nurse
workflow; the reset panel addresses infection control. The "Inject
Stress" button is the one exception — it's a demo affordance, not a
production feature, and it's intentionally styled as such (warning-yellow
outline, no fill, clearly different from the operational controls).
