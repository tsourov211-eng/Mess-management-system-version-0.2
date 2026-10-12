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
import {
    Receipt,
    ShoppingBag,
    Coins,
    ArrowUpRight,
    ArrowDownRight,
    Utensils,
    Users,
    Coffee,
    Soup,
    CalendarDays,
    Calendar,
    ChevronRight,
    Check,
    X,
    Clock,
    FileText
} from "lucide-react";

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

    // Total meal count for the day across breakfast, lunch, dinner & guests
    // Note: Breakfast counts as 0.5 meals, Lunch as 1.0 meal, Dinner as 1.0 meal
    const breakfastMealCount = cookingHeadcount?.breakfast?.meals ?? (
        Math.round(((cookingHeadcount?.breakfast?.total ?? 0) * 0.5) * 10) / 10
    );
    const lunchMealCount = cookingHeadcount?.lunch?.meals ?? (cookingHeadcount?.lunch?.total ?? 0);
    const dinnerMealCount = cookingHeadcount?.dinner?.meals ?? (cookingHeadcount?.dinner?.total ?? 0);

    const totalDayMeals = cookingHeadcount?.totalMealsToday ?? (
        Math.round((breakfastMealCount + lunchMealCount + dinnerMealCount) * 10) / 10
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            
            {/* ─── MOBILE VIEW: Bazaar & Expenses (Matching expenses.png Pixel-for-Pixel) ─── */}
            <div className="md:hidden flex flex-col gap-3.5 w-full max-w-md mx-auto">
                
                {/* Screen Title */}
                <div className="pt-1 px-0.5">
                    <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight">
                        Bazaar & Expenses
                    </h1>
                </div>

                {/* Top Metrics Row (3 Gradient Cards) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    
                    {/* Food Cost */}
                    <div className="bg-gradient-to-b from-[#FFF5ED] via-[#FFEADB] to-[#FED7AA]/50 rounded-[28px] p-3 sm:p-3.5 border border-orange-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[148px]">
                        {/* Bottom wave decoration */}
                        <svg className="absolute -bottom-1 -right-1 w-28 h-16 pointer-events-none opacity-30 text-orange-400" viewBox="0 0 100 50" fill="currentColor">
                            <path d="M0,35 C20,20 50,45 80,25 C90,18 95,20 100,15 L100,50 L0,50 Z" />
                        </svg>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="w-9 h-9 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                                <Receipt size={18} strokeWidth={2.2} />
                            </div>
                            <svg className="w-12 sm:w-14 h-7 text-orange-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M 4,22 C 16,22 24,10 36,16 C 48,22 56,8 66,6" />
                            </svg>
                        </div>
                        <div className="my-auto py-1 relative z-10">
                            <p className="text-[11px] font-bold text-gray-500 leading-tight">Food Cost</p>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight mt-1 truncate">
                                ৳ {(stats.totalExpense ?? 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="relative z-10">
                            <span className="bg-orange-100/90 text-[#FF6B00] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 w-fit shadow-2xs">
                                <ArrowUpRight size={11} strokeWidth={3} /> +12%
                            </span>
                        </div>
                    </div>

                    {/* Today's Bazaar */}
                    <div className="bg-gradient-to-b from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0]/50 rounded-[28px] p-3 sm:p-3.5 border border-emerald-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[148px]">
                        {/* Bottom wave decoration */}
                        <svg className="absolute -bottom-1 -right-1 w-28 h-16 pointer-events-none opacity-30 text-emerald-400" viewBox="0 0 100 50" fill="currentColor">
                            <path d="M0,35 C20,20 50,45 80,25 C90,18 95,20 100,15 L100,50 L0,50 Z" />
                        </svg>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="w-9 h-9 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                                <ShoppingBag size={18} strokeWidth={2.2} />
                            </div>
                            <svg className="w-12 sm:w-14 h-7 text-emerald-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M 4,12 C 14,8 24,20 38,14 C 48,10 56,22 66,18" />
                            </svg>
                        </div>
                        <div className="my-auto py-1 relative z-10">
                            <p className="text-[11px] font-bold text-gray-500 leading-tight">Today's Bazaar</p>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight mt-1 truncate">
                                ৳ {todayTotal.toLocaleString()}
                            </h3>
                        </div>
                        <div className="relative z-10">
                            <span className="bg-emerald-100/90 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 w-fit shadow-2xs">
                                <ArrowDownRight size={11} strokeWidth={3} /> -8%
                            </span>
                        </div>
                    </div>

                    {/* Mess Fund */}
                    <div className="bg-gradient-to-b from-[#FAF5FF] via-[#F3E8FF] to-[#E9D5FF]/50 rounded-[28px] p-3 sm:p-3.5 border border-purple-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[148px]">
                        {/* Bottom wave decoration */}
                        <svg className="absolute -bottom-1 -right-1 w-28 h-16 pointer-events-none opacity-30 text-purple-400" viewBox="0 0 100 50" fill="currentColor">
                            <path d="M0,35 C20,20 50,45 80,25 C90,18 95,20 100,15 L100,50 L0,50 Z" />
                        </svg>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="w-9 h-9 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
                                <Coins size={18} strokeWidth={2.2} />
                            </div>
                            <svg className="w-12 sm:w-14 h-7 text-purple-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M 4,22 C 16,20 26,8 38,14 C 50,20 58,10 66,6" />
                            </svg>
                        </div>
                        <div className="my-auto py-1 relative z-10">
                            <p className="text-[11px] font-bold text-gray-500 leading-tight">Mess Fund</p>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight mt-1 truncate">
                                ৳ {(stats.availableBalance ?? 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="relative z-10">
                            <span className="bg-purple-100/90 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 w-fit shadow-2xs">
                                <ArrowUpRight size={11} strokeWidth={3} /> +5%
                            </span>
                        </div>
                    </div>

                </div>

                {/* "Cooking & Market Headcount" Hero Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-[28px] border border-orange-100/70 shadow-sm p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 z-10 min-w-0 pr-24">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                                <Utensils size={22} strokeWidth={2.2} />
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h2 className="text-base sm:text-[17px] font-black text-gray-900 tracking-tight leading-tight">
                                    Cooking & Market Headcount
                                </h2>
                                {/* Leaf Icon Accent */}
                                <svg className="w-4 h-4 text-emerald-500 shrink-0 transform -rotate-12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.75C7 7.35 6 9 6 11c2-2 7-3 11-3z" />
                                </svg>
                            </div>
                        </div>

                        {/* 3D Grocery Basket Illustration */}
                        <div className="absolute right-2.5 top-2 pointer-events-none">
                            <svg className="w-24 h-18 sm:w-28 sm:h-20" viewBox="0 0 100 65" fill="none">
                                {/* Fresh Leaf behind */}
                                <path d="M12,28 C10,20 18,16 22,20 C26,24 20,32 12,28 Z" fill="#22C55E" />
                                <path d="M14,26 C17,23 20,22 21,21" stroke="#15803D" strokeWidth="0.8" />
                                
                                {/* Milk/Oil Bottle */}
                                <rect x="68" y="8" width="12" height="26" rx="3" fill="#FEF08A" />
                                <rect x="70" y="4" width="8" height="6" rx="1.5" fill="#EAB308" />
                                <rect x="71" y="1" width="6" height="3" rx="1" fill="#CA8A04" />
                                <rect x="69" y="14" width="10" height="12" rx="1.5" fill="#FEF9C3" opacity="0.8" />

                                {/* Veggies / Greens */}
                                <ellipse cx="62" cy="22" rx="12" ry="10" fill="#22C55E" />
                                <ellipse cx="56" cy="18" rx="8" ry="7" fill="#16A34A" />
                                <ellipse cx="44" cy="22" rx="10" ry="8" fill="#4ADE80" />

                                {/* Tomato 1 */}
                                <circle cx="48" cy="28" r="9" fill="#EF4444" />
                                <circle cx="45" cy="26" r="2.5" fill="#FCA5A5" opacity="0.6" />
                                <path d="M47,19 L48,22 L51,20" stroke="#15803D" strokeWidth="1.2" strokeLinecap="round" />

                                {/* Tomato 2 */}
                                <circle cx="62" cy="30" r="9.5" fill="#DC2626" />
                                <circle cx="59" cy="28" r="2.5" fill="#FCA5A5" opacity="0.6" />
                                <path d="M61,21 L62,24 L65,22" stroke="#15803D" strokeWidth="1.2" strokeLinecap="round" />

                                {/* Woven Basket Body */}
                                <path d="M30,32 L36,54 C37,57 40,59 43,59 L75,59 C78,59 81,57 82,54 L88,32 Z" fill="#F97316" />
                                <path d="M34,38 L84,38 M36,45 L82,45 M38,52 L80,52" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M42,32 L46,59 M54,32 L56,59 M66,32 L66,59 M76,32 L74,59" stroke="#C2410C" strokeWidth="1.2" />
                                <path d="M28,32 C28,30 32,30 36,30 L82,30 C86,30 90,30 90,32 C90,34 86,34 82,34 L36,34 C32,34 28,34 28,32 Z" fill="#FB923C" />
                            </svg>
                        </div>
                    </div>

                    {/* Headcount Indicator Bar */}
                    <div className="bg-gradient-to-r from-[#FF6B00] via-orange-500 to-amber-500 text-white rounded-2xl py-2.5 px-3.5 flex items-center justify-between gap-2 shadow-sm mt-3.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <Users size={17} strokeWidth={2.5} className="shrink-0" />
                            <span className="w-px h-3.5 bg-white/40 shrink-0" />
                            <span className="text-xs font-black tracking-tight text-white truncate">
                                Lunch: {(cookingHeadcount?.lunch?.total ?? 0)} Heads
                            </span>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-black text-white shrink-0 border border-white/25 flex items-center gap-1.5 shadow-2xs">
                            <IconToolsKitchen2 size={14} stroke={2.5} />
                            <span>Total: {totalDayMeals} Meals</span>
                        </div>
                    </div>
                </div>

                {/* Meal Slots Breakdown (3 Interactive Cards) */}
                <div className="space-y-2.5">
                    {/* Breakfast Card */}
                    <div className="bg-white rounded-2xl p-3.5 border border-blue-100/70 shadow-sm flex items-center justify-between relative overflow-hidden transition-transform active:scale-[0.99]">
                        {/* Soft blue wave in bottom-right */}
                        <svg className="absolute bottom-0 right-0 w-36 h-full pointer-events-none text-blue-100/50" viewBox="0 0 140 60" fill="currentColor" preserveAspectRatio="none">
                            <path d="M20,60 C40,40 60,60 100,30 C120,15 130,20 140,10 L140,60 Z" />
                        </svg>

                        <div className="flex items-center gap-3 min-w-0 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-[#E8F1FF] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
                                <Coffee size={22} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 leading-tight">Breakfast</p>
                                <h3 className="text-xl font-black text-gray-900 leading-tight mt-0.5">
                                    {cookingHeadcount?.breakfast?.total ?? 0}
                                </h3>
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 mt-0.5">
                                    <Users size={12} className="shrink-0 text-gray-400" />
                                    <span>{(cookingHeadcount?.breakfast?.members ?? 0)} + {(cookingHeadcount?.breakfast?.guests ?? 0)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 relative z-10">
                            <span className="bg-[#E0EEFE] text-[#1D4ED8] text-xs font-bold px-3 py-1 rounded-full">
                                Slot 1
                            </span>
                            <ChevronRight size={18} className="text-gray-400" />
                        </div>
                    </div>

                    {/* Lunch (Main) Card */}
                    <div className="bg-white rounded-2xl p-3.5 border border-orange-100/70 shadow-sm flex items-center justify-between relative overflow-hidden transition-transform active:scale-[0.99]">
                        {/* Soft peach wave in bottom-right */}
                        <svg className="absolute bottom-0 right-0 w-36 h-full pointer-events-none text-orange-100/50" viewBox="0 0 140 60" fill="currentColor" preserveAspectRatio="none">
                            <path d="M20,60 C40,40 60,60 100,30 C120,15 130,20 140,10 L140,60 Z" />
                        </svg>

                        <div className="flex items-center gap-3 min-w-0 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-[#FFEADB] text-[#EA580C] flex items-center justify-center shrink-0 shadow-2xs">
                                <Utensils size={22} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-[#EA580C] leading-tight">Lunch (Main)</p>
                                <h3 className="text-xl font-black text-gray-900 leading-tight mt-0.5">
                                    {cookingHeadcount?.lunch?.total ?? 0}
                                </h3>
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 mt-0.5">
                                    <Users size={12} className="shrink-0 text-gray-400" />
                                    <span>{(cookingHeadcount?.lunch?.members ?? 0)} + {(cookingHeadcount?.lunch?.guests ?? 0)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 relative z-10">
                            <span className="bg-[#FFEDD5] text-[#C2410C] text-xs font-bold px-3 py-1 rounded-full">
                                Peak
                            </span>
                            <ChevronRight size={18} className="text-gray-400" />
                        </div>
                    </div>

                    {/* Dinner Card */}
                    <div className="bg-white rounded-2xl p-3.5 border border-purple-100/70 shadow-sm flex items-center justify-between relative overflow-hidden transition-transform active:scale-[0.99]">
                        {/* Soft purple wave in bottom-right */}
                        <svg className="absolute bottom-0 right-0 w-36 h-full pointer-events-none text-purple-100/50" viewBox="0 0 140 60" fill="currentColor" preserveAspectRatio="none">
                            <path d="M20,60 C40,40 60,60 100,30 C120,15 130,20 140,10 L140,60 Z" />
                        </svg>

                        <div className="flex items-center gap-3 min-w-0 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0 shadow-2xs">
                                <Soup size={22} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 leading-tight">Dinner</p>
                                <h3 className="text-xl font-black text-gray-900 leading-tight mt-0.5">
                                    {cookingHeadcount?.dinner?.total ?? 0}
                                </h3>
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 mt-0.5">
                                    <Users size={12} className="shrink-0 text-gray-400" />
                                    <span>{(cookingHeadcount?.dinner?.members ?? 0)} + {(cookingHeadcount?.dinner?.guests ?? 0)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 relative z-10">
                            <span className="bg-[#F3E8FF] text-[#6B21A8] text-xs font-bold px-3 py-1 rounded-full">
                                Slot 2
                            </span>
                            <ChevronRight size={18} className="text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Today's Shopper Responsibility Card (if active shopper) */}
                {isTodayShopper && (
                    <div className="bg-white/95 backdrop-blur-sm rounded-[26px] border border-orange-200/80 p-3.5 shadow-sm flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {assignedInitial}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Today's Shopper</p>
                                <p className="text-xs font-black text-slate-900 truncate">{assignedName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="relative w-28">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-xs text-gray-400">৳</span>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Amount" 
                                    className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                                />
                            </div>
                            <button 
                                onClick={handleSubmitExpense}
                                disabled={isSubmitting}
                                className="bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmitting ? "..." : "Save"}
                            </button>
                        </div>
                    </div>
                )}

                {/* "Bazaar Schedule" Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-[28px] border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col">
                    <div className="flex items-center justify-between pb-3.5 border-b border-gray-100/80">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <CalendarDays size={19} strokeWidth={2.4} />
                            </div>
                            <h2 className="text-base sm:text-[17px] font-black text-gray-900 tracking-tight">
                                Bazaar Schedule
                            </h2>
                        </div>

                        <button
                            onClick={handleOpenModal}
                            className="bg-[#FFF5ED] hover:bg-orange-100 text-[#EA580C] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            View All <ChevronRight size={14} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-100/80">
                        {(schedules.length > 0 ? schedules : [
                            { id: "mock-1", date: "2026-10-12T00:00:00.000Z", status: "Approved", user: { name: "Tanvir" }, mockTiming: "Tomorrow" },
                            { id: "mock-2", date: "2026-10-29T00:00:00.000Z", status: "Approved", user: { name: "Tanvir" }, mockTiming: "Next" },
                            { id: "mock-3", date: "2026-10-30T00:00:00.000Z", status: "Approved", user: { name: "Tanvir" }, mockTiming: "Next" },
                            { id: "mock-4", date: "2026-10-31T00:00:00.000Z", status: "Pending", user: { name: "Tanvir" }, mockTiming: "Next" },
                        ]).map((item: any, idx: number) => {
                            const d = new Date(item.date);
                            const dateFormatted = isNaN(d.getTime()) ? "Oct 12" : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            const timingLabel = item.mockTiming || (idx === 0 ? "Tomorrow" : "Next");
                            const isApproved = (item.status || "").toLowerCase() === "approved";
                            const uInitial = item.user?.name ? item.user.name.charAt(0).toUpperCase() : "T";

                            return (
                                <div key={item.id} className="py-3 flex items-center justify-between gap-2.5">
                                    <div className="text-left min-w-[70px]">
                                        <p className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                                            {timingLabel}
                                        </p>
                                        <p className="text-[11px] font-medium text-gray-400 leading-tight mt-0.5">
                                            {dateFormatted}
                                        </p>
                                    </div>

                                    <div className="flex justify-center">
                                        {isApproved ? (
                                            <span className="bg-[#DCFCE7]/90 text-[#16A34A] border border-emerald-200/60 text-[11px] font-bold px-3 py-0.5 rounded-full">
                                                Approved
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => handleApproveSchedule(item.id)}
                                                className="bg-[#FEF3C7]/90 text-[#D97706] hover:bg-emerald-50 hover:text-emerald-700 border border-amber-200/60 text-[11px] font-bold px-3 py-0.5 rounded-full transition-colors cursor-pointer"
                                            >
                                                Pending
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-[#FFEADB] text-[#EA580C] font-black text-xs flex items-center justify-center shadow-2xs">
                                            {uInitial}
                                        </div>
                                        <ChevronRight size={16} className="text-gray-400" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* "Today's Expenses" Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-[28px] border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col mb-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100/80">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                                <Receipt size={18} strokeWidth={2.2} />
                            </div>
                            <h2 className="text-base sm:text-[17px] font-black text-gray-900 tracking-tight">
                                Today's Expenses
                            </h2>
                        </div>

                        <button
                            onClick={() => setIsMonthlyModalOpen(true)}
                            className="text-[#FF6B00] hover:text-orange-700 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                        >
                            History <ChevronRight size={14} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Table Column Labels */}
                    <div className="flex items-center justify-between text-[10px] font-black text-gray-400 tracking-wider uppercase px-2 pt-2.5 pb-2">
                        <span>SHOPPER</span>
                        <span>AMOUNT</span>
                        <span>STATUS</span>
                    </div>

                    {/* Content Area */}
                    {expenses.length === 0 ? (
                        <div className="relative overflow-hidden flex items-center justify-center gap-2 py-8 bg-gradient-to-b from-[#FAF5FF]/30 via-[#EEF2FF]/40 to-[#E0E7FF]/20 rounded-2xl border border-indigo-50/50 text-xs font-bold text-gray-400">
                            <FileText size={16} className="text-gray-400" />
                            <span>No expenses yet</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100/80">
                            {expenses.map((exp) => (
                                <div key={exp.id} className="py-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-[#FFEADB] text-[#EA580C] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                            {exp.user?.name ? exp.user.name.charAt(0).toUpperCase() : "B"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-extrabold text-gray-900 text-xs truncate">{exp.user?.name || "Shopper"}</p>
                                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{exp.description || "Bazaar"}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-black text-slate-900 text-sm">৳ {exp.amount}</span>
                                    </div>
                                    <div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            exp.status === 'Approved' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEF3C7] text-[#D97706]'
                                        }`}>
                                            {exp.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* ─── DESKTOP VIEW ─── */}
            <div className="hidden md:block space-y-6 lg:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#450705] tracking-tight">Bazaar & Expenses</h1>
                    <p className="text-gray-500 text-sm mt-1.5 font-medium">Manage bazaar schedule and track daily market expenses.</p>
                </div>
            </div>

            {/* Top 3 Pastel Metric Cards (Desktop Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Food Cost */}
                <div className="bg-gradient-to-b from-[#FFF5ED] via-[#FFEADB] to-[#FED7AA]/50 rounded-3xl p-5 lg:p-6 border border-orange-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow">
                    <svg className="absolute -bottom-1 -right-1 w-36 h-20 pointer-events-none opacity-30 text-orange-400" viewBox="0 0 100 50" fill="currentColor">
                        <path d="M0,35 C20,20 50,45 80,25 C90,18 95,20 100,15 L100,50 L0,50 Z" />
                    </svg>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="w-11 h-11 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                            <Receipt size={22} strokeWidth={2.2} />
                        </div>
                        <svg className="w-16 h-8 text-orange-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M 4,22 C 16,22 24,10 36,16 C 48,22 56,8 66,6" />
                        </svg>
                    </div>
                    <div className="my-auto py-2 relative z-10">
                        <p className="text-xs font-bold text-gray-500 leading-tight">Food Cost</p>
                        <h3 className="text-xl lg:text-2xl font-black text-gray-900 leading-tight mt-1 truncate">
                            ৳ {(stats.totalExpense ?? 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="relative z-10">
                        <span className="bg-orange-100/90 text-[#FF6B00] text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit shadow-2xs">
                            <ArrowUpRight size={13} strokeWidth={3} /> +12%
                        </span>
                    </div>
                </div>

                {/* Today's Bazaar */}
                <div className="bg-gradient-to-b from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0]/50 rounded-3xl p-5 lg:p-6 border border-emerald-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow">
                    <svg className="absolute -bottom-1 -right-1 w-36 h-20 pointer-events-none opacity-30 text-emerald-400" viewBox="0 0 100 50" fill="currentColor">
                        <path d="M0,35 C20,20 50,45 80,25 C90,18 95,20 100,15 L100,50 L0,50 Z" />
                    </svg>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="w-11 h-11 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                            <ShoppingBag size={22} strokeWidth={2.2} />
                        </div>
                        <svg className="w-16 h-8 text-emerald-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M 4,12 C 14,8 24,20 38,14 C 48,10 56,22 66,18" />
                        </svg>
                    </div>
                    <div className="my-auto py-2 relative z-10">
                        <p className="text-xs font-bold text-gray-500 leading-tight">Today's Bazaar</p>
                        <h3 className="text-xl lg:text-2xl font-black text-gray-900 leading-tight mt-1 truncate">
                            ৳ {todayTotal.toLocaleString()}
                        </h3>
                    </div>
                    <div className="relative z-10">
                        <span className="bg-emerald-100/90 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit shadow-2xs">
                            <ArrowDownRight size={13} strokeWidth={3} /> -8%
                        </span>
                    </div>
                </div>

                {/* Mess Fund */}
                <div className="bg-gradient-to-b from-[#FAF5FF] via-[#F3E8FF] to-[#E9D5FF]/50 rounded-3xl p-5 lg:p-6 border border-purple-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow">
                    <svg className="absolute -bottom-1 -right-1 w-36 h-20 pointer-events-none opacity-30 text-purple-400" viewBox="0 0 100 50" fill="currentColor">
                        <path d="M0,35 C20,20 50,45 80,25 C90,18 95,20 100,15 L100,50 L0,50 Z" />
                    </svg>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="w-11 h-11 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
                            <Coins size={22} strokeWidth={2.2} />
                        </div>
                        <svg className="w-16 h-8 text-purple-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M 4,22 C 16,20 26,8 38,14 C 50,20 58,10 66,6" />
                        </svg>
                    </div>
                    <div className="my-auto py-2 relative z-10">
                        <p className="text-xs font-bold text-gray-500 leading-tight">Mess Fund</p>
                        <h3 className="text-xl lg:text-2xl font-black text-gray-900 leading-tight mt-1 truncate">
                            ৳ {(stats.availableBalance ?? 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="relative z-10">
                        <span className="bg-purple-100/90 text-purple-700 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit shadow-2xs">
                            <ArrowUpRight size={13} strokeWidth={3} /> +5%
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── Shopper & Cooking Headcount Module ("Accurate Market Count") ─── */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-orange-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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

                {/* ─── Bottom Row: Approved Guest Meals + Total Meal Count for the Day ─── */}
                <div className="px-5 sm:px-6 pb-5 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Approved Guest Meals */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <IconUsers size={14} className="text-orange-600" />
                            Approved Guest Meals for Today:
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            {cookingHeadcount?.approvedGuestRequests && cookingHeadcount.approvedGuestRequests.length > 0 ? (
                                cookingHeadcount.approvedGuestRequests.map((g: any) => (
                                    <span key={g.id} className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200/80 text-orange-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs">
                                        <span>{g.memberName}</span>
                                        <span className="bg-orange-200/80 text-orange-800 px-1.5 py-0.5 rounded-md text-[10px]">+{g.guests} {g.mealType}</span>
                                        {g.note && <span className="text-gray-500 text-[10px] font-normal italic">("{g.note}")</span>}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs font-medium text-gray-400 italic">No approved guest meals for today</span>
                            )}
                        </div>
                    </div>

                    {/* Right (Marked Place): Modern & Colorful Total Meal Count Widget */}
                    <div className="shrink-0 self-start md:self-center">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF6B00] via-[#E11D48] to-[#7C3AED] text-white p-3 sm:px-4 sm:py-2.5 shadow-lg shadow-rose-500/20 flex items-center gap-3.5 border border-white/20">
                            {/* Decorative ambient background glow */}
                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/15 rounded-full blur-xl pointer-events-none" />
                            <div className="absolute -left-4 -top-4 w-16 h-16 bg-amber-300/25 rounded-full blur-lg pointer-events-none" />

                            {/* Icon Squircle */}
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner border border-white/30">
                                <IconToolsKitchen2 size={20} stroke={2.5} />
                            </div>

                            {/* Content */}
                            <div className="relative z-10 flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-100">
                                        Total Meals for the Day
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                </div>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none drop-shadow-sm">
                                        {totalDayMeals}
                                    </span>
                                    <span className="text-xs font-extrabold text-orange-100">
                                        Meals
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black bg-white/20 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full border border-white/20">
                                        {breakfastMealCount}B • {lunchMealCount}L • {dinnerMealCount}D
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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