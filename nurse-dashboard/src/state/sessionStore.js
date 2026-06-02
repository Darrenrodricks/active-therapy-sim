import { useEffect, useState, useCallback } from 'react';
import { socket, connectAsNurse } from '../socket/client.js';
import { EVENTS, THERAPY_STATE } from '../../../shared/types/therapyEvents.js';
import { SESSION } from '../../../shared/constants/thresholds.js';

/**
 * Centralized session state hook. Connects to the socket, listens for vitals
 * + state + alerts, and exposes everything the dashboard needs.
 *
 * Vitals are kept in a rolling window of SESSION.VITALS_WINDOW samples so the
 * chart has a "last 30 seconds" feel.
 */
export function useSession() {
  const [connected, setConnected] = useState(false);
  const [therapyState, setTherapyState] = useState(THERAPY_STATE.IDLE);
  const [patient, setPatient] = useState(null);
  const [latestVitals, setLatestVitals] = useState(null);
  const [vitalsLog, setVitalsLog] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [criticalAlert, setCriticalAlert] = useState(null);

  // Connect on mount.
  useEffect(() => {
    connectAsNurse();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // Subscribe to server events.
  useEffect(() => {
    const onVitals = (sample) => {
      setLatestVitals(sample);
      setVitalsLog((prev) => {
        const next = [...prev, sample];
        return next.length > SESSION.VITALS_WINDOW
          ? next.slice(-SESSION.VITALS_WINDOW)
          : next;
      });
    };

    const onState = ({ state, patient: p }) => {
      setTherapyState(state);
      if (p) setPatient(p);
      // Clear the modal critical alert when patient resumes or ends.
      if (state !== THERAPY_STATE.PAUSED) {
        setCriticalAlert(null);
      }
    };

    const onAlert = (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
      if (alert.level === 'CRITICAL') {
        setCriticalAlert(alert);
      }
    };

    socket.on(EVENTS.VITALS_UPDATE, onVitals);
    socket.on(EVENTS.SESSION_STATE, onState);
    socket.on(EVENTS.ALERT, onAlert);

    return () => {
      socket.off(EVENTS.VITALS_UPDATE, onVitals);
      socket.off(EVENTS.SESSION_STATE, onState);
      socket.off(EVENTS.ALERT, onAlert);
    };
  }, []);

  const dismissCriticalAlert = useCallback(() => setCriticalAlert(null), []);

  return {
    connected,
    therapyState,
    patient,
    latestVitals,
    vitalsLog,
    alerts,
    criticalAlert,
    dismissCriticalAlert,
  };
}
