import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import './Dashboard.css';
import './AppointmentsPage.css';
import { DashboardSidebar } from '../components/DashboardSidebar';

type Appointment = {
	id: string;
	clientName: string;
	address: string;
	dateISO: string;
	priceBRL: number;
	observation?: string;
};

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const AppointmentsMockPage: React.FC = () => {
	const today = useMemo(() => new Date(), []);
	const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
	const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
	const [selectedDate, setSelectedDate] = useState<Date>(today);

	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		const makeISO = (baseDate: Date, day: number, monthOffset: number) => {
			const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, day);
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const dayStr = String(d.getDate()).padStart(2, '0');
			return `${year}-${month}-${dayStr}`;
		};

		setAppointments([
			{
				id: '001260',
				clientName: 'Ana Paula',
				address: 'Local: Rua XV, 10 - Centro - Maringá',
				dateISO: makeISO(today, 26, 2),
				priceBRL: 237.15,
				observation: 'Chegar 30min antes para montagem. Preferência por sobremesa sem lactose.',
			},
			{
				id: '001259',
				clientName: 'Pedro Henrique',
				address: 'Local: Av. Tuiuti, 500 - Zona 01 - Maringá',
				dateISO: makeISO(today, 18, 1),
				priceBRL: 237.15,
				observation: 'Cliente pediu opção vegetariana para 1 convidado.',
			},
			{
				id: '001258',
				clientName: 'Carlos Lima',
				address: 'Local: Av. Brasil, 3000 - Centro - Maringá',
				dateISO: makeISO(today, 8, 0),
				priceBRL: 237.15,
				observation: 'Levar maçarico e ramequins para crème brûlée.',
			},
			{
				id: '001257',
				clientName: 'Maria Souza',
				address: 'Local: Rua das Flores, 120 - Zona 07 - Maringá',
				dateISO: makeISO(today, 7, -1),
				priceBRL: 237.15,
				observation: 'Ajustar tempero com menos sal. Aniversário de 12 pessoas.',
			},
			{
				id: '001256',
				clientName: 'Luciano de Freitas',
				address: 'Local: Avenida Cerro Azul, 1855 - Zona 02 - Maringá',
				dateISO: makeISO(today, 4, -2), 
				priceBRL: 237.15,
				observation: 'Levar utensílios para massa fresca. Cliente prefere menos sal.',
			},
		]);
		setIsLoading(false);
		setError('');
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
		setSelectedDate(new Date(currentYear, currentMonth, day));
	};

	const dateToISOString = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
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

	const confirmedSorted = useMemo(() => {
		return [...appointments].sort((a, b) => {
			const timeA = new Date(a.dateISO).getTime();
			const timeB = new Date(b.dateISO).getTime();
			if (timeA < timeB) return -1;
			if (timeA > timeB) return 1;
			return 0;
		});
	}, [appointments]);

	const [observationText, setObservationText] = useState<string>('');

	useEffect(() => {
		const selected = appointments.find(a => a.dateISO === selectedDateISO) || null;
		const localKey = selected ? `obs:appointment:${selected.id}` : `obs:date:${selectedDateISO}`;
		const initial = selected?.observation ?? localStorage.getItem(localKey) ?? '';
		setObservationText(initial);
	}, [appointments, selectedDateISO]);

	const persistObservation = (text: string) => {
		const selected = appointments.find(a => a.dateISO === selectedDateISO) || null;
		const localKey = selected ? `obs:appointment:${selected.id}` : `obs:date:${selectedDateISO}`;
		localStorage.setItem(localKey, text);
	};

	let debounceTimer: number | undefined;
	const handleObservationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		setObservationText(value);
		if (debounceTimer) window.clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => {
			persistObservation(value);
		}, 500);
	};
	return (
		<div className="dashboard-layout">
			<DashboardSidebar />

			<main className="dashboard-main">
				<div className="main-content">
					<h1 className="dashboard-title">Agendamentos (Preview)</h1>

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
										<li key={a.id} className="appointment-card">
											<div className="card-left">
												<div className="appt-code">#{a.id}</div>
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
									{formatDateBR(selectedDate)} - Observações
								</div>
								
								<textarea
									className="notes-textarea"
									placeholder="Escreva observações do atendimento..."
									value={observationText}
									onChange={handleObservationChange}
								/>
							</div>
						</section>
					</div>
				</div>
			</main>
		</div>
	);
};

export default AppointmentsMockPage;


