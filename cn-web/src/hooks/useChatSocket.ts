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
    localStorage.setItem(
      getAttachmentCacheKey(serviceRequestId, messageId),
      base64
    );
  } catch (e) {
    console.warn("Erro ao salvar attachment no cache:", e);
    try {
      const keys = Object.keys(localStorage);
      const chatKeys = keys.filter(k => k.startsWith('chat_attachment_'));
      if (chatKeys.length > 100) {
        chatKeys.sort().slice(0, 50).forEach(key => localStorage.removeItem(key));
        localStorage.setItem(
          getAttachmentCacheKey(serviceRequestId, messageId),
          base64
        );
      }
    } catch (e2) {
      console.warn("Erro ao limpar cache antigo:", e2);
    }
  }
};

const getAttachmentFromCache = (
  serviceRequestId: number,
  messageId: number
): string | null => {
  try {
    return localStorage.getItem(
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
        const cachedBase64 = getAttachmentFromCache(serviceRequestId, msg.id);
        const cacheKey = `chat_attachment_url_${serviceRequestId}_${msg.id}`;
        let cachedUrl: string | null = null;
        try {
          cachedUrl = localStorage.getItem(cacheKey);
        } catch (e) {
        }
        
        if (!msg.metadata) {
          if (cachedBase64) {
            const mimeType = "image/jpeg";
            return {
              ...msg,
              metadata: {
                attachment: {
                  url: `data:${mimeType};base64,${cachedBase64}`,
                  _cachedUrl: `data:${mimeType};base64,${cachedBase64}`,
                  _base64: cachedBase64,
                  type: "image",
                  name: "image.jpg",
                  mimeType: mimeType,
                  sizeBytes: 0,
                },
              },
            };
          } else if (cachedUrl) {
            return {
              ...msg,
              metadata: {
                attachment: {
                  url: cachedUrl,
                  type: "image",
                  name: "image.jpg",
                  mimeType: "image/jpeg",
                  sizeBytes: 0,
                },
              },
            };
          }
          return msg;
        }

        let metadata = msg.metadata;
        if (typeof metadata === "string") {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            if (cachedBase64) {
              const mimeType = "image/jpeg";
              return {
                ...msg,
                metadata: {
                  attachment: {
                    url: `data:${mimeType};base64,${cachedBase64}`,
                    _cachedUrl: `data:${mimeType};base64,${cachedBase64}`,
                    _base64: cachedBase64,
                    type: "image",
                    name: "image.jpg",
                    mimeType: mimeType,
                    sizeBytes: 0,
                  },
                },
              };
            }
            return msg;
          }
        }

        if (!metadata?.attachment) {
          if (cachedBase64) {
            const mimeType = "image/jpeg";
            return {
              ...msg,
              metadata: {
                ...metadata,
                attachment: {
                  url: `data:${mimeType};base64,${cachedBase64}`,
                  _cachedUrl: `data:${mimeType};base64,${cachedBase64}`,
                  _base64: cachedBase64,
                  type: "image",
                  name: "image.jpg",
                  mimeType: mimeType,
                  sizeBytes: 0,
                },
              },
            };
          } else if (cachedUrl) {
            return {
              ...msg,
              metadata: {
                ...metadata,
                attachment: {
                  url: cachedUrl,
                  type: "image",
                  name: "image.jpg",
                  mimeType: "image/jpeg",
                  sizeBytes: 0,
                },
              },
            };
          }
          return msg;
        }

        const attachment = metadata.attachment as any;
        if (!attachment) {
          if (cachedBase64) {
            const mimeType = "image/jpeg";
            return {
              ...msg,
              metadata: {
                ...metadata,
                attachment: {
                  url: `data:${mimeType};base64,${cachedBase64}`,
                  _cachedUrl: `data:${mimeType};base64,${cachedBase64}`,
                  _base64: cachedBase64,
                  type: "image",
                  name: "image.jpg",
                  mimeType: mimeType,
                  sizeBytes: 0,
                },
              },
            };
          }
          return msg;
        }

        if (cachedBase64) {
          attachment._base64 = cachedBase64;
          const isImage = attachment.type === "image" || attachment.mimeType?.startsWith("image/");
          const mimeType = attachment.mimeType || (isImage ? "image/jpeg" : "application/octet-stream");
          attachment._cachedUrl = `data:${mimeType};base64,${cachedBase64}`;
        }
        
        if (attachment.base64 && !attachment._base64) {
          attachment._base64 = attachment.base64;
          const isImage = attachment.type === "image" || attachment.mimeType?.startsWith("image/");
          const mimeType = attachment.mimeType || (isImage ? "image/jpeg" : "application/octet-stream");
          attachment._cachedUrl = `data:${mimeType};base64,${attachment.base64}`;
          if (!attachment.url || attachment.url.startsWith("http")) {
            attachment.url = attachment._cachedUrl;
          }
          if (serviceRequestId) {
            saveAttachmentToCache(serviceRequestId, msg.id, attachment.base64);
          }
        }
        
        if (attachment.url && attachment.url.startsWith("data:")) {
          const base64Match = attachment.url.match(/data:[^;]+;base64,(.+)/);
          if (base64Match && base64Match[1]) {
            attachment._base64 = base64Match[1];
            attachment._cachedUrl = attachment.url;
            if (serviceRequestId) {
              saveAttachmentToCache(serviceRequestId, msg.id, base64Match[1]);
            }
          }
        }
        
        if (
          !attachment.url ||
          attachment.url === "about:blank" ||
          attachment.url.includes("about:")
        ) {
          if (cachedBase64) {
            const isImage =
              attachment.type === "image" ||
              attachment.mimeType?.startsWith("image/");
            const mimeType =
              attachment.mimeType ||
              (isImage ? "image/jpeg" : "application/octet-stream");
            attachment.url = `data:${mimeType};base64,${cachedBase64}`;
          }
        } else if (attachment.url && !attachment._base64 && !cachedBase64) {
          if (serviceRequestId && attachment.url.startsWith("http")) {
            const cacheKey = `chat_attachment_url_${serviceRequestId}_${msg.id}`;
            try {
              localStorage.setItem(cacheKey, attachment.url);
            } catch (e) {
              console.warn("Erro ao salvar URL do attachment no cache:", e);
            }
          }
        }

        if (attachment._base64 && serviceRequestId) {
          saveAttachmentToCache(serviceRequestId, msg.id, attachment._base64);
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

            if (optimisticAttachment._base64) {
              realAttachment._base64 = optimisticAttachment._base64;
              const isImage = realAttachment.type === "image" || realAttachment.mimeType?.startsWith("image/");
              const mimeType = realAttachment.mimeType || (isImage ? "image/jpeg" : "application/octet-stream");
              realAttachment._cachedUrl = `data:${mimeType};base64,${optimisticAttachment._base64}`;
              if (serviceRequestId) {
                saveAttachmentToCache(
                  serviceRequestId,
                  newMessage.id,
                  optimisticAttachment._base64
                );
                saveAttachmentToCache(
                  serviceRequestId,
                  optimistic.id,
                  optimisticAttachment._base64
                );
              }
            }

            if (
              !realAttachment.url ||
              realAttachment.url === "about:blank" ||
              realAttachment.url.includes("about:")
            ) {
              realAttachment.url = optimisticAttachment.url || realAttachment._cachedUrl;
            } else if (realAttachment.url && realAttachment.url.startsWith("data:")) {
              const base64Match = realAttachment.url.match(/data:[^;]+;base64,(.+)/);
              if (base64Match && base64Match[1]) {
                realAttachment._base64 = base64Match[1];
                realAttachment._cachedUrl = realAttachment.url;
                if (serviceRequestId) {
                  saveAttachmentToCache(serviceRequestId, newMessage.id, base64Match[1]);
                }
              }
            }
          }

          const updated = [...prev];
          updated[optimisticIndex] = newMessage;
          return updated;
        }

        if (message.metadata?.attachment && serviceRequestId) {
          const attachment = message.metadata.attachment as any;

          // Extrai base64 de URLs data: se disponível
          if (attachment.url && attachment.url.startsWith("data:")) {
            const base64Match = attachment.url.match(/data:[^;]+;base64,(.+)/);
            if (base64Match && base64Match[1]) {
              attachment._base64 = base64Match[1];
              attachment._cachedUrl = attachment.url;
              // Salva no cache imediatamente
              saveAttachmentToCache(serviceRequestId, message.id, base64Match[1]);
            }
          }

          // Verifica se o servidor enviou base64 diretamente no metadata
          if (attachment.base64 && !attachment._base64) {
            attachment._base64 = attachment.base64;
            const isImage = attachment.type === "image" || attachment.mimeType?.startsWith("image/");
            const mimeType = attachment.mimeType || (isImage ? "image/jpeg" : "application/octet-stream");
            attachment._cachedUrl = `data:${mimeType};base64,${attachment.base64}`;
            if (!attachment.url || attachment.url.startsWith("http")) {
              // Se a URL é HTTP ou não existe, usa a data URL
              attachment.url = attachment._cachedUrl;
            }
            saveAttachmentToCache(serviceRequestId, message.id, attachment.base64);
          }

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
              attachment._cachedUrl = attachment.url;
            }
          } else {
            // Se temos URL válida, verifica se temos base64 no cache
            const cachedBase64 = getAttachmentFromCache(
              serviceRequestId,
              message.id
            );
            if (cachedBase64) {
              attachment._base64 = cachedBase64;
              const isImage = attachment.type === "image" || attachment.mimeType?.startsWith("image/");
              const mimeType = attachment.mimeType || (isImage ? "image/jpeg" : "application/octet-stream");
              attachment._cachedUrl = `data:${mimeType};base64,${cachedBase64}`;
            } else if (attachment.url && attachment.url.startsWith("http") && !attachment._base64) {
              // Se temos apenas URL HTTP sem base64, salva a URL como fallback
              const cacheKey = `chat_attachment_url_${serviceRequestId}_${message.id}`;
              try {
                localStorage.setItem(cacheKey, attachment.url);
              } catch (e) {
                console.warn("Erro ao salvar URL do attachment no cache:", e);
              }
            }
          }

          // Sempre garantir que base64 seja salvo quando disponível
          if (attachment._base64 && serviceRequestId) {
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
