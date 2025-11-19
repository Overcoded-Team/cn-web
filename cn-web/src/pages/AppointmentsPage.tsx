import React, { useEffect, useMemo, useState, useRef } from "react";
import "../App.css";
import "./Dashboard.css";
import "./DashboardDark.css";
import "./AppointmentsPage.css";
import { ChatWindow } from "../components/ChatWindow";
import { useAuth } from "../contexts/AuthContext";
import chatIcon from "../assets/chat.svg";
import { DashboardSidebar } from "../components/DashboardSidebar";
import {
  serviceRequestService,
  ServiceRequest,
  ServiceRequestStatus,
} from "../services/serviceRequest.service";
import {
  isChatEnabled,
  isChatReadOnly,
  getChatStatusMessage,
} from "../utils/chatUtils";

type Appointment = {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientProfilePicture?: string;
  address: string;
  serviceType: string;
  dateISO: string;
  requestedDate: Date;
  expectedDurationMinutes?: number;
  priceBRL: number;
  observation?: string;
  description?: string;
  serviceRequestId: number;
  status: ServiceRequestStatus;
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const AppointmentsPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ServiceRequest[]>([]);
  const [pendingClientApproval, setPendingClientApproval] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [modalError, setModalError] = useState<string>("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [showAcceptModal, setShowAcceptModal] = useState<boolean>(false);
  const [selectedPendingRequest, setSelectedPendingRequest] =
    useState<ServiceRequest | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<string>("");
  const [quoteNotes, setQuoteNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [chatContext, setChatContext] = useState<{
    serviceRequestId: number;
    status: ServiceRequestStatus;
    participantName?: string;
    participantAvatarUrl?: string;
  } | null>(null);
  const { user } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("dashboard-theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const [isPendingExpanded, setIsPendingExpanded] = useState<boolean>(true);
  const [isAwaitingClientExpanded, setIsAwaitingClientExpanded] = useState<boolean>(true);
  const [isConfirmedExpanded, setIsConfirmedExpanded] = useState<boolean>(true);
  const [hasPendingNotification, setHasPendingNotification] = useState<boolean>(false);
  const [hasAwaitingClientNotification, setHasAwaitingClientNotification] = useState<boolean>(false);
  const [hasConfirmedNotification, setHasConfirmedNotification] = useState<boolean>(false);
  
  const prevPendingCountRef = useRef<number>(-1);
  const prevAwaitingClientCountRef = useRef<number>(-1);
  const prevConfirmedCountRef = useRef<number>(-1);
  const isInitialLoadRef = useRef<boolean>(true);

  const calculateValueWithFees = (value: string): string => {
    if (!value || value.trim() === "") return "0,00";
    const numericValue = parseFloat(value.replace(",", "."));
    if (isNaN(numericValue) || numericValue <= 0) return "0,00";
    
    const feePercentage = 0.15;
    const fixedFee = 0.80;
    const totalWithFees = numericValue + (numericValue * feePercentage) + fixedFee;
    
    return totalWithFees.toFixed(2).replace(".", ",");
  };

  const dateToISOString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await serviceRequestService.listChefServiceRequests(
          1,
          1000
        );

        const confirmedStatuses = [
          ServiceRequestStatus.SCHEDULED,
          ServiceRequestStatus.PAYMENT_CONFIRMED,
          ServiceRequestStatus.QUOTE_ACCEPTED,
          ServiceRequestStatus.PAYMENT_PENDING,
        ];

        const allRequests = response.items || [];
        const filteredRequests = allRequests.filter((req: ServiceRequest) =>
          confirmedStatuses.includes(req.status)
        );

        const pending = allRequests.filter(
          (req: ServiceRequest) =>
            req.status === ServiceRequestStatus.PENDING_CHEF_REVIEW
        );
        setPendingRequests(pending);

        const pendingApproval = allRequests.filter(
          (req: ServiceRequest) =>
            req.status === ServiceRequestStatus.QUOTE_SENT
        );
        setPendingClientApproval(pendingApproval);

        const mappedAppointments: Appointment[] = filteredRequests.map(
          (req: ServiceRequest) => {
            const requestedDate = new Date(req.requested_date);
            const clientName = req.client_profile?.user?.name || "Cliente";
            const clientEmail = req.client_profile?.user?.email;
            const clientProfilePicture =
              req.client_profile?.user?.profilePictureUrl;
            const priceCents = req.quote?.amount_cents || 0;
            const priceBRL = priceCents / 100;

            return {
              id: `appt-${req.id}`,
              serviceRequestId: req.id,
              clientName,
              clientEmail,
              clientProfilePicture,
              address: req.location,
              serviceType: req.service_type,
              dateISO: dateToISOString(requestedDate),
              requestedDate,
              expectedDurationMinutes: req.expected_duration_minutes,
              priceBRL,
              observation: req.quote?.notes,
              description: req.description,
              status: req.status,
            };
          }
        );

        setAppointments(mappedAppointments);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar agendamentos"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, []);

  // Detectar atualizações e mostrar notificações quando os cards estiverem fechados
  useEffect(() => {
    // Ignorar a primeira carga
    if (isInitialLoadRef.current) {
      prevPendingCountRef.current = pendingRequests.length;
      prevAwaitingClientCountRef.current = pendingClientApproval.length;
      prevConfirmedCountRef.current = appointments.length;
      isInitialLoadRef.current = false;
      return;
    }

    const currentPendingCount = pendingRequests.length;
    const currentAwaitingClientCount = pendingClientApproval.length;
    const currentConfirmedCount = appointments.length;

    // Verificar se há novos itens pendentes
    if (currentPendingCount > prevPendingCountRef.current && !isPendingExpanded && prevPendingCountRef.current >= 0) {
      setHasPendingNotification(true);
    }
    prevPendingCountRef.current = currentPendingCount;

    // Verificar se há novos itens aguardando cliente
    if (currentAwaitingClientCount > prevAwaitingClientCountRef.current && !isAwaitingClientExpanded && prevAwaitingClientCountRef.current >= 0) {
      setHasAwaitingClientNotification(true);
    }
    prevAwaitingClientCountRef.current = currentAwaitingClientCount;

    // Verificar se há novos itens confirmados
    if (currentConfirmedCount > prevConfirmedCountRef.current && !isConfirmedExpanded && prevConfirmedCountRef.current >= 0) {
      setHasConfirmedNotification(true);
    }
    prevConfirmedCountRef.current = currentConfirmedCount;
  }, [pendingRequests.length, pendingClientApproval.length, appointments.length, isPendingExpanded, isAwaitingClientExpanded, isConfirmedExpanded]);

  // Limpar notificações quando os cards forem abertos
  useEffect(() => {
    if (isPendingExpanded) {
      setHasPendingNotification(false);
    }
  }, [isPendingExpanded]);

  useEffect(() => {
    if (isAwaitingClientExpanded) {
      setHasAwaitingClientNotification(false);
    }
  }, [isAwaitingClientExpanded]);

  useEffect(() => {
    if (isConfirmedExpanded) {
      setHasConfirmedNotification(false);
    }
  }, [isConfirmedExpanded]);

  const monthName = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [currentMonth, currentYear]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentMonth, currentYear]);

  const firstWeekDayIndex = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    const newMonth = currentMonth - 1;
    if (newMonth < 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth(newMonth);
    }
  };

  const handleNextMonth = () => {
    const newMonth = currentMonth + 1;
    if (newMonth > 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth(newMonth);
    }
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    const dateISO = dateToISOString(newDate);
    const appointmentForDate = appointments.find((a) => a.dateISO === dateISO);
    if (appointmentForDate) {
      setSelectedAppointmentId(appointmentForDate.id);
    } else {
      setSelectedAppointmentId(null);
    }
  };

  const formatDateBR = (date: Date | string): string => {
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
    return `${day}/${month}/${year}`;
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

  const selectedDateISO = useMemo(() => {
    return dateToISOString(selectedDate);
  }, [selectedDate]);

  const selectedAppointment = useMemo(() => {
    if (selectedAppointmentId) {
      return appointments.find((a) => a.id === selectedAppointmentId) || null;
    }
    return appointments.find((a) => a.dateISO === selectedDateISO) || null;
  }, [appointments, selectedDateISO, selectedAppointmentId]);

  const confirmedSorted = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const timeA = new Date(a.dateISO).getTime();
      const timeB = new Date(b.dateISO).getTime();
      if (timeA < timeB) return -1;
      if (timeA > timeB) return 1;
      return 0;
    });
  }, [appointments]);

  const handleOpenAcceptModal = (request: ServiceRequest) => {
    setSelectedPendingRequest(request);
    setQuoteAmount("");
    setQuoteNotes("");
    setModalError("");
    setShowAcceptModal(true);
  };

  const handleCloseAcceptModal = () => {
    setShowAcceptModal(false);
    setSelectedPendingRequest(null);
    setQuoteAmount("");
    setQuoteNotes("");
    setModalError("");
  };

  const handleAcceptAndSendQuote = async () => {
    if (!selectedPendingRequest) return;

    const amount = parseFloat(quoteAmount.replace(",", "."));
    if (isNaN(amount) || amount < 1) {
      setModalError("Valor inválido. O valor mínimo é R$ 1,00");
      return;
    }

    try {
      setIsProcessing(true);
      setModalError("");

      await serviceRequestService.acceptRequest(selectedPendingRequest.id);

      await serviceRequestService.sendQuote(selectedPendingRequest.id, {
        amount_cents: Math.round(amount * 100),
        notes: quoteNotes.trim() || undefined,
      });

      const response = await serviceRequestService.listChefServiceRequests(
        1,
        1000
      );

      const confirmedStatuses = [
        ServiceRequestStatus.SCHEDULED,
        ServiceRequestStatus.PAYMENT_CONFIRMED,
        ServiceRequestStatus.QUOTE_ACCEPTED,
        ServiceRequestStatus.PAYMENT_PENDING,
      ];

      const allRequests = response.items || [];
      const filteredRequests = allRequests.filter((req: ServiceRequest) =>
        confirmedStatuses.includes(req.status)
      );

      const pending = allRequests.filter(
        (req: ServiceRequest) =>
          req.status === ServiceRequestStatus.PENDING_CHEF_REVIEW
      );
      setPendingRequests(pending);

      const pendingApproval = allRequests.filter(
        (req: ServiceRequest) =>
          req.status === ServiceRequestStatus.QUOTE_SENT
      );
      setPendingClientApproval(pendingApproval);

      const mappedAppointments: Appointment[] = filteredRequests.map(
        (req: ServiceRequest) => {
          const requestedDate = new Date(req.requested_date);
          const clientName = req.client_profile?.user?.name || "Cliente";
          const clientEmail = req.client_profile?.user?.email;
          const clientProfilePicture =
            req.client_profile?.user?.profilePictureUrl;
          const priceCents = req.quote?.amount_cents || 0;
          const priceBRL = priceCents / 100;

          return {
            id: `appt-${req.id}`,
            serviceRequestId: req.id,
            clientName,
            clientEmail,
            clientProfilePicture,
            address: req.location,
            serviceType: req.service_type,
            dateISO: dateToISOString(requestedDate),
            requestedDate,
            expectedDurationMinutes: req.expected_duration_minutes,
            priceBRL,
            observation: req.quote?.notes,
            description: req.description,
            status: req.status,
          };
        }
      );

      setAppointments(mappedAppointments);
      handleCloseAcceptModal();
      
      // Abrir chat automaticamente após aceitar a solicitação
      const acceptedRequest = allRequests.find((req: ServiceRequest) => req.id === selectedPendingRequest.id);
      if (acceptedRequest) {
        const clientName = acceptedRequest.client_profile?.user?.name || "Cliente";
        const clientProfilePicture = acceptedRequest.client_profile?.user?.profilePictureUrl;
        setChatContext({
          serviceRequestId: acceptedRequest.id,
          status: acceptedRequest.status,
          participantName: clientName,
          participantAvatarUrl: clientProfilePicture,
        });
        setShowChatModal(true);
      }
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : "Erro ao aceitar pedido e enviar orçamento"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    if (
      !confirm(
        "Tem certeza que deseja rejeitar este pedido? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      setIsProcessing(true);
      setError("");

      await serviceRequestService.rejectRequest(requestId);

      const response = await serviceRequestService.listChefServiceRequests(
        1,
        1000
      );

      const allRequests = response.items || [];
      const pending = allRequests.filter(
        (req: ServiceRequest) =>
          req.status === ServiceRequestStatus.PENDING_CHEF_REVIEW
      );
      setPendingRequests(pending);

      const pendingApproval = allRequests.filter(
        (req: ServiceRequest) =>
          req.status === ServiceRequestStatus.QUOTE_SENT
      );
      setPendingClientApproval(pendingApproval);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao rejeitar pedido");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  return (
    <div className={`dashboard-layout ${theme === "light" ? "dashboard-light" : "dashboard-dark"}`}>
      <DashboardSidebar />
      <main className={`dashboard-main ${theme === "light" ? "dashboard-light-main" : "dashboard-dark-main"}`}>
        <div className={`dashboard-content ${theme === "light" ? "dashboard-light-content" : "dashboard-dark-content"}`}>
          <div className={`dashboard-header ${theme === "light" ? "dashboard-light-header" : "dashboard-dark-header"}`}>
            <h1 className={`dashboard-title ${theme === "light" ? "dashboard-light-title" : "dashboard-dark-title"}`}>Agendamentos</h1>
            <div className="theme-toggle-container">
              <span className="theme-toggle-label">Tema</span>
              <button
                className={`theme-toggle-switch ${theme === "light" ? "theme-toggle-on" : "theme-toggle-off"}`}
                onClick={toggleTheme}
                title={theme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"}
                type="button"
                role="switch"
                aria-checked={theme === "light"}
                aria-label={theme === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro"}
              >
                <span className="theme-toggle-slider"></span>
              </button>
            </div>
          </div>
          <div className="appointments-grid">
            <section className="appointments-list-section">
              <div className="dashboard-dark-card pending-section">
                <div className="section-header-with-chevron">
                  <div className="section-title-with-notification">
                    <h2 className="dashboard-dark-card-title">Pendentes</h2>
                    {hasPendingNotification && !isPendingExpanded && (
                      <span className="section-notification-badge" aria-label="Novos itens">
                        <span className="notification-dot"></span>
                      </span>
                    )}
                  </div>
                  <button
                    className="section-chevron-button"
                    onClick={() => setIsPendingExpanded(!isPendingExpanded)}
                    aria-label={isPendingExpanded ? "Ocultar" : "Mostrar"}
                    type="button"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`section-chevron-icon ${isPendingExpanded ? "expanded" : ""}`}
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                {isPendingExpanded && (
                <>
                {isLoading ? (
                  <div className="empty-state">Carregando...</div>
                ) : pendingRequests.length === 0 ? (
                  <div className="empty-state">
                    Nenhum pedido pendente.
                  </div>
                ) : (
                  <div className="pending-requests-list">
                    {pendingRequests.map((req) => {
                      const requestedDate = new Date(req.requested_date);
                      const clientName =
                        req.client_profile?.user?.name || "Cliente";
                      const clientProfilePicture =
                        req.client_profile?.user?.profilePictureUrl;

                      return (
                        <div key={req.id} className="pending-request-card">
                          <div className="pending-card-left">
                            {clientProfilePicture ? (
                              <img
                                src={clientProfilePicture}
                                alt={clientName}
                                className="pending-client-avatar"
                              />
                            ) : (
                              <div className="pending-client-avatar-placeholder">
                                {clientName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="pending-info">
                              <div className="pending-code">#{req.id}</div>
                              <div className="pending-client">{clientName}</div>
                              <div className="pending-service-type">
                                {req.service_type}
                              </div>
                              <div className="pending-date">
                                {formatDateTimeBR(requestedDate)}
                              </div>
                              <div className="pending-address">
                                {req.location}
                              </div>
                            </div>
                          </div>
                          <div className="pending-card-actions">
                            <button
                              className="accept-button"
                              onClick={() => handleOpenAcceptModal(req)}
                              disabled={isProcessing}
                            >
                              Aceitar
                            </button>
                            <button
                              className="reject-button"
                              onClick={() => handleRejectRequest(req.id)}
                              disabled={isProcessing}
                            >
                              Rejeitar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </>
                )}
              </div>

              <div className="dashboard-dark-card pending-section">
                <div className="section-header-with-chevron">
                  <div className="section-title-with-notification">
                    <h2 className="dashboard-dark-card-title">Aguardando Cliente</h2>
                    {hasAwaitingClientNotification && !isAwaitingClientExpanded && (
                      <span className="section-notification-badge" aria-label="Novos itens">
                        <span className="notification-dot"></span>
                      </span>
                    )}
                  </div>
                  <button
                    className="section-chevron-button"
                    onClick={() => setIsAwaitingClientExpanded(!isAwaitingClientExpanded)}
                    aria-label={isAwaitingClientExpanded ? "Ocultar" : "Mostrar"}
                    type="button"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`section-chevron-icon ${isAwaitingClientExpanded ? "expanded" : ""}`}
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                {isAwaitingClientExpanded && (
                <>
                {isLoading ? (
                  <div className="empty-state">Carregando...</div>
                ) : pendingClientApproval.length === 0 ? (
                  <div className="empty-state">
                    Nenhum pedido aguardando aprovação do cliente.
                  </div>
                ) : (
                  <div className="pending-requests-list">
                    {pendingClientApproval.map((req) => {
                      const requestedDate = new Date(req.requested_date);
                      const clientName =
                        req.client_profile?.user?.name || "Cliente";
                      const clientProfilePicture =
                        req.client_profile?.user?.profilePictureUrl;
                      const priceCents = req.quote?.amount_cents || 0;
                      const priceBRL = priceCents / 100;

                      return (
                        <div key={req.id} className="pending-request-card">
                          <div className="pending-card-left">
                            {clientProfilePicture ? (
                              <img
                                src={clientProfilePicture}
                                alt={clientName}
                                className="pending-client-avatar"
                              />
                            ) : (
                              <div className="pending-client-avatar-placeholder">
                                {clientName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="pending-info">
                              <div className="pending-code">#{req.id}</div>
                              <div className="pending-client">{clientName}</div>
                              <div className="pending-service-type">
                                {req.service_type}
                              </div>
                              <div className="pending-date">
                                {formatDateTimeBR(requestedDate)}
                              </div>
                              <div className="pending-address">
                                {req.location}
                              </div>
                              {priceBRL > 0 && (
                                <div className="pending-price">
                                  Valor: R${" "}
                                  {priceBRL.toFixed(2).replace(".", ",")}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="pending-card-status">
                            <div className="status-badge waiting">
                              Aguardando aprovação
                            </div>
                          </div>
                          <button
                            className="pending-chat-fab"
                            aria-label="Abrir chat"
                            onClick={() => {
                              setChatContext({
                                serviceRequestId: req.id,
                                status: req.status,
                                participantName: clientName,
                                participantAvatarUrl: clientProfilePicture,
                              });
                              setShowChatModal(true);
                            }}
                          >
                            <img src={chatIcon} alt="" className="chat-icon" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                </>
                )}
              </div>

              <div className="dashboard-dark-card">
                <div className="section-header-with-chevron">
                  <div className="section-title-with-notification">
                    <h2 className="dashboard-dark-card-title">Confirmados</h2>
                    {hasConfirmedNotification && !isConfirmedExpanded && (
                      <span className="section-notification-badge" aria-label="Novos itens">
                        <span className="notification-dot"></span>
                      </span>
                    )}
                  </div>
                  <button
                    className="section-chevron-button"
                    onClick={() => setIsConfirmedExpanded(!isConfirmedExpanded)}
                    aria-label={isConfirmedExpanded ? "Ocultar" : "Mostrar"}
                    type="button"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`section-chevron-icon ${isConfirmedExpanded ? "expanded" : ""}`}
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {isConfirmedExpanded && (
                <>
                {isLoading ? (
                  <div className="empty-state">Carregando...</div>
                ) : error ? (
                  <div className="empty-state">{error}</div>
                ) : confirmedSorted.length === 0 ? (
                  <div className="empty-state">
                    Nenhum agendamento confirmado.
                  </div>
                ) : (
                  <ul className="appointments-list">
                  {confirmedSorted.map((a) => (
                    <li
                      key={a.id}
                      className={`appointment-card ${
                        selectedAppointmentId === a.id ? "selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedAppointmentId(a.id);
                        const appointmentDate = new Date(
                          a.dateISO + "T00:00:00"
                        );
                        setSelectedDate(appointmentDate);
                        setCurrentMonth(appointmentDate.getMonth());
                        setCurrentYear(appointmentDate.getFullYear());
                      }}
                    >
                      <div className="card-left">
                        {a.clientProfilePicture ? (
                          <img
                            src={a.clientProfilePicture}
                            alt={a.clientName}
                            className="appt-client-avatar"
                          />
                        ) : (
                          <div className="appt-client-avatar-placeholder">
                            {a.clientName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="appt-info">
                          <div className="appt-code">#{a.serviceRequestId}</div>
                          <div className="appt-client">{a.clientName}</div>
                          <div className="appt-service-type">
                            {a.serviceType}
                          </div>
                          <div className="appt-address">{a.address}</div>
                          {a.expectedDurationMinutes && (
                            <div className="appt-duration">
                              Duração: {a.expectedDurationMinutes} min
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="card-right">
                        <div className="appt-date">
                          {formatDateTimeBR(a.requestedDate)}
                        </div>
                        <div className="appt-price">
                          R$ {a.priceBRL.toFixed(2).replace(".", ",")}
                        </div>
                      </div>
                      <button
                        className="pending-chat-fab"
                        aria-label="Abrir chat"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatContext({
                            serviceRequestId: a.serviceRequestId,
                            status: a.status,
                            participantName: a.clientName,
                            participantAvatarUrl: a.clientProfilePicture,
                          });
                          setShowChatModal(true);
                        }}
                      >
                        <img src={chatIcon} alt="" className="chat-icon" />
                      </button>
                    </li>
                  ))}
                  </ul>
                )}
                </>
                )}
              </div>
            </section>

            <section className="appointments-right-panel">
              <div className="dashboard-dark-card calendar-card">
                <div className="calendar-header">
                  <button
                    type="button"
                    className="cal-nav"
                    onClick={handlePrevMonth}
                    aria-label="Mês anterior"
                  >
                    ‹
                  </button>
                  <div className="cal-title">
                    {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                  </div>
                  <button
                    type="button"
                    className="cal-nav"
                    onClick={handleNextMonth}
                    aria-label="Próximo mês"
                  >
                    ›
                  </button>
                </div>
                <div className="calendar-grid">
                  {weekDays.map((d) => (
                    <div key={d} className="cal-weekday">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: firstWeekDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="cal-day empty" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const isSelected =
                      selectedDate.getFullYear() === currentYear &&
                      selectedDate.getMonth() === currentMonth &&
                      selectedDate.getDate() === day;
                    return (
                      <button
                        key={day}
                        className={`cal-day ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectDate(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="dashboard-dark-card notes-card">
                {selectedAppointment ? (
                  <>
                    <div className="notes-header">
                      <div className="notes-title">
                        {selectedAppointment.clientName}
                      </div>
                      <div className="notes-date">
                        {formatDateTimeBR(selectedAppointment.requestedDate)}
                      </div>
                    </div>

                    <div className="appointment-details">
                      <div className="detail-item">
                        <span className="detail-label">Tipo de Serviço:</span>
                        <span className="detail-value">
                          {selectedAppointment.serviceType}
                        </span>
                      </div>

                      {selectedAppointment.clientEmail && (
                        <div className="detail-item">
                          <span className="detail-label">Email:</span>
                          <span className="detail-value">
                            {selectedAppointment.clientEmail}
                          </span>
                        </div>
                      )}

                      <div className="detail-item">
                        <span className="detail-label">Endereço:</span>
                        <span className="detail-value">
                          {selectedAppointment.address}
                        </span>
                      </div>

                      {selectedAppointment.expectedDurationMinutes && (
                        <div className="detail-item">
                          <span className="detail-label">Duração:</span>
                          <span className="detail-value">
                            {selectedAppointment.expectedDurationMinutes}{" "}
                            minutos
                          </span>
                        </div>
                      )}

                      {selectedAppointment.priceBRL > 0 && (
                        <div className="detail-item">
                          <span className="detail-label">Valor:</span>
                          <span className="detail-value price">
                            R${" "}
                            {selectedAppointment.priceBRL
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>
                      )}
                    </div>

                    {(selectedAppointment.description ||
                      selectedAppointment.observation) ? (
                      <div className="appointment-observation">
                        {selectedAppointment.description && (
                          <div style={{ marginBottom: selectedAppointment.observation ? "16px" : "0" }}>
                            <strong>Descrição do Cliente:</strong>
                            <p>{selectedAppointment.description}</p>
                          </div>
                        )}
                        {selectedAppointment.observation && (
                          <div>
                            <strong>Observações do Chef:</strong>
                            <p>{selectedAppointment.observation}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="appointment-observation-empty">
                        <p>Nenhuma observação disponível.</p>
                      </div>
                    )}

                    <div className="appointment-actions">
                      {(() => {
                        const chatEnabled = isChatEnabled(selectedAppointment.status);
                        const chatReadOnly = isChatReadOnly(selectedAppointment.status);
                        const statusMessage = getChatStatusMessage(selectedAppointment.status);

                        if (!chatEnabled) {
                          return (
                            <div className="chat-unavailable">
                              <div className="chat-unavailable-text">
                                <strong>Chat Indisponível</strong>
                                {statusMessage && <p>{statusMessage}</p>}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <>
                            {statusMessage && (
                              <div className="chat-info-message">
                                <span className="chat-info-icon">ℹ️</span>
                                <span>{statusMessage}</span>
                              </div>
                            )}
                            <button
                              className={`chat-button ${chatReadOnly ? "chat-readonly" : ""}`}
                              onClick={() => {
                                if (selectedAppointment) {
                                  setChatContext({
                                    serviceRequestId: selectedAppointment.serviceRequestId,
                                    status: selectedAppointment.status,
                                    participantName: selectedAppointment.clientName,
                                    participantAvatarUrl: selectedAppointment.clientProfilePicture,
                                  });
                                  setShowChatModal(true);
                                }
                              }}
                            >
                              <img src={chatIcon} alt="Chat" className="chat-icon" />
                              {chatReadOnly ? "Ver Chat (Somente Leitura)" : "Abrir Chat"}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="notes-title">
                      {formatDateBR(selectedDate)} - Observações
                    </div>
                    <div className="appointment-observation-empty">
                      <p>Selecione um agendamento para ver os detalhes.</p>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {showAcceptModal && selectedPendingRequest && (
        <div className="modal-overlay" onClick={handleCloseAcceptModal}>
          <div className="accept-modal" onClick={(e) => e.stopPropagation()}>
            <div className="accept-modal-header">
              <h2 className="accept-modal-title">Aceitar Pedido</h2>
              <button
                className="accept-modal-close"
                onClick={handleCloseAcceptModal}
                disabled={isProcessing}
              >
                ×
              </button>
            </div>

            <div className="accept-modal-content">
              {modalError && (
                <div className="accept-modal-error">{modalError}</div>
              )}

              <div className="accept-request-info">
                <div className="accept-info-item">
                  <span className="accept-info-label">Cliente:</span>
                  <span className="accept-info-value">
                    {selectedPendingRequest.client_profile?.user?.name ||
                      "Cliente"}
                  </span>
                </div>
                <div className="accept-info-item">
                  <span className="accept-info-label">Tipo de Serviço:</span>
                  <span className="accept-info-value">
                    {selectedPendingRequest.service_type}
                  </span>
                </div>
                <div className="accept-info-item">
                  <span className="accept-info-label">Data e Horário:</span>
                  <span className="accept-info-value">
                    {formatDateTimeBR(selectedPendingRequest.requested_date)}
                  </span>
                </div>
                <div className="accept-info-item">
                  <span className="accept-info-label">Endereço:</span>
                  <span className="accept-info-value">
                    {selectedPendingRequest.location}
                  </span>
                </div>
                {selectedPendingRequest.description && (
                  <div className="accept-info-item">
                    <span className="accept-info-label">Descrição:</span>
                    <span className="accept-info-value">
                      {selectedPendingRequest.description}
                    </span>
                  </div>
                )}
              </div>

              <div className="accept-form-group">
                <label className="accept-form-label">
                  Valor do Serviço (R$)
                </label>
                <div className="accept-value-container">
                  <input
                    type="text"
                    className="accept-form-input"
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
                    disabled={isProcessing}
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

              <div className="accept-form-group">
                <label className="accept-form-label">
                  Observações (opcional)
                </label>
                <textarea
                  className="accept-form-textarea"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Adicione observações sobre este serviço..."
                  rows={4}
                  disabled={isProcessing}
                />
              </div>

              <div className="accept-modal-actions">
                <button
                  className="accept-modal-cancel"
                  onClick={handleCloseAcceptModal}
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
                <button
                  className="accept-modal-submit"
                  onClick={handleAcceptAndSendQuote}
                  disabled={isProcessing || !quoteAmount}
                >
                  {isProcessing
                    ? "Processando..."
                    : "Aceitar e Enviar Orçamento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChatModal && chatContext && (
        <div className="modal-overlay" onClick={() => setShowChatModal(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <ChatWindow
              serviceRequestId={chatContext.serviceRequestId}
              currentUserId={user?.id}
              currentUserRole="CHEF"
              status={chatContext.status}
              participantName={chatContext.participantName}
              participantAvatarUrl={chatContext.participantAvatarUrl}
              onClose={() => setShowChatModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
