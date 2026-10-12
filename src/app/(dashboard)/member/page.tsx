"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
    IconWallet, 
    IconToolsKitchen2, 
    IconCalendarEvent,
    IconCalendar,
    IconBell,
    IconShoppingCart,
    IconFileText,
    IconSend,
    IconSpeakerphone,
    IconRefresh,
    IconChevronRight,
    IconChevronLeft,
    IconUsers,
    IconCheck,
    IconAlertCircle,
    IconX,
    IconCircleCheck,
    IconClock,
    IconCreditCard,
    IconTrash
} from "@tabler/icons-react";

export default function MemberDashboard() {
    const { data: session, status } = useSession(); 

    // ─── Financial & Meal Stats ───
    const [totalDeposit, setTotalDeposit] = useState(0);
    const [totalMeals, setTotalMeals] = useState(0);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [fixedCost, setFixedCost] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [liveMealRate, setLiveMealRate] = useState(0);
    const [recentMeals, setRecentMeals] = useState<any[]>([]);
    const [notices, setNotices] = useState<any[]>([]);
    const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // ─── Current Date Formatting ───
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDate = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // ─── Bazaar Schedule States ───
    const [activeMonth, setActiveMonth] = useState(today.getMonth()); // 0-11
    const [activeYear, setActiveYear] = useState(today.getFullYear());

    const [modalMonth, setModalMonth] = useState(today.getMonth());
    const [modalYear, setModalYear] = useState(today.getFullYear());

    const [bazarSchedules, setBazarSchedules] = useState<any[]>([]);
    const [messSchedules, setMessSchedules] = useState<any[]>([]);
    const [isLoadingBazar, setIsLoadingBazar] = useState(false);

    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [isSubmittingBazarDates, setIsSubmittingBazarDates] = useState(false);

    // ─── Bazaar Expense Form ───
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseDetails, setExpenseDetails] = useState("");
    const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

    // ─── Payment / Deposit Modal State ───
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"Cash" | "bKash" | "Nagad" | "Bank">("Cash");
    const [paymentNote, setPaymentNote] = useState("");
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // ─── Floating Toast Notification ───
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // ─── Fetch Member Dashboard Data ───
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch("/api/members/dashboard-data");
                if (res.ok) {
                    const data = await res.json();
                    setTotalDeposit(data.stats.totalDeposit || 0);
                    setTotalMeals(data.stats.totalMeals || 0);
                    setCurrentBalance(data.stats.currentBalance ?? 0);
                    setFixedCost(data.stats.fixedCost || 0);
                    setTotalCost(data.stats.totalCost || 0);
                    setLiveMealRate(data.stats.liveMealRate || 0);
                    setRecentMeals(data.recentMeals || []);
                    setNotices(data.notices || []);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        if (status === "authenticated") {
            fetchDashboardData();
        }
    }, [status]);

    // ─── Fetch Bazaar Schedules ───
    const fetchBazarSchedules = async (m: number, y: number) => {
        setIsLoadingBazar(true);
        try {
            const res = await fetch(`/api/members/bazaar-schedule?month=${m + 1}&year=${y}`);
            if (res.ok) {
                const data = await res.json();
                setBazarSchedules(data.mySchedules || []);
                setMessSchedules(data.allSchedules || []);
            }
        } catch (error) {
            console.error("Error fetching bazaar schedules:", error);
        } finally {
            setIsLoadingBazar(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchBazarSchedules(activeMonth, activeYear);
        }
    }, [status, activeMonth, activeYear]);

    // ─── Active Month Navigation ───
    const handlePrevActiveMonth = () => {
        if (activeMonth === 0) {
            setActiveMonth(11);
            setActiveYear((prev) => prev - 1);
        } else {
            setActiveMonth((prev) => prev - 1);
        }
    };

    const handleNextActiveMonth = () => {
        if (activeMonth === 11) {
            setActiveMonth(0);
            setActiveYear((prev) => prev + 1);
        } else {
            setActiveMonth((prev) => prev + 1);
        }
    };

    // ─── Modal Month Navigation ───
    const handlePrevModalMonth = () => {
        if (modalMonth === 0) {
            setModalMonth(11);
            setModalYear((prev) => prev - 1);
        } else {
            setModalMonth((prev) => prev - 1);
        }
    };

    const handleNextModalMonth = () => {
        if (modalMonth === 11) {
            setModalMonth(0);
            setModalYear((prev) => prev + 1);
        } else {
            setModalMonth((prev) => prev + 1);
        }
    };

    const formatDateKey = (year: number, month: number, day: number) => {
        return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    const toggleDateSelection = (dateKey: string, isBookedByOther?: boolean) => {
        if (isBookedByOther) return;
        const selected = new Date(dateKey + "T00:00:00");
        const todayZero = new Date();
        todayZero.setHours(0, 0, 0, 0);
        if (selected.getTime() < todayZero.getTime()) return;

        setSelectedDates((prev) =>
            prev.includes(dateKey) ? prev.filter((d) => d !== dateKey) : [...prev, dateKey].sort()
        );
    };

    const handleConfirmBazarDates = async () => {
        if (selectedDates.length === 0) {
            showToast("Please select at least one date for bazaar.", "error");
            return;
        }

        setIsSubmittingBazarDates(true);
        try {
            const res = await fetch("/api/members/bazaar-schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dates: selectedDates }),
            });

            if (res.ok) {
                showToast("Bazaar dates submitted successfully for manager approval!", "success");
                setSelectedDates([]);
                setIsCalendarModalOpen(false);
                fetchBazarSchedules(activeMonth, activeYear);
            } else {
                const err = await res.json();
                showToast(err.error || "Failed to submit bazaar dates.", "error");
            }
        } catch (error) {
            showToast("An error occurred while submitting bazaar dates.", "error");
        } finally {
            setIsSubmittingBazarDates(false);
        }
    };

    // Calendar grid calculations
    const daysInModalMonth = new Date(modalYear, modalMonth + 1, 0).getDate();
    const firstDayOfModalMonth = new Date(modalYear, modalMonth, 1).getDay();
    const daysInPrevModalMonth = new Date(modalYear, modalMonth, 0).getDate();

    const prevMonthDays = Array.from(
        { length: firstDayOfModalMonth },
        (_, i) => daysInPrevModalMonth - firstDayOfModalMonth + 1 + i
    );
    const currentMonthDays = Array.from({ length: daysInModalMonth }, (_, i) => i + 1);
    const totalCells = firstDayOfModalMonth + daysInModalMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => i + 1);

    const currentUserId = (session?.user as any)?.id;

    const getDateStatus = (day: number) => {
        const key = formatDateKey(modalYear, modalMonth, day);
        const isSelected = selectedDates.includes(key);

        const mySchedule = bazarSchedules.find((s) => {
            const d = new Date(s.date);
            return d.getUTCFullYear() === modalYear && d.getUTCMonth() === modalMonth && d.getUTCDate() === day;
        });

        const messSchedule = messSchedules.find((s) => {
            const d = new Date(s.date);
            return d.getUTCFullYear() === modalYear && d.getUTCMonth() === modalMonth && d.getUTCDate() === day;
        });

        const approvedByOther = messSchedules.find((s) => {
            const d = new Date(s.date);
            return d.getUTCFullYear() === modalYear && d.getUTCMonth() === modalMonth && d.getUTCDate() === day
                && s.status === "approved" && s.user?.id !== currentUserId;
        });
        const isBookedByOther = !!approvedByOther;
        const bookedByName = approvedByOther?.user?.name || "Someone";

        const sched = mySchedule || messSchedule;
        const dayDate = new Date(modalYear, modalMonth, day);
        const todayZero = new Date();
        todayZero.setHours(0, 0, 0, 0);

        const isPast = dayDate.getTime() < todayZero.getTime();
        const isCompleted = sched ? (sched.status === "done" || (isPast && sched.status === "approved")) : false;
        const isUpcoming = sched ? !isCompleted : false;

        return {
            key,
            isSelected,
            isPast,
            isBookedByOther,
            bookedByName,
            isCompleted,
            isUpcoming,
            isScheduled: !!sched,
            status: sched?.status,
        };
    };

    // ─── Submit Bazaar Expense ───
    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseAmount) {
            showToast("Please enter the bazaar amount.", "error");
            return;
        }

        setIsSubmittingExpense(true);
        try {
            const res = await fetch("/api/members/finance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "expense", amount: expenseAmount, note: expenseDetails }),
            });

            if (res.ok) {
                showToast("Bazaar expense submitted successfully to manager!", "success");
                setExpenseAmount("");
                setExpenseDetails("");
            } else {
                showToast("Failed to submit expense.", "error");
            }
        } catch (error) {
            showToast("An error occurred while submitting.", "error");
        } finally {
            setIsSubmittingExpense(false);
        }
    };

    // ─── Submit Payment / Deposit ───
    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amountVal = parseFloat(paymentAmount);
        if (!amountVal || isNaN(amountVal) || amountVal <= 0) {
            showToast("Please enter a valid payment amount.", "error");
            return;
        }

        setIsSubmittingPayment(true);
        try {
            const res = await fetch("/api/members/finance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "payment",
                    amount: amountVal,
                    method: paymentMethod,
                    note: paymentNote.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast("Payment request submitted successfully for manager approval!", "success");
                setPaymentAmount("");
                setPaymentNote("");
                setPaymentMethod("Cash");
                setIsPaymentModalOpen(false);
            } else {
                showToast(data.error || "Failed to submit payment request.", "error");
            }
        } catch (error) {
            showToast("An error occurred while submitting payment.", "error");
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    // ─── Notice Board Handlers ───
    const handleClearAllNotices = async () => {
        if (notices.length === 0) return;
        setNotices([]);
        showToast("All notices cleared successfully.", "success");
        try {
            await fetch("/api/members/clear-notices", { method: "POST" });
        } catch (error) {
            console.error("Failed to clear notices:", error);
        }
    };

    const handleDismissNotice = async (noticeId: string) => {
        setNotices((prev) => prev.filter((n) => n.id !== noticeId));
        setSelectedNotice(null);
        showToast("Notice dismissed successfully.", "success");
        try {
            await fetch("/api/members/clear-notices", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noticeId }),
            });
        } catch (error) {
            console.error("Failed to dismiss notice:", error);
        }
    };

    // Top announcement
    const topAnnouncement = notices.length > 0 ? notices[0] : {
        title: `${monthNames[today.getMonth()]} ${today.getFullYear()} expense finalized!`,
        description: "The monthly overhead expense has been calculated.",
    };

    return (
        <div className="w-full max-w-md sm:max-w-xl md:max-w-7xl mx-auto space-y-4 md:space-y-6 pb-12 animate-in fade-in duration-300">
            
            {/* ─── Floating Toast Notification ─── */}
            {toast && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold border transition-all animate-in slide-in-from-top-4 duration-200 ${
                    toast.type === "success" 
                        ? "bg-slate-900 text-white border-slate-800" 
                        : toast.type === "error" 
                        ? "bg-rose-600 text-white border-rose-700" 
                        : "bg-indigo-600 text-white border-indigo-700"
                }`}>
                    {toast.type === "success" && <IconCheck size={18} className="text-emerald-400" stroke={3} />}
                    {toast.type === "error" && <IconAlertCircle size={18} className="text-rose-200" stroke={2.5} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* ──────────────────────────────────────────────────────────
                A. MEMBER GREETING & DATE CAPSULE ROW
            ────────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-3 pt-1 pb-1">
                {/* Left Block */}
                <div>
                    <p className="text-xs font-semibold text-slate-500">Welcome back,</p>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 mt-0.5">
                        {session?.user?.name || "Member"} <span className="text-2xl">👋</span>
                    </h1>
                    <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-0.5">
                        Have a balanced meal, have a brighter day!
                    </p>
                </div>

                {/* Right Block (Date Capsule) */}
                <div className="bg-white/95 backdrop-blur-sm border border-orange-100/90 rounded-2xl px-3 sm:px-3.5 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2 shrink-0">
                    <IconCalendar size={20} className="text-[#FF6B00] shrink-0" stroke={2.2} />
                    <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black text-[#FF6B00] leading-none uppercase tracking-tight">
                            {dayOfWeek}
                        </span>
                        <span className="text-xs font-black text-slate-900 leading-tight mt-0.5 whitespace-nowrap">
                            {formattedDate}
                        </span>
                    </div>
                    <IconChevronRight size={14} className="text-[#FF6B00] shrink-0 ml-0.5" stroke={2.5} />
                </div>
            </div>

            {/* ──────────────────────────────────────────────────────────
                B. URGENT ANNOUNCEMENT BANNER
            ────────────────────────────────────────────────────────── */}
            <div 
                onClick={() => setSelectedNotice(topAnnouncement)}
                className="bg-gradient-to-r from-orange-50/95 via-amber-50/90 to-orange-50/95 border border-orange-200/70 rounded-2xl p-3 md:p-4 flex items-center justify-between gap-3 shadow-2xs cursor-pointer hover:bg-orange-100/60 transition-all"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/25">
                        <IconSpeakerphone size={20} stroke={2.2} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs md:text-sm font-black text-slate-900 leading-tight truncate">
                            {topAnnouncement.title}
                        </h3>
                        <p className="text-[11px] md:text-xs font-medium text-slate-500 truncate mt-0.5">
                            {topAnnouncement.description}
                        </p>
                    </div>
                </div>
                <IconChevronRight size={16} className="text-slate-400 shrink-0" stroke={2.5} />
            </div>

            {/* ──────────────────────────────────────────────────────────
                C & D. TOP 3 METRICS (Balance, Deposit, Total Meals)
            ────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                
                {/* 1. "CURRENT BALANCE / TOTAL DUE" HERO CARD */}
                <div className={`col-span-2 md:col-span-1 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[148px] md:min-h-[170px] hover:shadow-2xl transition-all ${
                    currentBalance < 0 
                        ? "bg-gradient-to-br from-[#881337] via-[#4c0519] to-[#2a040e] border border-rose-800/40 text-white" 
                        : "bg-gradient-to-br from-[#064e3b] via-[#042f2e] to-[#022c22] border border-emerald-800/40 text-white"
                }`}>
                    {/* Decorative Geometric Wave Line */}
                    <svg 
                        className={`absolute right-4 bottom-2 w-36 h-20 pointer-events-none transition-colors ${
                            currentBalance < 0 ? "text-rose-400/20" : "text-emerald-400/20"
                        }`} 
                        viewBox="0 0 100 50" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M5 40 L35 40 L55 22 L75 32 L95 10" />
                    </svg>

                    {/* Top Row: Wallet Icon on Left, Status Badge & Meal Rate on Right */}
                    <div className="flex items-start justify-between relative z-10">
                        {/* Wallet squircle badge */}
                        <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-inner ${
                            currentBalance < 0 ? "text-rose-300" : "text-emerald-300"
                        }`}>
                            <IconWallet size={24} stroke={2.2} />
                        </div>

                        {/* Right Block: Status Badge + Meal Rate */}
                        <div className="flex flex-col items-end">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm ${
                                currentBalance < 0 
                                    ? "bg-amber-400 text-amber-950" 
                                    : "bg-[#10b981] text-[#022c22]"
                            }`}>
                                <span>{currentBalance < 0 ? "Due ⚠️" : "Refundable"}</span>
                                {currentBalance >= 0 && <IconRefresh size={13} stroke={2.5} />}
                            </span>

                            <div className="mt-2 text-right">
                                <p className={`text-[10px] font-bold tracking-wide uppercase ${
                                    currentBalance < 0 ? "text-rose-200/70" : "text-emerald-200/70"
                                }`}>Meal Rate</p>
                                <p className="text-sm sm:text-base font-black text-white mt-0.5">
                                    Tk {liveMealRate.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Left: Balance / Due Amount */}
                    <div className="mt-3 relative z-10">
                        <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-semibold tracking-wide ${
                                currentBalance < 0 ? "text-rose-200/80" : "text-emerald-200/80"
                            }`}>
                                {currentBalance < 0 ? "Total Due (Payable)" : "Current Balance"}
                            </p>
                            {fixedCost > 0 && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    currentBalance < 0 
                                        ? "bg-rose-950/50 text-rose-200 border border-rose-500/30" 
                                        : "bg-emerald-950/50 text-emerald-200 border border-emerald-500/30"
                                }`}>
                                    Overhead: Tk {fixedCost.toLocaleString()}
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-0.5">
                            {isLoadingData 
                                ? "..." 
                                : `${currentBalance < 0 ? "- Tk " : currentBalance > 0 ? "+ Tk " : "Tk "}${Math.abs(currentBalance).toLocaleString()}`
                            }
                        </h2>
                    </div>
                </div>

                {/* 2. Total Deposit Card */}
                <div className="col-span-1 bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl p-3.5 sm:p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[110px] md:min-h-[170px] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100/60 flex items-center justify-center shrink-0 shadow-2xs">
                            <IconWallet size={22} stroke={2.2} />
                        </div>
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <IconChevronRight size={15} stroke={2.5} />
                        </div>
                    </div>
                    <div className="mt-2 md:mt-4">
                        <p className="text-xs font-bold text-slate-500 leading-tight">Total Deposit</p>
                        <p className="text-lg md:text-2xl font-black text-slate-900 leading-tight mt-1 truncate">
                            Tk {isLoadingData ? "..." : totalDeposit}
                        </p>
                    </div>
                </div>

                {/* 3. My Total Meals Card */}
                <Link 
                    href="/member/my-meals"
                    className="col-span-1 bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl p-3.5 sm:p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[110px] md:min-h-[170px] hover:shadow-md hover:bg-orange-50/20 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100/60 flex items-center justify-center shrink-0 shadow-2xs">
                            <IconToolsKitchen2 size={22} stroke={2.2} />
                        </div>
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-50 group-hover:bg-orange-100 group-hover:text-orange-600 flex items-center justify-center text-slate-400 shrink-0 transition-colors">
                            <IconChevronRight size={15} stroke={2.5} />
                        </div>
                    </div>
                    <div className="mt-2 md:mt-4">
                        <p className="text-xs font-bold text-slate-500 leading-tight">My Total Meals</p>
                        <p className="text-lg md:text-2xl font-black text-slate-900 leading-tight mt-1 truncate group-hover:text-[#FF6B00] transition-colors">
                            {isLoadingData ? "..." : totalMeals}
                        </p>
                    </div>
                </Link>

            </div>

            {/* ─── Desktop Multi-Column Grid (Bazaar & Meals on Left 2 cols, Notice Board on Right) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Columns: Bazaar & Recent Meals */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    {/* ──────────────────────────────────────────────────────────
                        E. "THIS MONTH'S BAZAAR & PAYMENT" CONTAINER CARD
                    ────────────────────────────────────────────────────────── */}
                    <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-sm shadow-orange-500/20 shrink-0">
                            <IconShoppingCart size={20} stroke={2.2} />
                        </div>
                        <h2 className="text-sm sm:text-base font-black text-slate-900">
                            This Month's Bazaar & Payment
                        </h2>
                    </div>

                    {/* Month Selector Pill */}
                    <div className="bg-slate-50/90 border border-slate-200/80 rounded-full px-2.5 py-1 flex items-center gap-1 text-xs font-bold text-slate-800 shadow-2xs">
                        <button 
                            type="button" 
                            onClick={handlePrevActiveMonth}
                            className="p-0.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                            <IconChevronLeft size={13} stroke={2.5} />
                        </button>
                        <span className="text-[11px] sm:text-xs font-bold px-1 whitespace-nowrap">
                            {monthNames[activeMonth]} {activeYear}
                        </span>
                        <button 
                            type="button" 
                            onClick={handleNextActiveMonth}
                            className="p-0.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                            <IconChevronRight size={13} stroke={2.5} />
                        </button>
                    </div>
                </div>

                {/* Inner 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
                    
                    {/* Sub-Card 1: Bazaar Dates (Left) */}
                    <div className="border border-slate-100/90 bg-slate-50/60 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shrink-0">
                                    <IconCalendarEvent size={16} stroke={2.2} />
                                </div>
                                <h3 className="text-xs font-black text-slate-900">Bazaar Dates</h3>
                            </div>

                            {/* Graphic Illustration or Scheduled Dates */}
                            {isLoadingBazar ? (
                                <div className="py-6 text-center text-xs font-bold text-slate-400">Loading dates...</div>
                            ) : bazarSchedules.length === 0 ? (
                                <div className="py-3 flex flex-col items-center justify-center">
                                    {/* Dotted path curve illustration */}
                                    <svg className="w-48 h-12 text-slate-300" viewBox="0 0 200 50" fill="none">
                                        <path 
                                            d="M10 40 Q 60 10 90 25 T 190 20" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeDasharray="4 4" 
                                        />
                                        {/* Center Calendar Box */}
                                        <g transform="translate(80, 10)">
                                            <rect width="24" height="24" rx="6" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.8" />
                                            <rect x="0" y="0" width="24" height="8" rx="6" fill="#64748B" />
                                            <circle cx="6" cy="4" r="1.5" fill="white" />
                                            <circle cx="18" cy="4" r="1.5" fill="white" />
                                        </g>
                                        {/* End Leaf */}
                                        <g transform="translate(180, 10)">
                                            <path d="M0 10 C 5 0, 15 0, 18 10 C 15 20, 5 20, 0 10 Z" fill="#10B981" opacity="0.8" />
                                        </g>
                                    </svg>
                                    <p className="text-xs font-semibold text-slate-600 mt-2 text-center">
                                        No bazaar dates scheduled.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide py-1">
                                    {bazarSchedules.map((s: any) => {
                                        const d = new Date(s.date);
                                        const dayStr = String(d.getUTCDate()).padStart(2, "0");
                                        const monthStr = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
                                        
                                        const todayZero = new Date();
                                        todayZero.setHours(0, 0, 0, 0);
                                        const isPast = d.getTime() < todayZero.getTime();
                                        const isDone = s.status === "done" || (isPast && s.status === "approved");
                                        const isUpcoming = s.status === "approved" && !isPast;
                                        const isPending = s.status === "pending";

                                        return (
                                            <div 
                                                key={s.id} 
                                                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl border min-w-[62px] shrink-0 ${
                                                    isDone 
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-900" 
                                                        : isUpcoming 
                                                        ? "border-orange-200 bg-orange-50 text-orange-900" 
                                                        : "border-amber-200 bg-amber-50 text-amber-900"
                                                }`}
                                            >
                                                <span className="text-[9px] font-bold text-slate-500 uppercase">{monthStr}</span>
                                                <span className="text-lg font-black text-slate-900 leading-none my-1">{dayStr}</span>
                                                <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded ${
                                                    isDone ? "text-emerald-700 bg-emerald-100" : isUpcoming ? "text-orange-700 bg-orange-100" : "text-amber-700 bg-amber-100"
                                                }`}>
                                                    {isDone ? "Done" : isUpcoming ? "Upcoming" : "Pending"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Select Bazaar Date Action Button */}
                        <button 
                            type="button"
                            onClick={() => {
                                setModalMonth(activeMonth);
                                setModalYear(activeYear);
                                setSelectedDates([]);
                                setIsCalendarModalOpen(true);
                            }}
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 mt-3 cursor-pointer transition-all"
                        >
                            <IconCalendarEvent size={15} stroke={2.5} />
                            <span>Select Bazaar Date</span>
                        </button>
                    </div>

                    {/* Sub-Card 2: Update Bazaar Expense (Right) */}
                    <div className="border border-slate-100/90 bg-slate-50/60 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                        <form onSubmit={handleExpenseSubmit} className="flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shrink-0">
                                            <IconShoppingCart size={17} stroke={2.2} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xs font-black text-slate-900 leading-tight">Update Bazar Expense</h3>
                                            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">If bazar is done, submit the total expense.</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsPaymentModalOpen(true)}
                                        className="bg-orange-50/90 text-orange-600 border border-orange-200/70 text-xs font-bold px-3 py-1 rounded-full hover:bg-orange-100 transition-colors cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                                    >
                                        + Submit Payment
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Bazar Amount (Tk)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={expenseAmount} 
                                                onChange={(e) => setExpenseAmount(e.target.value)} 
                                                placeholder="Enter amount (e.g. 1250)" 
                                                className="w-full bg-white border border-slate-200/90 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs font-semibold" 
                                                required 
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                                                ৳
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Details (Optional)</label>
                                        <input 
                                            type="text" 
                                            value={expenseDetails} 
                                            onChange={(e) => setExpenseDetails(e.target.value)} 
                                            placeholder="E.g. Market items, note etc." 
                                            className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit to Manager Button */}
                            <button 
                                type="submit" 
                                disabled={isSubmittingExpense}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 mt-3 cursor-pointer transition-all disabled:opacity-50"
                            >
                                <IconSend size={15} stroke={2.5} />
                                <span>{isSubmittingExpense ? "Submitting..." : "Submit to Manager"}</span>
                            </button>
                        </form>
                    </div>

                </div>
            </div>

            {/* ──────────────────────────────────────────────────────────
                F. "MY RECENT MEALS" CARD
            ────────────────────────────────────────────────────────── */}
            <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100/60 flex items-center justify-center shrink-0">
                            <IconToolsKitchen2 size={20} stroke={2.2} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900 leading-tight">My Recent Meals</h2>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Last 7 days meal log</p>
                        </div>
                    </div>

                    <Link 
                        href="/member/my-meals" 
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 text-xs font-bold px-3.5 py-1 rounded-full transition-colors cursor-pointer"
                    >
                        View All
                    </Link>
                </div>

                {/* Table Header Bar */}
                <div className="bg-slate-50/90 rounded-xl px-3.5 py-2 grid grid-cols-5 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider text-center mt-3.5">
                    <span className="text-left pl-1">DATE</span>
                    <span>B'FAST</span>
                    <span>LUNCH</span>
                    <span>DINNER</span>
                    <span className="text-[#FF6B00]">TOTAL</span>
                </div>

                {/* Table Content */}
                <div className="divide-y divide-slate-100 min-h-[90px] flex flex-col justify-center">
                    {isLoadingData ? (
                        <div className="py-6 text-center text-xs font-bold text-slate-400">Loading meals...</div>
                    ) : recentMeals.length === 0 ? (
                        <div className="py-7 flex flex-col items-center justify-center gap-1.5">
                            {/* Food Cloche / Plate SVG Icon */}
                            <svg className="w-10 h-10 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4a1.5 1.5 0 0 1 1.5 1.5c0 .35-.12.67-.32.92A8.005 8.005 0 0 1 20 14v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1a8.005 8.005 0 0 1 6.82-7.58A1.498 1.498 0 0 1 10.5 5.5 1.5 1.5 0 0 1 12 4zm9 13a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h18z"/>
                            </svg>
                            <p className="text-xs font-bold text-slate-600 mt-1">No recent meals yet.</p>
                            <p className="text-[11px] text-slate-400 font-medium">Your meal records will appear here.</p>
                        </div>
                    ) : (
                        recentMeals.map((meal: any, idx: number) => {
                            const mealDate = new Date(meal.date);
                            const formattedDate = mealDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                            const isToday = mealDate.toDateString() === new Date().toDateString();
                            const totalDayMeal = (meal.breakfast || 0) + (meal.lunch || 0) + (meal.dinner || 0) + (meal.guest || 0);

                            return (
                                <div key={idx} className="grid grid-cols-5 items-center px-3.5 py-2.5 text-xs text-center hover:bg-slate-50/50 transition-colors">
                                    <div className="text-left pl-1 font-bold text-slate-800 flex items-center gap-1">
                                        <span>{formattedDate}</span>
                                        {isToday && <span className="text-[8px] bg-blue-50 text-blue-600 px-1 py-0.2 rounded font-black">Today</span>}
                                    </div>
                                    <span className="font-semibold text-slate-700">{meal.breakfast || 0}</span>
                                    <span className="font-semibold text-slate-700">{meal.lunch || 0}</span>
                                    <span className="font-semibold text-slate-700">{meal.dinner || 0}</span>
                                    <span className="font-black text-[#FF6B00]">{totalDayMeal}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            </div>

            {/* Right Column: Notice Board */}
            <div className="lg:col-span-1">
                {/* ──────────────────────────────────────────────────────────
                    G. "NOTICE BOARD" CARD
                ────────────────────────────────────────────────────────── */}
                <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-sm shadow-orange-500/20 shrink-0">
                            <IconBell size={20} stroke={2.2} />
                        </div>
                        <h2 className="text-base font-black text-slate-900">Notice Board</h2>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {notices.length > 0 && (
                            <span className="bg-[#FF6B00] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full">
                                {notices.length} New
                            </span>
                        )}
                        {notices.length > 0 && (
                            <button 
                                type="button"
                                onClick={handleClearAllNotices}
                                className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-2.5 py-1 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                                Clear All
                            </button>
                        )}
                        <button 
                            type="button"
                            onClick={() => setSelectedNotice(notices[0] || null)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 text-xs font-bold px-3 py-1 rounded-full transition-colors cursor-pointer"
                        >
                            View All
                        </button>
                    </div>
                </div>

                {/* Notice Rows */}
                <div className="divide-y divide-slate-100 mt-3">
                    {isLoadingData ? (
                        <div className="py-6 text-center text-xs font-bold text-slate-400">Loading notices...</div>
                    ) : notices.length === 0 ? (
                        <div className="py-7 text-center">
                            <p className="text-xs font-bold text-slate-500">All caught up! 🎉 No new notices.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Check back later for new announcements.</p>
                        </div>
                    ) : (
                        notices.slice(0, 5).map((notice, index) => {
                            const isGuestMeal = notice.type === "guest_meal";
                            const nDate = notice.createdAt 
                                ? new Date(notice.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                                : formattedDate;

                            return (
                                <div 
                                    key={notice.id || index}
                                    onClick={() => setSelectedNotice(notice)}
                                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-2xl transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Icon */}
                                        {isGuestMeal ? (
                                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                                                <IconUsers size={18} stroke={2.2} />
                                            </div>
                                        ) : (
                                            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shrink-0">
                                                <IconFileText size={18} stroke={2.2} />
                                            </div>
                                        )}

                                        <div className="min-w-0">
                                            <h4 className="text-xs font-black text-slate-900 leading-tight truncate">
                                                {notice.title}
                                            </h4>
                                            <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                                                {notice.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 text-slate-400">
                                        <span className="text-[10px] font-bold whitespace-nowrap">{nDate}</span>
                                        <IconChevronRight size={14} stroke={2.5} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            </div>
            </div>

            {/* ─── Popup Calendar Modal: Select Bazaar Date ─── */}
            {isCalendarModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsCalendarModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-[420px] w-full p-5 sm:p-6 relative z-10 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                    <IconCalendarEvent size={20} stroke={2.5} />
                                </div>
                                <h3 className="text-base font-black text-slate-900">Select Bazaar Date</h3>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsCalendarModalOpen(false)}
                                className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <IconX size={18} stroke={2.5} />
                            </button>
                        </div>

                        {/* Month Navigator */}
                        <div className="flex items-center justify-between my-3 px-2">
                            <button 
                                type="button"
                                onClick={handlePrevModalMonth}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <IconChevronLeft size={18} stroke={2.5} />
                            </button>
                            <span className="text-sm font-black text-slate-800">
                                {monthNames[modalMonth]} {modalYear}
                            </span>
                            <button 
                                type="button"
                                onClick={handleNextModalMonth}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <IconChevronRight size={18} stroke={2.5} />
                            </button>
                        </div>

                        {/* Weekday Row */}
                        <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 mb-1">
                            <span>Sun</span>
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center my-2">
                            {prevMonthDays.map((d, idx) => (
                                <div key={`prev-${idx}`} className="h-9 flex items-center justify-center text-xs font-semibold text-gray-300 select-none">
                                    {d}
                                </div>
                            ))}

                            {currentMonthDays.map((d) => {
                                const st = getDateStatus(d);
                                return (
                                    <button
                                        key={`day-${d}`}
                                        type="button"
                                        disabled={st.isPast || st.isBookedByOther}
                                        onClick={() => !(st.isPast || st.isBookedByOther) && toggleDateSelection(st.key, st.isBookedByOther)}
                                        title={st.isBookedByOther ? `Booked by ${st.bookedByName}` : undefined}
                                        className={`h-9 w-9 mx-auto rounded-full flex flex-col items-center justify-center transition-all text-xs font-bold relative ${
                                            st.isPast
                                                ? "text-gray-300 cursor-not-allowed line-through"
                                                : st.isBookedByOther
                                                ? "bg-rose-50 text-rose-400 border border-rose-200 cursor-not-allowed"
                                                : st.isSelected
                                                ? "bg-[#FF6B00] text-white shadow-md shadow-orange-500/30 scale-105 cursor-pointer"
                                                : st.isCompleted
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 cursor-pointer"
                                                : st.isUpcoming
                                                ? "bg-orange-50 text-orange-800 border border-orange-200/80 cursor-pointer"
                                                : "text-gray-800 hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
                                        }`}
                                    >
                                        <span className="leading-none">{d}</span>
                                        {st.isPast ? null : st.isBookedByOther ? (
                                            <span className="w-1 h-1 rounded-full bg-rose-400 block mt-0.5" />
                                        ) : st.isSelected ? (
                                            <span className="w-1 h-1 rounded-full bg-white block mt-0.5" />
                                        ) : st.isCompleted ? (
                                            <span className="w-1 h-1 rounded-full bg-emerald-500 block mt-0.5" />
                                        ) : st.isUpcoming ? (
                                            <span className="w-1 h-1 rounded-full bg-[#FF6B00] block mt-0.5" />
                                        ) : null}
                                    </button>
                                );
                            })}

                            {nextMonthDays.map((d, idx) => (
                                <div key={`next-${idx}`} className="h-9 flex items-center justify-center text-xs font-semibold text-gray-300 select-none">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-3 pt-3 pb-1 border-t border-gray-100 text-[10px] font-bold text-gray-500 select-none flex-wrap">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
                                <span>Selected</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-orange-400" />
                                <span>Upcoming</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>Done</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-rose-400" />
                                <span>Booked</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2.5 mt-4 pt-2">
                            <button
                                type="button"
                                onClick={() => { setSelectedDates([]); setIsCalendarModalOpen(false); }}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmBazarDates}
                                disabled={selectedDates.length === 0 || isSubmittingBazarDates}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                {isSubmittingBazarDates ? "Submitting..." : "Confirm Date"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Notice Detail Modal ─── */}
            {selectedNotice && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedNotice(null)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-5 sm:p-6 space-y-3 relative z-10 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                    <IconBell size={18} stroke={2.5} />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 line-clamp-1">
                                    {selectedNotice.title}
                                </h3>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setSelectedNotice(null)}
                                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <IconX size={18} stroke={2.5} />
                            </button>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium pt-1">
                            {selectedNotice.description}
                        </p>

                        {selectedNotice.createdAt && (
                            <p className="text-[10px] text-slate-400 font-bold pt-2 border-t border-slate-100">
                                {new Date(selectedNotice.createdAt).toLocaleString("en-US", { 
                                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" 
                                })}
                            </p>
                        )}

                        <div className="flex items-center gap-2.5 pt-2">
                            <button 
                                type="button"
                                onClick={() => handleDismissNotice(selectedNotice.id)}
                                className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/70 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <IconTrash size={15} stroke={2.2} />
                                <span>Dismiss</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setSelectedNotice(null)}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Payment / Deposit Submission Modal ─── */}
            {isPaymentModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => !isSubmittingPayment && setIsPaymentModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-5 sm:p-6 space-y-4 relative z-10 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shrink-0">
                                    <IconCreditCard size={18} stroke={2.2} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                                        Submit Payment
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                                        Deposit request to manager for verification
                                    </p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                disabled={isSubmittingPayment}
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <IconX size={18} stroke={2.5} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                            {/* 1. Payment / Deposit Amount */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Payment / Deposit Amount (৳) <span className="text-orange-500">*</span>
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        min="1"
                                        step="any"
                                        value={paymentAmount} 
                                        onChange={(e) => setPaymentAmount(e.target.value)} 
                                        placeholder="Enter amount (e.g. 2000)" 
                                        className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-3.5 pr-8 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs font-bold" 
                                        required 
                                        autoFocus
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                                        ৳
                                    </span>
                                </div>

                                {/* Quick Amount Chips */}
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    {[500, 1000, 2000, 3000, 5000].map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setPaymentAmount(String(amt))}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-slate-600 transition-colors cursor-pointer"
                                        >
                                            +৳{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Payment Method */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Payment Method <span className="text-orange-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: "Cash" as const, label: "Cash" },
                                        { id: "bKash" as const, label: "bKash" },
                                        { id: "Nagad" as const, label: "Nagad" },
                                        { id: "Bank" as const, label: "Bank Transfer" },
                                    ].map((pm) => (
                                        <button
                                            key={pm.id}
                                            type="button"
                                            onClick={() => setPaymentMethod(pm.id)}
                                            className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                                                paymentMethod === pm.id
                                                    ? "bg-orange-50 border-orange-500 text-orange-600 shadow-2xs ring-1 ring-orange-500/20"
                                                    : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100"
                                            }`}
                                        >
                                            {pm.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Trx ID / Note */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Trx ID / Note <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={paymentNote} 
                                    onChange={(e) => setPaymentNote(e.target.value)} 
                                    placeholder="E.g. TrxID: 9X8Y7Z... or cash reference" 
                                    className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs" 
                                />
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    disabled={isSubmittingPayment}
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingPayment || !paymentAmount}
                                    className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <IconSend size={15} stroke={2.5} />
                                    <span>{isSubmittingPayment ? "Submitting..." : "Submit to Manager"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}