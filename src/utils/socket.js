import { io } from "socket.io-client";

let socket;

export const initSocket = (
  url = import.meta.env.VITE_API_URL || "http://localhost:1997"
) => {
  if (!socket) {
    socket = io(url, { transports: ["websocket"], autoConnect: true });
  }
  return socket;
};

export const getSocket = () => socket;
