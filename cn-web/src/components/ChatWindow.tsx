import React, { useState, useRef, useEffect } from "react";
import { useChatSocket, ChatMessage } from "../hooks/useChatSocket";
import { ServiceRequestStatus } from "../services/serviceRequest.service";
import { isChatReadOnly } from "../utils/chatUtils";
import "./ChatWindow.css";

interface ChatWindowProps {
  serviceRequestId: number;
  currentUserId?: number;
  currentUserRole?: "CLIENT" | "CHEF";
  status: ServiceRequestStatus;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  serviceRequestId,
  currentUserId,
  currentUserRole,
  status,
  onClose,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const isReadOnly = isChatReadOnly(status);

  const { messages, isConnected, isLoading, sendMessage } = useChatSocket({
    serviceRequestId,
    enabled: true,
    onError: (err) => setError(err),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !isConnected || isReadOnly) return;

    setError(null);
    sendMessage(messageInput);
    setMessageInput("");
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isMyMessage = (message: ChatMessage) => {
    if (message.sender_type === "SYSTEM") return false;
    if (message.sender_type === currentUserRole) {
      return message.sender_user_id === currentUserId;
    }
    return false;
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-content">
          <h3 className="chat-title">Chat do Pedido #{serviceRequestId}</h3>
          <div className="chat-status">
            {isReadOnly && (
              <span className="chat-readonly-badge">Somente Leitura</span>
            )}
            <span
              className={`status-indicator ${
                isConnected ? "connected" : "disconnected"
              }`}
            />
            <span className="status-text">
              {isConnected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>
        {onClose && (
          <button className="chat-close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        {isLoading ? (
          <div className="chat-loading">Carregando mensagens...</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            Nenhuma mensagem ainda. Seja o primeiro a enviar!
          </div>
        ) : (
          messages.map((message) => {
            const isMyMsg = isMyMessage(message);
            const isSystem = message.sender_type === "SYSTEM";

            return (
              <div
                key={message.id}
                className={`chat-message ${isMyMsg ? "my-message" : ""} ${
                  isSystem ? "system-message" : ""
                }`}
              >
                {!isSystem && (
                  <div className="message-sender">
                    {message.sender_type === "CLIENT" ? "Cliente" : "Chef"}
                  </div>
                )}
                <div className="message-content">{message.content}</div>
                <div className="message-time">
                  {formatMessageTime(message.created_at)}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="chat-error">
          <div className="chat-error-content">
            <strong>Erro:</strong> {error}
            {!isConnected && (
              <div className="chat-error-hint">
                Verifique sua conexão com a internet e tente novamente.
              </div>
            )}
          </div>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {isReadOnly ? (
        <div className="chat-readonly-notice">
          <span className="chat-readonly-icon">🔒</span>
          <span className="chat-readonly-text">
            Este chat está em modo somente leitura. Você pode visualizar as
            mensagens, mas não pode enviar novas.
          </span>
        </div>
      ) : (
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-input"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={
              isConnected ? "Digite sua mensagem..." : "Conectando..."
            }
            disabled={!isConnected}
            maxLength={1000}
          />
          <button
            type="submit"
            className="chat-send-button"
            disabled={!isConnected || !messageInput.trim()}
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  );
};
