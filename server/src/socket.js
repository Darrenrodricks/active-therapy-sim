import { Server } from 'socket.io';
import { EVENTS, THERAPY_STATE, ALERT_LEVEL } from '../../shared/types/therapyEvents.js';
import { SESSION, PATIENT_INFO } from '../../shared/constants/thresholds.js';
import { createStateMachine } from './simulation/therapyStateMachine.js';
import { createVitalsGenerator } from './simulation/vitalsGenerator.js';
import { log } from './utils/logger.js';

export function attachSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      // Open CORS for the demo. In a real deployment you'd lock this down.
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const stateMachine = createStateMachine(THERAPY_STATE.IDLE);
  const vitals = createVitalsGenerator();
  const room = PATIENT_INFO.sessionId;

  // Track when therapy started so we know when ramp-up finishes.
  let therapyStartedAt = 0;
  let endedAt = 0;

  // Broadcast helpers — every emit goes to the session room.
  const broadcastVitals = (sample) => io.to(room).emit(EVENTS.VITALS_UPDATE, sample);
  const broadcastState = (state) => io.to(room).emit(EVENTS.SESSION_STATE, {
    state,
    timestamp: Date.now(),
    patient: PATIENT_INFO,
  });
  const broadcastAlert = (level, message) => {
    const alert = { level, message, room: PATIENT_INFO.room, timestamp: Date.now() };
    io.to(room).emit(EVENTS.ALERT, alert);
    log.event(`Alert ${level}: ${message}`);
  };

  // State machine reactions — when the state changes, push the new state out
  // and fire any side-effects (e.g. alerts).
  stateMachine.onChange((next, prev) => {
    broadcastState(next);

    if (next === THERAPY_STATE.PAUSED) {
      broadcastAlert(ALERT_LEVEL.CRITICAL, `Patient Interrupted Therapy — ${PATIENT_INFO.room}`);
    } else if (next === THERAPY_STATE.ENDED) {
      endedAt = Date.now();
      broadcastAlert(ALERT_LEVEL.INFO, 'Device in Triage. Awaiting Sanitization Protocol.');
    } else if (next === THERAPY_STATE.READY) {
      broadcastAlert(ALERT_LEVEL.INFO, 'Sanitization verified. Ready for next patient.');
    } else if (next === THERAPY_STATE.ACTIVE && prev === THERAPY_STATE.RAMP_UP) {
      broadcastAlert(ALERT_LEVEL.INFO, 'Therapy active. Ramp-up complete.');
    } else if (next === THERAPY_STATE.RAMP_UP) {
      therapyStartedAt = Date.now();
      broadcastAlert(ALERT_LEVEL.INFO, 'Session started. Ramp-up in progress.');
    }
  });

  // The simulation loop. One tick per second, always running so the dashboard
  // shows live numbers even when idle.
  setInterval(() => {
    // Auto-advance RAMP_UP → ACTIVE after the configured duration.
    if (
      stateMachine.state === THERAPY_STATE.RAMP_UP &&
      Date.now() - therapyStartedAt >= SESSION.RAMP_UP_DURATION_MS
    ) {
      stateMachine.transition(THERAPY_STATE.ACTIVE);
    }

    const sample = vitals.next(stateMachine.state);
    broadcastVitals(sample);
  }, SESSION.VITALS_INTERVAL_MS);

  // Connection handler.
  io.on('connection', (socket) => {
    log.info(`Client connected: ${socket.id}`);
    socket.join(room);

    // Send the new client the current state immediately so it doesn't sit blank.
    socket.emit(EVENTS.SESSION_STATE, {
      state: stateMachine.state,
      timestamp: Date.now(),
      patient: PATIENT_INFO,
    });

    // Patient identifies itself.
    socket.on(EVENTS.PATIENT_JOIN, () => {
      log.event(`Patient joined: ${socket.id}`);
      socket.data.role = 'patient';
    });

    // Nurse identifies itself.
    socket.on(EVENTS.NURSE_JOIN, () => {
      log.event(`Nurse joined: ${socket.id}`);
      socket.data.role = 'nurse';
    });

    // Patient starts therapy → go to RAMP_UP (only legal from IDLE).
    socket.on(EVENTS.PATIENT_START, () => {
      if (stateMachine.state === THERAPY_STATE.IDLE) {
        stateMachine.transition(THERAPY_STATE.RAMP_UP);
      } else {
        log.warn(`Cannot start therapy from state ${stateMachine.state}`);
      }
    });

    // Patient pressed spacebar → PAUSED.
    socket.on(EVENTS.PATIENT_PANIC, () => {
      if (
        stateMachine.state === THERAPY_STATE.RAMP_UP ||
        stateMachine.state === THERAPY_STATE.ACTIVE
      ) {
        stateMachine.transition(THERAPY_STATE.PAUSED);
      }
    });

    // Patient ended therapy → ENDED (triggers reset protocol).
    socket.on(EVENTS.PATIENT_END, () => {
      if (
        stateMachine.state === THERAPY_STATE.ACTIVE ||
        stateMachine.state === THERAPY_STATE.PAUSED ||
        stateMachine.state === THERAPY_STATE.RAMP_UP
      ) {
        stateMachine.transition(THERAPY_STATE.ENDED);
      }
    });

    // Patient resets session — skips sanitization and goes straight to IDLE.
    socket.on(EVENTS.PATIENT_RESET, () => {
      if (
        stateMachine.state === THERAPY_STATE.ENDED ||
        stateMachine.state === THERAPY_STATE.SANITIZING ||
        stateMachine.state === THERAPY_STATE.READY
      ) {
        stateMachine.transition(THERAPY_STATE.IDLE);
        broadcastAlert(ALERT_LEVEL.INFO, 'Session reset by patient.');
      }
    });

    // Nurse injects stress (for the demo's "stress escalation" scenario).
    socket.on(EVENTS.NURSE_INJECT_STRESS, () => {
      log.event('Nurse injected stress');
      vitals.injectStress(45);
      broadcastAlert(ALERT_LEVEL.WARNING, 'Stress event detected.');
    });

    // Nurse verifies sanitization → SANITIZING → READY → IDLE.
    // We gate this so it can't be instant (real reset takes time).
    socket.on(EVENTS.NURSE_VERIFY_SANITIZATION, () => {
      if (stateMachine.state !== THERAPY_STATE.ENDED) {
        log.warn(`Cannot verify sanitization from state ${stateMachine.state}`);
        return;
      }
      const elapsed = Date.now() - endedAt;
      if (elapsed < SESSION.RESET_PROTOCOL_MIN_WAIT_MS) {
        broadcastAlert(
          ALERT_LEVEL.WARNING,
          `Reset protocol incomplete. Wait ${Math.ceil((SESSION.RESET_PROTOCOL_MIN_WAIT_MS - elapsed) / 1000)}s.`,
        );
        return;
      }
      stateMachine.transition(THERAPY_STATE.SANITIZING);
      // Brief pause to represent the final sanitization step, then ready.
      setTimeout(() => stateMachine.transition(THERAPY_STATE.READY), 1500);
      setTimeout(() => stateMachine.transition(THERAPY_STATE.IDLE), 3000);
    });

    socket.on('disconnect', () => {
      log.info(`Client disconnected: ${socket.id} (${socket.data.role || 'unknown'})`);
    });
  });

  return io;
}
