import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "../utils/api";

export interface ChatMessage {
  id: number;
  service_request_id: number;
  sender_type: "CLIENT" | "CHEF" | "SYSTEM";
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

const getAttachmentCacheKey = (serviceRequestId: number, messageId: number) =>
  `chat_attachment_${serviceRequestId}_${messageId}`;

const saveAttachmentToCache = (
  serviceRequestId: number,
  messageId: number,
  base64: string
) => {
  try {
    sessionStorage.setItem(
      getAttachmentCacheKey(serviceRequestId, messageId),
      base64
    );
  } catch (e) {
    console.warn("Erro ao salvar attachment no cache:", e);
  }
};

const getAttachmentFromCache = (
  serviceRequestId: number,
  messageId: number
): string | null => {
  try {
    return sessionStorage.getItem(
      getAttachmentCacheKey(serviceRequestId, messageId)
    );
  } catch (e) {
    console.warn("Erro ao recuperar attachment do cache:", e);
    return null;
  }
};

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
      if (socketRef.current.connected) {
        socketRef.current.disconnect();
      }
      socketRef.current.removeAllListeners();
      socketRef.current = null;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      onErrorRef.current?.("Token de autenticação não encontrado");
      return;
    }

    const baseUrl = api.baseURL.replace(/\/$/, "");
    const socketUrl = `${baseUrl}/service-requests-chat`;

    console.log("Connecting to WebSocket:", socketUrl);
    console.log("Token exists:", !!token);

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
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      setIsLoading(true);

      socket.emit("join", { serviceRequestId });
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
      setIsLoading(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      setIsLoading(false);
      const errorMessage = error.message || "Erro ao conectar ao chat";
      onErrorRef.current?.(errorMessage);
    });

    socket.on("chat_history", (history: ChatMessage[]) => {
      if (!serviceRequestId) {
        setMessages(history || []);
        setIsLoading(false);
        return;
      }

      const restoredHistory = (history || []).map((msg) => {
        if (!msg.metadata) return msg;

        let metadata = msg.metadata;
        if (typeof metadata === "string") {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            return msg;
          }
        }

        if (!metadata?.attachment) return msg;

        const attachment = metadata.attachment as any;
        if (!attachment) return msg;

        if (
          !attachment.url ||
          attachment.url === "about:blank" ||
          attachment.url.includes("about:")
        ) {
          const cachedBase64 = getAttachmentFromCache(serviceRequestId, msg.id);
          if (cachedBase64) {
            const isImage =
              attachment.type === "image" ||
              attachment.mimeType?.startsWith("image/");
            const mimeType =
              attachment.mimeType ||
              (isImage ? "image/jpeg" : "application/octet-stream");
            attachment.url = `data:${mimeType};base64,${cachedBase64}`;
            attachment._base64 = cachedBase64;
          }
        } else {
          if (!attachment._base64) {
            const cachedBase64 = getAttachmentFromCache(
              serviceRequestId,
              msg.id
            );
            if (cachedBase64) {
              attachment._base64 = cachedBase64;
            }
          }
        }

        return {
          ...msg,
          metadata: { ...metadata, attachment },
        };
      });

      setMessages(restoredHistory);
      setIsLoading(false);
    });

    socket.on("message", (message: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }

        const optimisticIndex = prev.findIndex(
          (m) =>
            m.metadata?.attachment?._optimistic &&
            Math.abs(
              new Date(m.created_at).getTime() -
                new Date(message.created_at).getTime()
            ) < 5000
        );

        if (optimisticIndex !== -1) {
          const optimistic = prev[optimisticIndex];
          const newMessage = { ...message };

          if (
            !newMessage.metadata?.attachment &&
            optimistic.metadata?.attachment
          ) {
            newMessage.metadata = optimistic.metadata;
            if (serviceRequestId && optimistic.metadata.attachment._base64) {
              saveAttachmentToCache(
                serviceRequestId,
                newMessage.id,
                optimistic.metadata.attachment._base64
              );
            }
          } else if (
            newMessage.metadata?.attachment &&
            optimistic.metadata?.attachment
          ) {
            const realAttachment = newMessage.metadata.attachment as any;
            const optimisticAttachment = optimistic.metadata.attachment as any;

            if (
              !realAttachment.url ||
              realAttachment.url === "about:blank" ||
              realAttachment.url.includes("about:")
            ) {
              realAttachment.url = optimisticAttachment.url;
            }

            if (optimisticAttachment._base64) {
              realAttachment._base64 = optimisticAttachment._base64;
              if (serviceRequestId) {
                saveAttachmentToCache(
                  serviceRequestId,
                  newMessage.id,
                  optimisticAttachment._base64
                );
              }
            }
          }

          const updated = [...prev];
          updated[optimisticIndex] = newMessage;
          return updated;
        }

        if (message.metadata?.attachment && serviceRequestId) {
          const attachment = message.metadata.attachment as any;

          if (
            !attachment.url ||
            attachment.url === "about:blank" ||
            attachment.url.includes("about:")
          ) {
            const cachedBase64 = getAttachmentFromCache(
              serviceRequestId,
              message.id
            );
            if (cachedBase64) {
              const isImage =
                attachment.type === "image" ||
                attachment.mimeType?.startsWith("image/");
              const mimeType =
                attachment.mimeType ||
                (isImage ? "image/jpeg" : "application/octet-stream");
              attachment.url = `data:${mimeType};base64,${cachedBase64}`;
              attachment._base64 = cachedBase64;
            }
          } else {
            if (!attachment._base64) {
              const cachedBase64 = getAttachmentFromCache(
                serviceRequestId,
                message.id
              );
              if (cachedBase64) {
                attachment._base64 = cachedBase64;
              }
            }
          }

          if (attachment._base64) {
            saveAttachmentToCache(
              serviceRequestId,
              message.id,
              attachment._base64
            );
          }

          message.metadata.attachment = attachment;
        }

        return [...prev, message];
      });
    });

    socket.on("error", (error: { message: string }) => {
      onErrorRef.current?.(error.message || "Erro no chat");
    });

    socketRef.current = socket;
  }, [enabled, serviceRequestId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (socketRef.current.connected) {
        socketRef.current.disconnect();
      }
      socketRef.current.removeAllListeners();
      socketRef.current = null;
      setIsConnected(false);
      setMessages([]);
    }
  }, []);

  const sendMessage = useCallback(
    (
      content: string,
      attachment?: {
        filename: string;
        mimeType: string;
        base64: string;
        size: number;
      }
    ) => {
      if (!socketRef.current?.connected || !serviceRequestId) {
        onErrorRef.current?.("Não conectado ao chat");
        return;
      }

      const trimmedContent = content.trim();
      if (!trimmedContent && !attachment) {
        onErrorRef.current?.("Mensagem ou anexo é obrigatório");
        return;
      }

      if (trimmedContent && trimmedContent.length > 1000) {
        onErrorRef.current?.("Mensagem excede o limite de 1000 caracteres");
        return;
      }

      if (attachment) {
        const isImage = attachment.mimeType.startsWith("image/");
        const tempUrl = isImage
          ? `data:${attachment.mimeType};base64,${attachment.base64}`
          : `data:${attachment.mimeType};base64,${attachment.base64}`;

        const optimisticMessage: ChatMessage = {
          id: Date.now(),
          service_request_id: serviceRequestId,
          sender_type: "CHEF",
          sender_user_id: undefined,
          content: trimmedContent || "\u200B",
          metadata: {
            attachment: {
              url: tempUrl,
              name: attachment.filename,
              mimeType: attachment.mimeType,
              sizeBytes: attachment.size,
              type: isImage ? "image" : "file",
              _optimistic: true,
              _base64: attachment.base64,
            },
          },
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        if (serviceRequestId) {
          saveAttachmentToCache(
            serviceRequestId,
            optimisticMessage.id,
            attachment.base64
          );
        }
      }

      socketRef.current.emit("message", {
        serviceRequestId,
        content: trimmedContent || (attachment ? "\u200B" : undefined),
        attachment: attachment
          ? {
              filename: attachment.filename,
              mimeType: attachment.mimeType,
              base64: attachment.base64,
              size: attachment.size,
            }
          : undefined,
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
      if (socketRef.current) {
        if (socketRef.current.connected) {
          socketRef.current.disconnect();
        }
        socketRef.current.removeAllListeners();
        socketRef.current = null;
      }
      setIsConnected(false);
      setMessages([]);
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
