import { io } from 'socket.io-client';
import { EVENTS } from '../../../shared/types/therapyEvents.js';

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export function connectAsNurse() {
  if (!socket.connected) socket.connect();
  socket.emit(EVENTS.NURSE_JOIN);
}

export const send = {
  injectStress: () => socket.emit(EVENTS.NURSE_INJECT_STRESS),
  verifySanitization: () => socket.emit(EVENTS.NURSE_VERIFY_SANITIZATION),
};
