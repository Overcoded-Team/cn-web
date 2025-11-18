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
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const connect = useCallback(() => {
    if (!enabled || !serviceRequestId) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      onErrorRef.current?.('Token de autenticação não encontrado');
      return;
    }

    const baseUrl = api.baseURL.replace(/\/$/, '');
    const socketUrl = `${baseUrl}/service-requests-chat`;
    
    console.log('Connecting to WebSocket:', socketUrl);
    console.log('Token exists:', !!token);
    
    const socket = io(socketUrl, {
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
      timeout: 20000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setIsLoading(true);
      
      socket.emit('join', { serviceRequestId });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      setIsLoading(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setIsLoading(false);
      const errorMessage = error.message || 'Erro ao conectar ao chat';
      onErrorRef.current?.(errorMessage);
    });

    socket.on('chat_history', (history: ChatMessage[]) => {
      setMessages(history || []);
      setIsLoading(false);
    });

    socket.on('message', (message: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    socket.on('error', (error: { message: string }) => {
      onErrorRef.current?.(error.message || 'Erro no chat');
    });

    socketRef.current = socket;
  }, [enabled, serviceRequestId]);

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
        onErrorRef.current?.('Não conectado ao chat');
        return;
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        onErrorRef.current?.('Mensagem não pode estar vazia');
        return;
      }

      if (trimmedContent.length > 1000) {
        onErrorRef.current?.('Mensagem excede o limite de 1000 caracteres');
        return;
      }

      socketRef.current.emit('message', {
        serviceRequestId,
        content: trimmedContent,
      });
    },
    [serviceRequestId]
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
  }, [enabled, serviceRequestId]);

  return {
    messages,
    isConnected,
    isLoading,
    sendMessage,
    connect,
    disconnect,
  };
};

