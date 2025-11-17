import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import "./Dashboard.css";
import "./AppointmentsPage.css";
import { DashboardSidebar } from "../components/DashboardSidebar";
import {
  serviceRequestService,
  ServiceRequest,
  ServiceRequestStatus,
} from "../services/serviceRequest.service";

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
  serviceRequestId: number;
};

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const AppointmentsPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ServiceRequest[]>([]);
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
          };
        }
      );

      setAppointments(mappedAppointments);
      handleCloseAcceptModal();
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

      const pending = response.items.filter(
        (req: ServiceRequest) =>
          req.status === ServiceRequestStatus.PENDING_CHEF_REVIEW
      );
      setPendingRequests(pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao rejeitar pedido");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <main className="dashboard-main">
        <div className="main-content">
          <h1 className="dashboard-title">Agendamentos</h1>
          <div className="appointments-grid">
            <section className="appointments-list-section">
              {pendingRequests.length > 0 && (
                <div className="pending-section">
                  <h2 className="section-title-orange">Pendentes</h2>
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
                </div>
              )}

              <h2 className="section-title">Confirmados</h2>

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
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="appointments-right-panel">
              <div className="calendar-card">
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

              <div className="notes-card">
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

                      <div className="detail-item">
                        <span className="detail-label">Valor:</span>
                        <span className="detail-value price">
                          R${" "}
                          {selectedAppointment.priceBRL
                            .toFixed(2)
                            .replace(".", ",")}
                        </span>
                      </div>
                    </div>

                    {selectedAppointment.observation ? (
                      <div className="appointment-observation">
                        <strong>Observações:</strong>
                        <p>{selectedAppointment.observation}</p>
                      </div>
                    ) : (
                      <div className="appointment-observation-empty">
                        <p>Nenhuma observação disponível.</p>
                      </div>
                    )}
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
    </div>
  );
};

export default AppointmentsPage;
