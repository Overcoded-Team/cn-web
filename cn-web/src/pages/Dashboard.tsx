import React, { useState, useEffect, useMemo } from "react";
import "./Dashboard.css";
import estrelaInteira from "../assets/estrelainteira.png";
import meiaEstrela from "../assets/meiaestrela.png";
import estrelaVazia from "../assets/estrelavazia.png";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { chefService, ChefReview } from "../services/chef.service";
import {
  serviceRequestService,
  ServiceRequest,
  ServiceRequestStatus,
} from "../services/serviceRequest.service";

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [reviews, setReviews] = useState<ChefReview[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [profileData, requestsData, reviewsData] = await Promise.all([
          chefService.getMyProfile(),
          serviceRequestService.listChefServiceRequests(1, 1000),
          chefService.getMyReviews(1, 1000),
        ]);

        setProfile(profileData);
        setServiceRequests(requestsData.items);
        setReviews(reviewsData.items);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const monthRequests = serviceRequests.filter((sr) => {
      const srDate = new Date(sr.created_at);
      return srDate >= startOfMonth && srDate <= endOfMonth;
    });

    const completedRequests = serviceRequests.filter(
      (sr) => sr.status === ServiceRequestStatus.COMPLETED
    );

    const cancelledRequests = serviceRequests.filter(
      (sr) =>
        sr.status === ServiceRequestStatus.CANCELLED ||
        sr.status === ServiceRequestStatus.REJECTED_BY_CHEF
    );

    const pendingRequests = serviceRequests.filter(
      (sr) =>
        sr.status !== ServiceRequestStatus.COMPLETED &&
        sr.status !== ServiceRequestStatus.CANCELLED &&
        sr.status !== ServiceRequestStatus.REJECTED_BY_CHEF
    );

    const completedWithQuote = completedRequests.filter((sr) => sr.quote);

    const totalEarnings = completedWithQuote.reduce((sum, sr) => {
      if (!sr.quote) return sum;
      return sum + (sr.quote.total_cents || sr.quote.amount_cents || 0);
    }, 0);

    const monthCompletedWithQuote = monthRequests.filter(
      (sr) => sr.status === ServiceRequestStatus.COMPLETED && sr.quote
    );

    const monthEarnings = monthCompletedWithQuote.reduce((sum, sr) => {
      if (!sr.quote) return sum;
      return sum + (sr.quote.total_cents || sr.quote.amount_cents || 0);
    }, 0);

    const yearRequests = serviceRequests.filter((sr) => {
      const srDate = new Date(sr.created_at);
      return srDate.getFullYear() === selectedYear;
    });

    const yearCompleted = yearRequests.filter(
      (sr) => sr.status === ServiceRequestStatus.COMPLETED
    ).length;

    const yearCancelled = yearRequests.filter(
      (sr) =>
        sr.status === ServiceRequestStatus.CANCELLED ||
        sr.status === ServiceRequestStatus.REJECTED_BY_CHEF
    ).length;

    const totalRequests = serviceRequests.length;
    const totalCompleted = completedRequests.length;
    const totalCancelled = cancelledRequests.length;
    const totalPending = pendingRequests.length;

    const greenPercent =
      totalRequests > 0
        ? Math.round((totalCompleted / totalRequests) * 100)
        : 0;
    const orangePercent =
      totalRequests > 0
        ? Math.round((totalPending / totalRequests) * 100)
        : 0;
    const redPercent =
      totalRequests > 0
        ? Math.round((totalCancelled / totalRequests) * 100)
        : 0;

    const progressAtendidos =
      totalRequests > 0
        ? Math.round((totalCompleted / totalRequests) * 100)
        : 0;
    const progressPendentes =
      totalRequests > 0
        ? Math.round((totalPending / totalRequests) * 100)
        : 0;
    const progressCancelados =
      totalRequests > 0
        ? Math.round((totalCancelled / totalRequests) * 100)
        : 0;

    const monthlyEarnings = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = new Date(selectedYear, monthIndex, 1);
      const monthEnd = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59);
      return serviceRequests
        .filter((sr) => {
          if (sr.status !== ServiceRequestStatus.COMPLETED || !sr.quote)
            return false;
          const completedDate = new Date(sr.updated_at);
          return completedDate >= monthStart && completedDate <= monthEnd;
        })
        .reduce((sum, sr) => {
          if (!sr.quote) return sum;
          return sum + (sr.quote.total_cents || sr.quote.amount_cents || 0);
        }, 0);
    });

    const maxMonthlyEarning = Math.max(...monthlyEarnings, 1);

    const formatPeriod = () => {
      const monthNames = [
        "jan",
        "fev",
        "mar",
        "abr",
        "mai",
        "jun",
        "jul",
        "ago",
        "set",
        "out",
        "nov",
        "dez",
      ];
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0);
      return `${startDate.getDate()} de ${
        monthNames[currentMonth]
      } - ${endDate.getDate()} de ${monthNames[currentMonth]}`;
    };

    let avgRating5 = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating10 = totalRating / reviews.length;
      avgRating5 = (avgRating10 / 10) * 5;
    } else if (profile?.avgRating) {
      avgRating5 = (Number(profile.avgRating) / 10) * 5;
    }

    return {
      avgRating: avgRating5,
      totalEarnings: totalEarnings / 100,
      monthEarnings: monthEarnings / 100,
      period: formatPeriod(),
      totalRequests,
      totalCompleted,
      totalPending,
      totalCancelled,
      yearCompleted,
      yearCancelled,
      greenPercent,
      orangePercent,
      redPercent,
      progressAtendidos,
      progressPendentes,
      progressCancelados,
      monthlyEarnings: monthlyEarnings.map((e) => e / 100),
      maxMonthlyEarning: maxMonthlyEarning / 100,
      yearTotal: yearRequests.length,
    };
  }, [serviceRequests, profile, selectedYear, selectedMonth, reviews]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-layout">
        <DashboardSidebar />
        <main className="dashboard-main">
          <div className="main-content">
            <h1 className="dashboard-title">Dashboard</h1>
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>Carregando dados...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    const roundedRating = Math.round(rating * 2) / 2;
    const stars = [];
    const fullStars = Math.floor(roundedRating);
    const hasHalfStar = roundedRating % 1 === 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <img
          key={`full-${i}`}
          src={estrelaInteira}
          alt="Estrela inteira"
          className="star-image"
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <img
          key="half"
          src={meiaEstrela}
          alt="Meia estrela"
          className="star-image"
        />
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <img
          key={`empty-${i}`}
          src={estrelaVazia}
          alt="Estrela vazia"
          className="star-image"
        />
      );
    }

    return stars;
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <main className="dashboard-main">
        <div className="main-content">
          <h1 className="dashboard-title">Dashboard</h1>

          <div className="dashboard-layout-grid">
            <div className="dashboard-left-column">
              <div className="cards-row-top">
                <div className="card ganhos-card">
                  <h3 className="card-title-white">Ganhos</h3>
                  <p className="card-period">{metrics.period}</p>
                  <p className="card-value-white">
                    R${" "}
                    {metrics.monthEarnings.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div className="card avaliacao-card">
                  <h3 className="card-title-orange">Avaliação Média</h3>
                  <div className="avaliacao-content">
                    <span className="avaliacao-number">
                      {metrics.avgRating.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                      })}
                    </span>
                    <div className="stars-rating">
                      {renderStars(metrics.avgRating)}
                    </div>
                    {reviews.length > 0 && (
                      <p className="total-avaliacoes">
                        {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card bar-chart-card">
                <div className="bar-chart-header">
                  <button
                    className="chart-nav-btn"
                    onClick={handlePreviousMonth}
                  >
                    ‹
                  </button>
                  <h2 className="bar-chart-title">
                    R${" "}
                    {metrics.totalEarnings.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </h2>
                  <button className="chart-nav-btn" onClick={handleNextMonth}>
                    ›
                  </button>
                </div>
                <div className="bar-chart-container">
                  {[
                    "Jan",
                    "Fev",
                    "Mar",
                    "Abr",
                    "Mai",
                    "Jun",
                    "Jul",
                    "Ago",
                    "Set",
                    "Out",
                    "Nov",
                    "Dez",
                  ].map((mes, index) => {
                    const height =
                      metrics.maxMonthlyEarning > 0
                        ? (metrics.monthlyEarnings[index] /
                            metrics.maxMonthlyEarning) *
                          100
                        : 0;
                    return (
                      <div key={mes} className="bar-item">
                        <div
                          className="bar"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        ></div>
                        <span className="bar-label">{mes}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card detalhamento-card">
                <h3 className="card-title-orange">Detalhamento</h3>
                <div className="detalhamento-content">
                  <div className="detalhamento-list">
                    <p className="detalhamento-item">
                      Total de Eventos : {metrics.yearTotal}
                    </p>
                    <p className="detalhamento-item">
                      Concluídos: {metrics.yearCompleted}
                    </p>
                    <p className="detalhamento-item cancelados">
                      Cancelados: {metrics.yearCancelled}
                    </p>
                  </div>
                  <div className="detalhamento-ano">{selectedYear}</div>
                </div>
              </div>
            </div>

            <div className="dashboard-right-column">
              <div className="card estatisticas-card">
                <h3 className="card-title-dark">Estatísticas</h3>
                <div className="estatisticas-content-wrapper">
                  <div className="estatisticas-chart-and-labels">
                    <div className="donut-chart-container">
                      {(() => {
                        const circumference = 2 * Math.PI * 50;
                        const totalRequests = metrics.totalRequests || 0;
                        const totalCompleted = metrics.totalCompleted || 0;
                        const totalPending = metrics.totalPending || 0;
                        const totalCancelled = metrics.totalCancelled || 0;

                        let verde = 0;
                        let laranja = 0;
                        let vermelho = 0;
                        let mostrarCinza = false;

                        if (totalRequests === 0) {
                          mostrarCinza = true;
                        } else {
                          const temVerde = totalCompleted > 0;
                          const temLaranja = totalPending > 0;
                          const temVermelho = totalCancelled > 0;

                          const categoriasComValor = [temVerde, temLaranja, temVermelho].filter(Boolean).length;

                          if (categoriasComValor === 1) {
                            if (temVerde) {
                              verde = circumference;
                            } else if (temLaranja) {
                              laranja = circumference;
                            } else if (temVermelho) {
                              vermelho = circumference;
                            }
                          } else if (categoriasComValor > 1) {
                            const somaValores = totalCompleted + totalPending + totalCancelled;

                            if (temVerde) {
                              verde = (totalCompleted / somaValores) * circumference;
                            }
                            if (temLaranja) {
                              laranja = (totalPending / somaValores) * circumference;
                            }
                            if (temVermelho) {
                              vermelho = (totalCancelled / somaValores) * circumference;
                            }

                            const soma = verde + laranja + vermelho;
                            const diff = circumference - soma;

                            if (Math.abs(diff) > 0.0001) {
                              if (temVermelho && vermelho > 0) {
                                vermelho += diff;
                              } else if (temLaranja && laranja > 0) {
                                laranja += diff;
                              } else if (temVerde && verde > 0) {
                                verde += diff;
                              }
                            }
                          } else {
                            mostrarCinza = true;
                          }
                        }

                        return (
                          <svg className="donut-chart" viewBox="0 0 120 120">
                            {mostrarCinza && (
                              <circle
                                className="donut-ring"
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#E5E5E5"
                                strokeWidth="20"
                              />
                            )}
                            {verde > 0 && (
                              <circle
                                className="donut-segment donut-segment-green"
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#4CAF50"
                                strokeWidth="20"
                                strokeDasharray={`${verde} ${circumference}`}
                                strokeDashoffset={circumference - verde}
                                transform="rotate(-90 60 60)"
                              />
                            )}
                            {laranja > 0 && (
                              <circle
                                className="donut-segment donut-segment-orange"
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#FF6B35"
                                strokeWidth="20"
                                strokeDasharray={`${laranja} ${circumference}`}
                                strokeDashoffset={
                                  circumference - verde - laranja
                                }
                                transform="rotate(-90 60 60)"
                              />
                            )}
                            {vermelho > 0 && (
                              <circle
                                className="donut-segment donut-segment-red"
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#F44336"
                                strokeWidth="20"
                                strokeDasharray={`${vermelho} ${circumference}`}
                                strokeDashoffset={
                                  circumference - verde - laranja - vermelho
                                }
                                transform="rotate(-90 60 60)"
                              />
                            )}
                          </svg>
                        );
                      })()}
                    </div>
                    <div className="donut-labels">
                      <div className="donut-label-item green">
                        <span className="donut-label-value">
                          {metrics.greenPercent}%
                        </span>
                        <span className="donut-label-arrow">↑</span>
                      </div>
                      <div className="donut-label-item orange">
                        <span className="donut-label-value">
                          {metrics.orangePercent}%
                        </span>
                        <span className="donut-label-arrow">↓</span>
                      </div>
                      <div className="donut-label-item red">
                        <span className="donut-label-value">
                          {metrics.redPercent}%
                        </span>
                        <span className="donut-label-arrow">↓</span>
                      </div>
                    </div>
                  </div>
                  <div className="estatisticas-progress-container">
                    <div className="estatistica-progress-item">
                      <h4 className="progress-title">Atendidos</h4>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar progress-bar-green"
                          style={{ width: `${metrics.progressAtendidos}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="estatistica-progress-item">
                      <h4 className="progress-title">Pendentes</h4>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar progress-bar-orange"
                          style={{ width: `${metrics.progressPendentes}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="estatistica-progress-item">
                      <h4 className="progress-title">Cancelados</h4>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar progress-bar-red"
                          style={{ width: `${metrics.progressCancelados}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
