import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import './Dashboard.css';
import './AppointmentsPage.css';
import { DashboardSidebar } from '../components/DashboardSidebar';
import {
	serviceRequestService,
	ServiceRequest,
	ServiceRequestStatus,
} from '../services/serviceRequest.service';

type Appointment = {
	id: string;
	clientName: string;
	address: string;
	dateISO: string;
	priceBRL: number;
	observation?: string;
	serviceRequestId: number;
};

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const AppointmentsPage: React.FC = () => {

	const today = useMemo(() => new Date(), []);
	const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
	const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
	const [selectedDate, setSelectedDate] = useState<Date>(today);

	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

	const dateToISOString = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	useEffect(() => {
		const loadAppointments = async () => {
			try {
				setIsLoading(true);
				setError('');
				const response = await serviceRequestService.listChefServiceRequests(1, 1000);
				
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

				const mappedAppointments: Appointment[] = filteredRequests.map((req: ServiceRequest) => {
					const requestedDate = new Date(req.requested_date);
					const clientName = req.client_profile?.user?.name || 'Cliente';
					const priceCents = req.quote?.amount_cents || 0;
					const priceBRL = priceCents / 100;

					return {
						id: `appt-${req.id}`,
						serviceRequestId: req.id,
						clientName,
						address: req.location,
						dateISO: dateToISOString(requestedDate),
						priceBRL,
						observation: req.description || req.quote?.notes,
					};
				});

				setAppointments(mappedAppointments);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Erro ao carregar agendamentos');
			} finally {
				setIsLoading(false);
			}
		};

		loadAppointments();
	}, []);

	const monthName = useMemo(() => {
		return new Date(currentYear, currentMonth, 1).toLocaleString('pt-BR', {
			month: 'long',
			year: 'numeric',
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
		const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
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


	return (
		<div className="dashboard-layout">
			<DashboardSidebar />

			<main className="dashboard-main">
				<div className="main-content">
					<h1 className="dashboard-title">Agendamentos</h1>
				<div className="appointments-grid">
				<section className="appointments-list-section">
					<h2 className="section-title">Confirmados</h2>

					{isLoading ? (
						<div className="empty-state">Carregando...</div>
					) : error ? (
						<div className="empty-state">{error}</div>
					) : confirmedSorted.length === 0 ? (
						<div className="empty-state">Nenhum agendamento confirmado.</div>
					) : (
						<ul className="appointments-list">
							{confirmedSorted.map((a) => (
								<li 
									key={a.id} 
									className={`appointment-card ${selectedAppointmentId === a.id ? 'selected' : ''}`}
									onClick={() => {
										setSelectedAppointmentId(a.id);
										const appointmentDate = new Date(a.dateISO + 'T00:00:00');
										setSelectedDate(appointmentDate);
										setCurrentMonth(appointmentDate.getMonth());
										setCurrentYear(appointmentDate.getFullYear());
									}}
								>
									<div className="card-left">
										<div className="appt-code">#{a.serviceRequestId}</div>
										<div className="appt-client">{a.clientName}</div>
										<div className="appt-address">{a.address}</div>
									</div>
									<div className="card-right">
										<div className="appt-date">
											{formatDateBR(a.dateISO)}
										</div>
										<div className="appt-price">
											R$ {a.priceBRL.toFixed(2).replace('.', ',')}
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
							<button type="button" className="cal-nav" onClick={handlePrevMonth} aria-label="Mês anterior">‹</button>
							<div className="cal-title">
								{monthName.charAt(0).toUpperCase() + monthName.slice(1)}
							</div>
							<button type="button" className="cal-nav" onClick={handleNextMonth} aria-label="Próximo mês">›</button>
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
										className={`cal-day ${isSelected ? 'selected' : ''}`}
										onClick={() => handleSelectDate(day)}
									>
										{day}
									</button>
								);
							})}
						</div>
					</div>

					<div className="notes-card">
						<div className="notes-title">
							{selectedAppointment 
								? `${selectedAppointment.clientName} - ${formatDateBR(selectedAppointment.dateISO)}`
								: `${formatDateBR(selectedDate)} - Observações`
							}
						</div>
						
						{selectedAppointment && selectedAppointment.observation ? (
							<div className="appointment-observation">
								<strong>Observações:</strong>
								<p>{selectedAppointment.observation}</p>
							</div>
						) : (
							<div className="appointment-observation-empty">
								<p>Nenhum observação disponível.</p>
							</div>
						)}
					</div>
				</section>
				</div>
				</div>
			</main>
		</div>
	);
};

export default AppointmentsPage;


