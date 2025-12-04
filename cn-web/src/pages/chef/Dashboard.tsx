import React, { useState, useEffect, useMemo, useRef } from "react";
import "./Dashboard.css";
import "./DashboardDark.css";
import "./themes/Dashboard.light.css";
import estrelaInteira from "../../assets/estrelainteira.png";
import meiaEstrela from "../../assets/meiaestrela.png";
import estrelaVazia from "../../assets/estrelavazia.png";
import logoBranco from "../../assets/iconebranco.png";
import { chefService, ChefReview } from "../../services/chef.service";
import { DashboardSidebar } from "../../components/DashboardSidebar";
import {
  serviceRequestService,
  ServiceRequest,
  ServiceRequestStatus,
} from "../../services/serviceRequest.service";
import {
  chefWalletService,
  WalletBalance,
  WalletEntry,
  ChefPayout,
} from "../../services/chef-wallet.service";
import { formatCurrency, formatDate, calculatePercentage } from "../../utils/dataUtils";

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [reviews, setReviews] = useState<ChefReview[]>([]);
  const [selectedChartMonth, setSelectedChartMonth] = useState<number | null>(new Date().getMonth());
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0); // 0 = semana atual, -1 = semana anterior, 1 = próxima semana

  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(
    null
  );
  const [showReviewsModal, setShowReviewsModal] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [walletEntries, setWalletEntries] = useState<WalletEntry[]>([]);
  const [walletPayouts, setWalletPayouts] = useState<ChefPayout[]>([]);
  const [isLoadingWallet, setIsLoadingWallet] = useState<boolean>(false);
  const [walletError, setWalletError] = useState<string>("");
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [pixKey, setPixKey] = useState<string>("");
  const [pixKeyType, setPixKeyType] = useState<"EMAIL" | "CPF" | "CNPJ" | "PHONE" | "EVP">("EMAIL");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState<boolean>(false);
  const [payoutError, setPayoutError] = useState<string>("");
  const previousCompletedCountRef = useRef<number>(0);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("dashboard-theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const [monthlyGoal, setMonthlyGoal] = useState<number>(0);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<string>("");
  const [isLoadingGoal, setIsLoadingGoal] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  useEffect(() => {
    const loadGoalForMonth = async () => {
      if (selectedChartMonth === null) return;
      
      try {
        const monthKey = `${selectedYear}-${String(selectedChartMonth + 1).padStart(2, '0')}`;
        const goalData = await chefService.getMySalesGoal(monthKey).catch(() => null);
        
        if (goalData && goalData.goal_set) {
          setMonthlyGoal(goalData.amount_cents);
        } else {
          setMonthlyGoal(0);
        }
      } catch (error) {
        console.error("Erro ao carregar meta:", error);
      }
    };

    loadGoalForMonth();
  }, [selectedYear, selectedChartMonth]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        const timeoutId = setTimeout(() => {
          setIsLoading(false);
        }, 5000);

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const [profileData, reviewsData, balanceData, goalData] = await Promise.all([
          chefService.getMyProfile().catch(() => null),
          chefService.getMyReviews(1, 1000).catch(() => ({ items: [] })),
          chefWalletService.getBalance().catch(() => null),
          chefService.getMySalesGoal(currentMonth).catch(() => null),
        ]);

        setProfile(profileData);
        setReviews(reviewsData.items || []);
        if (balanceData) {
          setWalletBalance(balanceData);
        }
        if (goalData && goalData.goal_set) {
          setMonthlyGoal(goalData.amount_cents);
        }

        let allRequests: ServiceRequest[] = [];
        let page = 1;
        let hasMore = true;
        let maxPages = 3;

        try {
          while (hasMore && page <= maxPages) {
            const requestsData =
              await serviceRequestService.listChefServiceRequests(page, 500);
            allRequests = [...allRequests, ...requestsData.items];

            if (
              requestsData.items.length < 500 ||
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
    const selectedYear = now.getFullYear();
    const startOfMonth = new Date(selectedYear, chartMonth, 1);
    const endOfMonth = new Date(selectedYear, chartMonth + 1, 0, 23, 59, 59);

    const monthRequests = serviceRequests.filter((sr) => {
      const srDate = new Date(sr.requested_date);
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

    const rejectedByChef = serviceRequests.filter(
      (sr) => sr.status === ServiceRequestStatus.REJECTED_BY_CHEF
    );

    const rejectedByClient = serviceRequests.filter(
      (sr) =>
        sr.status === ServiceRequestStatus.CANCELLED && sr.quote
    );

    const rejectedCount = rejectedByChef.length + rejectedByClient.length;

    const monthEarnings = serviceRequests
      .filter((sr) => {
        if (
          sr.status !== ServiceRequestStatus.COMPLETED ||
          !sr.quote
        )
          return false;
        const serviceDate = new Date(sr.requested_date);
        return serviceDate >= startOfMonth && serviceDate <= endOfMonth;
      })
      .reduce((sum, sr) => {
        if (!sr.quote) return sum;
        return sum + (sr.quote.amount_cents || 0);
      }, 0);


    const yearRequests = serviceRequests.filter((sr) => {
      const srDate = new Date(sr.requested_date);
      return srDate.getFullYear() === selectedYear;
    });

    const totalEarnings = yearRequests
      .filter((sr) => {
        if (
          sr.status !== ServiceRequestStatus.COMPLETED ||
          !sr.quote
        )
          return false;
        return true;
      })
      .reduce((sum, sr) => {
        if (!sr.quote) return sum;
        return sum + (sr.quote.amount_cents || 0);
      }, 0);

    const yearCompleted = yearRequests.filter(
      (sr) => sr.status === ServiceRequestStatus.COMPLETED
    ).length;

    const monthCompleted = monthRequests.filter(
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

    const greenPercent = calculatePercentage(totalCompleted, totalRequests);
    const orangePercent = calculatePercentage(totalPending, totalRequests);
    const redPercent = calculatePercentage(totalCancelled, totalRequests);

    const progressAtendidos = calculatePercentage(totalCompleted, totalRequests);
    const progressPendentes = calculatePercentage(totalPending, totalRequests);
    const progressCancelados = calculatePercentage(totalCancelled, totalRequests);


    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (selectedWeekOffset * 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const dailyEarnings = Array.from({ length: 7 }, (_, dayIndex) => {
      return serviceRequests
        .filter((sr) => {
          if (
            sr.status !== ServiceRequestStatus.COMPLETED ||
            !sr.quote
          )
            return false;
          const serviceDate = new Date(sr.requested_date);
          return serviceDate >= weekStart && 
                 serviceDate <= weekEnd && 
                 serviceDate.getDay() === dayIndex;
        })
        .reduce((sum, sr) => {
          if (!sr.quote) return sum;
          return sum + (sr.quote.amount_cents || 0);
        }, 0);
    });


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
      const rawRating5 = (avgRating10 / 10) * 5;
      avgRating5 = Math.round(rawRating5 * 2) / 2;
    } else if (profile?.avgRating) {
      const rawRating5 = (Number(profile.avgRating) / 10) * 5;
      avgRating5 = Math.round(rawRating5 * 2) / 2;
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
            const serviceDate = new Date(sr.requested_date);
            return serviceDate >= lastMonthStart && serviceDate <= lastMonthEnd;
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

    const salesProgress = monthlyGoal > 0
      ? Math.min(Math.round((monthEarnings / monthlyGoal) * 100), 100)
      : (monthEarnings > 0 ? 100 : 0);

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
      salesProgress,
      yearTotal: yearRequests.length,
      monthCompleted,
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
      rejectedCount,
      dailyEarnings: dailyEarnings.map((e) => e / 100),
    };
  }, [serviceRequests, profile, selectedChartMonth, reviews, monthlyGoal, selectedWeekOffset]);

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

  const formatCurrencyFromReais = (reais: number): string => {
    return formatCurrency(reais * 100);
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
        <main className={`dashboard-main ${theme === "light" ? "dashboard-light-main" : "dashboard-dark-main"}`} style={{ marginLeft: 0, width: '100vw' }}>
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleOpenGoalModal = () => {
    setEditingGoal(monthlyGoal > 0 ? (monthlyGoal / 100).toFixed(2) : "");
    setShowGoalModal(true);
  };

  const handleSaveGoal = async () => {
    const goalValue = parseFloat(editingGoal);
    if (isNaN(goalValue) || goalValue < 1) {
      alert("A meta mínima é de R$ 1,00");
      return;
    }
    const goalInCents = Math.round(goalValue * 100);
    
    if (goalInCents < 100) {
      alert("A meta mínima é de R$ 1,00");
      return;
    }
    
    try {
      setIsLoadingGoal(true);
      const now = new Date();
      const selectedYear = now.getFullYear();
      const monthToSave = selectedChartMonth !== null ? selectedChartMonth : now.getMonth();
      const monthKey = `${selectedYear}-${String(monthToSave + 1).padStart(2, '0')}`;
      
      const response = await chefService.setMySalesGoal({
        amount_cents: goalInCents,
        goalMonth: monthKey,
      });
      
      if (response && response.goal_set) {
        setMonthlyGoal(response.amount_cents);
      } else {
        setMonthlyGoal(goalInCents);
      }
      
      setShowGoalModal(false);
      setEditingGoal("");
    } catch (error: any) {
      console.error("Erro ao salvar meta:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Erro ao salvar meta. Tente novamente.";
      alert(Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage);
    } finally {
      setIsLoadingGoal(false);
    }
  };

  const handleCloseGoalModal = () => {
    setShowGoalModal(false);
    setEditingGoal("");
  };

  const handleRequestPayout = async () => {
    const amountValue = parseFloat(payoutAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setPayoutError("Por favor, insira um valor válido maior que zero.");
      return;
    }

    if (!pixKey || pixKey.trim() === "") {
      setPayoutError("Por favor, insira uma chave PIX.");
      return;
    }

    if (!walletBalance || walletBalance.available_cents < amountValue * 100) {
      setPayoutError("Saldo insuficiente para realizar o saque.");
      return;
    }

    try {
      setIsSubmittingPayout(true);
      setPayoutError("");
      
      const amountCents = Math.round(amountValue * 100);
      await chefWalletService.requestPayout({
        amount_cents: amountCents,
        pix_key: pixKey.trim(),
        pix_key_type: pixKeyType,
      });

      await loadWalletData();
      
      setShowPayoutModal(false);
      setPayoutAmount("");
      setPixKey("");
      setPixKeyType("EMAIL");
      setPayoutError("");
      
      alert(`Saque de ${formatCurrency(amountCents)} solicitado com sucesso!`);
    } catch (error) {
      console.error("Erro ao solicitar saque:", error);
      setPayoutError(
        error instanceof Error ? error.message : "Erro ao solicitar saque. Tente novamente."
      );
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const handleClosePayoutModal = () => {
    setShowPayoutModal(false);
    setPayoutAmount("");
    setPixKey("");
    setPixKeyType("EMAIL");
    setPayoutError("");
  };

  return (
    <div className={`dashboard-layout ${theme === "light" ? "dashboard-light" : "dashboard-dark"}`}>
      <DashboardSidebar />
      <main className={`dashboard-main ${theme === "light" ? "dashboard-light-main" : "dashboard-dark-main"}`}>
        <div className={`dashboard-content ${theme === "light" ? "dashboard-light-content" : "dashboard-dark-content"}`}>
          <div className={`dashboard-header ${theme === "light" ? "dashboard-light-header" : "dashboard-dark-header"}`}>
            <h1 className={`dashboard-title ${theme === "light" ? "dashboard-light-title" : "dashboard-dark-title"}`}>Dashboard</h1>
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

          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              className="card ganhos-card"
              style={{
                maxWidth: "380px",
                width: "100%",
                flex: "1 1 350px",
                maxHeight: "320px",
                height: "320px",
                position: "relative",
                padding: "1.5rem 1.75rem 1.75rem 1.75rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <button
                className="ver-carteira-button"
                onClick={handleOpenWallet}
                style={{
                  position: "absolute",
                  top: "1.25rem",
                  right: "1.25rem",
                  background: "rgba(255, 255, 255, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  color: "white",
                  padding: "0.6rem 1.2rem",
                  borderRadius: "24px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  transition: "all 0.3s",
                  fontFamily: '"Comfortaa", sans-serif',
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.35)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
                }}
              >
                Ver Carteira
              </button>
              <h3
                className="saldo-disponivel-label"
                style={{ 
                  fontSize: "1.2rem", 
                  color: "#ffffff",
                  marginBottom: "1.5rem", 
                  letterSpacing: "0.3px",
                  fontWeight: "700",
                  marginTop: "0",
                  marginLeft: "0",
                  marginRight: "0",
                  padding: "0",
                  fontFamily: '"Comfortaa", sans-serif'
                }}
              >
                Saldo Disponível
              </h3>
              <div
                className="saldo-disponivel-section"
                style={{ borderTop: "none", paddingTop: "0", marginTop: "0", flex: "1" }}
              >
                <p
                  className="saldo-disponivel-value"
                  style={{ 
                    fontSize: "3rem", 
                    fontWeight: "800", 
                    lineHeight: "1", 
                    marginBottom: "1.5rem", 
                    marginTop: "0", 
                    fontFamily: '"Comfortaa", sans-serif',
                    color: "white",
                    letterSpacing: "0"
                  }}
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
                  borderTop: "1px solid rgba(255, 255, 255, 0.25)",
                  marginTop: "auto",
                  paddingTop: "1.25rem",
                  paddingBottom: "0",
                }}
              >
                <h3 className="card-title-white" style={{ fontSize: "1rem", opacity: 0.95, marginBottom: "0.5rem", fontWeight: "500", fontFamily: '"Comfortaa", sans-serif', color: "rgba(255, 255, 255, 0.9)" }}>
                  Ganhos do Mês
                </h3>
                <p className="card-value-white" style={{ fontSize: "1.75rem", fontWeight: "700", lineHeight: "1.2", fontFamily: '"Comfortaa", sans-serif' }}>
                  R${" "}
                  {metrics.monthEarnings.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div
              className="dashboard-dark-card"
              style={{
                maxWidth: "380px",
                width: "100%",
                flex: "1 1 350px",
                position: "relative",
                overflow: "hidden",
                maxHeight: "320px",
                height: "320px",
                display: "flex",
                flexDirection: "column",
                padding: "1.5rem 1.75rem",
              }}
            >
              <button
                className="ver-avaliacoes-button"
                onClick={() => setShowReviewsModal(true)}
                style={{
                  position: "absolute",
                  top: "1.25rem",
                  right: "1.25rem",
                  padding: "0.6rem 1.2rem",
                  background: "#ff6b35",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "24px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  fontFamily: '"Comfortaa", sans-serif',
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(255, 107, 53, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#ff8c00";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 107, 53, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ff6b35";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(255, 107, 53, 0.3)";
                }}
              >
                Ver Avaliações
              </button>
              <h3 className="dashboard-dark-card-title" style={{ 
                fontSize: "1.2rem", 
                marginBottom: "1.5rem", 
                letterSpacing: "0.3px",
                fontWeight: "700",
                marginTop: "0",
                marginLeft: "0",
                marginRight: "0",
                padding: "0",
                fontFamily: '"Comfortaa", sans-serif'
              }}>
                Avaliações
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  flex: "1",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  paddingTop: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    width: "100%",
                  }}
                >
                  <div
                    className="dashboard-dark-metric-large"
                    style={{ 
                      margin: 0, 
                      fontSize: "3rem", 
                      fontWeight: "800", 
                      lineHeight: "1", 
                      color: "#ff6b35", 
                      fontFamily: '"Comfortaa", sans-serif',
                      letterSpacing: "0"
                    }}
                  >
                    {metrics.avgRating % 1 === 0 
                      ? metrics.avgRating.toLocaleString("pt-BR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                      : metrics.avgRating.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                  </div>
                  <div
                    className="review-stars-top"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      flex: "1",
                    }}
                  >
                    {renderStars(metrics.avgRating)}
                  </div>
                </div>
                <div
                  className="dashboard-dark-metric-label"
                  style={{ margin: 0, opacity: 1, fontSize: "1rem", fontWeight: "500", fontFamily: '"Comfortaa", sans-serif' }}
                >
                  {reviews.length}{" "}
                  {reviews.length === 1 ? "avaliação" : "avaliações"}
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: "-1rem",
                  right: "-3rem",
                }}
              >
                <img
                  src={logoBranco}
                  alt="Logo"
                  style={{
                    width: "190px",
                    height: "150px",
                    filter: theme === "light" ? "brightness(0) saturate(100%)" : "brightness(0) invert(1)",
                    objectFit: "contain",
                    opacity: 0.3,
                  }}
                />
              </div>
            </div>

            <div
              className="dashboard-dark-progress-card"
              style={{
                maxHeight: "320px",
                height: "320px",
                flex: "1",
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "2rem",
                overflow: "visible",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", flex: "1" }}
              >
                <h3 className="dashboard-dark-progress-title" style={{ marginTop: "0", marginBottom: "0.5rem" }}>
                  Meta de Ganhos Mensal
                </h3>
                <p className="dashboard-dark-progress-subtitle">
                  {selectedChartMonth !== null
                    ? (() => {
                        const now = new Date();
                        const selectedYear = now.getFullYear();
                        const monthName = new Date(selectedYear, selectedChartMonth).toLocaleDateString("pt-BR", {
                          month: "long",
                        });
                        return monthName.charAt(0).toUpperCase() + monthName.slice(1) + ` ${selectedYear}`;
                      })()
                    : "Mês atual"}
                </p>
                {monthlyGoal > 0 && (
                  <p className="dashboard-dark-progress-goal-label">
                    Meta: {formatCurrency(monthlyGoal)}
                  </p>
                )}
                <div>
                  <span className="dashboard-dark-progress-value">
                    {formatCurrencyFromReais(metrics.monthEarnings)}
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <button
                    className="define-goal-button"
                    onClick={handleOpenGoalModal}
                    style={{ alignSelf: "flex-start" }}
                  >
                    Defina uma meta
                  </button>
                </div>
              </div>
              <div
                className="dashboard-dark-gauge"
                style={{
                  flex: "0 0 auto",
                  width: "280px",
                  minWidth: "280px",
                  marginTop: "auto",
                  marginBottom: "auto",
                  alignSelf: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  overflow: "visible",
                }}
              >
                <svg
                  viewBox="0 0 200 100"
                  style={{ width: "100%", height: "160px", overflow: "visible" }}
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
                      (metrics.salesProgress / 100) * (Math.PI * 80)
                    } ${Math.PI * 80}`}
                  />
                </svg>
                {monthlyGoal > 0 && (
                  <div className="dashboard-dark-progress-message">
                    {metrics.monthEarnings >= (monthlyGoal / 100) ? (
                      <span className="progress-message-success">
                         Parabéns! Meta atingida!
                      </span>
                    ) : metrics.salesProgress >= 50 && metrics.salesProgress < 100 ? (
                      <span className="progress-message-encouragement">
                         Você está na metade! Continue assim!
                      </span>
                    ) : (
                      <span className="progress-message-remaining">
                        Faltam {formatCurrency((monthlyGoal / 100 - metrics.monthEarnings) * 100)} para atingir a meta
                      </span>
                    )}
                  </div>
                )}
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
                  <tr>
                    <td>Recusados</td>
                    <td>-</td>
                    <td>{metrics.rejectedCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="dashboard-dark-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <h3 className="dashboard-dark-card-title" style={{ margin: 0 }}>Ganhos por Dia</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        color: "#b0b3b8",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontFamily: '"Comfortaa", sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      ‹
                    </button>
                    <span style={{ color: "#b0b3b8", fontSize: "0.9rem", minWidth: "120px", textAlign: "center" }}>
                      {(() => {
                        const weekStart = new Date();
                        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (selectedWeekOffset * 7));
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6);
                        const startDay = weekStart.getDate();
                        const startMonth = weekStart.toLocaleDateString("pt-BR", { month: "short" });
                        const endDay = weekEnd.getDate();
                        const endMonth = weekEnd.toLocaleDateString("pt-BR", { month: "short" });
                        if (selectedWeekOffset === 0) {
                          return "Semana Atual";
                        }
                        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
                      })()}
                    </span>
                    <button
                      onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        color: "#b0b3b8",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontFamily: '"Comfortaa", sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      ›
                    </button>
                    {selectedWeekOffset !== 0 && (
                      <button
                        onClick={() => setSelectedWeekOffset(0)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255, 107, 53, 0.5)",
                          color: "#ff6b35",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontFamily: '"Comfortaa", sans-serif',
                          marginLeft: "0.5rem",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255, 107, 53, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        Hoje
                      </button>
                    )}
                  </div>
                </div>
                <p className="dashboard-dark-card-description">
                  Distribuição dos ganhos da semana
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
                          <div className="review-client-container">
                            {review.client.profilePictureUrl ? (
                              <img
                                src={review.client.profilePictureUrl}
                                alt={review.client.name || "Cliente"}
                                className="review-client-avatar"
                              />
                            ) : (
                              <div className="review-client-avatar-placeholder">
                                {(review.client.name || "Cliente").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <p className="review-client">
                              {review.client.name || "Cliente"}
                            </p>
                          </div>
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
                    <button
                      className="wallet-request-payout-button"
                      onClick={() => {
                        setPayoutAmount("");
                        setPixKey("");
                        setPixKeyType("EMAIL");
                        setPayoutError("");
                        setShowPayoutModal(true);
                      }}
                      disabled={!walletBalance || walletBalance.available_cents <= 0}
                    >
                      Solicitar Saque
                    </button>
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

      {showGoalModal && (
        <div className="wallet-modal-overlay" onClick={handleCloseGoalModal}>
          <div className="goal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="goal-modal-header">
              <h2 className="goal-modal-title">Ajustar Meta Mensal</h2>
              <button
                className="goal-modal-close"
                onClick={handleCloseGoalModal}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="goal-modal-content">
              <label className="goal-modal-label">
                Meta de vendas mensal (em reais):
              </label>
              <input
                type="number"
                className="goal-modal-input"
                value={editingGoal}
                onChange={(e) => setEditingGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoadingGoal && editingGoal && !isNaN(parseFloat(editingGoal)) && parseFloat(editingGoal) >= 1) {
                    handleSaveGoal();
                  }
                }}
                placeholder="Ex: 15000.00"
                min="1"
                step="0.01"
                autoFocus
              />
              <div className="goal-modal-actions">
                <button
                  className="goal-modal-cancel"
                  onClick={handleCloseGoalModal}
                  disabled={isLoadingGoal}
                >
                  Cancelar
                </button>
                <button
                  className="goal-modal-save"
                  onClick={handleSaveGoal}
                  disabled={isLoadingGoal || !editingGoal || isNaN(parseFloat(editingGoal)) || parseFloat(editingGoal) < 1}
                >
                  {isLoadingGoal ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPayoutModal && (
        <div className="wallet-modal-overlay" onClick={handleClosePayoutModal}>
          <div className="goal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="goal-modal-header">
              <h2 className="goal-modal-title">Solicitar Saque</h2>
              <button
                className="goal-modal-close"
                onClick={handleClosePayoutModal}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="goal-modal-content">
              {payoutError && (
                <div className="wallet-error" style={{ marginBottom: "1rem", padding: "0.75rem", borderRadius: "8px" }}>
                  <p style={{ margin: 0, color: "#f44336" }}>{payoutError}</p>
                </div>
              )}
              
              <label className="goal-modal-label">
                Valor do saque (em reais):
              </label>
              <input
                type="number"
                className="goal-modal-input"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Ex: 300.00"
                min="0.01"
                step="0.01"
                disabled={isSubmittingPayout}
              />
              
              <label className="goal-modal-label" style={{ marginTop: "1rem" }}>
                Tipo de chave PIX:
              </label>
              <select
                className="goal-modal-input"
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as typeof pixKeyType)}
                disabled={isSubmittingPayout}
              >
                <option value="EMAIL">E-mail</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="PHONE">Telefone</option>
                <option value="EVP">Chave Aleatória</option>
              </select>
              
              <label className="goal-modal-label" style={{ marginTop: "1rem" }}>
                Chave PIX:
              </label>
              <input
                type="text"
                className="goal-modal-input"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder={
                  pixKeyType === "EMAIL" ? "exemplo@email.com" :
                  pixKeyType === "CPF" ? "000.000.000-00" :
                  pixKeyType === "CNPJ" ? "00.000.000/0000-00" :
                  pixKeyType === "PHONE" ? "(00) 00000-0000" :
                  "Chave aleatória"
                }
                disabled={isSubmittingPayout}
              />
              
              {walletBalance && (
                <p style={{ 
                  fontSize: "0.85rem", 
                  color: "#b0b3b8", 
                  marginTop: "0.5rem",
                  marginBottom: "0"
                }}>
                  Saldo disponível: {formatCurrency(walletBalance.available_cents)}
                </p>
              )}
              
              <div className="goal-modal-actions">
                <button
                  className="goal-modal-cancel"
                  onClick={handleClosePayoutModal}
                  disabled={isSubmittingPayout}
                >
                  Cancelar
                </button>
                <button
                  className="goal-modal-save"
                  onClick={handleRequestPayout}
                  disabled={
                    isSubmittingPayout || 
                    !payoutAmount || 
                    !pixKey || 
                    isNaN(parseFloat(payoutAmount)) || 
                    parseFloat(payoutAmount) <= 0
                  }
                >
                  {isSubmittingPayout ? "Processando..." : "Solicitar Saque"}
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
