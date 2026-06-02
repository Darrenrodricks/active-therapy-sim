import { io } from 'socket.io-client';
import { EVENTS } from '../../../shared/types/therapyEvents.js';

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export function connectAsPatient() {
  if (!socket.connected) socket.connect();
  socket.emit(EVENTS.PATIENT_JOIN);
}

export const send = {
  startTherapy: () => socket.emit(EVENTS.PATIENT_START),
  endTherapy: () => socket.emit(EVENTS.PATIENT_END),
  panic: () => socket.emit(EVENTS.PATIENT_PANIC),
  resetSession: () => socket.emit(EVENTS.PATIENT_RESET),
};
