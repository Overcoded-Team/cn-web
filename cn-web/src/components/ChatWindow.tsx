import React, { useState, useRef, useEffect } from "react";
import { useChatSocket, ChatMessage } from "../hooks/useChatSocket";
import { ServiceRequestStatus, serviceRequestService, ServiceRequest } from "../services/serviceRequest.service";
import { isChatReadOnly } from "../utils/chatUtils";
import attachIcon from "../assets/attach-files.svg";
import "./ChatWindow.css";

// Constantes alinhadas com o backend (service-request-chat.gateway.ts)
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_ATTACHMENT_MIMES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
];

// String para o atributo accept do input file
const ACCEPT_FILE_TYPES = ALLOWED_ATTACHMENT_MIMES.join(",");

interface ChatWindowProps {
  serviceRequestId: number;
  currentUserId?: number;
  currentUserRole?: "CLIENT" | "CHEF";
  status: ServiceRequestStatus;
  participantName?: string;
  participantAvatarUrl?: string;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  serviceRequestId,
  currentUserId,
  currentUserRole,
  status,
  participantName,
  participantAvatarUrl,
  onClose,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [serviceRequestDetails, setServiceRequestDetails] = useState<ServiceRequest | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const loadServiceRequestDetails = async () => {
      if (showQuoteModal && currentUserRole === "CHEF") {
        try {
          setIsLoadingDetails(true);
          const response = await serviceRequestService.listChefServiceRequests(1, 1000);
          const request = response.items.find((req) => req.id === serviceRequestId);
          if (request) {
            setServiceRequestDetails(request);
          }
        } catch (err) {
          console.error("Erro ao carregar detalhes do pedido:", err);
        } finally {
          setIsLoadingDetails(false);
        }
      }
    };

    loadServiceRequestDetails();
  }, [showQuoteModal, serviceRequestId, currentUserRole]);

  const calculateValueWithFees = (value: string): string => {
    if (!value || value.trim() === "") return "0,00";
    const numericValue = parseFloat(value.replace(",", "."));
    if (isNaN(numericValue) || numericValue <= 0) return "0,00";
    
    const feePercentage = 0.15;
    const fixedFee = 0.80;
    const totalWithFees = numericValue + (numericValue * feePercentage) + fixedFee;
    
    return totalWithFees.toFixed(2).replace(".", ",");
  };

  const formatDateTimeBR = (date: Date | string): string => {
    let d: Date;
    if (typeof date === "string") {
      d = new Date(date);
      if (isNaN(d.getTime())) {
        d = new Date(date + "T00:00:00");
      }
    } else {
      d = date;
    }

    if (isNaN(d.getTime())) {
      return "Data inválida";
    }

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove o prefixo data:image/...;base64,
        const base64 = result.split(",")[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo (alinhado com o backend)
    if (!ALLOWED_ATTACHMENT_MIMES.includes(file.type)) {
      setError("Tipo de arquivo não permitido. Use imagens (JPEG, PNG, WebP, AVIF) ou documentos (PDF, DOC, DOCX).");
      return;
    }

    // Validar tamanho (alinhado com o backend: 5MB)
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError("Arquivo muito grande. Tamanho máximo de 5MB.");
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || !isConnected || isReadOnly) return;

    setError(null);
    setIsUploading(true);

    try {
      let attachment = undefined;
      
      if (selectedFile) {
        const base64 = await convertFileToBase64(selectedFile);
        attachment = {
          filename: selectedFile.name,
          mimeType: selectedFile.type,
          base64: base64,
          size: selectedFile.size,
        };
      }

      sendMessage(messageInput.trim() || "", attachment);
      setMessageInput("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao processar arquivo. Tente novamente."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendQuote = async () => {
    if (!quoteAmount.trim()) {
      setError("Por favor, informe o valor do orçamento.");
      return;
    }

    const amount = parseFloat(quoteAmount.replace(",", "."));
    if (isNaN(amount) || amount < 1) {
      setError("Valor inválido. O valor mínimo é R$ 1,00");
      return;
    }

    try {
      setIsSendingQuote(true);
      setError(null);

      await serviceRequestService.sendQuote(serviceRequestId, {
        amount_cents: Math.round(amount * 100),
        notes: quoteNotes.trim() || undefined,
      });

      setShowQuoteModal(false);
      setQuoteAmount("");
      setQuoteNotes("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao enviar orçamento. Tente novamente."
      );
    } finally {
      setIsSendingQuote(false);
    }
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

  const chatTitle = participantName
    ? `${participantName} - Chat do Pedido #${serviceRequestId}`
    : `Chat do Pedido #${serviceRequestId}`;

  const participantInitial = participantName?.charAt(0).toUpperCase();

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-header-main">
            {participantName && (
              <div className="chat-avatar">
                {participantAvatarUrl ? (
                  <img src={participantAvatarUrl} alt={participantName} />
                ) : (
                  <span>{participantInitial}</span>
                )}
              </div>
            )}
            <h3 className="chat-title">{chatTitle}</h3>
          </div>
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
        <div className="chat-header-actions">
          {currentUserRole === "CHEF" && !isReadOnly && (
            <button
              className="chat-send-quote-button"
              onClick={() => setShowQuoteModal(true)}
              title="Enviar Orçamento"
            >
               Enviar Orçamento
            </button>
          )}
          {onClose && (
            <button className="chat-close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>
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
                {message.metadata?.attachment && (() => {
                  const attachment = message.metadata.attachment as {
                    url: string;
                    name: string;
                    type: "image" | "file";
                    sizeBytes: number;
                  };
                  return (
                    <div className="message-attachment">
                      {attachment.type === "image" ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="message-attachment-image"
                          onClick={() => window.open(attachment.url, "_blank")}
                        />
                      ) : (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="message-attachment-link"
                        >
                          <span className="message-attachment-icon">📄</span>
                          <div className="message-attachment-info">
                            <span className="message-attachment-name">
                              {attachment.name}
                            </span>
                            <span className="message-attachment-size">
                              {(attachment.sizeBytes / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </a>
                      )}
                    </div>
                  );
                })()}
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
          <span className="chat-readonly-text">
            Este chat está em modo somente leitura. Você pode visualizar as
            mensagens, mas não pode enviar novas.
          </span>
        </div>
      ) : (
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            ref={fileInputRef}
            type="file"
            className="chat-file-input"
            accept={ACCEPT_FILE_TYPES}
            onChange={handleFileSelect}
            disabled={!isConnected || isUploading}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="chat-attach-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected || isUploading}
            title="Anexar arquivo"
          >
            <img src={attachIcon} alt="Anexar arquivo" />
          </button>
          {selectedFile && (
            <div className="chat-selected-file">
              <span className="chat-file-name">{selectedFile.name}</span>
              <button
                type="button"
                className="chat-file-remove"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                title="Remover arquivo"
              >
                ×
              </button>
            </div>
          )}
          <input
            type="text"
            className="chat-input"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={
              isConnected ? "Digite sua mensagem..." : "Conectando..."
            }
            disabled={!isConnected || isUploading}
            maxLength={1000}
          />
          <button
            type="submit"
            className="chat-send-button"
            disabled={!isConnected || (!messageInput.trim() && !selectedFile) || isUploading}
          >
            {isUploading ? "Enviando..." : "Enviar"}
          </button>
        </form>
      )}

      {showQuoteModal && (
        <div className="quote-modal-overlay" onClick={() => setShowQuoteModal(false)}>
          <div className="quote-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quote-modal-header">
              <h2 className="quote-modal-title">Enviar Orçamento</h2>
              <button
                className="quote-modal-close"
                onClick={() => setShowQuoteModal(false)}
                disabled={isSendingQuote}
              >
                ×
              </button>
            </div>
            <div className="quote-modal-content">
              {error && (
                <div className="quote-modal-error">{error}</div>
              )}

              {isLoadingDetails ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#b0b3b8" }}>
                  Carregando informações do pedido...
                </div>
              ) : serviceRequestDetails ? (
                <>
                  <div className="accept-request-info">
                    <div className="accept-info-item">
                      <span className="accept-info-label">Cliente:</span>
                      <span className="accept-info-value">
                        {serviceRequestDetails.client_profile?.user?.name || "Cliente"}
                      </span>
                    </div>
                    <div className="accept-info-item">
                      <span className="accept-info-label">Tipo de Serviço:</span>
                      <span className="accept-info-value">
                        {serviceRequestDetails.service_type}
                      </span>
                    </div>
                    <div className="accept-info-item">
                      <span className="accept-info-label">Data e Horário:</span>
                      <span className="accept-info-value">
                        {formatDateTimeBR(serviceRequestDetails.requested_date)}
                      </span>
                    </div>
                    <div className="accept-info-item">
                      <span className="accept-info-label">Endereço:</span>
                      <span className="accept-info-value">
                        {serviceRequestDetails.location}
                      </span>
                    </div>
                    {serviceRequestDetails.description && (
                      <div className="accept-info-item">
                        <span className="accept-info-label">Descrição:</span>
                        <span className="accept-info-value">
                          {serviceRequestDetails.description}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="quote-form-group">
                    <label className="quote-form-label">
                      Valor do Serviço (R$)
                    </label>
                    <div className="accept-value-container">
                      <input
                        type="text"
                        className="quote-form-input"
                        value={quoteAmount}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/[^\d,]/g, "")
                            .replace(",", ".");
                          if (value === "" || !isNaN(parseFloat(value))) {
                            setQuoteAmount(e.target.value.replace(/[^\d,]/g, ""));
                          }
                        }}
                        placeholder="0,00"
                        disabled={isSendingQuote}
                      />
                      {quoteAmount && parseFloat(quoteAmount.replace(",", ".")) > 0 && (
                        <div className="accept-value-with-fees">
                          <span className="accept-fees-label">
                            Valor incluindo as taxas para o cliente:
                          </span>
                          <span className="accept-fees-value">
                            R$ {calculateValueWithFees(quoteAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="quote-form-group">
                    <label className="quote-form-label">
                      Observações (opcional)
                    </label>
                    <textarea
                      className="quote-form-textarea"
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      placeholder="Adicione observações sobre este serviço..."
                      rows={4}
                      disabled={isSendingQuote}
                    />
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "2rem", color: "#b0b3b8" }}>
                  Erro ao carregar informações do pedido.
                </div>
              )}
            </div>
            <div className="quote-modal-actions">
              <button
                className="quote-modal-cancel"
                onClick={() => setShowQuoteModal(false)}
                disabled={isSendingQuote}
              >
                Cancelar
              </button>
              <button
                className="quote-modal-submit"
                onClick={handleSendQuote}
                disabled={isSendingQuote || !quoteAmount}
              >
                {isSendingQuote ? "Enviando..." : "Enviar Orçamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
