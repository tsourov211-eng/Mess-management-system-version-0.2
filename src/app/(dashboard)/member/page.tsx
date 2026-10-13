"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
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
    IconTrash,
    IconBuildingCommunity,
    IconReceipt2
} from "@tabler/icons-react";

export default function MemberDashboard() {
    const { data: session, status } = useSession(); 

    // ─── Financial & Meal Stats ───
    const [totalDeposit, setTotalDeposit] = useState(0);
    const [userMealDeposit, setUserMealDeposit] = useState(0);
    const [userOverheadDeposit, setUserOverheadDeposit] = useState(0);
    const [mealFund, setMealFund] = useState(0);
    const [messFund, setMessFund] = useState(0);
    const [monthlyOverheadConfig, setMonthlyOverheadConfig] = useState<any | null>(null);
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

    // ─── Bazaar Expense Form & Done Duty State ───
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseDetails, setExpenseDetails] = useState("");
    const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
    const [isDoneBazarModalOpen, setIsDoneBazarModalOpen] = useState(false);
    const [targetDoneScheduleId, setTargetDoneScheduleId] = useState<string | null>(null);
    const amountInputRef = useRef<HTMLInputElement>(null);

    // ─── Payment / Deposit Modal State ───
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentCategory, setPaymentCategory] = useState<string>("Meal Fund");
    const [selectedOverheads, setSelectedOverheads] = useState<string[]>(["Seat Rent"]);
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

    // ─── Fetch Member Dashboard Data & Bazaar Schedules with SWR ───
    const { 
        data: dashboardData, 
        isLoading: isSwrLoadingDashboard,
        mutate: mutateDashboard 
    } = useSWR(
        status === "authenticated" ? "/api/members/dashboard-data" : null
    );

    const { 
        data: bazaarData, 
        isLoading: isSwrLoadingBazar, 
        mutate: mutateBazar 
    } = useSWR(
        status === "authenticated" ? `/api/members/bazaar-schedule?month=${activeMonth + 1}&year=${activeYear}` : null
    );

    useEffect(() => {
        if (dashboardData?.stats) {
            setTotalDeposit(dashboardData.stats.totalDeposit || 0);
            setUserMealDeposit(dashboardData.stats.userMealDeposit || 0);
            setUserOverheadDeposit(dashboardData.stats.userOverheadDeposit || 0);
            setMealFund(dashboardData.stats.mealFund ?? 0);
            setMessFund(dashboardData.stats.messFund ?? 0);
            setMonthlyOverheadConfig(dashboardData.monthlyOverheadConfig || null);
            setTotalMeals(dashboardData.stats.totalMeals || 0);
            setCurrentBalance(dashboardData.stats.currentBalance ?? 0);
            setFixedCost(dashboardData.stats.fixedCost || 0);
            setTotalCost(dashboardData.stats.totalCost || 0);
            setLiveMealRate(dashboardData.stats.liveMealRate || 0);
            setRecentMeals(dashboardData.recentMeals || []);
            setNotices(dashboardData.notices || []);
            setIsLoadingData(false);
        } else if (!isSwrLoadingDashboard) {
            setIsLoadingData(false);
        }
    }, [dashboardData, isSwrLoadingDashboard]);

    useEffect(() => {
        if (bazaarData) {
            setBazarSchedules(bazaarData.mySchedules || []);
            setMessSchedules(bazaarData.allSchedules || []);
            setIsLoadingBazar(false);
        } else {
            setIsLoadingBazar(isSwrLoadingBazar);
        }
    }, [bazaarData, isSwrLoadingBazar]);

    const fetchDashboardData = () => mutateDashboard();
    const fetchBazarSchedules = (_m?: number, _y?: number) => mutateBazar();

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
        const todayZero = new Date();
        todayZero.setHours(0, 0, 0, 0);
        const cellDate = new Date(modalYear, modalMonth, day);
        cellDate.setHours(0, 0, 0, 0);

        const isToday = cellDate.getTime() === todayZero.getTime();
        const isPast = cellDate.getTime() < todayZero.getTime();
        const isCompleted = sched?.status === "done";
        const isUpcoming = sched ? (!isCompleted && !isPast) : false;

        return {
            key,
            isSelected,
            isToday,
            isPast,
            isBookedByOther,
            bookedByName,
            isCompleted,
            isUpcoming,
            isScheduled: !!sched,
            status: sched?.status,
        };
    };

    // ─── Today's Date & Duty Calculation (Asia/Dhaka & local) ───
    const todayParts = (() => {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth(),
            day: now.getDate()
        };
    })();

    const todayDutySchedule = bazarSchedules.find((s: any) => {
        const d = new Date(s.date);
        return (
            d.getUTCFullYear() === todayParts.year &&
            d.getUTCMonth() === todayParts.month &&
            d.getUTCDate() === todayParts.day
        );
    });

    const [isUpdatingBazarStatus, setIsUpdatingBazarStatus] = useState(false);

    // ─── Toggle Done Bazaar Handler ───
    const handleToggleDoneBazaar = async (
        scheduleId: string, 
        newStatus: "done" | "approved", 
        amountVal?: number | string, 
        noteVal?: string
    ) => {
        setIsUpdatingBazarStatus(true);
        try {
            const payload: any = { scheduleId, status: newStatus };
            if (newStatus === "done" && amountVal && Number(amountVal) > 0) {
                payload.amount = Number(amountVal);
                if (noteVal) payload.note = noteVal;
            }

            const res = await fetch("/api/members/bazaar-schedule", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setBazarSchedules((prev) =>
                    prev.map((s) => (s.id === scheduleId ? { ...s, status: newStatus } : s))
                );
                setMessSchedules((prev) =>
                    prev.map((s) => (s.id === scheduleId ? { ...s, status: newStatus } : s))
                );
                showToast(
                    newStatus === "done" 
                        ? "🎉 Bazaar marked as done and expense updated!" 
                        : "Bazaar status updated to approved.", 
                    "success"
                );
                setExpenseAmount("");
                setExpenseDetails("");
                setIsDoneBazarModalOpen(false);
                setTargetDoneScheduleId(null);
                fetchBazarSchedules(activeMonth, activeYear);
                fetchDashboardData();
            } else {
                const errData = await res.json();
                showToast(errData.error || "Failed to update bazaar status", "error");
                if (newStatus === "done" && (!amountVal || Number(amountVal) <= 0)) {
                    setTargetDoneScheduleId(scheduleId);
                    setIsDoneBazarModalOpen(true);
                }
            }
        } catch (err) {
            showToast("Error updating bazaar status", "error");
        } finally {
            setIsUpdatingBazarStatus(false);
        }
    };

    // ─── Triggered when clicking "Done Bazar" on cards or banners ───
    const handleDoneBazaarClick = (scheduleId: string, currentStatus: string) => {
        if (currentStatus === "done") {
            handleToggleDoneBazaar(scheduleId, "approved");
            return;
        }

        const enteredAmount = parseFloat(expenseAmount);
        if (enteredAmount && enteredAmount > 0) {
            handleToggleDoneBazaar(scheduleId, "done", enteredAmount, expenseDetails);
        } else {
            // Member must provide the input in Update Bazar Expense!
            setTargetDoneScheduleId(scheduleId);
            setIsDoneBazarModalOpen(true);
            amountInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => {
                amountInputRef.current?.focus();
            }, 200);
            showToast("Please enter today's bazaar expense amount in Update Bazar Expense.", "info");
        }
    };

    // ─── Submit Bazaar Expense ───
    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(expenseAmount);
        if (!parsedAmount || parsedAmount <= 0) {
            showToast("Please enter the bazaar amount.", "error");
            return;
        }

        setIsSubmittingExpense(true);
        try {
            // Auto-complete today's bazaar duty if scheduled and not marked done yet
            if (todayDutySchedule && todayDutySchedule.status !== "done") {
                await handleToggleDoneBazaar(todayDutySchedule.id, "done", parsedAmount, expenseDetails);
            } else {
                const res = await fetch("/api/members/finance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "expense", amount: expenseAmount, note: expenseDetails }),
                });

                if (res.ok) {
                    showToast("Bazaar expense submitted successfully to manager!", "success");
                    setExpenseAmount("");
                    setExpenseDetails("");
                    fetchBazarSchedules(activeMonth, activeYear);
                    fetchDashboardData();
                } else {
                    showToast("Failed to submit expense.", "error");
                }
            }
        } catch (error) {
            showToast("An error occurred while submitting.", "error");
        } finally {
            setIsSubmittingExpense(false);
        }
    };

    const overheadOptions = [
        { id: "Seat Rent", label: "Seat Rent", icon: "🛏️", rate: monthlyOverheadConfig?.seatRent || 0 },
        { id: "Electricity + Gas", label: "Electricity + Gas", icon: "⚡", rate: monthlyOverheadConfig?.electricityGas || 0 },
        { id: "Internet", label: "Internet / WiFi", icon: "📶", rate: monthlyOverheadConfig?.internet || 0 },
        { id: "Maid Charge", label: "Maid Charge", icon: "🧹", rate: monthlyOverheadConfig?.maid || 0 },
        { id: "Additional", label: "Additional", icon: "📦", rate: monthlyOverheadConfig?.additional || 0 },
    ];

    const calculateOverheadsTotal = (selectedIds: string[]) => {
        return selectedIds.reduce((sum, id) => {
            const item = overheadOptions.find((o) => o.id === id);
            return sum + (item?.rate || 0);
        }, 0);
    };

    const handleToggleOverhead = (ohId: string) => {
        const updated = selectedOverheads.includes(ohId)
            ? selectedOverheads.filter((id) => id !== ohId)
            : [...selectedOverheads, ohId];
        
        setSelectedOverheads(updated);
        const total = calculateOverheadsTotal(updated);
        setPaymentAmount(total > 0 ? String(total) : "");
    };

    const handleSelectAllOverheads = () => {
        const allIds = overheadOptions.map((o) => o.id);
        setSelectedOverheads(allIds);
        const total = calculateOverheadsTotal(allIds);
        setPaymentAmount(total > 0 ? String(total) : "");
    };

    const handleClearAllOverheads = () => {
        setSelectedOverheads([]);
        setPaymentAmount("");
    };

    const handleSwitchToOverhead = () => {
        setPaymentCategory("Overhead");
        const active = selectedOverheads.length > 0 ? selectedOverheads : ["Seat Rent"];
        setSelectedOverheads(active);
        const total = calculateOverheadsTotal(active);
        if (total > 0) {
            setPaymentAmount(String(total));
        }
    };

    const handleSwitchToMealFund = () => {
        setPaymentCategory("Meal Fund");
    };

    // ─── Submit Payment / Deposit ───
    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amountVal = parseFloat(paymentAmount);
        if (!amountVal || isNaN(amountVal) || amountVal <= 0) {
            showToast("Please enter a valid payment amount.", "error");
            return;
        }

        if (paymentCategory !== "Meal Fund" && selectedOverheads.length === 0) {
            showToast("Please select at least one overhead expense.", "error");
            return;
        }

        const categoryToSubmit = paymentCategory === "Meal Fund" 
            ? "Meal Fund" 
            : selectedOverheads.join(", ");

        setIsSubmittingPayment(true);
        try {
            const res = await fetch("/api/members/finance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "payment",
                    amount: amountVal,
                    category: categoryToSubmit,
                    method: paymentMethod,
                    note: paymentNote.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`Payment request for ${categoryToSubmit} submitted for manager approval!`, "success");
                setPaymentAmount("");
                setPaymentNote("");
                setPaymentCategory("Meal Fund");
                setSelectedOverheads(["Seat Rent"]);
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
                <div 
                    onClick={() => {
                        setPaymentCategory("Meal Fund");
                        setIsPaymentModalOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            setPaymentCategory("Meal Fund");
                            setIsPaymentModalOpen(true);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    className="col-span-1 bg-gradient-to-br from-[#1e3a8a] via-[#172554] to-[#0a1128] border border-blue-700/40 text-white rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all relative overflow-hidden flex flex-col justify-between min-h-[148px] md:min-h-[170px] cursor-pointer group"
                >
                    {/* Decorative Geometric Deposit Sparkline */}
                    <svg 
                        className="absolute right-3 bottom-2 w-32 md:w-36 h-20 pointer-events-none text-blue-400/20 transition-opacity" 
                        viewBox="0 0 100 50" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M5 42 L30 36 L55 38 L75 20 L95 12" />
                        <circle cx="95" cy="12" r="3" fill="currentColor" />
                    </svg>

                    {/* Top Row: Icon badge + Action Badge */}
                    <div className="flex items-center justify-between relative z-10">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 shadow-inner text-blue-300 group-hover:scale-105 transition-transform">
                            <IconCreditCard size={22} stroke={2.2} />
                        </div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 group-hover:bg-white/20 text-blue-200 border border-white/15 backdrop-blur-md transition-all shadow-2xs">
                            <span className="hidden sm:inline">Deposit</span>
                            <IconChevronRight size={13} stroke={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>

                    {/* Bottom: Total Deposit Amount + Fund Pills */}
                    <div className="mt-3 relative z-10">
                        <p className="text-[11px] sm:text-xs font-bold text-blue-200/80 tracking-wide uppercase leading-tight">Total Deposit</p>
                        <h2 className="text-2xl sm:text-3xl md:text-3xl font-black text-white tracking-tight mt-0.5 truncate">
                            Tk {isLoadingData ? "..." : totalDeposit.toLocaleString()}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-lg bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-xs whitespace-nowrap shadow-2xs">
                                Meal ৳{userMealDeposit.toLocaleString()}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-lg bg-indigo-300/20 text-indigo-200 border border-indigo-300/30 backdrop-blur-xs whitespace-nowrap shadow-2xs">
                                Overhead ৳{userOverheadDeposit.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. My Total Meals Card */}
                <Link 
                    href="/member/my-meals"
                    className="col-span-1 bg-gradient-to-br from-[#ea580c] via-[#c2410c] to-[#7c2d12] border border-orange-600/40 text-white rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all relative overflow-hidden flex flex-col justify-between min-h-[148px] md:min-h-[170px] group"
                >
                    {/* Decorative Dining Accent Wave */}
                    <svg 
                        className="absolute right-3 bottom-2 w-32 md:w-36 h-20 pointer-events-none text-orange-300/20 transition-opacity" 
                        viewBox="0 0 100 50" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M10 40 Q 40 18, 65 28 T 95 14" />
                        <circle cx="78" cy="18" r="8" strokeDasharray="3 3" />
                    </svg>

                    {/* Top Row: Kitchen Icon + Details Badge */}
                    <div className="flex items-center justify-between relative z-10">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 shadow-inner text-orange-200 group-hover:scale-105 transition-transform">
                            <IconToolsKitchen2 size={22} stroke={2.2} />
                        </div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 group-hover:bg-white/20 text-orange-100 border border-white/15 backdrop-blur-md transition-all shadow-2xs">
                            <span className="hidden sm:inline">Details</span>
                            <IconChevronRight size={13} stroke={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>

                    {/* Bottom: Meal Count + Pill */}
                    <div className="mt-3 relative z-10">
                        <p className="text-[11px] sm:text-xs font-bold text-orange-200/80 tracking-wide uppercase leading-tight">My Total Meals</p>
                        <h2 className="text-2xl sm:text-3xl md:text-3xl font-black text-white tracking-tight mt-0.5 truncate">
                            {isLoadingData ? "..." : totalMeals}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-lg bg-white/15 text-orange-100 border border-white/20 backdrop-blur-xs whitespace-nowrap shadow-2xs flex items-center gap-1">
                                <span>🍽️ Logged Meals</span>
                            </span>
                        </div>
                    </div>
                </Link>

            </div>

            {/* ──────────────────────────────────────────────────────────
                D2. MESS FUNDS STATUS (Separately Visible Meal Fund & Mess Fund)
            ────────────────────────────────────────────────────────── */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
                            <IconWallet size={20} stroke={2.2} />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-black text-slate-900">
                                Mess Funds Overview
                            </h2>
                            <p className="text-[11px] sm:text-xs font-medium text-slate-500">
                                Real-time separated balances for Meal Fund & Overhead Mess Fund
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setPaymentCategory("Meal Fund");
                            setIsPaymentModalOpen(true);
                        }}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                        <IconCreditCard size={15} stroke={2.5} />
                        <span className="hidden sm:inline">Submit Payment</span>
                        <span className="sm:hidden">Pay</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* 1. Meal Fund Card */}
                    <div className="bg-gradient-to-br from-emerald-50/90 via-[#f0fdf4] to-teal-50/80 border border-emerald-200/70 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
                        <div className="flex items-start justify-between gap-3 relative z-10">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Meal Fund (Bazaar)
                                </span>
                                <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1.5 leading-none">
                                    ৳ {isLoadingData ? "..." : mealFund.toLocaleString()}
                                </h3>
                                <p className="text-[11px] font-semibold text-emerald-700/90 mt-1">
                                    Food deposits collected minus bazaar food cost
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-sm border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                                <IconToolsKitchen2 size={22} stroke={2.2} />
                            </div>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs relative z-10">
                            <span className="text-[11px] font-bold text-emerald-800">Your Meal Deposit:</span>
                            <span className="font-black text-emerald-900 bg-white/70 px-2 py-0.5 rounded-md border border-emerald-200/60 text-xs">
                                ৳ {isLoadingData ? "..." : userMealDeposit.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* 2. Mess Fund Card */}
                    <div className="bg-gradient-to-br from-purple-50/90 via-[#faf5ff] to-indigo-50/80 border border-purple-200/70 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
                        <div className="flex items-start justify-between gap-3 relative z-10">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-purple-100 text-purple-800 border border-purple-200/80">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    Mess Fund (Overhead)
                                </span>
                                <h3 className="text-2xl sm:text-3xl font-black text-purple-950 mt-1.5 leading-none">
                                    ৳ {isLoadingData ? "..." : messFund.toLocaleString()}
                                </h3>
                                <p className="text-[11px] font-semibold text-purple-700/90 mt-1">
                                    Seat rent, utility bills, WiFi, and maid fund
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                                <IconBuildingCommunity size={22} stroke={2.2} />
                            </div>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-purple-200/60 flex items-center justify-between text-xs relative z-10">
                            <span className="text-[11px] font-bold text-purple-800">Your Overhead Deposit:</span>
                            <span className="font-black text-purple-900 bg-white/70 px-2 py-0.5 rounded-md border border-purple-200/60 text-xs">
                                ৳ {isLoadingData ? "..." : userOverheadDeposit.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
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
                                        
                                        const now = new Date();
                                        const schedYear = d.getUTCFullYear();
                                        const schedMonth = d.getUTCMonth();
                                        const schedDay = d.getUTCDate();

                                        const isToday = schedYear === now.getFullYear() && 
                                                        schedMonth === now.getMonth() && 
                                                        schedDay === now.getDate();
                                        
                                        const schedVal = Date.UTC(schedYear, schedMonth, schedDay);
                                        const todayVal = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
                                        const isPast = schedVal < todayVal;
                                        const isFuture = schedVal > todayVal;

                                        const isDone = s.status === "done";
                                        const isApproved = s.status === "approved";
                                        const isPending = s.status === "pending";

                                        return (
                                            <div 
                                                key={s.id} 
                                                className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-xl border min-w-[70px] shrink-0 transition-all ${
                                                    isDone 
                                                        ? "border-emerald-300 bg-emerald-50/90 text-emerald-900 shadow-2xs" 
                                                        : isToday
                                                        ? "border-orange-400 bg-gradient-to-b from-orange-50 to-amber-50 text-orange-950 shadow-md ring-2 ring-orange-400/40"
                                                        : isPending
                                                        ? "border-amber-200 bg-amber-50 text-amber-900"
                                                        : isPast
                                                        ? "border-slate-200 bg-slate-50 text-slate-700 opacity-80"
                                                        : "border-orange-200 bg-orange-50/80 text-orange-900"
                                                }`}
                                            >
                                                <span className="text-[9px] font-bold text-slate-500 uppercase">{monthStr}</span>
                                                <span className="text-lg font-black text-slate-900 leading-none my-1">{dayStr}</span>
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide ${
                                                    isDone 
                                                        ? "text-emerald-700 bg-emerald-100 border border-emerald-200" 
                                                        : isToday 
                                                        ? "text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-2xs animate-pulse font-extrabold" 
                                                        : isPending 
                                                        ? "text-amber-700 bg-amber-100" 
                                                        : isPast
                                                        ? "text-slate-600 bg-slate-200"
                                                        : "text-orange-700 bg-orange-100"
                                                }`}>
                                                    {isDone ? "Done" : isToday ? "Today" : isPending ? "Pending" : isPast ? "Past" : "Upcoming"}
                                                </span>

                                                {/* Done Bazar Option Button on Card */}
                                                {isToday && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDoneBazaarClick(s.id, s.status);
                                                        }}
                                                        disabled={isUpdatingBazarStatus}
                                                        className={`mt-1.5 w-full py-0.5 px-1 rounded-md text-[8px] font-black transition-all cursor-pointer flex items-center justify-center gap-0.5 shadow-2xs ${
                                                            isDone
                                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                : "bg-orange-500 hover:bg-orange-600 text-white animate-pulse"
                                                        }`}
                                                        title={isDone ? "Click to revert if needed" : "Click to mark bazaar as completed"}
                                                    >
                                                        {isDone ? "✓ Done" : "Done Bazar"}
                                                    </button>
                                                )}
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

                                {todayDutySchedule && (
                                    <div className={`mb-2.5 px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2 text-[11px] ${
                                        todayDutySchedule.status === "done"
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                            : "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-950 shadow-2xs"
                                    }`}>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-sm">{todayDutySchedule.status === "done" ? "✅" : "🛒"}</span>
                                            <div className="min-w-0">
                                                <span className="font-extrabold truncate block">
                                                    {todayDutySchedule.status === "done" ? "Bazaar Done Today" : "Today is your Bazaar Day"}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDoneBazaarClick(todayDutySchedule.id, todayDutySchedule.status)}
                                            disabled={isUpdatingBazarStatus}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all shrink-0 ${
                                                todayDutySchedule.status === "done"
                                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                    : "bg-orange-500 text-white hover:bg-orange-600 shadow-xs animate-pulse"
                                            }`}
                                        >
                                            {todayDutySchedule.status === "done" ? "✓ Done" : "Done Bazar"}
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Bazar Amount (Tk)</label>
                                        <div className="relative">
                                            <input 
                                                ref={amountInputRef}
                                                id="bazar-expense-amount-input"
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
                                <span>{isSubmittingExpense ? "Submitting..." : (todayDutySchedule && todayDutySchedule.status !== "done" ? "Submit Expense & Mark Done" : "Submit to Manager")}</span>
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
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-nowrap min-w-0">
                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl sm:rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-sm shadow-orange-500/20 shrink-0">
                            <IconBell size={18} stroke={2.2} className="sm:w-5 sm:h-5" />
                        </div>
                        <h2 className="text-sm sm:text-base font-black text-slate-900 whitespace-nowrap shrink-0">Notice</h2>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-nowrap">
                        {notices.length > 0 && (
                            <span className="bg-[#FF6B00] text-white text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 leading-tight">
                                {notices.length} New
                            </span>
                        )}
                        {notices.length > 0 && (
                            <button 
                                type="button"
                                onClick={handleClearAllNotices}
                                className="text-[11px] sm:text-xs font-semibold text-gray-500 hover:text-rose-600 px-2 sm:px-2.5 py-1 rounded-full hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap shrink-0 leading-tight"
                            >
                                Clear All
                            </button>
                        )}
                        <button 
                            type="button"
                            onClick={() => setSelectedNotice(notices[0] || null)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap shrink-0 leading-tight"
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
                            const isPayment = notice.type === "payment";
                            const isBazaar = notice.type === "bazaar";
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
                                        ) : isPayment ? (
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                                <IconCreditCard size={18} stroke={2.2} />
                                            </div>
                                        ) : isBazaar ? (
                                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                                                <IconShoppingCart size={18} stroke={2.2} />
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
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => !isSubmittingPayment && setIsPaymentModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full p-5 sm:p-6 space-y-4 relative z-10 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shrink-0">
                                    <IconCreditCard size={20} stroke={2.2} />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                                        Submit Payment / Deposit
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                                        Select Meal Fund or individual Overhead Expense
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
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            
                            {/* 1. Category Selector: Meal Fund vs Overhead Expense */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                    Payment Category <span className="text-orange-500">*</span>
                                </label>
                                
                                {/* Top 2 Tabs */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSwitchToMealFund}
                                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                            paymentCategory === "Meal Fund"
                                                ? "bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500/20"
                                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl">🍲</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                paymentCategory === "Meal Fund" 
                                                    ? "bg-emerald-600 text-white" 
                                                    : "bg-slate-200 text-slate-600"
                                            }`}>
                                                Meal Fund
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-xs font-black">Daily Bazaar / Food</p>
                                            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                                Adds to Meal Fund
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSwitchToOverhead}
                                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                            paymentCategory !== "Meal Fund"
                                                ? "bg-purple-50/90 border-purple-500 text-purple-950 shadow-xs ring-1 ring-purple-500/20"
                                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl">🏢</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                paymentCategory !== "Meal Fund" 
                                                    ? "bg-purple-600 text-white" 
                                                    : "bg-slate-200 text-slate-600"
                                            }`}>
                                                Mess Fund
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-xs font-black">Overhead Expenses</p>
                                            <p className="text-[10px] text-purple-700 font-semibold mt-0.5">
                                                Adds to Mess Fund
                                            </p>
                                        </div>
                                    </button>
                                </div>

                                {/* Individual Overhead Options (Multiple Selection) */}
                                {paymentCategory !== "Meal Fund" && (
                                    <div className="mt-2.5 p-3 sm:p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100/90 space-y-2.5">
                                        {/* Header with Multi-Select notice and action buttons */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-black text-purple-900 uppercase tracking-wide">
                                                    Select Overhead Expenses:
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900">
                                                    {selectedOverheads.length} selected
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px]">
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllOverheads}
                                                    className="font-bold text-purple-700 hover:text-purple-950 hover:underline px-1 cursor-pointer transition-colors"
                                                >
                                                    Select All
                                                </button>
                                                <span className="text-purple-300">•</span>
                                                <button
                                                    type="button"
                                                    onClick={handleClearAllOverheads}
                                                    className="font-bold text-purple-700 hover:text-purple-950 hover:underline px-1 cursor-pointer transition-colors"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>

                                        {/* Multi-Select Cards Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {overheadOptions.map((oh) => {
                                                const isSelected = selectedOverheads.includes(oh.id);
                                                return (
                                                    <button
                                                        key={oh.id}
                                                        type="button"
                                                        onClick={() => handleToggleOverhead(oh.id)}
                                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative select-none ${
                                                            isSelected
                                                                ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-1 ring-purple-500/30"
                                                                : "bg-white text-slate-800 border-purple-100 hover:border-purple-300 hover:bg-purple-50/40"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-1">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="text-sm shrink-0">{oh.icon}</span>
                                                                <span className="text-[11px] font-black truncate">{oh.label}</span>
                                                            </div>
                                                            {/* Checkbox indicator */}
                                                            <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black transition-colors ${
                                                                isSelected 
                                                                    ? "bg-white text-purple-700 shadow-2xs" 
                                                                    : "border border-slate-300 bg-slate-50 text-transparent"
                                                            }`}>
                                                                ✓
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 flex items-center justify-between">
                                                            <span className={`text-[10px] font-bold ${
                                                                isSelected ? "text-purple-100" : "text-purple-600"
                                                            }`}>
                                                                Rate: ৳{(oh.rate || 0).toLocaleString()}
                                                            </span>
                                                            <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded ${
                                                                isSelected ? "bg-purple-500 text-white" : "bg-purple-50 text-purple-700"
                                                            }`}>
                                                                {isSelected ? "Selected" : "+ Add"}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Auto-Calculated Sum Status Bar */}
                                        {(() => {
                                            const totalCalculated = calculateOverheadsTotal(selectedOverheads);
                                            return (
                                                <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                                                    <div className="flex items-center gap-1.5 text-purple-900 font-bold text-[11px]">
                                                        <span>Auto-calculated rate:</span>
                                                        <span className="text-xs sm:text-sm font-black text-purple-950 bg-white px-2 py-0.5 rounded-lg border border-purple-200">
                                                            ৳{totalCalculated.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {totalCalculated > 0 && paymentAmount !== String(totalCalculated) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPaymentAmount(String(totalCalculated))}
                                                            className="text-[10px] font-black text-purple-700 bg-white border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                                        >
                                                            <span>⚡ Auto-fill ৳{totalCalculated.toLocaleString()}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Live Target Fund Callout Banner */}
                            <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
                                paymentCategory === "Meal Fund"
                                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                                    : "bg-purple-50/70 border-purple-200 text-purple-900"
                            }`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-base ${
                                    paymentCategory === "Meal Fund" ? "bg-emerald-200 text-emerald-800" : "bg-purple-200 text-purple-800"
                                }`}>
                                    {paymentCategory === "Meal Fund" ? "🍲" : "🏢"}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-extrabold text-[11px] leading-tight flex items-center gap-1.5">
                                        <span>Target: {paymentCategory === "Meal Fund" ? "Mess Meal Fund" : "Mess Fund (Overhead)"}</span>
                                        {paymentCategory !== "Meal Fund" && selectedOverheads.length > 0 && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-200/80 text-purple-900">
                                                {selectedOverheads.length} item{selectedOverheads.length > 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-[10px] opacity-85 leading-tight mt-0.5">
                                        {paymentCategory === "Meal Fund" 
                                            ? "Funds everyday bazaar items and groceries for all meals."
                                            : selectedOverheads.length > 0 
                                            ? `Paying for: ${selectedOverheads.join(", ")}. It will be added to the Mess Fund.`
                                            : "No overhead selected. Please select one or more overhead expenses above."
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* 2. Payment / Deposit Amount */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Payment Amount (৳) <span className="text-orange-500">*</span>
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        min="1"
                                        step="any"
                                        value={paymentAmount} 
                                        onChange={(e) => setPaymentAmount(e.target.value)} 
                                        placeholder="Enter amount (e.g. 1500)" 
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
                                    {[500, 1000, 1500, 2000, 2500, 3000, 5000].map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setPaymentAmount(String(amt))}
                                            className="text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-slate-600 transition-colors cursor-pointer"
                                        >
                                            +৳{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Payment Method */}
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
                                            className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
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

                            {/* 4. Trx ID / Note */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Trx ID / Note <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={paymentNote} 
                                    onChange={(e) => setPaymentNote(e.target.value)} 
                                    placeholder="E.g. TrxID: 9X8Y7Z... or partial note" 
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
                                    disabled={isSubmittingPayment || !paymentAmount || (paymentCategory !== "Meal Fund" && selectedOverheads.length === 0)}
                                    className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <IconSend size={15} stroke={2.5} />
                                    <span className="truncate">
                                        {isSubmittingPayment 
                                            ? "Submitting..." 
                                            : `Pay ৳${paymentAmount ? Number(paymentAmount).toLocaleString() : "0"} (${
                                                paymentCategory === "Meal Fund" 
                                                    ? "Meal Fund" 
                                                    : selectedOverheads.length > 0 
                                                    ? `${selectedOverheads.length} Overhead${selectedOverheads.length > 1 ? "s" : ""}` 
                                                    : "No selection"
                                            })`
                                        }
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Enter Bazaar Expense Modal (Triggered when Done Bazar is pressed) ─── */}
            {isDoneBazarModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsDoneBazarModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-5 sm:p-6 space-y-4 relative z-10 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                                    <IconShoppingCart size={20} stroke={2.2} />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                                        Update Bazar Expense
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Enter amount to mark today's bazaar as done
                                    </p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsDoneBazarModalOpen(false)}
                                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <IconX size={18} stroke={2.5} />
                            </button>
                        </div>

                        {/* Banner Note */}
                        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 flex items-start gap-2.5 text-amber-900">
                            <span className="text-base leading-none mt-0.5">💡</span>
                            <p className="text-[11px] font-semibold leading-relaxed">
                                To complete today's bazaar duty, please input your total bazaar expense. It will be recorded and submitted for manager approval.
                            </p>
                        </div>

                        {/* Expense Input Form */}
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const amt = parseFloat(expenseAmount);
                            if (!amt || amt <= 0) {
                                showToast("Please enter a valid amount.", "error");
                                return;
                            }
                            const targetId = targetDoneScheduleId || todayDutySchedule?.id;
                            if (!targetId) {
                                showToast("No bazaar schedule selected.", "error");
                                return;
                            }
                            handleToggleDoneBazaar(targetId, "done", amt, expenseDetails);
                        }} className="space-y-3.5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Bazar Amount (৳) <span className="text-orange-500">*</span>
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        min="1"
                                        step="any"
                                        value={expenseAmount} 
                                        onChange={(e) => setExpenseAmount(e.target.value)} 
                                        placeholder="Enter total amount (e.g. 1250)" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-8 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold shadow-2xs" 
                                        required 
                                        autoFocus
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                                        ৳
                                    </span>
                                </div>

                                {/* Quick Amount Chips */}
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    {[500, 800, 1000, 1200, 1500, 2000].map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setExpenseAmount(String(amt))}
                                            className="text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-slate-600 transition-colors cursor-pointer"
                                        >
                                            +৳{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Expense Details / Note <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={expenseDetails} 
                                    onChange={(e) => setExpenseDetails(e.target.value)} 
                                    placeholder="E.g. Chicken, vegetables, spices, oil etc." 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs" 
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    disabled={isUpdatingBazarStatus}
                                    onClick={() => setIsDoneBazarModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdatingBazarStatus || !expenseAmount || parseFloat(expenseAmount) <= 0}
                                    className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <IconCheck size={16} stroke={3} />
                                    <span>
                                        {isUpdatingBazarStatus 
                                            ? "Saving..." 
                                            : `Confirm ৳${expenseAmount ? Number(expenseAmount).toLocaleString() : "0"} & Mark Done`
                                        }
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}