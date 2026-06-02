import { useEffect, useState } from 'react';
import { socket, connectAsPatient, send } from './socket/client.js';
import { EVENTS, THERAPY_STATE } from '../../shared/types/therapyEvents.js';
import { Scene } from './scene/Scene.jsx';
import { GroundingOverlay } from './ui/GroundingOverlay.jsx';
import { StartScreen, ExitButton, PauseHint } from './ui/Overlays.jsx';
import { useRampUp } from './therapy/useRampUp.js';

export default function App() {
  const [therapyState, setTherapyState] = useState(THERAPY_STATE.IDLE);
  const [vitals, setVitals] = useState({ heartRate: 72, stress: 20 });
  const [connected, setConnected] = useState(false);

  // Connect once on mount.
  useEffect(() => {
    connectAsPatient();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // Listen for server-side state and vitals so we can drive the visual.
  useEffect(() => {
    const onState = ({ state }) => setTherapyState(state);
    const onVitals = (sample) => setVitals(sample);
    socket.on(EVENTS.SESSION_STATE, onState);
    socket.on(EVENTS.VITALS_UPDATE, onVitals);
    return () => {
      socket.off(EVENTS.SESSION_STATE, onState);
      socket.off(EVENTS.VITALS_UPDATE, onVitals);
    };
  }, []);

  // Spacebar = panic / grounding mode. Only fires during active or ramp-up.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return;
      if (
        therapyState === THERAPY_STATE.RAMP_UP ||
        therapyState === THERAPY_STATE.ACTIVE
      ) {
        e.preventDefault();
        send.panic();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [therapyState]);

  // The ramp-up controller drives the scene's opacity from 0 to 1.
  const sceneActive =
    therapyState === THERAPY_STATE.RAMP_UP || therapyState === THERAPY_STATE.ACTIVE;
  const opacity = useRampUp(sceneActive);

  // Which overlays to show.
  const showStartScreen =
    therapyState === THERAPY_STATE.IDLE ||
    therapyState === THERAPY_STATE.READY ||
    therapyState === THERAPY_STATE.ENDED ||
    therapyState === THERAPY_STATE.SANITIZING;

  const showGrounding = therapyState === THERAPY_STATE.PAUSED;
  const showSceneControls = sceneActive;

  return (
    <>
      {/* Always render the scene — we control visibility via opacity, not unmount. */}
      <Scene
        heartRate={vitals.heartRate}
        stress={vitals.stress}
        opacity={sceneActive ? opacity : 0}
      />

      {showStartScreen && (
        <StartScreen
          onStart={() => send.startTherapy()}
          onReset={() => send.resetSession()}
          sessionState={therapyState}
        />
      )}

      {showGrounding && (
        <GroundingOverlay
          onResume={() => send.startTherapy()}
          onEnd={() => send.endTherapy()}
        />
      )}

      {showSceneControls && (
        <>
          <ExitButton onClick={() => send.endTherapy()} />
          <PauseHint visible={opacity > 0.6} />
        </>
      )}

      {/* Connection indicator — tiny, only visible when disconnected. */}
      {!connected && (
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            color: '#c47575',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            zIndex: 100,
          }}
        >
          ⦿ Reconnecting…
        </div>
      )}
    </>
  );
}
