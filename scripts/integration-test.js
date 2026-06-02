/**
 * End-to-end integration test.
 *
 * Boots the server, connects two socket.io clients (one as patient, one as
 * nurse), and walks the full lifecycle:
 *
 *   1. Both clients connect → both see IDLE
 *   2. Patient starts → state goes RAMP_UP, vitals start flowing
 *   3. Nurse injects stress → vitals climb, alert fires
 *   4. Patient panics → state goes PAUSED, critical alert fires
 *   5. Patient ends → state goes ENDED
 *   6. Nurse verifies sanitization too early → rejected
 *   7. After min wait, nurse verifies → SANITIZING → READY → IDLE
 *
 * Each assertion logs ✓ or ✗ and the script exits non-zero on any failure.
 */

import { spawn } from 'child_process';
import { io as ioClient } from 'socket.io-client';
import { EVENTS, THERAPY_STATE, ALERT_LEVEL } from '../shared/types/therapyEvents.js';
import { SESSION } from '../shared/constants/thresholds.js';

const SERVER_URL = 'http://localhost:3001';
const STARTUP_WAIT_MS = 1500;
const TEST_TIMEOUT_MS = 30_000;

// ─── test harness ──────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
    failures.push(label);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Wait for a predicate over a live stream of events. Pass either an array
// (which we re-read each tick) or a getter function for sliced views.
function waitFor(getStream, predicate, ms = 5000, label = '') {
  const read = typeof getStream === 'function' ? getStream : () => getStream;
  return new Promise((resolve, reject) => {
    let intervalId;
    const timer = setTimeout(() => {
      clearInterval(intervalId);
      reject(new Error(`Timeout waiting for ${label || 'event'}`));
    }, ms);
    const check = () => {
      const found = read().find(predicate);
      if (found) {
        clearTimeout(timer);
        clearInterval(intervalId);
        resolve(found);
        return true;
      }
      return false;
    };
    if (check()) return;
    intervalId = setInterval(check, 50);
  });
}

// ─── connect both clients ──────────────────────────────────────────────────

function makeClient(role) {
  const socket = ioClient(SERVER_URL, {
    transports: ['websocket'],
    reconnection: false,
  });

  const events = {
    state: [],
    vitals: [],
    alerts: [],
  };

  socket.on(EVENTS.SESSION_STATE, (msg) => events.state.push(msg));
  socket.on(EVENTS.VITALS_UPDATE, (msg) => events.vitals.push(msg));
  socket.on(EVENTS.ALERT, (msg) => events.alerts.push(msg));

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      socket.emit(role === 'patient' ? EVENTS.PATIENT_JOIN : EVENTS.NURSE_JOIN);
      resolve({ socket, events });
    });
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error(`Connection timeout for ${role}`)), 5000);
  });
}

// ─── boot the server ───────────────────────────────────────────────────────

async function bootServer() {
  console.log('\n→ Booting server\n');
  const proc = spawn('node', ['src/index.js'], {
    cwd: new URL('../server', import.meta.url),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverOutput = '';
  proc.stdout.on('data', (d) => (serverOutput += d.toString()));
  proc.stderr.on('data', (d) => (serverOutput += d.toString()));

  await sleep(STARTUP_WAIT_MS);

  if (proc.exitCode !== null) {
    throw new Error(`Server died on startup:\n${serverOutput}`);
  }

  return { proc, getOutput: () => serverOutput };
}

// ─── the test ──────────────────────────────────────────────────────────────

async function runTest() {
  const server = await bootServer();

  // Hard timeout safety net.
  const killSwitch = setTimeout(() => {
    console.error('\n\x1b[31mTest exceeded global timeout — killing server\x1b[0m');
    server.proc.kill();
    process.exit(2);
  }, TEST_TIMEOUT_MS);

  try {
    // ── Phase 1: Connect both clients ──────────────────────────────────────
    console.log('Phase 1: Connection\n');
    const patient = await makeClient('patient');
    const nurse = await makeClient('nurse');

    // Server pushes the current state immediately on connect.
    await waitFor(() => patient.events.state, (s) => !!s.state, 2000, 'initial state (patient)');
    await waitFor(() => nurse.events.state, (s) => !!s.state, 2000, 'initial state (nurse)');

    assert(
      'Patient receives initial session state',
      patient.events.state[0]?.state === THERAPY_STATE.IDLE,
      `got ${patient.events.state[0]?.state}`,
    );
    assert(
      'Nurse receives initial session state',
      nurse.events.state[0]?.state === THERAPY_STATE.IDLE,
      `got ${nurse.events.state[0]?.state}`,
    );
    assert(
      'Server sends patient metadata',
      nurse.events.state[0]?.patient?.room === 'Room 4',
      `got ${JSON.stringify(nurse.events.state[0]?.patient)}`,
    );

    // ── Phase 2: Vitals stream ─────────────────────────────────────────────
    console.log('\nPhase 2: Vitals stream\n');

    // Wait long enough for a few ticks.
    await sleep(2500);

    assert(
      'Patient receives vitals broadcasts',
      patient.events.vitals.length >= 2,
      `got ${patient.events.vitals.length} samples`,
    );
    assert(
      'Nurse receives vitals broadcasts',
      nurse.events.vitals.length >= 2,
      `got ${nurse.events.vitals.length} samples`,
    );

    const sample = nurse.events.vitals.at(-1);
    assert(
      'Vitals samples have full schema',
      sample &&
        typeof sample.heartRate === 'number' &&
        typeof sample.respiration === 'number' &&
        typeof sample.stress === 'number' &&
        typeof sample.therapyState === 'string',
      `got ${JSON.stringify(sample)}`,
    );

    // ── Phase 3: Start therapy → RAMP_UP ───────────────────────────────────
    console.log('\nPhase 3: Start therapy\n');

    // Clear state buffer so we can wait for the new transition cleanly.
    const stateCountBefore = nurse.events.state.length;
    patient.socket.emit(EVENTS.PATIENT_START);

    await waitFor(
      () => nurse.events.state.slice(stateCountBefore),
      (s) => s.state === THERAPY_STATE.RAMP_UP,
      2000,
      'RAMP_UP transition',
    );
    assert(
      'Start therapy → RAMP_UP',
      nurse.events.state.some((s) => s.state === THERAPY_STATE.RAMP_UP),
    );
    assert(
      'Server emits "ramp-up in progress" info alert',
      nurse.events.alerts.some(
        (a) => a.level === ALERT_LEVEL.INFO && a.message.toLowerCase().includes('ramp-up'),
      ),
    );

    // Verify vitals carry the new therapy state.
    await sleep(1200);
    const rampSamples = nurse.events.vitals.filter(
      (v) => v.therapyState === THERAPY_STATE.RAMP_UP,
    );
    assert(
      'Vitals samples reflect new therapy state during ramp-up',
      rampSamples.length >= 1,
      `got ${rampSamples.length} ramp-up samples`,
    );

    // ── Phase 4: Stress injection ──────────────────────────────────────────
    console.log('\nPhase 4: Stress injection\n');

    const baselineHR = nurse.events.vitals.at(-1).heartRate;
    const alertCountBefore = nurse.events.alerts.length;

    nurse.socket.emit(EVENTS.NURSE_INJECT_STRESS);

    // Stress takes a few ticks to manifest because vitals drift smoothly.
    await sleep(3500);

    const peakHR = Math.max(...nurse.events.vitals.slice(-4).map((v) => v.heartRate));
    assert(
      'HR climbs after stress injection',
      peakHR > baselineHR,
      `baseline ${baselineHR}, peak ${peakHR}`,
    );
    assert(
      'Stress event fires a WARNING alert',
      nurse.events.alerts
        .slice(alertCountBefore)
        .some((a) => a.level === ALERT_LEVEL.WARNING),
    );

    // ── Phase 5: Panic → PAUSED ────────────────────────────────────────────
    console.log('\nPhase 5: Panic / Grounding mode\n');

    const stateCountBeforePanic = nurse.events.state.length;
    patient.socket.emit(EVENTS.PATIENT_PANIC);

    await waitFor(
      () => nurse.events.state.slice(stateCountBeforePanic),
      (s) => s.state === THERAPY_STATE.PAUSED,
      2000,
      'PAUSED transition',
    );
    assert(
      'Spacebar / panic → PAUSED',
      nurse.events.state.some((s) => s.state === THERAPY_STATE.PAUSED),
    );

    const criticalAlerts = nurse.events.alerts.filter(
      (a) => a.level === ALERT_LEVEL.CRITICAL,
    );
    assert(
      'PAUSED triggers a CRITICAL alert',
      criticalAlerts.length >= 1,
      `got ${criticalAlerts.length} critical alerts`,
    );
    assert(
      'Critical alert names the room',
      criticalAlerts.at(-1)?.message?.includes('Room 4'),
      `got "${criticalAlerts.at(-1)?.message}"`,
    );

    // Vitals should reflect the elevated PAUSED targets.
    await sleep(2000);
    const pausedSamples = nurse.events.vitals.filter(
      (v) => v.therapyState === THERAPY_STATE.PAUSED,
    );
    assert(
      'Vitals stay elevated during PAUSED',
      pausedSamples.length > 0 && pausedSamples.at(-1).stress > 40,
      `last paused stress: ${pausedSamples.at(-1)?.stress}`,
    );

    // ── Phase 6: End therapy → ENDED ───────────────────────────────────────
    console.log('\nPhase 6: End therapy\n');

    const stateCountBeforeEnd = nurse.events.state.length;
    patient.socket.emit(EVENTS.PATIENT_END);

    await waitFor(
      () => nurse.events.state.slice(stateCountBeforeEnd),
      (s) => s.state === THERAPY_STATE.ENDED,
      2000,
      'ENDED transition',
    );
    assert(
      'End therapy → ENDED',
      nurse.events.state.some((s) => s.state === THERAPY_STATE.ENDED),
    );
    assert(
      'ENDED triggers the "Device in Triage" alert',
      nurse.events.alerts.some((a) => a.message.toLowerCase().includes('triage')),
    );

    // ── Phase 7: Reset protocol gate ───────────────────────────────────────
    console.log('\nPhase 7: SENSORA Reset Protocol gate\n');

    const alertsBeforeVerify = nurse.events.alerts.length;
    // Immediate verification should be rejected.
    nurse.socket.emit(EVENTS.NURSE_VERIFY_SANITIZATION);
    await sleep(400);

    assert(
      'Early sanitization verification is rejected with a warning',
      nurse.events.alerts
        .slice(alertsBeforeVerify)
        .some(
          (a) =>
            a.level === ALERT_LEVEL.WARNING &&
            a.message.toLowerCase().includes('reset protocol incomplete'),
        ),
    );
    assert(
      'State stays ENDED after early verification',
      nurse.events.state.at(-1).state === THERAPY_STATE.ENDED,
      `current: ${nurse.events.state.at(-1).state}`,
    );

    // Wait out the gate, then verify properly.
    await sleep(SESSION.RESET_PROTOCOL_MIN_WAIT_MS);
    const stateCountBeforeFinalVerify = nurse.events.state.length;
    nurse.socket.emit(EVENTS.NURSE_VERIFY_SANITIZATION);

    // SANITIZING → READY → IDLE auto-progresses on the server (3s total).
    await waitFor(
      () => nurse.events.state.slice(stateCountBeforeFinalVerify),
      (s) => s.state === THERAPY_STATE.SANITIZING,
      2000,
      'SANITIZING transition',
    );
    assert(
      'Verified sanitization → SANITIZING',
      nurse.events.state.some((s) => s.state === THERAPY_STATE.SANITIZING),
    );

    await waitFor(
      () => nurse.events.state.slice(stateCountBeforeFinalVerify),
      (s) => s.state === THERAPY_STATE.READY,
      3000,
      'READY transition',
    );
    assert(
      'Auto-progression → READY',
      nurse.events.state.some((s) => s.state === THERAPY_STATE.READY),
    );

    await waitFor(
      () => nurse.events.state.slice(stateCountBeforeFinalVerify),
      (s) => s.state === THERAPY_STATE.IDLE,
      3000,
      'return to IDLE',
    );
    assert(
      'Returns to IDLE — ready for next patient',
      nurse.events.state.at(-1).state === THERAPY_STATE.IDLE,
      `final: ${nurse.events.state.at(-1).state}`,
    );

    // Clean up.
    patient.socket.close();
    nurse.socket.close();
  } finally {
    clearTimeout(killSwitch);
    server.proc.kill();
    await sleep(300);
  }
}

// ─── run ──────────────────────────────────────────────────────────────────

console.log('\n\x1b[36m╔══════════════════════════════════════════════════════╗\x1b[0m');
console.log('\x1b[36m║   SENSORA Integration Test — Full Lifecycle          ║\x1b[0m');
console.log('\x1b[36m╚══════════════════════════════════════════════════════╝\x1b[0m');

try {
  await runTest();

  console.log(`\n${'─'.repeat(56)}`);
  console.log(
    `\x1b[32m${passed} passed\x1b[0m, ${failed > 0 ? '\x1b[31m' : ''}${failed} failed\x1b[0m`,
  );

  if (failed > 0) {
    console.log('\nFailed assertions:');
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
  console.log('\n\x1b[32mAll integration checks passed.\x1b[0m\n');
  process.exit(0);
} catch (err) {
  console.error(`\n\x1b[31mTest crashed:\x1b[0m`, err);
  process.exit(2);
}
