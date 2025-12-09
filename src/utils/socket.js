import { io } from "socket.io-client";

let socket;

export const initSocket = (url) => {
  const base = url || import.meta.env.VITE_API_URL || "http://localhost:1997";
  if (!socket) {
    socket = io(base, { transports: ["websockets"], autoConnect: true });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
