import React, { useState, useRef, useEffect } from "react";
import { useChatSocket, ChatMessage } from "../hooks/useChatSocket";
import { ServiceRequestStatus, serviceRequestService, ServiceRequest } from "../services/serviceRequest.service";
import { isChatReadOnly } from "../utils/chatUtils";
import attachIcon from "../assets/attach-files.svg";
import downloadIcon from "../assets/dowload.svg";
import "./ChatWindow.css";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIMES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

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
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string>("");
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
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
        const base64 = result.split(",")[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const normalizeMimeType = (mimeType: string): string => {
    if (mimeType === "image/jpg" || mimeType === "image/jpeg") {
      return "image/jpeg";
    }
    return mimeType;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const normalizedType = normalizeMimeType(file.type);

    if (!ALLOWED_ATTACHMENT_MIMES.includes(normalizedType)) {
      setError("Tipo de arquivo não permitido. Use imagens (JPEG, PNG, WebP, AVIF) ou documentos (PDF, DOC, DOCX).");
      return;
    }

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
        const normalizedMimeType = normalizeMimeType(selectedFile.type);
        attachment = {
          filename: selectedFile.name,
          mimeType: normalizedMimeType,
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
                {(() => {
                  let metadata = message.metadata;
                  if (typeof metadata === "string") {
                    try {
                      metadata = JSON.parse(metadata);
                    } catch (e) {
                    }
                  }
                  
                  let hasAttachment = !!metadata?.attachment;
                  
                  if (!hasAttachment && (message.content === "📎 Arquivo anexado" || message.content === "Arquivo anexado")) {
                    const cachedBase64 = serviceRequestId 
                      ? sessionStorage.getItem(`chat_attachment_${serviceRequestId}_${message.id}`)
                      : null;
                    hasAttachment = !!cachedBase64;
                  }
                  
                  return hasAttachment;
                })() ? (
                  message.content && 
                  message.content !== "📎 Arquivo anexado" && 
                  message.content !== "Arquivo anexado" && (
                    <div className="message-content">{message.content}</div>
                  )
                ) : (
                  message.content && (
                    <div className="message-content">{message.content}</div>
                  )
                )}
                {(() => {
                  let metadata = message.metadata;
                  if (typeof metadata === "string") {
                    try {
                      metadata = JSON.parse(metadata);
                    } catch (e) {
                      console.error("Erro ao parsear metadata:", e);
                    }
                  }

                  let attachment = metadata?.attachment as {
                    url?: string;
                    name: string;
                    type: "image" | "file";
                    sizeBytes: number;
                    mimeType?: string;
                    _base64?: string;
                  };
                  
                  if (!attachment && serviceRequestId) {
                    let cachedBase64 = sessionStorage.getItem(`chat_attachment_${serviceRequestId}_${message.id}`);
                    
                    if (!cachedBase64) {
                      const cacheKeys: { key: string; value: string; timestamp: number }[] = [];
                      for (let i = 0; i < sessionStorage.length; i++) {
                        const key = sessionStorage.key(i);
                        if (key && key.startsWith(`chat_attachment_${serviceRequestId}_`)) {
                          const value = sessionStorage.getItem(key);
                          if (value && value.length > 100) {
                            const msgIdMatch = key.match(/_(\d+)$/);
                            const msgId = msgIdMatch ? parseInt(msgIdMatch[1]) : 0;
                            cacheKeys.push({ key, value, timestamp: msgId });
                          }
                        }
                      }
                      cacheKeys.sort((a, b) => {
                        const timeDiffA = Math.abs(a.timestamp - message.id);
                        const timeDiffB = Math.abs(b.timestamp - message.id);
                        return timeDiffA - timeDiffB;
                      });
                      if (cacheKeys.length > 0) {
                        cachedBase64 = cacheKeys[0].value;
                      }
                    }
                    
                    if (cachedBase64) {
                      const base64Start = cachedBase64.substring(0, 30);
                      const isImage = base64Start.includes('/9j/') ||
                                     base64Start.includes('iVBORw0KGgo') ||
                                     base64Start.includes('UklGR') ||
                                     base64Start.includes('AAAAIGZ0eXB');
                      
                      attachment = {
                        name: isImage ? "imagem-anexada.jpg" : "arquivo-anexado",
                        type: isImage ? "image" : "file",
                        sizeBytes: Math.round((cachedBase64.length * 3) / 4),
                        mimeType: isImage ? "image/jpeg" : "application/octet-stream",
                        _base64: cachedBase64,
                      };
                    }
                  }
                  
                  if (attachment && !attachment._base64 && serviceRequestId) {
                    const cachedBase64 = sessionStorage.getItem(`chat_attachment_${serviceRequestId}_${message.id}`);
                    if (cachedBase64) {
                      attachment._base64 = cachedBase64;
                    }
                  }

                  if (!attachment) return null;

                  const getImageUrl = () => {
                    if (attachment.url && attachment.url !== "about:blank" && !attachment.url.includes("about:")) {
                      return attachment.url;
                    }
                    if (attachment._base64) {
                      const mimeType = attachment.mimeType || (attachment.type === "image" ? "image/jpeg" : "application/octet-stream");
                      return `data:${mimeType};base64,${attachment._base64}`;
                    }
                    if (attachment.type === "image" && attachment.url) {
                      return attachment.url;
                    }
                    return null;
                  };

                  const imageUrl = getImageUrl();
                  const isValidUrl = imageUrl && imageUrl !== "about:blank" && !imageUrl.includes("about:");
                  const hasBase64 = !!attachment._base64;
                  const hasUrl = !!attachment.url && attachment.url !== "about:blank" && !attachment.url.includes("about:");
                  
                  const shouldShowImage = attachment.type === "image" && (hasUrl || hasBase64 || !!attachment.url);
                  
                  const imageUrlToUse = imageUrl || (attachment.type === "image" && attachment.url ? attachment.url : null);

                  const handleDownload = (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (isValidUrl && imageUrl) {
                      const a = document.createElement("a");
                      a.href = imageUrl;
                      a.download = attachment.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    } else if (attachment._base64) {
                      try {
                        const mimeType = attachment.mimeType || (attachment.type === "image" ? "image/jpeg" : "application/octet-stream");
                        const byteCharacters = atob(attachment._base64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: mimeType });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = attachment.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error("Erro ao fazer download:", error);
                        setError("Erro ao fazer download do arquivo.");
                      }
                    }
                  };

                  return (
                    <div className="message-attachment">
                      {attachment.type === "image" ? (
                        <div className="message-attachment-image-wrapper">
                          {shouldShowImage && imageUrlToUse ? (
                            <img
                              src={imageUrlToUse}
                              alt={attachment.name}
                              className="message-attachment-image"
                              onClick={() => {
                                if (imageUrlToUse) {
                                  setSelectedImageUrl(imageUrlToUse);
                                  setSelectedImageName(attachment.name);
                                  setSelectedImageBase64(attachment._base64 || null);
                                  setShowImageModal(true);
                                }
                              }}
                              onError={(e) => {
                                if (attachment._base64) {
                                  const mimeType = attachment.mimeType || "image/jpeg";
                                  const fallbackUrl = `data:${mimeType};base64,${attachment._base64}`;
                                  if (e.currentTarget.src !== fallbackUrl) {
                                    e.currentTarget.src = fallbackUrl;
                                  } else {
                                    e.currentTarget.style.display = "none";
                                  }
                                } else {
                                  e.currentTarget.style.display = "none";
                                }
                              }}
                            />
                          ) : (
                            <div className="message-attachment-image-placeholder">
                              <span className="message-attachment-icon">🖼️</span>
                              <div className="message-attachment-info">
                                <span className="message-attachment-name">
                                  {attachment.name}
                                </span>
                                <span className="message-attachment-size">
                                  {(attachment.sizeBytes / 1024).toFixed(1)} KB
                                </span>
                              </div>
                            </div>
                          )}
                            <button
                              className="message-attachment-download-btn"
                              onClick={handleDownload}
                              title="Baixar imagem"
                              aria-label="Baixar imagem"
                            >
                              <img src={downloadIcon} alt="Download" className="download-icon" />
                            </button>
                        </div>
                      ) : (
                        <div className="message-attachment-file-wrapper">
                          <a
                            href={isValidUrl ? imageUrl : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="message-attachment-link"
                            onClick={(e) => {
                              if (!isValidUrl) {
                                e.preventDefault();
                                handleDownload(e);
                              }
                            }}
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
                          <button
                            className="message-attachment-download-btn"
                            onClick={handleDownload}
                            title="Baixar arquivo"
                            aria-label="Baixar arquivo"
                          >
                            <img src={downloadIcon} alt="Download" className="download-icon" />
                          </button>
                        </div>
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

      {showImageModal && selectedImageUrl && (
        <div className="image-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3 className="image-modal-title">{selectedImageName}</h3>
              <div className="image-modal-actions">
                <button
                  className="image-modal-download-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (selectedImageUrl) {
                      const a = document.createElement("a");
                      a.href = selectedImageUrl;
                      a.download = selectedImageName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    } else if (selectedImageBase64) {
                      try {
                        const byteCharacters = atob(selectedImageBase64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: "image/jpeg" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = selectedImageName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error("Erro ao fazer download:", error);
                        setError("Erro ao fazer download do arquivo.");
                      }
                    }
                  }}
                  title="Baixar imagem"
                  aria-label="Baixar imagem"
                >
                  <img src={downloadIcon} alt="Download" className="download-icon" />
                </button>
                <button
                  className="image-modal-close"
                  onClick={() => setShowImageModal(false)}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="image-modal-content">
              <img
                src={selectedImageUrl}
                alt={selectedImageName}
                className="image-modal-image"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
