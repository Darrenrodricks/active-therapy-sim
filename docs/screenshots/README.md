# Screenshots

Captured automatically against the running stack. The system was driven
through its full lifecycle by a Playwright-based capture script.

| #  | File                       | What you're seeing                                                                 |
|----|----------------------------|-----------------------------------------------------------------------------------|
| 01 | `01-dashboard-idle.png`    | Dashboard at boot. Vitals streaming, no active session, event log empty.          |
| 02 | `02-patient-start.png`     | Patient app start screen. Single CTA, no clinical chrome.                         |
| 03 | `03-patient-rampup.png`    | A few seconds into the 30s ramp-up. Sphere at low opacity, exit button visible.   |
| 04 | `04-dashboard-active.png`  | Session active. Chart drawing live vitals with threshold bands behind the line.   |
| 05 | `05-dashboard-stressed.png`| After "Inject Stress" — HR climbed, stress index jumped into the warning band.    |
| 06 | `06-dashboard-panic.png`   | Patient hit panic. Flashing red overlay, critical alert modal naming the room.    |
| 07 | `07-patient-grounding.png` | The patient's view of the same moment. Warm tones, single calm focal dot.         |
| 08 | `08-dashboard-reset.png`   | SENSORA Reset Protocol panel — 5-step checklist with time-gated verify button.    |
