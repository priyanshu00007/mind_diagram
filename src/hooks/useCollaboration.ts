import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const useCollaboration = (diagramId: string | null) => {
  const socketRef = useRef<WebSocket | null>(null);
  const { updateDiagram, user } = useStore();

  useEffect(() => {
    if (!diagramId || !user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'join',
        roomId: diagramId,
        userId: user.id
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        updateDiagram(diagramId, { mermaidCode: data.code });
      }
    };

    return () => {
      socket.close();
    };
  }, [diagramId, user, updateDiagram]);

  const broadcastUpdate = (code: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN && diagramId && user) {
      socketRef.current.send(JSON.stringify({
        type: 'update',
        code,
        userId: user.id
      }));
    }
  };

  return { broadcastUpdate };
};
