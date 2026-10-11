"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
    IconReceipt2, 
    IconWallet, 
    IconShoppingBag, 
    IconCalendarEvent, 
    IconCalendarUser, 
    IconCheck, 
    IconChevronRight,
    IconX,
    IconToolsKitchen2,
    IconUsers
} from "@tabler/icons-react";

export default function BazaarManagementPage() {
    const { data: session } = useSession();
    const currentUserEmail = session?.user?.email;

    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [todayAssigned, setTodayAssigned] = useState<any>(null);
    const [todayScheduleStatus, setTodayScheduleStatus] = useState<string | null>(null);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [todayTotal, setTodayTotal] = useState(0);
    const [cookingHeadcount, setCookingHeadcount] = useState<any>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fullMonthSchedules, setFullMonthSchedules] = useState<any[]>([]);
    const [isLoadingMonth, setIsLoadingMonth] = useState(false);

    const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [monthlySummary, setMonthlySummary] = useState<any[]>([]);
    const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

    const [stats, setStats] = useState({
        totalExpense: 0,
        availableBalance: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const today = new Date();
    const formattedToday = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const currentMonthYear = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    useEffect(() => {
        fetchBazaarData();
        fetchGlobalStats();
    }, []);

    const fetchBazaarData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/bazaar");
            if (res.ok) {
                const data = await res.json();
                setTodayAssigned(data.todayAssigned);
                setTodayScheduleStatus(data.todayScheduleStatus);
                setSchedules(data.schedules || []);
                setExpenses(data.todayExpenses || []);
                setTodayTotal(data.todayTotal || 0);
                setCookingHeadcount(data.cookingHeadcount || null);
            }
        } catch (error) {
            console.error("Error fetching bazaar data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMonthlySummary = async (month: number, year: number) => {
        setIsLoadingMonthly(true);
        try {
            const res = await fetch(`/api/bazaar/monthly-summary?month=${month}&year=${year}`);
            if (res.ok) {
                const data = await res.json();
                setMonthlySummary(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching monthly summary:", error);
        } finally {
            setIsLoadingMonthly(false);
        }
    };

    useEffect(() => {
        if (isMonthlyModalOpen) {
            fetchMonthlySummary(selectedMonth, selectedYear);
        }
    }, [isMonthlyModalOpen, selectedMonth, selectedYear]);

    const fetchFullMonthSchedules = async () => {
        setIsLoadingMonth(true);
        try {
            const res = await fetch("/api/bazaar/month");
            if (res.ok) {
                const data = await res.json();
                setFullMonthSchedules(data.schedules || []);
            }
        } catch (error) {
            console.error("Error fetching full month schedule:", error);
        } finally {
            setIsLoadingMonth(false);
        }
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
        fetchFullMonthSchedules();
    };

    const fetchGlobalStats = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                if (data.stats) {
                    setStats({
                        totalExpense: data.stats.totalFoodCost,
                        availableBalance: data.stats.messFund,
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching global stats:", error);
        }
    };

    const handleSubmitExpense = async () => {
        if (!amount || Number(amount) <= 0) {
            alert("Please enter a valid amount!");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/bazaar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: Number(amount),
                    description: description || "Daily Bazaar",
                }),
            });

            if (res.ok) {
                alert("✅ Bazaar expense added successfully!");
                setAmount("");
                setDescription("");
                fetchBazaarData();
                fetchGlobalStats();
            } else {
                alert("❌ Failed to add expense!");
            }
        } catch (error) {
            console.error("Bazaar submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveSchedule = async (scheduleId: string) => {
        try {
            const res = await fetch("/api/members/bazaar-schedule", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scheduleId, status: "approved" }),
            });
            if (res.ok) {
                alert("✅ Bazaar schedule approved successfully!");
                fetchBazaarData();
            } else {
                alert("❌ Failed to approve!");
            }
        } catch (error) {
            console.error("Schedule approve error:", error);
            alert("❌ Error occurred!");
        }
    };

    const assignedName = todayAssigned?.name || "None Assigned";
    const assignedInitial = assignedName ? assignedName.charAt(0).toUpperCase() : "T";

    // Check if the current user is assigned for today AND the schedule is approved
    const isTodayShopper = 
        currentUserEmail && 
        todayAssigned?.email === currentUserEmail && 
        todayScheduleStatus === "approved";

    return (
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            
            {/* ─── Header Section ─── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#450705] tracking-tight">Bazaar & Expenses</h1>
                    <p className="text-gray-500 text-sm mt-1.5 font-medium">Manage bazaar schedule and track daily market expenses.</p>
                </div>
            </div>

            {/* ─── Shopper & Cooking Headcount Module ("Accurate Market Count") ─── */}
            <div className="bg-white rounded-3xl border border-orange-200/80 shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white border-b border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                            <IconToolsKitchen2 size={22} stroke={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-extrabold text-gray-900">Cooking & Market Headcount</h2>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                                    Accurate Market Count
                                </span>
                            </div>
                            <p className="text-xs font-bold text-gray-500 mt-0.5">
                                Live headcount for cooking and grocery purchases ({formattedToday})
                            </p>
                        </div>
                    </div>
                    
                    {/* Prominent Callout Banner */}
                    <div className="bg-orange-500 text-white px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-100">Today's Lunch:</span>
                        <span className="text-sm font-extrabold">
                            {cookingHeadcount?.lunch?.members ?? 0} Members + {cookingHeadcount?.lunch?.guests ?? 0} Guest Meals = {cookingHeadcount?.lunch?.total ?? 0} Total Heads
                        </span>
                    </div>
                </div>

                {/* Breakdown Grid */}
                <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Breakfast */}
                    <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 hover:border-orange-200 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Breakfast</span>
                            <span className="text-xs font-bold text-gray-400">Slot 1</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-gray-900">{cookingHeadcount?.breakfast?.total ?? 0}</span>
                            <span className="text-xs font-bold text-gray-500">Heads</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 mt-2">
                            {cookingHeadcount?.breakfast?.members ?? 0} Members + <span className="text-orange-600">{cookingHeadcount?.breakfast?.guests ?? 0} Guests</span>
                        </p>
                    </div>

                    {/* Lunch */}
                    <div className="bg-orange-50/40 rounded-2xl p-4 border border-orange-200/60 hover:border-orange-300 transition-all shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold text-orange-700 uppercase tracking-wider">Lunch (Main)</span>
                            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">Peak</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-gray-900">{cookingHeadcount?.lunch?.total ?? 0}</span>
                            <span className="text-xs font-bold text-gray-500">Heads</span>
                        </div>
                        <p className="text-xs font-bold text-gray-600 mt-2">
                            {cookingHeadcount?.lunch?.members ?? 0} Members + <span className="text-orange-600 font-extrabold">{cookingHeadcount?.lunch?.guests ?? 0} Guests</span>
                        </p>
                    </div>

                    {/* Dinner */}
                    <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 hover:border-orange-200 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Dinner</span>
                            <span className="text-xs font-bold text-gray-400">Slot 2</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-gray-900">{cookingHeadcount?.dinner?.total ?? 0}</span>
                            <span className="text-xs font-bold text-gray-500">Heads</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 mt-2">
                            {cookingHeadcount?.dinner?.members ?? 0} Members + <span className="text-orange-600">{cookingHeadcount?.dinner?.guests ?? 0} Guests</span>
                        </p>
                    </div>
                </div>

                {/* Approved Guest Details Sub-row */}
                {cookingHeadcount?.approvedGuestRequests && cookingHeadcount.approvedGuestRequests.length > 0 && (
                    <div className="px-5 sm:px-6 pb-5 pt-0 border-t border-gray-100">
                        <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mt-4 mb-2 flex items-center gap-1.5">
                            <IconUsers size={14} className="text-orange-600" />
                            Approved Guest Meals for Today:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {cookingHeadcount.approvedGuestRequests.map((g: any) => (
                                <span key={g.id} className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200/80 text-orange-900 text-xs font-bold px-3 py-1.5 rounded-xl">
                                    <span>{g.memberName}</span>
                                    <span className="bg-orange-200/80 text-orange-800 px-1.5 py-0.5 rounded-md text-[10px]">+{g.guests} {g.mealType}</span>
                                    {g.note && <span className="text-gray-500 text-[10px] font-normal italic">("{g.note}")</span>}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Main Content Container (Responsive Ordering) ─── */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
                
                {/* ─── 1. Today's Responsibility (Mobile: Order 2, Desktop: Order 2) ─── */}
                {isTodayShopper && (
                    <div className="order-2 lg:order-2 lg:col-span-2">
                        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                            <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 pl-8">
                                
                                {/* Who is assigned */}
                                <div>
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Today's Responsibility</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="w-12 h-12 rounded-full bg-[#1e293b] flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                                            {assignedInitial}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-extrabold text-gray-900">{assignedName}</h3>
                                            <p className="text-sm font-bold text-orange-600">{formattedToday}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Cost Input for the assigned member */}
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                    <div className="relative w-full sm:w-48">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-gray-400">Tk </span>
                                        <input 
                                            type="number" 
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="Enter amount..." 
                                            className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm text-gray-900 font-bold transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleSubmitExpense}
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        <IconCheck className="w-5 h-5" stroke={3} />
                                        {isSubmitting ? "Submitting..." : "Submit"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── 2. Bazaar Schedule (Mobile: Order 3, Desktop: Order 3) ─── */}
                <div className="order-3 lg:order-3 lg:col-span-1 lg:row-span-2">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-28">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8FAFC]">
                            <div className="flex items-center gap-2">
                                <IconCalendarUser className="w-5 h-5 text-gray-600" stroke={2} />
                                <h3 className="font-extrabold text-gray-900">Bazaar Schedule</h3>
                            </div>
                            <button
                                onClick={handleOpenModal}
                                className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                                View All
                            </button>
                        </div>
                        
                        <div className="divide-y divide-gray-50 p-2">
                            {schedules.length === 0 ? (
                                <div className="p-4 text-center text-xs font-bold text-gray-400">
                                    No upcoming schedules yet.
                                </div>
                            ) : schedules.map((item, idx) => {
                                const d = new Date(item.date);
                                const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
                                const label = idx === 0 ? "Tomorrow" : "Next";
                                const uInitial = item.user?.name ? item.user.name.charAt(0).toUpperCase() : "M";

                                return (
                                    <div key={item.id} className="grid grid-cols-[1fr_auto_minmax(110px,1fr)] sm:grid-cols-[1fr_auto_minmax(140px,1fr)] items-center gap-2 sm:gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                        <div className="text-left overflow-hidden">
                                            <p className="text-sm font-bold text-gray-900 truncate">{label}</p>
                                            <p className="text-xs font-medium text-gray-500 truncate">{dateFormatted}</p>
                                        </div>
                                        <div className="flex justify-center min-w-[65px]">
                                            {item.status === "pending" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleApproveSchedule(item.id)}
                                                    className="text-[11px] font-bold bg-amber-50 hover:bg-emerald-50 text-amber-700 hover:text-emerald-700 px-2 py-0.5 rounded-md border border-amber-200 hover:border-emerald-300 transition-all cursor-pointer whitespace-nowrap"
                                                    title="Click to approve member schedule"
                                                >
                                                    Pending
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 whitespace-nowrap">
                                                    Approved
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-start gap-2 overflow-hidden pl-1 sm:pl-2 border-l border-gray-100/50">
                                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0">
                                                {uInitial}
                                            </div>
                                            <span className="text-xs sm:text-sm font-extrabold text-gray-800 truncate">{item.user?.name || "Member"}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ─── 3. Expense History Table (Mobile: Order 4, Desktop: Order 4) ─── */}
                <div className="order-4 lg:order-4 lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-start sm:items-center justify-between gap-2 sm:gap-4 bg-[#F8FAFC]">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm shrink-0">
                                    <IconCalendarEvent className="w-4 h-4 sm:w-5 sm:h-5" stroke={1.5} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">Today's Expenses</h2>
                                    <p className="hidden md:block text-xs font-bold text-gray-500 mt-0.5">History of market purchases for today</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMonthlyModalOpen(true)}
                                className="text-[10px] sm:text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 sm:px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                                Monthly History
                            </button>
                        </div>

                        <div className="w-full">
                            {/* Header Row */}
                            <div className="grid grid-cols-[minmax(0,1fr)_75px_60px] sm:grid-cols-[minmax(0,1fr)_100px_80px] gap-2 sm:gap-4 items-center border-b border-gray-100 px-4 sm:px-6 py-3 bg-white">
                                <div className="text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wider truncate">Shopper & Desc</div>
                                <div className="text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Amount</div>
                                <div className="text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right justify-self-end">Status</div>
                            </div>
                            
                            {/* Data Rows */}
                            <div className="divide-y divide-gray-100">
                                {expenses.length === 0 ? (
                                    <div className="py-10 text-center font-bold text-gray-400">
                                        No expenses logged today yet.
                                    </div>
                                ) : expenses.map((exp) => (
                                    <div key={exp.id} className="grid grid-cols-[minmax(0,1fr)_75px_60px] sm:grid-cols-[minmax(0,1fr)_100px_80px] gap-2 sm:gap-4 items-center px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                                                {exp.user?.name ? exp.user.name.charAt(0).toUpperCase() : "B"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-extrabold text-gray-900 text-xs sm:text-sm truncate">{exp.user?.name || "Shopper"}</p>
                                                <p className="text-[10px] sm:text-xs font-medium text-gray-500 mt-0.5 truncate">{exp.description || "Bazaar"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right whitespace-nowrap">
                                            <span className="font-extrabold text-red-600 text-sm sm:text-base">Tk {exp.amount}</span>
                                        </div>
                                        <div className="text-right whitespace-nowrap justify-self-end">
                                            <span className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-1 rounded-lg ${exp.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {exp.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── 4. Quick Stats Grid (Mobile: Order 1 - Top, Desktop: Order 1 - Top) ─── */}
                <div className="order-1 lg:order-1 lg:col-span-3 grid grid-cols-3 gap-2 sm:gap-6">
                    <div className="bg-white p-2 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[130px]">
                        <div className="flex justify-between items-start gap-1 sm:gap-4">
                            <div className="w-6 h-6 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 mb-1 sm:mb-0">
                                <IconReceipt2 className="w-4 h-4 sm:w-6 sm:h-6" stroke={2} />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 font-semibold leading-tight truncate">Food Cost</p>
                            <h3 className="text-sm sm:text-3xl font-extrabold text-gray-900 mt-0.5 sm:mt-3 leading-tight truncate">Tk {stats.totalExpense.toLocaleString()}</h3>
                        </div>
                        <IconReceipt2 className="hidden sm:block absolute -bottom-4 -right-4 w-24 h-24 text-orange-50/50" stroke={1} />
                    </div>

                    <div className="bg-white p-2 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[130px]">
                        <div className="flex justify-between items-start gap-1 sm:gap-4">
                            <div className="w-6 h-6 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 mb-1 sm:mb-0">
                                <IconShoppingBag className="w-4 h-4 sm:w-6 sm:h-6" stroke={2} />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 font-semibold leading-tight truncate">Today's Bazaar</p>
                            <h3 className="text-sm sm:text-3xl font-extrabold text-gray-900 mt-0.5 sm:mt-3 leading-tight truncate">Tk {todayTotal.toLocaleString()}</h3>
                        </div>
                        <p className="hidden sm:block text-gray-500 text-xs font-medium z-10 mt-1">{todayTotal > 0 ? "Logged for today" : "No bazaar yet"}</p>
                    </div>

                    <div className="bg-white p-2 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[90px] sm:min-h-[130px]">
                        <div className="flex justify-between items-start gap-1 sm:gap-4">
                            <div className="w-6 h-6 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 mb-1 sm:mb-0">
                                <IconWallet className="w-4 h-4 sm:w-6 sm:h-6" stroke={2} />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 font-semibold leading-tight truncate">Mess Fund</p>
                            <h3 className="text-sm sm:text-3xl font-extrabold text-gray-900 mt-0.5 sm:mt-3 leading-tight truncate">Tk {stats.availableBalance.toLocaleString()}</h3>
                        </div>
                        <p className="hidden sm:block text-gray-500 text-xs font-medium z-10 mt-1">{stats.availableBalance >= 0 ? "Surplus fund" : "Deficit fund"}</p>
                    </div>
                </div>

            </div>

            {/* ─── Modal ─── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8FAFC]">
                            <div className="flex items-center gap-2">
                                <IconCalendarEvent className="w-5 h-5 text-gray-600" stroke={2} />
                                <h3 className="font-extrabold text-gray-900">Full Month Schedule</h3>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
                            >
                                <IconX size={20} stroke={2} />
                            </button>
                        </div>
                        
                        <div className="p-2 max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
                            {isLoadingMonth ? (
                                <div className="p-8 text-center text-sm font-bold text-gray-500 animate-pulse">
                                    Loading schedule...
                                </div>
                            ) : fullMonthSchedules.length === 0 ? (
                                <div className="p-8 text-center text-sm font-bold text-gray-400">
                                    No schedules found for this month.
                                </div>
                            ) : (
                                fullMonthSchedules.map((item) => {
                                    const d = new Date(item.date);
                                    const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
                                    const uInitial = item.user?.name ? item.user.name.charAt(0).toUpperCase() : "M";

                                    return (
                                        <div key={item.id} className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] items-center gap-2 sm:gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                            <div className="text-left overflow-hidden">
                                                <p className="text-sm font-bold text-gray-900 truncate">{dateFormatted}</p>
                                            </div>
                                            <div className="flex items-center justify-start gap-3 pl-2 sm:pl-4 border-l border-gray-100/70 overflow-hidden">
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0">
                                                    {uInitial}
                                                </div>
                                                <span className="text-sm font-extrabold text-gray-800 truncate">{item.user?.name || "Member"}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Monthly Summary Modal ─── */}
            {isMonthlyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8FAFC]">
                            <div className="flex items-center gap-2">
                                <IconReceipt2 className="w-5 h-5 text-gray-600" stroke={2} />
                                <h3 className="font-extrabold text-gray-900">Monthly Expenses</h3>
                            </div>
                            <button 
                                onClick={() => setIsMonthlyModalOpen(false)}
                                className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
                            >
                                <IconX size={20} stroke={2} />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-3">
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-orange-500"
                            >
                                {Array.from({ length: 12 }, (_, i) => {
                                    const d = new Date(2000, i, 1);
                                    return <option key={i} value={i}>{d.toLocaleString('default', { month: 'long' })}</option>;
                                })}
                            </select>
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-orange-500"
                            >
                                {Array.from({ length: 5 }, (_, i) => {
                                    const year = new Date().getFullYear() - 2 + i;
                                    return <option key={year} value={year}>{year}</option>;
                                })}
                            </select>
                        </div>

                        <div className="p-2 max-h-[50vh] overflow-y-auto divide-y divide-gray-50">
                            {isLoadingMonthly ? (
                                <div className="p-8 text-center text-sm font-bold text-gray-500 animate-pulse">
                                    Loading expenses...
                                </div>
                            ) : monthlySummary.length === 0 ? (
                                <div className="p-8 text-center text-sm font-bold text-gray-400">
                                    No expenses found for this month.
                                </div>
                            ) : (
                                monthlySummary.map((item) => {
                                    const uInitial = item.name ? item.name.charAt(0).toUpperCase() : "M";
                                    return (
                                        <div key={item.userId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {uInitial}
                                                </div>
                                                <span className="text-sm font-extrabold text-gray-800">{item.name}</span>
                                            </div>
                                            <div>
                                                <span className="font-extrabold text-red-600 text-sm">Tk {item.total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}