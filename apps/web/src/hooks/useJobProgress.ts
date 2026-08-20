import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

interface JobProgress {
  jobId: string;
  progress: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  timestamp: number;
}

export const useJobProgress = (jobId: string | null) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'PROCESSING' | 'COMPLETED' | 'FAILED'>('PROCESSING');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!jobId) return;

    // Conectar Socket.IO
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      // Suscribirse al job
      newSocket.emit('subscribe:job', jobId);
    });

    // Escuchar actualizaciones de progreso
    newSocket.on('job:progress', (data: JobProgress) => {
      setProgress(data.progress);
      setStatus(data.status);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('unsubscribe:job', jobId);
        newSocket.disconnect();
      }
    };
  }, [jobId]);

  return { progress, status, socket };
};
