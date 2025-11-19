import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Dashboard.css";
import "./DashboardDark.css";
import estrelaInteira from "../assets/estrelainteira.png";
import meiaEstrela from "../assets/meiaestrela.png";
import estrelaVazia from "../assets/estrelavazia.png";
import logoBranco from "../assets/iconebranco.png";
import { chefService, ChefReview } from "../services/chef.service";
import { useAuth } from "../contexts/AuthContext";
import perfilVazio from "../assets/perfilvazio.png";
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
} from "../services/chef-wallet.service";

const Dashboard: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [reviews, setReviews] = useState<ChefReview[]>([]);
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedChartMonth] = useState<number | null>(new Date().getMonth());

  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(
    null
  );
  const [showReviewsModal, setShowReviewsModal] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [walletEntries, setWalletEntries] = useState<WalletEntry[]>([]);
  const [walletPayouts, setWalletPayouts] = useState<ChefPayout[]>([]);
  const [isLoadingWallet, setIsLoadingWallet] = useState<boolean>(false);
  const [walletError, setWalletError] = useState<string>("");
  const [profileImageError, setProfileImageError] = useState(false);
  const previousCompletedCountRef = useRef<number>(0);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("dashboard-theme");
    return (savedTheme as "dark" | "light") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        const timeoutId = setTimeout(() => {
          setIsLoading(false);
        }, 5000);

        const [profileData, reviewsData, balanceData] = await Promise.all([
          chefService.getMyProfile().catch(() => null),
          chefService.getMyReviews(1, 1000).catch(() => ({ items: [] })),
          chefWalletService.getBalance().catch(() => null),
        ]);

        setProfile(profileData);
        setReviews(reviewsData.items || []);
        if (balanceData) {
          setWalletBalance(balanceData);
        }

        let allRequests: ServiceRequest[] = [];
        let page = 1;
        let hasMore = true;
        let maxPages = 10;

        try {
          while (hasMore && page <= maxPages) {
            const requestsData =
              await serviceRequestService.listChefServiceRequests(page, 1000);
            allRequests = [...allRequests, ...requestsData.items];

            if (
              requestsData.items.length < 1000 ||
              allRequests.length >= requestsData.total ||
              !requestsData.items ||
              requestsData.items.length === 0
            ) {
              hasMore = false;
            } else {
              page++;
            }
          }
        } catch (error) {
          console.error("Erro ao carregar solicitações:", error);
        }

        setServiceRequests(allRequests);

        const initialPaidCount = allRequests.filter(
          (sr) =>
            sr.status === ServiceRequestStatus.PAYMENT_CONFIRMED ||
            sr.status === ServiceRequestStatus.SCHEDULED ||
            sr.status === ServiceRequestStatus.COMPLETED
        ).length;
        previousCompletedCountRef.current = initialPaidCount;

        clearTimeout(timeoutId);
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
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

    const paidCount = serviceRequests.filter(
      (sr) =>
        sr.status === ServiceRequestStatus.PAYMENT_CONFIRMED ||
        sr.status === ServiceRequestStatus.SCHEDULED ||
        sr.status === ServiceRequestStatus.COMPLETED
    ).length;

    if (paidCount > previousCompletedCountRef.current) {
      previousCompletedCountRef.current = paidCount;
      updateWalletBalance();
    }
  }, [serviceRequests]);

  const metrics = useMemo(() => {
    const now = new Date();
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

    const paidRequests = serviceRequests.filter(
      (sr) =>
        sr.status === ServiceRequestStatus.PAYMENT_CONFIRMED ||
        sr.status === ServiceRequestStatus.SCHEDULED ||
        sr.status === ServiceRequestStatus.COMPLETED
    );

    const paidWithQuote = paidRequests.filter((sr) => sr.quote);

    const completedWithQuote = completedRequests.filter((sr) => sr.quote);
    const pendingWithQuote = pendingRequests.filter((sr) => sr.quote);

    const completedEarnings = completedWithQuote.reduce(
      (sum, sr) => sum + (sr.quote?.amount_cents || 0),
      0
    );

    const pendingEarnings = pendingWithQuote.reduce(
      (sum, sr) => sum + (sr.quote?.amount_cents || 0),
      0
    );

    const completedCount = completedWithQuote.length;
    const pendingCount = pendingWithQuote.length;

    const totalEarnings = paidWithQuote.reduce((sum, sr) => {
      if (!sr.quote) return sum;
      return sum + (sr.quote.amount_cents || 0);
    }, 0);

    const monthPaidWithQuote = monthRequests.filter(
      (sr) =>
        (sr.status === ServiceRequestStatus.PAYMENT_CONFIRMED ||
          sr.status === ServiceRequestStatus.SCHEDULED ||
          sr.status === ServiceRequestStatus.COMPLETED) &&
        sr.quote
    );

    const monthEarnings = monthPaidWithQuote.reduce((sum, sr) => {
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
          if (
            (sr.status !== ServiceRequestStatus.PAYMENT_CONFIRMED &&
              sr.status !== ServiceRequestStatus.SCHEDULED &&
              sr.status !== ServiceRequestStatus.COMPLETED) ||
            !sr.quote
          )
            return false;
          const paymentDate = new Date(sr.updated_at);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        })
        .reduce((sum, sr) => {
          if (!sr.quote) return sum;
          return sum + (sr.quote.amount_cents || 0);
        }, 0);
    });

    const dailyEarnings = Array.from({ length: 7 }, (_, dayIndex) => {
      return serviceRequests
        .filter((sr) => {
          if (
            (sr.status !== ServiceRequestStatus.PAYMENT_CONFIRMED &&
              sr.status !== ServiceRequestStatus.SCHEDULED &&
              sr.status !== ServiceRequestStatus.COMPLETED) ||
            !sr.quote
          )
            return false;
          const paymentDate = new Date(sr.updated_at);
          return paymentDate.getDay() === dayIndex;
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

    const pendingApprovals = serviceRequests.filter(
      (sr) => sr.status === ServiceRequestStatus.QUOTE_SENT
    );

    const pendingChefReview = serviceRequests.filter(
      (sr) => sr.status === ServiceRequestStatus.PENDING_CHEF_REVIEW
    );

    const scheduledRequests = serviceRequests.filter(
      (sr) =>
        sr.status === ServiceRequestStatus.SCHEDULED ||
        sr.status === ServiceRequestStatus.PAYMENT_CONFIRMED
    );

    const upcomingAppointments = scheduledRequests
      .filter((sr) => {
        const reqDate = new Date(sr.requested_date);
        return reqDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.requested_date).getTime();
        const dateB = new Date(b.requested_date).getTime();
        return dateA - dateB;
      })
      .slice(0, 5);

    const quotesSent = serviceRequests.filter(
      (sr) => sr.status === ServiceRequestStatus.QUOTE_SENT
    );

    const quotesAccepted = serviceRequests.filter(
      (sr) => sr.status === ServiceRequestStatus.QUOTE_ACCEPTED
    );

    const conversionRate =
      quotesSent.length > 0
        ? Math.round((quotesAccepted.length / quotesSent.length) * 100)
        : 0;

    const avgResponseTime = (() => {
      const quotesWithTimes = quotesSent
        .filter((sr) => sr.quote && sr.created_at && sr.quote.created_at)
        .map((sr) => {
          const requestDate = new Date(sr.created_at);
          const quoteDate = new Date(sr.quote!.created_at);
          return quoteDate.getTime() - requestDate.getTime();
        });

      if (quotesWithTimes.length === 0) return 0;
      const avgMs =
        quotesWithTimes.reduce((sum, time) => sum + time, 0) /
        quotesWithTimes.length;
      return Math.round(avgMs / (1000 * 60 * 60));
    })();

    const lastMonthEarnings =
      (() => {
        const lastMonth = chartMonth === 0 ? 11 : chartMonth - 1;
        const lastMonthYear =
          chartMonth === 0 ? selectedYear - 1 : selectedYear;
        const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
        const lastMonthEnd = new Date(
          lastMonthYear,
          lastMonth + 1,
          0,
          23,
          59,
          59
        );

        return serviceRequests
          .filter((sr) => {
            if (
              (sr.status !== ServiceRequestStatus.PAYMENT_CONFIRMED &&
                sr.status !== ServiceRequestStatus.SCHEDULED &&
                sr.status !== ServiceRequestStatus.COMPLETED) ||
              !sr.quote
            )
              return false;
            const paymentDate = new Date(sr.updated_at);
            return paymentDate >= lastMonthStart && paymentDate <= lastMonthEnd;
          })
          .reduce((sum, sr) => {
            if (!sr.quote) return sum;
            return sum + (sr.quote.amount_cents || 0);
          }, 0);
      })() / 100;

    const earningsGrowth =
      lastMonthEarnings > 0
        ? Math.round(
            ((monthEarnings / 100 - lastMonthEarnings) / lastMonthEarnings) *
              100
          )
        : monthEarnings / 100 > 0
        ? 100
        : 0;

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
      pendingApprovals: pendingApprovals.length,
      pendingChefReview: pendingChefReview.length,
      upcomingAppointments,
      conversionRate,
      avgResponseTime,
      earningsGrowth,
      lastMonthEarnings,
      completedEarnings: completedEarnings / 100,
      pendingEarnings: pendingEarnings / 100,
      completedCount,
      pendingCount,
      dailyEarnings: dailyEarnings.map((e) => e / 100),
    };
  }, [serviceRequests, profile, selectedYear, selectedChartMonth, reviews]);

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

  const getPayoutStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      REQUESTED: "Solicitado",
      PROCESSING: "Processando",
      PAID: "Pago",
      FAILED: "Falhou",
      CANCELLED: "Cancelado",
    };
    return statusMap[status] || status;
  };

  const getPayoutStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      REQUESTED: "#ff6b35",
      PROCESSING: "#ffa726",
      PAID: "#4caf50",
      FAILED: "#f44336",
      CANCELLED: "#9e9e9e",
    };
    return colorMap[status] || "#9e9e9e";
  };

  if (isLoading) {
    return (
      <div className={`dashboard-layout ${theme === "light" ? "dashboard-light" : "dashboard-dark"}`}>
        <main className={`dashboard-main ${theme === "light" ? "dashboard-light-main" : "dashboard-dark-main"}`}>
          <div className={`dashboard-content ${theme === "light" ? "dashboard-light-content" : "dashboard-dark-content"}`}>
            <div className="dashboard-loading-container">
              <div className="dashboard-loading-logo">
                <img
                  src={logoBranco}
                  alt="Logo"
                  className="loading-logo-image"
                />
              </div>
              <p className="dashboard-loading-text">Carregando dados...</p>
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

  const profilePicture =
    user?.profilePictureUrl && !profileImageError
      ? user.profilePictureUrl
      : perfilVazio;

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className={`dashboard-layout ${theme === "light" ? "dashboard-light" : "dashboard-dark"}`}>
      <main className={`dashboard-main ${theme === "light" ? "dashboard-light-main" : "dashboard-dark-main"}`}>
        <div className={`dashboard-content ${theme === "light" ? "dashboard-light-content" : "dashboard-dark-content"}`}>
          <div className={`dashboard-header ${theme === "light" ? "dashboard-light-header" : "dashboard-dark-header"}`}>
            <h1 className={`dashboard-title ${theme === "light" ? "dashboard-light-title" : "dashboard-dark-title"}`}>Dashboard</h1>
            <nav className={`dashboard-nav ${theme === "light" ? "dashboard-light-nav" : "dashboard-dark-nav"}`}>
              <Link
                to="/dashboard"
                className={`dashboard-nav-link ${theme === "light" ? "dashboard-light-nav-link" : "dashboard-dark-nav-link"} ${
                  location.pathname === "/dashboard" ||
                  location.pathname === "/"
                    ? "active"
                    : ""
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/agendamentos"
                className={`dashboard-nav-link ${theme === "light" ? "dashboard-light-nav-link" : "dashboard-dark-nav-link"} ${
                  location.pathname === "/agendamentos" ||
                  location.pathname === "/preview/agendamentos"
                    ? "active"
                    : ""
                }`}
              >
                Agendamentos
              </Link>
              <Link
                to="/historico"
                className={`dashboard-nav-link ${theme === "light" ? "dashboard-light-nav-link" : "dashboard-dark-nav-link"} ${
                  location.pathname === "/historico" ? "active" : ""
                }`}
              >
                Histórico
              </Link>
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
              <Link to="/perfil">
                <img
                  src={profilePicture}
                  alt="Perfil"
                  className={`dashboard-nav-profile ${theme === "light" ? "dashboard-light-nav-profile" : "dashboard-dark-nav-profile"}`}
                  onError={() => setProfileImageError(true)}
                />
              </Link>
              <button
                className={`dashboard-nav-link ${theme === "light" ? "dashboard-light-nav-link" : "dashboard-dark-nav-link"}`}
                onClick={logout}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  fontWeight: "inherit",
                }}
              >
                Sair
              </button>
            </nav>
          </div>

          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <div
              className="card ganhos-card"
              style={{
                maxWidth: "350px",
                width: "100%",
                flex: "0 0 auto",
                maxHeight: "280px",
                height: "280px",
                position: "relative",
              }}
            >
              <button
                className="ver-carteira-button"
                onClick={handleOpenWallet}
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  transition: "all 0.3s",
                  fontFamily: '"Comfortaa", sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                }}
              >
                Ver Carteira
              </button>
              <div
                className="saldo-disponivel-section"
                style={{ borderTop: "none", paddingTop: "0" }}
              >
                <p
                  className="saldo-disponivel-label"
                  style={{ fontSize: "1.2rem" }}
                >
                  Saldo Disponível
                </p>
                <p
                  className="saldo-disponivel-value"
                  style={{ fontSize: "2.5rem" }}
                >
                  R${" "}
                  {(walletBalance?.available_cents &&
                  walletBalance.available_cents > 0
                    ? walletBalance.available_cents / 100
                    : metrics.totalEarnings
                  ).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                  marginTop: "1rem",
                  marginBottom: "1rem",
                  paddingTop: "1rem",
                }}
              >
                <h3 className="card-title-white" style={{ fontSize: "1.2rem" }}>
                  Ganhos
                </h3>
                <p className="card-value-white" style={{ fontSize: "1.5rem" }}>
                  R${" "}
                  {metrics.monthEarnings.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div
              className="dashboard-dark-card"
              style={{
                maxWidth: "300px",
                width: "100%",
                flex: "0 0 auto",
                position: "relative",
                overflow: "hidden",
                maxHeight: "280px",
                height: "280px",
              }}
            >
              <button
                className="ver-avaliacoes-button"
                onClick={() => setShowReviewsModal(true)}
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  padding: "0.5rem 1rem",
                  background: "#ff6b35",
                  color: "#ffffff",
                  border: "2px solid rgba(255, 107, 53, 0.3)",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  fontFamily: '"Comfortaa", sans-serif',
                  zIndex: 10,
                }}
              >
                Ver Avaliações
              </button>
              <h3 className="dashboard-dark-card-title">Avaliações</h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  position: "absolute",
                  left: "1rem",
                  bottom: "6rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    className="dashboard-dark-metric-large"
                    style={{ margin: 0 }}
                  >
                    {metrics.avgRating.toLocaleString("pt-BR", {
                      minimumFractionDigits: 1,
                    })}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.2rem",
                    }}
                  >
                    {renderStars(metrics.avgRating)}
                  </div>
                </div>
                <div
                  className="dashboard-dark-metric-label"
                  style={{ margin: 0, opacity: 1 }}
                >
                  {reviews.length}{" "}
                  {reviews.length === 1 ? "avaliação" : "avaliações"}
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: "-1rem",
                  left: "10.5rem",
                }}
              >
                <img
                  src={logoBranco}
                  alt="Logo"
                  style={{
                    width: "190px",
                    height: "150px",
                    filter: "brightness(0) invert(1)",
                    objectFit: "contain",
                    opacity: 0.3,
                  }}
                />
              </div>
            </div>

            <div
              className="dashboard-dark-progress-card"
              style={{
                maxHeight: "280px",
                height: "280px",
                flex: "1 1 auto",
                minWidth: "400px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "2rem",
                overflow: "visible",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", flex: "1" }}
              >
                <h3 className="dashboard-dark-progress-title">
                  Progresso de Vendas
                </h3>
                <p className="dashboard-dark-progress-subtitle">Mês atual</p>
                <div>
                  <span className="dashboard-dark-progress-value">
                    R$ {(metrics.monthEarnings / 1000).toFixed(2)}K
                  </span>
                  <span className="dashboard-dark-progress-target">
                    / R$ {(metrics.totalEarnings / 1000).toFixed(2)}K
                  </span>
                </div>
              </div>
              <div
                className="dashboard-dark-gauge"
                style={{
                  flex: "0 0 auto",
                  width: "200px",
                  height: "120px",
                  marginTop: "0",
                }}
              >
                <svg
                  viewBox="0 0 200 100"
                  style={{ width: "100%", height: "100%" }}
                >
                  <defs>
                    <path
                      id="gauge-arc"
                      d="M 20 80 A 80 80 0 0 1 180 80"
                      fill="none"
                    />
                  </defs>
                  <use href="#gauge-arc" stroke="#2d3139" strokeWidth="20" />
                  <use
                    href="#gauge-arc"
                    stroke="#ff6b35"
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={`${
                      (metrics.progressAtendidos / 100) * (Math.PI * 80)
                    } ${Math.PI * 80}`}
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="dashboard-dark-grid">
            <div className="dashboard-dark-card">
              <div className="dashboard-dark-summary-row">
                <div className="dashboard-dark-summary-item">
                  <div className="dashboard-dark-summary-label">Ganhos</div>
                  <div className="dashboard-dark-summary-value">
                    R${" "}
                    {metrics.monthEarnings.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="dashboard-dark-summary-item">
                  <div className="dashboard-dark-summary-label">
                    Ganhos Totais
                  </div>
                  <div className="dashboard-dark-summary-value">
                    R${" "}
                    {metrics.totalEarnings.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
              <table className="dashboard-dark-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Ganhos</th>
                    <th>Eventos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Concluídos</td>
                    <td>
                      R${" "}
                      {metrics.completedEarnings.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>{metrics.completedCount}</td>
                  </tr>
                  <tr>
                    <td>Pendentes</td>
                    <td>
                      R${" "}
                      {metrics.pendingEarnings.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>{metrics.pendingCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="dashboard-dark-card">
                <h3 className="dashboard-dark-card-title">Ganhos por Dia</h3>
                <p className="dashboard-dark-card-description">
                  Distribuição dos ganhos durante a semana
                </p>
                <div className="dashboard-dark-horizontal-bars">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                    (day, index) => {
                      const earning = metrics.dailyEarnings[index] || 0;
                      const maxEarning = Math.max(...metrics.dailyEarnings, 1);
                      const percentage = (earning / maxEarning) * 100;
                      return (
                        <div
                          key={day}
                          className="dashboard-dark-horizontal-bar-item"
                        >
                          <span className="dashboard-dark-horizontal-bar-label">
                            {day}
                          </span>
                          <div className="dashboard-dark-horizontal-bar-track">
                            <div
                              className="dashboard-dark-horizontal-bar-fill"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="dashboard-dark-horizontal-bar-value">
                            R${" "}
                            {earning.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            className="dashboard-dark-card"
            style={{ marginTop: "1.5rem", gridColumn: "1 / -1" }}
          >
            <h3 className="dashboard-dark-card-title">Ganhos Mensais</h3>
            <p className="dashboard-dark-card-description">
              Descrição dos ganhos do período selecionado
            </p>

            <div className="dashboard-dark-chart-container">
              <svg
                viewBox="0 0 800 200"
                style={{ width: "100%", height: "100%" }}
              >
                <defs>
                  <linearGradient
                    id="lineGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 25, 50, 75, 100].map((y) => (
                  <line
                    key={y}
                    x1="40"
                    y1={40 + (y / 100) * 120}
                    x2="760"
                    y2={40 + (y / 100) * 120}
                    stroke="#2d3139"
                    strokeWidth="1"
                  />
                ))}
                <polyline
                  points={metrics.monthlyEarnings
                    .map((earning, index) => {
                      const x = 40 + (index / 11) * 720;
                      const maxEarning = Math.max(
                        ...metrics.monthlyEarnings,
                        1
                      );
                      const y = 160 - (earning / maxEarning) * 120;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#ff6b35"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polygon
                  points={`40,160 ${metrics.monthlyEarnings
                    .map((earning, index) => {
                      const x = 40 + (index / 11) * 720;
                      const maxEarning = Math.max(
                        ...metrics.monthlyEarnings,
                        1
                      );
                      const y = 160 - (earning / maxEarning) * 120;
                      return `${x},${y}`;
                    })
                    .join(" ")} 760,160`}
                  fill="url(#lineGradient)"
                />
                {metrics.monthlyEarnings.map((earning, index) => {
                  const x = 40 + (index / 11) * 720;
                  const maxEarning = Math.max(...metrics.monthlyEarnings, 1);
                  const y = 160 - (earning / maxEarning) * 120;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#ff6b35"
                      stroke="#1a1d24"
                      strokeWidth="2"
                    />
                  );
                })}
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
                ].map((month, index) => {
                  const x = 40 + (index / 11) * 720;
                  return (
                    <text
                      key={month}
                      x={x}
                      y="190"
                      fill="#b0b3b8"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {month}
                    </text>
                  );
                })}
              </svg>
            </div>

            <div className="dashboard-dark-summary-row">
              <div className="dashboard-dark-summary-item">
                <div className="dashboard-dark-summary-label">Ganhos</div>
                <div className="dashboard-dark-summary-value">
                  R${" "}
                  {metrics.monthEarnings.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="dashboard-dark-summary-item">
                <div className="dashboard-dark-summary-label">
                  Ganhos Totais
                </div>
                <div className="dashboard-dark-summary-value">
                  R${" "}
                  {metrics.totalEarnings.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>

            <table className="dashboard-dark-table">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Ganhos</th>
                  <th>Eventos</th>
                  <th>Taxa</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Este Mês</td>
                  <td>
                    R${" "}
                    {metrics.monthEarnings.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td>{metrics.totalRequests}</td>
                  <td>{metrics.conversionRate}%</td>
                </tr>
                <tr>
                  <td>Este Ano</td>
                  <td>
                    R${" "}
                    {metrics.totalEarnings.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td>{metrics.yearTotal}</td>
                  <td>{metrics.conversionRate}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showReviewsModal && (
        <div
          className="wallet-modal-overlay"
          onClick={() => setShowReviewsModal(false)}
        >
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <h2 className="wallet-modal-title">Avaliações</h2>
              <button
                className="wallet-modal-close"
                onClick={() => setShowReviewsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="wallet-modal-content">
              {reviews.length > 0 ? (
                <div className="reviews-list">
                  {reviews.map((review) => {
                    const rating5 = (review.rating / 10) * 5;
                    return (
                      <div key={review.id} className="review-item">
                        <div className="review-header">
                          <div className="review-rating">
                            <div className="review-stars">
                              {renderStars(rating5)}
                            </div>
                            <span className="review-rating-value">
                              {rating5.toFixed(1)}
                            </span>
                          </div>
                          <p className="review-date">
                            {new Date(review.createdAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                        {review.client && (
                          <p className="review-client">
                            {review.client.name || "Cliente"}
                          </p>
                        )}
                        {review.comment && (
                          <p className="review-comment">{review.comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="wallet-empty">Nenhuma avaliação encontrada.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal da Carteira */}
      {showWalletModal && (
        <div
          className="wallet-modal-overlay"
          onClick={() => setShowWalletModal(false)}
        >
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <h2 className="wallet-modal-title">Carteira</h2>
              <button
                className="wallet-modal-close"
                onClick={() => setShowWalletModal(false)}
                aria-label="Fechar"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className="wallet-modal-content">
              {isLoadingWallet ? (
                <div className="wallet-loading">
                  <p>Carregando informações da carteira...</p>
                </div>
              ) : walletError ? (
                <div className="wallet-error">
                  <p>{walletError}</p>
                </div>
              ) : (
                <>
                  <div className="wallet-balance-section">
                    <div className="wallet-balance-item">
                      <span className="wallet-balance-label">
                        Saldo Disponível
                      </span>
                      <span className="wallet-balance-value">
                        {formatCurrency(walletBalance?.available_cents || 0)}
                      </span>
                    </div>
                    <div className="wallet-balance-item">
                      <span className="wallet-balance-label">
                        Saldo Bloqueado
                      </span>
                      <span className="wallet-balance-value">
                        {formatCurrency(walletBalance?.blocked_cents || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="wallet-section">
                    <h3 className="wallet-section-title">Últimas Transações</h3>
                    {walletEntries.length === 0 ? (
                      <p className="wallet-empty">
                        Nenhuma transação encontrada.
                      </p>
                    ) : (
                      <div className="wallet-entries-list">
                        {walletEntries.map((entry) => (
                          <div key={entry.id} className="wallet-entry-item">
                            <div className="wallet-entry-info">
                              <span
                                className={`wallet-entry-type ${entry.type.toLowerCase()}`}
                              >
                                {entry.type === "CREDIT" ? "Crédito" : "Débito"}
                              </span>
                              <span className="wallet-entry-description">
                                {entry.description || "Transação"}
                              </span>
                              <span className="wallet-entry-date">
                                {formatDate(entry.created_at)}
                              </span>
                            </div>
                            <span
                              className={`wallet-entry-amount ${entry.type.toLowerCase()}`}
                            >
                              {entry.type === "CREDIT" ? "+" : "-"}
                              {formatCurrency(Math.abs(entry.amount_cents))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="wallet-section">
                    <h3 className="wallet-section-title">Saques</h3>
                    {walletPayouts.length === 0 ? (
                      <p className="wallet-empty">Nenhum saque encontrado.</p>
                    ) : (
                      <div className="wallet-payouts-list">
                        {walletPayouts.map((payout) => (
                          <div key={payout.id} className="wallet-payout-item">
                            <div className="wallet-payout-info">
                              <span className="wallet-payout-amount">
                                {formatCurrency(payout.amount_cents)}
                              </span>
                              <span className="wallet-payout-date">
                                {formatDate(payout.requested_at)}
                              </span>
                              <span className="wallet-payout-key">
                                {payout.pix_key_type}: {payout.pix_key}
                              </span>
                            </div>
                            <span
                              className="wallet-payout-status"
                              style={{
                                color: getPayoutStatusColor(payout.status),
                              }}
                            >
                              {getPayoutStatusLabel(payout.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
