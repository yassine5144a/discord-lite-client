import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'https://ducky-chat.onrender.com';

// Keep Render from sleeping — ping every 14 minutes
let keepAliveInterval = null;
function startKeepAlive() {
  if (keepAliveInterval) return;
  keepAliveInterval = setInterval(() => {
    fetch(`${SERVER_URL}/health`).catch(() => {});
  }, 14 * 60 * 1000); // 14 minutes
}

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const newSocket = io(SERVER_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnectionDelay: 2000,
      reconnectionAttempts: 10
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      startKeepAlive(); // Start pinging when connected
    });
    newSocket.on('disconnect', () => setConnected(false));

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
