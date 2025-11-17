import React, { useState, useEffect, useMemo, useRef } from "react";
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
import {
  chefWalletService,
  WalletBalance,
  WalletEntry,
  ChefPayout,
  PixKeyType,
  RequestPayoutDTO,
} from "../services/chef-wallet.service";

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [reviews, setReviews] = useState<ChefReview[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedChartMonth, setSelectedChartMonth] = useState<number | null>(
    new Date().getMonth()
  );

  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(
    null
  );
  const [walletEntries, setWalletEntries] = useState<WalletEntry[]>([]);
  const [walletPayouts, setWalletPayouts] = useState<ChefPayout[]>([]);
  const [isLoadingWallet, setIsLoadingWallet] = useState<boolean>(false);
  const [walletError, setWalletError] = useState<string>("");
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [payoutForm, setPayoutForm] = useState<RequestPayoutDTO>({
    amount_cents: 0,
    pix_key: "",
    pix_key_type: "EVP",
  });
  const [payoutAmountInput, setPayoutAmountInput] = useState<string>("");
  const [isRequestingPayout, setIsRequestingPayout] = useState<boolean>(false);
  const previousCompletedCountRef = useRef<number>(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [profileData, reviewsData, balanceData] = await Promise.all([
          chefService.getMyProfile(),
          chefService.getMyReviews(1, 1000),
          chefWalletService.getBalance().catch(() => null),
        ]);

        let allRequests: ServiceRequest[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const requestsData =
            await serviceRequestService.listChefServiceRequests(page, 1000);
          allRequests = [...allRequests, ...requestsData.items];

          if (
            requestsData.items.length < 1000 ||
            allRequests.length >= requestsData.total
          ) {
            hasMore = false;
          } else {
            page++;
          }
        }

        setProfile(profileData);
        setServiceRequests(allRequests);
        setReviews(reviewsData.items);
        if (balanceData) {
          setWalletBalance(balanceData);
        }

        const initialCompletedCount = allRequests.filter(
          (sr) => sr.status === ServiceRequestStatus.COMPLETED
        ).length;
        previousCompletedCountRef.current = initialCompletedCount;
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const updateWalletBalance = async () => {
      try {
        const balance = await chefWalletService.getBalance();
        setWalletBalance(balance);
      } catch (error) {
        console.error("Erro ao atualizar saldo da carteira:", error);
      }
    };

    const completedCount = serviceRequests.filter(
      (sr) => sr.status === ServiceRequestStatus.COMPLETED
    ).length;

    if (completedCount > previousCompletedCountRef.current) {
      previousCompletedCountRef.current = completedCount;
      updateWalletBalance();
    }
  }, [serviceRequests]);

  const metrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const chartMonth =
      selectedChartMonth !== null ? selectedChartMonth : now.getMonth();
    const startOfMonth = new Date(selectedYear, chartMonth, 1);
    const endOfMonth = new Date(selectedYear, chartMonth + 1, 0, 23, 59, 59);

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
      return sum + (sr.quote.amount_cents || 0);
    }, 0);

    const monthCompletedWithQuote = monthRequests.filter(
      (sr) => sr.status === ServiceRequestStatus.COMPLETED && sr.quote
    );

    const monthEarnings = monthCompletedWithQuote.reduce((sum, sr) => {
      if (!sr.quote) return sum;
      return sum + (sr.quote.amount_cents || 0);
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
      totalRequests > 0 ? Math.round((totalPending / totalRequests) * 100) : 0;
    const redPercent =
      totalRequests > 0
        ? Math.round((totalCancelled / totalRequests) * 100)
        : 0;

    const progressAtendidos =
      totalRequests > 0
        ? Math.round((totalCompleted / totalRequests) * 100)
        : 0;
    const progressPendentes =
      totalRequests > 0 ? Math.round((totalPending / totalRequests) * 100) : 0;
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
          return sum + (sr.quote.amount_cents || 0);
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
      const chartMonth =
        selectedChartMonth !== null
          ? selectedChartMonth
          : new Date().getMonth();
      const startDate = new Date(selectedYear, chartMonth, 1);
      const endDate = new Date(selectedYear, chartMonth + 1, 0);
      return `${startDate.getDate()} de ${
        monthNames[chartMonth]
      } - ${endDate.getDate()} de ${monthNames[chartMonth]}`;
    };

    let avgRating5 = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
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
  }, [
    serviceRequests,
    profile,
    selectedYear,
    selectedMonth,
    selectedChartMonth,
    reviews,
  ]);

  const handlePreviousYear = () => {
    setSelectedYear(selectedYear - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(selectedYear + 1);
  };

  const loadWalletData = async () => {
    try {
      setIsLoadingWallet(true);
      setWalletError("");
      const [balance, entriesData, payoutsData] = await Promise.all([
        chefWalletService.getBalance(),
        chefWalletService.listEntries({ page: 1, limit: 10 }),
        chefWalletService.listPayouts(1, 10),
      ]);
      setWalletBalance(balance);
      setWalletEntries(entriesData.items);
      setWalletPayouts(payoutsData.items);
    } catch (err) {
      setWalletError(
        err instanceof Error ? err.message : "Erro ao carregar carteira"
      );
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const handleOpenWallet = () => {
    setShowWalletModal(true);
    loadWalletData();
  };

  const handleRequestPayout = async () => {
    const inputValue = payoutAmountInput.replace(",", ".");
    const numericValue = inputValue.replace(/[^\d.]/g, "");
    const value = parseFloat(numericValue) || 0;
    const amountCents = Math.round(value * 100);

    if (!amountCents || amountCents < 100) {
      setWalletError("O valor mínimo para saque é R$ 1,00");
      return;
    }

    if (!payoutForm.pix_key || payoutForm.pix_key.trim().length < 5) {
      setWalletError("Informe uma chave PIX válida");
      return;
    }

    if (!walletBalance || amountCents > walletBalance.available_cents) {
      setWalletError("Saldo insuficiente");
      return;
    }

    try {
      setIsRequestingPayout(true);
      setWalletError("");
      await chefWalletService.requestPayout({
        amount_cents: amountCents,
        pix_key: payoutForm.pix_key.trim(),
        pix_key_type: payoutForm.pix_key_type,
      });

      await loadWalletData();

      const updatedBalance = await chefWalletService.getBalance();
      setWalletBalance(updatedBalance);

      setShowPayoutModal(false);
      setPayoutForm({
        amount_cents: 0,
        pix_key: "",
        pix_key_type: "EVP",
      });
      setPayoutAmountInput("");
    } catch (err) {
      setWalletError(
        err instanceof Error ? err.message : "Erro ao solicitar saque"
      );
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const formatCurrency = (cents: number): string => {
    return `R$ ${(cents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      REQUESTED: "Solicitado",
      PROCESSING: "Processando",
      PAID: "Pago",
      FAILED: "Falhou",
      CANCELLED: "Cancelado",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      REQUESTED: "#FF6B35",
      PROCESSING: "#FFA500",
      PAID: "#4CAF50",
      FAILED: "#F44336",
      CANCELLED: "#9E9E9E",
    };
    return colorMap[status] || "#666";
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
                  <button
                    className="ver-carteira-button"
                    onClick={handleOpenWallet}
                  >
                    Ver Carteira
                  </button>
                  <h3 className="card-title-white">Ganhos</h3>
                  <p className="card-period">{metrics.period}</p>
                  <p className="card-value-white">
                    R${" "}
                    {metrics.monthEarnings.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  {walletBalance && (
                    <div className="saldo-disponivel-section">
                      <p className="saldo-disponivel-label">Saldo Disponível</p>
                      <p className="saldo-disponivel-value">
                        R${" "}
                        {(walletBalance.available_cents / 100).toLocaleString(
                          "pt-BR",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>
                  )}
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
                        {reviews.length}{" "}
                        {reviews.length === 1 ? "avaliação" : "avaliações"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card bar-chart-card">
                <div className="bar-chart-header">
                  <button
                    className="chart-nav-btn"
                    onClick={handlePreviousYear}
                  >
                    ‹
                  </button>
                  <h2 className="bar-chart-title">{selectedYear}</h2>
                  <button className="chart-nav-btn" onClick={handleNextYear}>
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
                    const isSelected = selectedChartMonth === index;
                    return (
                      <div
                        key={mes}
                        className="bar-item"
                        onClick={() => setSelectedChartMonth(index)}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className={`bar ${isSelected ? "bar-selected" : ""}`}
                          style={{ height: `${Math.max(height, 5)}%` }}
                        ></div>
                        <span
                          className={`bar-label ${
                            isSelected ? "bar-label-selected" : ""
                          }`}
                        >
                          {mes}
                        </span>
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
                      Recusados: {metrics.yearCancelled}
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

                        if (totalRequests === 0) {
                          return (
                            <svg className="donut-chart" viewBox="0 0 120 120">
                              <circle
                                className="donut-ring"
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#E5E5E5"
                                strokeWidth="20"
                              />
                            </svg>
                          );
                        }

                        const verde =
                          (totalCompleted / totalRequests) * circumference;
                        const laranja =
                          (totalPending / totalRequests) * circumference;
                        const vermelho =
                          (totalCancelled / totalRequests) * circumference;

                        const soma = verde + laranja + vermelho;
                        const diff = circumference - soma;

                        let verdeFinal = verde;
                        let laranjaFinal = laranja;
                        let vermelhoFinal = vermelho;

                        if (Math.abs(diff) > 0.0001) {
                          if (vermelhoFinal > 0) {
                            vermelhoFinal += diff;
                          } else if (laranjaFinal > 0) {
                            laranjaFinal += diff;
                          } else if (verdeFinal > 0) {
                            verdeFinal += diff;
                          }
                        }

                        return (
                          <svg className="donut-chart" viewBox="0 0 120 120">
                            {verdeFinal > 0.01 && (
                              <circle
                                className="donut-segment donut-segment-green"
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#4CAF50"
                                strokeWidth="20"
                                strokeDasharray={`${verdeFinal} ${
                                  circumference - verdeFinal
                                }`}
                                strokeDashoffset="0"
                                transform="rotate(-90 60 60)"
                                strokeLinecap="butt"
                              />
                            )}
                            {laranjaFinal > 0.01 && (
                              <circle
                                className="donut-segment donut-segment-orange"
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#ff9500"
                                strokeWidth="20"
                                strokeDasharray={`${laranjaFinal} ${
                                  circumference - laranjaFinal
                                }`}
                                strokeDashoffset={-verdeFinal}
                                transform="rotate(-90 60 60)"
                                strokeLinecap="butt"
                              />
                            )}
                            {vermelhoFinal > 0.01 && (
                              <circle
                                className="donut-segment donut-segment-red"
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#F44336"
                                strokeWidth="20"
                                strokeDasharray={`${vermelhoFinal} ${
                                  circumference - vermelhoFinal
                                }`}
                                strokeDashoffset={-(verdeFinal + laranjaFinal)}
                                transform="rotate(-90 60 60)"
                                strokeLinecap="butt"
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
                      <h4 className="progress-title">Recusados</h4>
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

      {showWalletModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!isRequestingPayout) {
              setShowWalletModal(false);
              setShowPayoutModal(false);
              setWalletError("");
            }
          }}
        >
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <h2 className="wallet-modal-title">Carteira</h2>
              <button
                className="wallet-modal-close"
                onClick={() => {
                  if (!isRequestingPayout) {
                    setShowWalletModal(false);
                    setShowPayoutModal(false);
                    setWalletError("");
                  }
                }}
                disabled={isRequestingPayout}
              >
                ×
              </button>
            </div>

            <div className="wallet-modal-content">
              {walletError && <div className="wallet-error">{walletError}</div>}

              {isLoadingWallet ? (
                <div className="wallet-loading">
                  <p>Carregando informações da carteira...</p>
                </div>
              ) : (
                <>
                  {walletBalance && (
                    <div className="wallet-balance-container">
                      <div className="wallet-balance-card">
                        <h3 className="wallet-balance-label">
                          Saldo Disponível
                        </h3>
                        <p className="wallet-balance-value">
                          {formatCurrency(walletBalance.available_cents)}
                        </p>
                      </div>
                      {walletBalance.blocked_cents > 0 && (
                        <div className="wallet-balance-card blocked">
                          <h3 className="wallet-balance-label">
                            Saldo Bloqueado
                          </h3>
                          <p className="wallet-balance-value">
                            {formatCurrency(walletBalance.blocked_cents)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    className="request-payout-button"
                    onClick={() => setShowPayoutModal(true)}
                    disabled={
                      !walletBalance || walletBalance.available_cents < 100
                    }
                  >
                    Solicitar Saque
                  </button>

                  <div className="wallet-tabs">
                    <div className="wallet-tab-content">
                      <h3 className="wallet-subtitle">Movimentações</h3>
                      {walletEntries.length > 0 ? (
                        <div className="wallet-entries-list">
                          {walletEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className={`wallet-entry ${
                                entry.type === "CREDIT" ? "credit" : "debit"
                              }`}
                            >
                              <div className="wallet-entry-main">
                                <div className="wallet-entry-info">
                                  <p className="wallet-entry-description">
                                    {entry.description || "Movimentação"}
                                  </p>
                                  <p className="wallet-entry-date">
                                    {formatDate(entry.created_at)}
                                  </p>
                                </div>
                                <div className="wallet-entry-amount">
                                  <span
                                    className={`wallet-entry-value ${
                                      entry.type === "CREDIT"
                                        ? "positive"
                                        : "negative"
                                    }`}
                                  >
                                    {entry.type === "CREDIT" ? "+" : "-"}
                                    {formatCurrency(entry.amount_cents)}
                                  </span>
                                  <p className="wallet-entry-balance">
                                    Saldo:{" "}
                                    {formatCurrency(entry.balance_after_cents)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="wallet-empty">
                          Nenhuma movimentação encontrada.
                        </p>
                      )}
                    </div>

                    <div className="wallet-tab-content">
                      <h3 className="wallet-subtitle">Saques</h3>
                      {walletPayouts.length > 0 ? (
                        <div className="wallet-payouts-list">
                          {walletPayouts.map((payout) => (
                            <div key={payout.id} className="wallet-payout">
                              <div className="wallet-payout-main">
                                <div className="wallet-payout-info">
                                  <p className="wallet-payout-amount">
                                    {formatCurrency(payout.amount_cents)}
                                  </p>
                                  <p className="wallet-payout-date">
                                    {formatDate(payout.requested_at)}
                                  </p>
                                  <p className="wallet-payout-key">
                                    {payout.pix_key_type}: {payout.pix_key}
                                  </p>
                                </div>
                                <div className="wallet-payout-status">
                                  <span
                                    className="wallet-status-badge"
                                    style={{
                                      backgroundColor: getStatusColor(
                                        payout.status
                                      ),
                                    }}
                                  >
                                    {getStatusLabel(payout.status)}
                                  </span>
                                  {payout.processed_at && (
                                    <p className="wallet-payout-processed">
                                      Processado:{" "}
                                      {formatDate(payout.processed_at)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="wallet-empty">Nenhum saque encontrado.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showPayoutModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!isRequestingPayout) {
              setShowPayoutModal(false);
              setWalletError("");
              setPayoutAmountInput("");
            }
          }}
        >
          <div className="payout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payout-modal-header">
              <h2 className="payout-modal-title">Solicitar Saque</h2>
              <button
                className="payout-modal-close"
                onClick={() => {
                  if (!isRequestingPayout) {
                    setShowPayoutModal(false);
                    setWalletError("");
                    setPayoutAmountInput("");
                  }
                }}
                disabled={isRequestingPayout}
              >
                ×
              </button>
            </div>

            <div className="payout-modal-content">
              {walletBalance && (
                <p className="payout-available-balance">
                  Saldo disponível:{" "}
                  <strong>
                    {formatCurrency(walletBalance.available_cents)}
                  </strong>
                </p>
              )}

              <div className="payout-form-group">
                <label className="payout-form-label">
                  Valor (R$)
                  <span className="required-field">*</span>
                </label>
                <input
                  type="text"
                  className="payout-form-input"
                  value={payoutAmountInput}
                  onChange={(e) => {
                    let inputValue = e.target.value;
                    inputValue = inputValue.replace(/[^\d,.]/g, "");
                    const parts = inputValue.split(/[,.]/);
                    if (parts.length > 2) {
                      inputValue = parts[0] + "," + parts.slice(1).join("");
                    }
                    setPayoutAmountInput(inputValue);
                  }}
                  onBlur={(e) => {
                    const inputValue = e.target.value.replace(",", ".");
                    const numericValue = inputValue.replace(/[^\d.]/g, "");
                    const value = parseFloat(numericValue) || 0;
                    if (value > 0) {
                      setPayoutAmountInput(value.toFixed(2).replace(".", ","));
                    }
                  }}
                  placeholder="0,00"
                  disabled={isRequestingPayout}
                />
                <p className="payout-form-hint">Valor mínimo: R$ 1,00</p>
              </div>

              <div className="payout-form-group">
                <label className="payout-form-label">
                  Tipo de Chave PIX
                  <span className="required-field">*</span>
                </label>
                <select
                  className="payout-form-input"
                  value={payoutForm.pix_key_type}
                  onChange={(e) =>
                    setPayoutForm({
                      ...payoutForm,
                      pix_key_type: e.target.value as PixKeyType,
                    })
                  }
                  disabled={isRequestingPayout}
                >
                  <option value="EVP">Chave Aleatória (EVP)</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="PHONE">Telefone</option>
                </select>
              </div>

              <div className="payout-form-group">
                <label className="payout-form-label">
                  Chave PIX
                  <span className="required-field">*</span>
                </label>
                <input
                  type="text"
                  className="payout-form-input"
                  value={payoutForm.pix_key}
                  onChange={(e) =>
                    setPayoutForm({
                      ...payoutForm,
                      pix_key: e.target.value,
                    })
                  }
                  placeholder="Digite a chave PIX"
                  disabled={isRequestingPayout}
                />
              </div>

              <div className="payout-modal-actions">
                <button
                  type="button"
                  className="payout-modal-cancel"
                  onClick={() => {
                    if (!isRequestingPayout) {
                      setShowPayoutModal(false);
                      setWalletError("");
                    }
                  }}
                  disabled={isRequestingPayout}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="payout-modal-submit"
                  onClick={handleRequestPayout}
                  disabled={isRequestingPayout}
                >
                  {isRequestingPayout ? "Processando..." : "Solicitar Saque"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
