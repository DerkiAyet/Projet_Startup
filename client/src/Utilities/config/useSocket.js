import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AppContext } from '../../App';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { userAuth } = useContext(AppContext); // get user info
  const [socket, setSocket] = useState(null);

  // Initialize socket once
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_NOTIFICATION_URL, {
      withCredentials: true,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected, id:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []); 

  // Register user whenever userAuth becomes available
  useEffect(() => {
    if (!socket) return;
    if (!userAuth || !userAuth.userId) return;

    socket.emit('register', {
      userId: userAuth.userId,
      userRole: userAuth.role || 'student',
    });

    console.log('✅ User registered on socket:', userAuth.userId);

  }, [socket, userAuth]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);