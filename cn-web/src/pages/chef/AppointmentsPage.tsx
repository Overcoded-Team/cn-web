import React, { useEffect, useMemo, useState, useRef } from "react";
import "../App.css";
import "./Dashboard.css";
import "./DashboardDark.css";
import "./themes/AppointmentsPage.base.css";
import "./themes/AppointmentsPage.dark.css";
import "./themes/AppointmentsPage.light.css";
import { ChatWindow } from "../../components/ChatWindow";
import { useAuth } from "../../contexts/AuthContext";
import chatIcon from "../assets/chat.svg";
import { DashboardSidebar } from "../../components/DashboardSidebar";
import {
  serviceRequestService,
  ServiceRequest,
  ServiceRequestStatus,
} from "../../services/serviceRequest.service";
import { formatCurrency } from "../../utils/dataUtils";

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
  const today = useMemo(() => {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
  }, []);
  const [currentMonth, setCurrentMonth] = useState<number>(today.getUTCMonth());
  const [currentYear, setCurrentYear] = useState<number>(
    today.getUTCFullYear()
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ServiceRequest[]>([]);
  const [pendingClientApproval, setPendingClientApproval] = useState<
    ServiceRequest[]
  >([]);
  const [allChefRequests, setAllChefRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [modalError, setModalError] = useState<string>("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [showAppointmentModal, setShowAppointmentModal] =
    useState<boolean>(false);
  const [filterByDate, setFilterByDate] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [chatContext, setChatContext] = useState<{
    serviceRequestId: number;
    status: ServiceRequestStatus;
    participantName?: string;
    participantAvatarUrl?: string;
  } | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [selectedQuoteRequest, setSelectedQuoteRequest] =
    useState<ServiceRequest | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<string>("");
  const [quoteNotes, setQuoteNotes] = useState<string>("");
  const [isSendingQuote, setIsSendingQuote] = useState<boolean>(false);
  const { user } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("dashboard-theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const [activeTab, setActiveTab] = useState<
    "solicitacoes" | "pendentes" | "confirmados"
  >("solicitacoes");
  const [hasPendingNotification, setHasPendingNotification] =
    useState<boolean>(false);
  const [hasAwaitingClientNotification, setHasAwaitingClientNotification] =
    useState<boolean>(false);
  const [hasConfirmedNotification, setHasConfirmedNotification] =
    useState<boolean>(false);

  const prevPendingCountRef = useRef<number>(-1);
  const prevAwaitingClientCountRef = useRef<number>(-1);
  const prevConfirmedCountRef = useRef<number>(-1);
  const isInitialLoadRef = useRef<boolean>(true);

  const dateToISOString = (date: Date | string): string => {
    let d: Date;
    if (typeof date === "string") {
      d = new Date(date);
    } else {
      d = date;
    }
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
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
        setAllChefRequests(allRequests);

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
            const requestedDateStr = String(req.requested_date);
            let dateStr = requestedDateStr;
            if (!dateStr.includes("T")) {
              dateStr = dateStr + "T00:00:00Z";
            } else if (
              !dateStr.includes("Z") &&
              !dateStr.includes("+") &&
              !dateStr.includes("-", 10)
            ) {
              dateStr = dateStr + "Z";
            }
            const requestedDate = new Date(dateStr);
            const normalizedDateForComparison = new Date(
              Date.UTC(
                requestedDate.getUTCFullYear(),
                requestedDate.getUTCMonth(),
                requestedDate.getUTCDate()
              )
            );
            const requestedDateWithTime = new Date(
              Date.UTC(
                requestedDate.getUTCFullYear(),
                requestedDate.getUTCMonth(),
                requestedDate.getUTCDate(),
                requestedDate.getUTCHours(),
                requestedDate.getUTCMinutes(),
                requestedDate.getUTCSeconds()
              )
            );

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
              dateISO: dateToISOString(normalizedDateForComparison),
              requestedDate: requestedDateWithTime,
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

  useEffect(() => {
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

    if (
      currentPendingCount > prevPendingCountRef.current &&
      activeTab !== "solicitacoes" &&
      prevPendingCountRef.current >= 0
    ) {
      setHasPendingNotification(true);
    }
    prevPendingCountRef.current = currentPendingCount;

    if (
      currentAwaitingClientCount > prevAwaitingClientCountRef.current &&
      activeTab !== "pendentes" &&
      prevAwaitingClientCountRef.current >= 0
    ) {
      setHasAwaitingClientNotification(true);
    }
    prevAwaitingClientCountRef.current = currentAwaitingClientCount;

    if (
      currentConfirmedCount > prevConfirmedCountRef.current &&
      activeTab !== "confirmados" &&
      prevConfirmedCountRef.current >= 0
    ) {
      setHasConfirmedNotification(true);
    }
    prevConfirmedCountRef.current = currentConfirmedCount;
  }, [
    pendingRequests.length,
    pendingClientApproval.length,
    appointments.length,
    activeTab,
  ]);

  useEffect(() => {
    if (activeTab === "solicitacoes") {
      setHasPendingNotification(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "pendentes") {
      setHasAwaitingClientNotification(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "confirmados") {
      setHasConfirmedNotification(false);
    }
  }, [activeTab]);

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
    setFilterByDate(false);
  };

  const handleNextMonth = () => {
    const newMonth = currentMonth + 1;
    if (newMonth > 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth(newMonth);
    }
    setFilterByDate(false);
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(Date.UTC(currentYear, currentMonth, day));
    const dateISO = dateToISOString(newDate);
    const selectedDateISO = dateToISOString(selectedDate);

    if (filterByDate && dateISO === selectedDateISO) {
      setFilterByDate(false);
      setSelectedAppointmentId(null);
      setSelectedDate(today);
      return;
    }

    setSelectedDate(newDate);
    setFilterByDate(true);

    const appointmentsForDate = appointments.filter((a) => {
      const appointmentDateNormalized = dateToISOString(a.requestedDate);
      return appointmentDateNormalized === dateISO;
    });

    if (appointmentsForDate.length > 0) {
      const sortedByTime = appointmentsForDate.sort((a, b) => {
        const timeA = new Date(a.requestedDate).getTime();
        const timeB = new Date(b.requestedDate).getTime();
        return timeA - timeB;
      });
      setSelectedAppointmentId(sortedByTime[0].id);
    } else {
      setSelectedAppointmentId(null);
    }
  };

  const requestSequentialNumbers = useMemo(() => {
    const sortedRequests = [...allChefRequests].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });

    const numberMap = new Map<number, number>();
    sortedRequests.forEach((req, index) => {
      numberMap.set(req.id, index + 1);
    });

    return numberMap;
  }, [allChefRequests]);

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

    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
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

  const sortedPendingRequests = useMemo(() => {
    const now = new Date().getTime();
    const sorted = [...pendingRequests].sort((a, b) => {
      const dateA = new Date(a.requested_date).getTime();
      const dateB = new Date(b.requested_date).getTime();
      const diffA = Math.abs(dateA - now);
      const diffB = Math.abs(dateB - now);
      return diffA - diffB;
    });
    return sorted;
  }, [pendingRequests]);

  const sortedPendingClientApproval = useMemo(() => {
    const now = new Date().getTime();
    const sorted = [...pendingClientApproval].sort((a, b) => {
      const dateA = new Date(a.requested_date).getTime();
      const dateB = new Date(b.requested_date).getTime();
      const diffA = Math.abs(dateA - now);
      const diffB = Math.abs(dateB - now);
      return diffA - diffB;
    });
    return sorted;
  }, [pendingClientApproval]);

  const confirmedSorted = useMemo(() => {
    let filtered = [...appointments];

    if (filterByDate) {
      const dateISO = dateToISOString(selectedDate);
      filtered = filtered.filter((a) => {
        const appointmentDateNormalized = dateToISOString(a.requestedDate);
        return appointmentDateNormalized === dateISO;
      });
    }

    if (filterByDate) {
      return filtered.sort((a, b) => {
        const dateA = new Date(a.requestedDate).getTime();
        const dateB = new Date(b.requestedDate).getTime();
        return dateA - dateB;
      });
    } else {
      const now = new Date().getTime();
      return filtered.sort((a, b) => {
        const dateA = new Date(a.requestedDate).getTime();
        const dateB = new Date(b.requestedDate).getTime();
        const diffA = Math.abs(dateA - now);
        const diffB = Math.abs(dateB - now);
        return diffA - diffB;
      });
    }
  }, [appointments, filterByDate, selectedDate]);

  const handleAcceptRequest = async (requestId: number) => {
    if (!confirm("Tem certeza que deseja aceitar este pedido?")) {
      return;
    }

    try {
      setIsProcessing(true);
      setError("");

      await serviceRequestService.acceptRequest(requestId);

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
        (req: ServiceRequest) => req.status === ServiceRequestStatus.QUOTE_SENT
      );
      setPendingClientApproval(pendingApproval);

      const mappedAppointments: Appointment[] = filteredRequests.map(
        (req: ServiceRequest) => {
          const requestedDateStr = String(req.requested_date);
          let dateStr = requestedDateStr;
          if (!dateStr.includes("T")) {
            dateStr = dateStr + "T00:00:00Z";
          } else if (
            !dateStr.includes("Z") &&
            !dateStr.includes("+") &&
            !dateStr.includes("-", 10)
          ) {
            dateStr = dateStr + "Z";
          }
          const requestedDate = new Date(dateStr);
          const normalizedDate = new Date(
            Date.UTC(
              requestedDate.getUTCFullYear(),
              requestedDate.getUTCMonth(),
              requestedDate.getUTCDate()
            )
          );

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
            dateISO: dateToISOString(normalizedDate),
            requestedDate: normalizedDate,
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
      setError(err instanceof Error ? err.message : "Erro ao aceitar pedido");
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
        (req: ServiceRequest) => req.status === ServiceRequestStatus.QUOTE_SENT
      );
      setPendingClientApproval(pendingApproval);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao rejeitar pedido");
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateValueWithFees = (value: string): string => {
    if (!value || value.trim() === "") return "0,00";
    const numericValue = parseFloat(value.replace(",", "."));
    if (isNaN(numericValue) || numericValue <= 0) return "0,00";

    const feePercentage = 0.15;
    const fixedFee = 0.8;
    const totalWithFees =
      numericValue + numericValue * feePercentage + fixedFee;

    return totalWithFees.toFixed(2).replace(".", ",");
  };

  const handleOpenQuoteModal = (request: ServiceRequest) => {
    setSelectedQuoteRequest(request);
    setQuoteAmount("");
    setQuoteNotes("");
    setModalError("");
    setShowQuoteModal(true);
  };

  const handleCloseQuoteModal = () => {
    setShowQuoteModal(false);
    setSelectedQuoteRequest(null);
    setQuoteAmount("");
    setQuoteNotes("");
    setModalError("");
  };

  const handleSendQuote = async () => {
    if (!selectedQuoteRequest) return;

    const amount = parseFloat(quoteAmount.replace(",", "."));
    if (isNaN(amount) || amount < 1) {
      setModalError("Valor inválido. O valor mínimo é R$ 1,00");
      return;
    }

    try {
      setIsSendingQuote(true);
      setModalError("");

      await serviceRequestService.sendQuote(selectedQuoteRequest.id, {
        amount_cents: Math.round(amount * 100),
        notes: quoteNotes.trim() || undefined,
      });

      const response = await serviceRequestService.listChefServiceRequests(
        1,
        1000
      );

      const allRequests = response.items || [];
      const pendingApproval = allRequests.filter(
        (req: ServiceRequest) => req.status === ServiceRequestStatus.QUOTE_SENT
      );
      setPendingClientApproval(pendingApproval);

      handleCloseQuoteModal();
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : "Erro ao enviar orçamento. Tente novamente."
      );
    } finally {
      setIsSendingQuote(false);
    }
  };

  const handleCompleteService = async (serviceRequestId: number) => {
    if (
      !confirm(
        "Tem certeza que deseja finalizar este serviço? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      setIsProcessing(true);
      setError("");

      await serviceRequestService.completeService(serviceRequestId);

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
      setAllChefRequests(allRequests);

      const filteredRequests = allRequests.filter((req: ServiceRequest) =>
        confirmedStatuses.includes(req.status)
      );

      const mappedAppointments: Appointment[] = filteredRequests.map(
        (req: ServiceRequest) => {
          const requestedDateStr = String(req.requested_date);
          let dateStr = requestedDateStr;
          if (!dateStr.includes("T")) {
            dateStr = dateStr + "T00:00:00Z";
          } else if (
            !dateStr.includes("Z") &&
            !dateStr.includes("+") &&
            !dateStr.includes("-", 10)
          ) {
            dateStr = dateStr + "Z";
          }
          const requestedDate = new Date(dateStr);
          const normalizedDate = new Date(
            Date.UTC(
              requestedDate.getUTCFullYear(),
              requestedDate.getUTCMonth(),
              requestedDate.getUTCDate()
            )
          );

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
            dateISO: dateToISOString(normalizedDate),
            requestedDate: normalizedDate,
            expectedDurationMinutes: req.expected_duration_minutes,
            priceBRL,
            observation: req.quote?.notes,
            description: req.description,
            status: req.status,
          };
        }
      );

      setAppointments(mappedAppointments);

      setShowAppointmentModal(false);
      setSelectedAppointmentId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao finalizar serviço"
      );
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
    <div
      className={`dashboard-layout ${
        theme === "light" ? "dashboard-light" : "dashboard-dark"
      }`}
    >
      <DashboardSidebar />
      <main
        className={`dashboard-main ${
          theme === "light" ? "dashboard-light-main" : "dashboard-dark-main"
        }`}
      >
        <div
          className={`dashboard-content ${
            theme === "light"
              ? "dashboard-light-content"
              : "dashboard-dark-content"
          }`}
        >
          <div
            className={`dashboard-header ${
              theme === "light"
                ? "dashboard-light-header"
                : "dashboard-dark-header"
            }`}
          >
            <h1
              className={`dashboard-title ${
                theme === "light"
                  ? "dashboard-light-title"
                  : "dashboard-dark-title"
              }`}
            >
              Agendamentos
            </h1>
            <div className="theme-toggle-container">
              <span className="theme-toggle-label">Tema</span>
              <button
                className={`theme-toggle-switch ${
                  theme === "light" ? "theme-toggle-on" : "theme-toggle-off"
                }`}
                onClick={toggleTheme}
                title={
                  theme === "dark"
                    ? "Alternar para tema claro"
                    : "Alternar para tema escuro"
                }
                type="button"
                role="switch"
                aria-checked={theme === "light"}
                aria-label={
                  theme === "dark"
                    ? "Alternar para tema claro"
                    : "Alternar para tema escuro"
                }
              >
                <span className="theme-toggle-slider"></span>
              </button>
            </div>
          </div>
          <div className="appointments-tabs">
            <div className="tabs-header">
              <button
                className={`tab-button ${
                  activeTab === "solicitacoes" ? "active" : ""
                }`}
                onClick={() => setActiveTab("solicitacoes")}
              >
                Solicitações
                {hasPendingNotification && activeTab !== "solicitacoes" && (
                  <span className="tab-notification-badge">
                    <span className="notification-dot"></span>
                  </span>
                )}
              </button>
              <button
                className={`tab-button ${
                  activeTab === "pendentes" ? "active" : ""
                }`}
                onClick={() => setActiveTab("pendentes")}
              >
                Pendentes
                {hasAwaitingClientNotification && activeTab !== "pendentes" && (
                  <span className="tab-notification-badge">
                    <span className="notification-dot"></span>
                  </span>
                )}
              </button>
              <button
                className={`tab-button ${
                  activeTab === "confirmados" ? "active" : ""
                }`}
                onClick={() => setActiveTab("confirmados")}
              >
                Confirmados
                {hasConfirmedNotification && activeTab !== "confirmados" && (
                  <span className="tab-notification-badge">
                    <span className="notification-dot"></span>
                  </span>
                )}
              </button>
            </div>

            <div className="tabs-content">
              {activeTab === "solicitacoes" && (
                <div className="tab-panel">
                  {isLoading ? (
                    <div className="empty-state">Carregando...</div>
                  ) : pendingRequests.length === 0 ? (
                    <div className="empty-state">Nenhum pedido pendente.</div>
                  ) : (
                    <div className="pending-requests-list">
                      {sortedPendingRequests.map((req) => {
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
                                <div className="pending-code">
                                  #
                                  {requestSequentialNumbers.get(req.id) ||
                                    req.id}
                                </div>
                                <div className="pending-client">
                                  {clientName}
                                </div>
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
                                onClick={() => handleAcceptRequest(req.id)}
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
                </div>
              )}

              {activeTab === "pendentes" && (
                <div className="tab-panel">
                  {isLoading ? (
                    <div className="empty-state">Carregando...</div>
                  ) : sortedPendingClientApproval.length === 0 ? (
                    <div className="empty-state">
                      Nenhum pedido aguardando aprovação do cliente.
                    </div>
                  ) : (
                    <div className="pending-requests-list">
                      {sortedPendingClientApproval.map((req) => {
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
                                <div className="pending-code">
                                  #
                                  {requestSequentialNumbers.get(req.id) ||
                                    req.id}
                                </div>
                                <div className="pending-client">
                                  {clientName}
                                </div>
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
                                    Valor: {formatCurrency(priceCents)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="pending-card-actions">
                              <button
                                className="send-quote-button"
                                onClick={() => handleOpenQuoteModal(req)}
                                disabled={isProcessing || isSendingQuote}
                              >
                                Enviar Orçamento
                              </button>
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
                              <img
                                src={chatIcon}
                                alt=""
                                className="chat-icon"
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "confirmados" && (
                <div className="appointments-grid">
                  <section className="appointments-list-section">
                    {isLoading ? (
                      <div className="empty-state">Carregando...</div>
                    ) : error ? (
                      <div className="empty-state">{error}</div>
                    ) : confirmedSorted.length === 0 ? (
                      <div className="empty-state">
                        {filterByDate
                          ? "Sem serviços agendados nesta data"
                          : "Nenhum agendamento confirmado."}
                      </div>
                    ) : (
                      <ul className="appointments-list">
                        {confirmedSorted.map((a) => (
                          <li
                            key={a.id}
                            className="appointment-card"
                            onClick={() => {
                              setSelectedAppointmentId(a.id);
                              setShowAppointmentModal(true);
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
                                <div className="appt-code">
                                  #
                                  {requestSequentialNumbers.get(
                                    a.serviceRequestId
                                  ) || a.serviceRequestId}
                                </div>
                                <div className="appt-client">
                                  {a.clientName}
                                </div>
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
                                {formatCurrency(a.priceBRL * 100)}
                              </div>
                              {(a.status === ServiceRequestStatus.SCHEDULED ||
                                a.status ===
                                  ServiceRequestStatus.PAYMENT_CONFIRMED) && (
                                <button
                                  className="complete-service-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteService(a.serviceRequestId);
                                  }}
                                  disabled={isProcessing}
                                >
                                  Finalizar Serviço
                                </button>
                              )}
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
                              <img
                                src={chatIcon}
                                alt=""
                                className="chat-icon"
                              />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
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
                          {monthName.charAt(0).toUpperCase() +
                            monthName.slice(1)}
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
                        {Array.from({ length: firstWeekDayIndex }).map(
                          (_, i) => (
                            <div key={`empty-${i}`} className="cal-day empty" />
                          )
                        )}
                        {Array.from({ length: daysInMonth }).map((_, idx) => {
                          const day = idx + 1;
                          const currentDate = new Date(
                            Date.UTC(currentYear, currentMonth, day)
                          );
                          const isSelected =
                            selectedDate.getUTCFullYear() === currentYear &&
                            selectedDate.getUTCMonth() === currentMonth &&
                            selectedDate.getUTCDate() === day;
                          const isToday =
                            today.getUTCFullYear() === currentYear &&
                            today.getUTCMonth() === currentMonth &&
                            today.getUTCDate() === day;
                          const dateISO = dateToISOString(currentDate);
                          const hasAppointment = appointments.some(
                            (a) => a.dateISO === dateISO
                          );
                          return (
                            <button
                              key={day}
                              className={`cal-day ${
                                isSelected ? "selected" : ""
                              } ${isToday ? "today" : ""} ${
                                hasAppointment ? "has-appointment" : ""
                              }`}
                              onClick={() => handleSelectDate(day)}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showQuoteModal && selectedQuoteRequest && (
        <div className="modal-overlay" onClick={handleCloseQuoteModal}>
          <div className="quote-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quote-modal-header">
              <h2 className="quote-modal-title">Enviar Orçamento</h2>
              <button
                className="quote-modal-close"
                onClick={handleCloseQuoteModal}
                disabled={isSendingQuote}
              >
                ×
              </button>
            </div>
            <div className="quote-modal-content">
              {modalError && (
                <div className="quote-modal-error">{modalError}</div>
              )}

              <div className="accept-request-info">
                <div className="accept-info-item">
                  <span className="accept-info-label">Cliente:</span>
                  <span className="accept-info-value">
                    {selectedQuoteRequest.client_profile?.user?.name ||
                      "Cliente"}
                  </span>
                </div>
                <div className="accept-info-item">
                  <span className="accept-info-label">Tipo de Serviço:</span>
                  <span className="accept-info-value">
                    {selectedQuoteRequest.service_type}
                  </span>
                </div>
                <div className="accept-info-item">
                  <span className="accept-info-label">Data e Horário:</span>
                  <span className="accept-info-value">
                    {formatDateTimeBR(selectedQuoteRequest.requested_date)}
                  </span>
                </div>
                <div className="accept-info-item">
                  <span className="accept-info-label">Endereço:</span>
                  <span className="accept-info-value">
                    {selectedQuoteRequest.location}
                  </span>
                </div>
                {selectedQuoteRequest.description && (
                  <div className="accept-info-item">
                    <span className="accept-info-label">Descrição:</span>
                    <span className="accept-info-value">
                      {selectedQuoteRequest.description}
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
                      let inputValue = e.target.value;

                      inputValue = inputValue.replace(/[^\d,]/g, "");

                      const parts = inputValue.split(",");
                      if (parts.length > 2) {
                        inputValue = parts[0] + "," + parts.slice(1).join("");
                      }

                      if (parts.length === 2 && parts[1].length > 2) {
                        inputValue = parts[0] + "," + parts[1].substring(0, 2);
                      }

                      setQuoteAmount(inputValue);
                    }}
                    placeholder="0,00"
                    disabled={isSendingQuote}
                  />
                  {quoteAmount &&
                    parseFloat(quoteAmount.replace(",", ".")) > 0 && (
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
            </div>
            <div className="quote-modal-actions">
              <button
                className="quote-modal-cancel"
                onClick={handleCloseQuoteModal}
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

      {showAppointmentModal && selectedAppointment && (
        <div
          className="modal-overlay"
          onClick={() => setShowAppointmentModal(false)}
        >
          <div
            className="appointment-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="appointment-modal-header">
              <div className="appointment-modal-title-section">
                <h2 className="appointment-modal-title">
                  {selectedAppointment.clientName}
                </h2>
                <div className="appointment-modal-date">
                  {formatDateTimeBR(selectedAppointment.requestedDate)}
                </div>
              </div>
              <button
                className="appointment-modal-close"
                onClick={() => setShowAppointmentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="appointment-modal-content">
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
                      {selectedAppointment.expectedDurationMinutes} minutos
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

              {selectedAppointment.description ||
              selectedAppointment.observation ? (
                <div className="appointment-observation">
                  {selectedAppointment.description && (
                    <div
                      style={{
                        marginBottom: selectedAppointment.observation
                          ? "16px"
                          : "0",
                      }}
                    >
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
