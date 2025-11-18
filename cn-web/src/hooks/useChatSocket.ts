import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../utils/api';

export interface ChatMessage {
  id: number;
  service_request_id: number;
  sender_type: 'CLIENT' | 'CHEF' | 'SYSTEM';
  sender_user_id?: number;
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface UseChatSocketOptions {
  serviceRequestId: number | null;
  enabled?: boolean;
  onError?: (error: string) => void;
}

export const useChatSocket = ({
  serviceRequestId,
  enabled = true,
  onError,
}: UseChatSocketOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !serviceRequestId || socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      onError?.('Token de autenticação não encontrado');
      return;
    }

    const socketUrl = api.baseURL.replace(/^https?:\/\//, '').split('/')[0];
    const protocol = api.baseURL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${socketUrl}`;

    const socket = io(`${wsUrl}/service-requests-chat`, {
      auth: {
        token: token,
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      query: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setIsLoading(true);
      
      // Join the room
      socket.emit('join', { serviceRequestId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      onError?.('Erro ao conectar ao chat');
    });

    socket.on('chat_history', (history: ChatMessage[]) => {
      setMessages(history || []);
      setIsLoading(false);
    });

    socket.on('message', (message: ChatMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    socket.on('error', (error: { message: string }) => {
      onError?.(error.message || 'Erro no chat');
    });

    socketRef.current = socket;
  }, [enabled, serviceRequestId, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setMessages([]);
    }
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current?.connected || !serviceRequestId) {
        onError?.('Não conectado ao chat');
        return;
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        onError?.('Mensagem não pode estar vazia');
        return;
      }

      if (trimmedContent.length > 1000) {
        onError?.('Mensagem excede o limite de 1000 caracteres');
        return;
      }

      socketRef.current.emit('message', {
        serviceRequestId,
        content: trimmedContent,
      });
    },
    [serviceRequestId, onError]
  );

  useEffect(() => {
    if (enabled && serviceRequestId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, serviceRequestId, connect, disconnect]);

  return {
    messages,
    isConnected,
    isLoading,
    sendMessage,
    connect,
    disconnect,
  };
};

