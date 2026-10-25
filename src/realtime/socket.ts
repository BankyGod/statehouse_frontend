import { io, type Socket } from 'socket.io-client';
import { getToken } from '../api/client';

let socket: Socket | null = null;

export function getApiOrigin(): string {
  return import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
}

export function connectSocket(): Socket {
  const token = getToken();
  if (socket?.connected) return socket;
  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(getApiOrigin(), {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: !!token,
    reconnection: true,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
