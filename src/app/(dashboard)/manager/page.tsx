"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    IconCalendar,
    IconToolsKitchen2,
    IconShoppingCart,
    IconCheck,
    IconClock,
    IconChevronRight,
    IconCreditCard,
    IconUsers,
    IconArrowRight,
    IconX,
    IconCalendarUser,
    IconWallet,
    IconShoppingBag,
    IconBell,
    IconTrash,
    IconFileText,
    IconAlertCircle,
    IconSearch,
    IconPhone,
    IconCrown,
    IconShieldCheck,
    IconUser
} from "@tabler/icons-react";
import { Coins, Search } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { calculateGuestMealUnits } from "@/lib/calculations";

export default function ManagerDashboard() {
    const [stats, setStats] = useState({
        totalMealsToday: 0,
        totalBazaarToday: 0,
        currentMealRate: 0,
        liveMealRate: 0,
        marketDuty: "Unassigned",
        mealFund: 0,
        messFund: 0,
        totalFund: 0,
    });
    const [users, setUsers] = useState<any[]>([]);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
    const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
    const [pendingBazaarSchedules, setPendingBazaarSchedules] = useState<any[]>([]);
    const [pendingGuestMeals, setPendingGuestMeals] = useState<any[]>([]);
    const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
    const [notices, setNotices] = useState<any[]>([]);
    const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        type: "approve" | "reject" | "danger" | "warning";
        title: string;
        message: React.ReactNode;
        confirmText?: string;
        onConfirm: () => Promise<void> | void;
    } | null>(null);
    const [isConfirmModalLoading, setIsConfirmModalLoading] = useState(false);

    const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const today = new Date();
    // Short date for mobile capsule: "Sun, Oct 11"
    const formattedShortDate = today.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });

    const getMemberAvatarStyle = (name: string, index: number) => {
        const initial = (name || "M").trim().charAt(0).toUpperCase();
        const palettes = [
            { bg: "bg-[#FFEADB]", text: "text-[#EA580C]" },
            { bg: "bg-[#DBEAFE]", text: "text-[#2563EB]" },
            { bg: "bg-[#DCFCE7]", text: "text-[#16A34A]" },
            { bg: "bg-[#FCE7F3]", text: "text-[#DB2777]" },
            { bg: "bg-[#EDE9FE]", text: "text-[#7C3AED]" },
        ];
        return {
            initial,
            ...palettes[index % palettes.length]
        };
    };

    const renderRoleBadge = (role: string) => {
        const r = (role || "member").toLowerCase();
        if (r === "admin") {
            return (
                <span className="bg-[#F3E8FF] text-[#7C3AED] border border-purple-200/50 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs shrink-0">
                    <IconCrown size={12} stroke={2.5} className="shrink-0" /> ADMIN
                </span>
            );
        }
        if (r === "manager") {
            return (
                <span className="bg-[#E0F2FE] text-[#0284C7] border border-sky-200/50 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs shrink-0">
                    <IconShieldCheck size={12} stroke={2.5} className="shrink-0" /> MANAGER
                </span>
            );
        }
        if (r === "suspended") {
            return (
                <span className="bg-rose-50 text-rose-600 border border-rose-200/50 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs shrink-0">
                    SUSPENDED
                </span>
            );
        }
        return (
            <span className="bg-[#DCFCE7] text-[#16A34A] border border-emerald-200/50 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs shrink-0">
                <IconUser size={12} stroke={2.5} className="shrink-0" /> MEMBER
            </span>
        );
    };

    const filteredUsers = users.filter((u) => {
        if (!memberSearchQuery.trim()) return true;
        const q = memberSearchQuery.toLowerCase();
        return (
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.role && u.role.toLowerCase().includes(q))
        );
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [res, usersRes] = await Promise.all([
                fetch("/api/manager/dashboard"),
                fetch("/api/admin/users")
            ]);
            if (res.ok) {
                const data = await res.json();
                if (data.stats) {
                    setStats(prev => ({
                        ...prev,
                        ...data.stats,
                    }));
                }
                setPendingDeposits(data.pendingDeposits || []);
                setPendingExpenses(data.pendingExpenses || []);
                setPendingBazaarSchedules(data.pendingBazaarSchedules || []);
                setPendingGuestMeals(data.pendingGuestMeals || []);
                setNotices(data.notices || []);
                setSelectedSchedules([]);
            }
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                const allUsers = usersData.users || [];
                setUsers(allUsers.filter((u: any) => u.role !== 'pending'));
            }
        } catch (error) {
            console.error("Error fetching manager dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Notice Board Handlers
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

    // Actions for desktop inline queues
    const handleAction = (id: string, type: 'deposit' | 'expense' | 'guestMeal', action: 'Approve' | 'Reject') => {
        const label = type === 'guestMeal' ? 'guest meal request' : type;
        setConfirmModalState({
            isOpen: true,
            type: action === "Approve" ? "approve" : "reject",
            title: `${action} ${label.charAt(0).toUpperCase() + label.slice(1)}`,
            message: `Are you sure you want to ${action.toLowerCase()} this ${label}?`,
            confirmText: action,
            onConfirm: async () => {
                setIsConfirmModalLoading(true);
                try {
                    const res = await fetch("/api/manager/action", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, type, action })
                    });

                    if (res.ok) {
                        showToast(`✅ ${label.charAt(0).toUpperCase() + label.slice(1)} ${action.toLowerCase()}d successfully!`, "success");
                        setConfirmModalState(null);
                        fetchDashboardData();
                    } else {
                        showToast(`❌ Failed to ${action.toLowerCase()} ${type}.`, "error");
                    }
                } catch (error) {
                    console.error(error);
                    showToast(`❌ Error processing ${type}.`, "error");
                } finally {
                    setIsConfirmModalLoading(false);
                }
            }
        });
    };

    const handleScheduleAction = (id: string, action: 'Approve' | 'Reject') => {
        const status = action === 'Approve' ? 'approved' : 'rejected';
        setConfirmModalState({
            isOpen: true,
            type: action === "Approve" ? "approve" : "reject",
            title: `${action} Bazaar Schedule`,
            message: `Are you sure you want to ${action.toLowerCase()} this schedule?`,
            confirmText: action,
            onConfirm: async () => {
                setIsConfirmModalLoading(true);
                try {
                    const res = await fetch("/api/members/bazaar-schedule", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ scheduleId: id, status })
                    });

                    if (res.ok) {
                        showToast(`✅ Schedule ${status} successfully!`, "success");
                        setConfirmModalState(null);
                        fetchDashboardData();
                    } else {
                        showToast(`❌ Failed to ${action.toLowerCase()} schedule.`, "error");
                    }
                } catch (error) {
                    console.error(error);
                    showToast("❌ Error processing schedule.", "error");
                } finally {
                    setIsConfirmModalLoading(false);
                }
            }
        });
    };

    const handleSelectAllSchedules = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedSchedules(pendingBazaarSchedules.map(s => s.id));
        } else {
            setSelectedSchedules([]);
        }
    };

    const handleSelectSchedule = (id: string) => {
        setSelectedSchedules(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleApproveSelectedSchedules = () => {
        if (selectedSchedules.length === 0) return;
        setConfirmModalState({
            isOpen: true,
            type: "approve",
            title: "Approve Selected Schedules",
            message: `Are you sure you want to approve ${selectedSchedules.length} selected schedule(s)?`,
            confirmText: "Approve All",
            onConfirm: async () => {
                setIsConfirmModalLoading(true);
                try {
                    const promises = selectedSchedules.map(id => 
                        fetch("/api/members/bazaar-schedule", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ scheduleId: id, status: "approved" })
                        })
                    );
                    await Promise.all(promises);
                    setSelectedSchedules([]);
                    showToast("✅ Selected schedules approved successfully!", "success");
                    setConfirmModalState(null);
                    fetchDashboardData();
                } catch (error) {
                    console.error(error);
                    showToast("❌ Failed to approve schedules.", "error");
                } finally {
                    setIsConfirmModalLoading(false);
                }
            }
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4 pb-6">
            
            {/* ─── Screen Heading ─── */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Manager Dashboard
                </h1>
            </div>

            {/* ─── B. Dual-Metric Capsule Card (Date & Current Meal Rate) ─── */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                {/* Left Section: Date */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <IconCalendar size={18} stroke={2.2} />
                    </div>
                    <span className="text-sm font-bold text-slate-800 tracking-tight truncate">
                        {formattedShortDate}
                    </span>
                </div>

                {/* Thin vertical divider */}
                <div className="h-8 w-px bg-gray-200/80 mx-2 shrink-0" />

                {/* Right Section: Current Meal Rate */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                        <IconToolsKitchen2 size={18} stroke={2.2} />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-[10px] text-gray-500 font-medium leading-tight">
                            Current Meal Rate
                        </span>
                        <span className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                            ৳ {Number(stats.currentMealRate ?? stats.liveMealRate ?? 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── C. Top Metric Cards (Meals, Bazaar, Meal Fund, Mess Fund, Market Duty) ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-5">
                {/* 1. Meals Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between min-h-[126px] sm:min-h-[140px] md:min-h-[160px] hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                        <IconToolsKitchen2 size={20} stroke={2.5} />
                    </div>
                    <div className="z-10 mt-2">
                        <p className="text-xs font-semibold text-gray-500">Meals</p>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 mt-0.5 leading-none">
                            {isLoading ? "..." : (stats.totalMealsToday ?? 0)}
                        </p>
                    </div>
                    {/* Bottom soft mint-green wave illustration */}
                    <div className="absolute right-0 bottom-0 pointer-events-none w-28 md:w-36 h-16 md:h-20 opacity-80">
                        <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M0 60C30 40 60 55 100 25V60H0Z" fill="#D1FAE5" fillOpacity="0.7"/>
                            <path d="M40 60C65 48 80 50 100 38V60H40Z" fill="#A7F3D0" fillOpacity="0.5"/>
                            <path d="M75 35C80 25 92 28 95 35C88 40 78 38 75 35Z" fill="#10B981" fillOpacity="0.4"/>
                        </svg>
                    </div>
                </div>

                {/* 2. Bazaar Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between min-h-[126px] sm:min-h-[140px] md:min-h-[160px] hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-2xs">
                        <IconShoppingCart size={20} stroke={2.2} />
                    </div>
                    <div className="z-10 mt-2">
                        <p className="text-xs font-semibold text-gray-500">Bazaar</p>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 mt-0.5 leading-none">
                            ৳ {isLoading ? "..." : (stats.totalBazaarToday ?? 0).toLocaleString()}
                        </p>
                    </div>
                    {/* Bottom soft peach/orange wave illustration */}
                    <div className="absolute right-0 bottom-0 pointer-events-none w-28 md:w-36 h-16 md:h-20 opacity-80">
                        <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M0 60C35 42 65 52 100 28V60H0Z" fill="#FFEDD5" fillOpacity="0.75"/>
                            <path d="M45 60C70 50 85 52 100 40V60H45Z" fill="#FDBA74" fillOpacity="0.45"/>
                        </svg>
                    </div>
                </div>

                {/* 3. Meal Fund Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between min-h-[126px] sm:min-h-[140px] md:min-h-[160px] hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-2xs">
                        <IconToolsKitchen2 size={20} stroke={2.2} />
                    </div>
                    <div className="z-10 mt-2">
                        <p className="text-xs font-semibold text-gray-500">Meal Fund</p>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 mt-0.5 leading-none">
                            ৳ {isLoading ? "..." : (stats.mealFund ?? 0).toLocaleString()}
                        </p>
                    </div>
                    {/* Bottom soft teal/emerald wave illustration */}
                    <div className="absolute right-0 bottom-0 pointer-events-none w-28 md:w-36 h-16 md:h-20 opacity-80">
                        <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M0 60C30 40 60 55 100 25V60H0Z" fill="#CCFBF1" fillOpacity="0.75"/>
                            <path d="M40 60C65 48 80 50 100 38V60H40Z" fill="#99F6E4" fillOpacity="0.5"/>
                            <path d="M75 35C80 25 92 28 95 35C88 40 78 38 75 35Z" fill="#14B8A6" fillOpacity="0.4"/>
                        </svg>
                    </div>
                </div>

                {/* 4. Mess Fund Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between min-h-[126px] sm:min-h-[140px] md:min-h-[160px] hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                        <Coins size={20} strokeWidth={2.2} />
                    </div>
                    <div className="z-10 mt-2">
                        <p className="text-xs font-semibold text-gray-500">Mess Fund</p>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 mt-0.5 leading-none">
                            ৳ {isLoading ? "..." : (stats.messFund ?? 0).toLocaleString()}
                        </p>
                    </div>
                    {/* Bottom soft lavender/purple wave illustration */}
                    <div className="absolute right-0 bottom-0 pointer-events-none w-28 md:w-36 h-16 md:h-20 opacity-80">
                        <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M0 60C30 40 60 55 100 25V60H0Z" fill="#EDE9FE" fillOpacity="0.75"/>
                            <path d="M40 60C65 48 80 50 100 38V60H40Z" fill="#DDD6FE" fillOpacity="0.5"/>
                            <path d="M75 35C80 25 92 28 95 35C88 40 78 38 75 35Z" fill="#8B5CF6" fillOpacity="0.4"/>
                        </svg>
                    </div>
                </div>

                {/* 5. Market Duty Hero Card */}
                <div className="col-span-2 sm:col-span-1 bg-gradient-to-b from-slate-950 via-[#0B132B] to-slate-950 text-white rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[126px] sm:min-h-[140px] md:min-h-[160px] hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between gap-2 relative z-10">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/10 text-orange-400 flex items-center justify-center border border-white/10 shrink-0">
                            <IconShoppingCart size={20} stroke={2.2} />
                        </div>
                        <div className={`${(stats as any).marketDutyStatus === "done" ? "bg-emerald-600" : "bg-[#00B050]"} text-white text-[10px] md:text-xs font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 shadow-sm shrink-0`}>
                            <IconCheck size={12} stroke={3} />
                            <span>{(stats as any).marketDutyStatus === "done" ? "Done" : "Assigned"}</span>
                        </div>
                    </div>

                    <div className="z-10 mt-2">
                        <p className="text-xs text-gray-400 font-medium">Market Duty</p>
                        <p className="text-base sm:text-lg md:text-xl font-black text-white mt-0.5 tracking-tight truncate flex items-center gap-1.5" title={stats.marketDuty || "Unassigned"}>
                            <span>{stats.marketDuty || "Unassigned"}</span>
                            {(stats as any).marketDutyStatus === "done" && (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold">Done ✅</span>
                            )}
                        </p>
                    </div>

                    {/* Bottom subtle dark orange/amber organic curve */}
                    <div className="absolute inset-x-0 bottom-0 pointer-events-none h-6 overflow-hidden">
                        <svg viewBox="0 0 400 30" fill="none" preserveAspectRatio="none" className="w-full h-full">
                            <path d="M0 30C120 10 280 25 400 5V30H0Z" fill="#FF6B00" fillOpacity="0.25"/>
                            <path d="M0 30C150 18 250 12 400 15V30H0Z" fill="#EA580C" fillOpacity="0.35"/>
                        </svg>
                    </div>
                </div>
            </div>

            {/* ─── E. 4 Action & Management Cards (2x2 on mobile, 4-col row on desktop) ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 md:mb-6">
                
                {/* 1. Bazaar Requests Card */}
                <Link 
                    href="/bazaar-requests"
                    className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[135px] md:min-h-[155px]"
                >
                    <div>
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-2xs">
                            <IconCalendar size={20} stroke={2.2} />
                        </div>
                        <h3 className="text-sm md:text-base font-extrabold text-slate-900 mt-2.5 truncate group-hover:text-[#FF6B00] transition-colors">
                            Bazaar Requests
                        </h3>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-1">
                        <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2.5 py-1 rounded-xl flex items-center gap-1 text-xs font-bold">
                            <IconClock size={13} stroke={2.5} />
                            <span>{pendingBazaarSchedules.length}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <IconChevronRight size={16} stroke={2.5} />
                        </div>
                    </div>
                </Link>

                {/* 2. Payments Card */}
                <Link 
                    href="/payments"
                    className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[135px] md:min-h-[155px]"
                >
                    <div>
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-2xs">
                            <IconCreditCard size={20} stroke={2.2} />
                        </div>
                        <h3 className="text-sm md:text-base font-extrabold text-slate-900 mt-2.5 truncate group-hover:text-blue-600 transition-colors">
                            Payments
                        </h3>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-1">
                        <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2.5 py-1 rounded-xl flex items-center gap-1 text-xs font-bold">
                            <IconClock size={13} stroke={2.5} />
                            <span>{pendingDeposits.length}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <IconChevronRight size={16} stroke={2.5} />
                        </div>
                    </div>
                </Link>

                {/* 3. Expenses Card */}
                <Link 
                    href="/expenses"
                    className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[135px] md:min-h-[155px]"
                >
                    <div>
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-2xs">
                            <IconShoppingCart size={20} stroke={2.2} />
                        </div>
                        <h3 className="text-sm md:text-base font-extrabold text-slate-900 mt-2.5 truncate group-hover:text-[#FF6B00] transition-colors">
                            Expenses
                        </h3>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-1">
                        <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2.5 py-1 rounded-xl flex items-center gap-1 text-xs font-bold">
                            <IconClock size={13} stroke={2.5} />
                            <span>{pendingExpenses.length}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <IconChevronRight size={16} stroke={2.5} />
                        </div>
                    </div>
                </Link>

                {/* 4. Guest Meals Card */}
                <Link 
                    href="/guest-meals"
                    className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[135px] md:min-h-[155px]"
                >
                    <div>
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                            <IconUsers size={20} stroke={2.2} />
                        </div>
                        <h3 className="text-sm md:text-base font-extrabold text-slate-900 mt-2.5 truncate group-hover:text-purple-600 transition-colors">
                            Guest Meals
                        </h3>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-1">
                        <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2.5 py-1 rounded-xl flex items-center gap-1 text-xs font-bold">
                            <IconClock size={13} stroke={2.5} />
                            <span>{pendingGuestMeals.length}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <IconChevronRight size={16} stroke={2.5} />
                        </div>
                    </div>
                </Link>

            </div>

            {/* ─── Notice Board Card ─── */}
            <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow mb-4 md:mb-6">
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
                    {isLoading ? (
                        <div className="py-6 text-center text-xs font-bold text-slate-400">Loading notices...</div>
                    ) : notices.length === 0 ? (
                        <div className="py-7 text-center">
                            <p className="text-xs font-bold text-slate-600">All caught up! 🪶 No new notices.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Check back later for new announcements.</p>
                        </div>
                    ) : (
                        notices.slice(0, 5).map((notice, index) => {
                            const isGuestMeal = notice.type === "guest_meal";
                            const nDate = notice.createdAt 
                                ? new Date(notice.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                                : formattedShortDate;

                            return (
                                <div 
                                    key={notice.id || index}
                                    onClick={() => setSelectedNotice(notice)}
                                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-2xl transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
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

            {/* ─── Desktop-Only Detailed Queue Sections (md: and above) ─── */}
            <div className="hidden md:block space-y-6 pt-2">
                {/* 1. Member Bazaar Date Requests */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5 flex items-center justify-between gap-4 border-b border-gray-100 bg-[#F8FAFC]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                                <IconCalendarUser className="w-5 h-5" stroke={2} />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-gray-900">Member Bazaar Date Requests</h2>
                                <p className="text-xs text-gray-500">Review and approve members' requested bazaar dates for this month.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className="bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-orange-200">
                                <IconClock size={14} /> {pendingBazaarSchedules.length} Pending
                            </span>
                            <Link href="/bazaar-requests" className="text-xs font-bold text-gray-700 hover:text-orange-600 transition-colors flex items-center gap-1 bg-white px-3.5 py-2 rounded-xl border border-gray-200 hover:border-orange-200 shadow-sm">
                                Full Queue <IconArrowRight size={14} />
                            </Link>
                            {selectedSchedules.length > 0 && (
                                <button onClick={handleApproveSelectedSchedules} className="bg-[#00B050] hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer">
                                    <IconCheck size={14} stroke={3} /> Approve Selected ({selectedSchedules.length})
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="p-4 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer" 
                                            checked={pendingBazaarSchedules.length > 0 && selectedSchedules.length === pendingBazaarSchedules.length}
                                            onChange={handleSelectAllSchedules}
                                        />
                                    </th>
                                    <th className="p-4 w-12">#</th>
                                    <th className="p-4">Member</th>
                                    <th className="p-4">Requested Date</th>
                                    <th className="p-4">Note</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-400 font-bold text-sm">Loading...</td>
                                    </tr>
                                ) : pendingBazaarSchedules.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-400 font-bold text-sm">No pending bazaar requests.</td>
                                    </tr>
                                ) : pendingBazaarSchedules.map((item, idx) => (
                                    <tr key={item.id} className={`hover:bg-orange-50/30 transition-colors ${selectedSchedules.includes(item.id) ? 'bg-orange-50/50' : ''}`}>
                                        <td className="p-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer" 
                                                checked={selectedSchedules.includes(item.id)}
                                                onChange={() => handleSelectSchedule(item.id)}
                                            />
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-400">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                                    {item.user?.name?.charAt(0) || 'M'}
                                                </div>
                                                <span className="font-extrabold text-gray-900 text-sm">{item.user?.name || 'Member'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-700">
                                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-600">
                                            {item.note || "I will go to the bazar."}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-orange-100 text-orange-600 px-2.5 py-1 rounded-md text-xs font-bold border border-orange-200">
                                                Pending
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleScheduleAction(item.id, 'Approve')} className="bg-[#00B050] hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer">
                                                    <IconCheck size={14} stroke={3} /> Approve
                                                </button>
                                                <button onClick={() => handleScheduleAction(item.id, 'Reject')} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer">
                                                    <IconX size={14} stroke={3} /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. 3-Column Split for Payments, Expenses, and Guest Meals */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pending Payments */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[420px] hover:shadow-md transition-shadow">
                        <div className="p-4 border-b border-gray-100 bg-[#F8FAFC] flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <IconWallet size={18} stroke={2.5} />
                                </div>
                                <h3 className="text-sm font-extrabold text-gray-900">Payments ({pendingDeposits.length})</h3>
                            </div>
                            <Link href="/payments" className="text-xs font-bold text-blue-600 hover:underline">
                                View
                            </Link>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-3">
                            {pendingDeposits.length === 0 ? (
                                <p className="text-center text-gray-400 font-bold py-12 text-xs">No pending payments.</p>
                            ) : (
                                pendingDeposits.map(item => (
                                    <div key={item.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-sm text-gray-900">{item.user?.name}</span>
                                            <span className="font-black text-emerald-600 text-sm">৳ {item.amount}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium">Method: {item.method}</p>
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={() => handleAction(item.id, 'deposit', 'Reject')} className="flex-1 text-xs font-bold text-red-600 bg-white border border-red-200 py-1.5 rounded-xl hover:bg-red-50">Reject</button>
                                            <button onClick={() => handleAction(item.id, 'deposit', 'Approve')} className="flex-1 text-xs font-bold text-white bg-blue-600 py-1.5 rounded-xl hover:bg-blue-700">Approve</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pending Expenses */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[420px] hover:shadow-md transition-shadow">
                        <div className="p-4 border-b border-gray-100 bg-[#F8FAFC] flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <IconShoppingBag size={18} stroke={2.5} />
                                </div>
                                <h3 className="text-sm font-extrabold text-gray-900">Expenses ({pendingExpenses.length})</h3>
                            </div>
                            <Link href="/expenses" className="text-xs font-bold text-orange-600 hover:underline">
                                View
                            </Link>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-3">
                            {pendingExpenses.length === 0 ? (
                                <p className="text-center text-gray-400 font-bold py-12 text-xs">No pending expenses.</p>
                            ) : (
                                pendingExpenses.map(item => (
                                    <div key={item.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-sm text-gray-900">{item.user?.name}</span>
                                            <span className="font-black text-orange-600 text-sm">৳ {item.amount}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium">{item.description || "Bazaar Expense"}</p>
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={() => handleAction(item.id, 'expense', 'Reject')} className="flex-1 text-xs font-bold text-red-600 bg-white border border-red-200 py-1.5 rounded-xl hover:bg-red-50">Reject</button>
                                            <button onClick={() => handleAction(item.id, 'expense', 'Approve')} className="flex-1 text-xs font-bold text-white bg-[#FF6B00] py-1.5 rounded-xl hover:bg-orange-600">Approve</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pending Guest Meals */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[420px] hover:shadow-md transition-shadow">
                        <div className="p-4 border-b border-gray-100 bg-[#F8FAFC] flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <IconUsers size={18} stroke={2.5} />
                                </div>
                                <h3 className="text-sm font-extrabold text-gray-900">Guest Meals ({pendingGuestMeals.length})</h3>
                            </div>
                            <Link href="/guest-meals" className="text-xs font-bold text-purple-600 hover:underline">
                                View
                            </Link>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-3">
                            {pendingGuestMeals.length === 0 ? (
                                <p className="text-center text-gray-400 font-bold py-12 text-xs">No pending guest meals.</p>
                            ) : (
                                pendingGuestMeals.map(item => (
                                    <div key={item.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-sm text-gray-900">{item.user?.name}</span>
                                            <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">
                                                {item.guests} {item.guests > 1 ? 'Guests' : 'Guest'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium">{item.mealType} • {calculateGuestMealUnits(item.guests, item.mealType)} meals</p>
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={() => handleAction(item.id, 'guestMeal', 'Reject')} className="flex-1 text-xs font-bold text-red-600 bg-white border border-red-200 py-1.5 rounded-xl hover:bg-red-50">Reject</button>
                                            <button onClick={() => handleAction(item.id, 'guestMeal', 'Approve')} className="flex-1 text-xs font-bold text-white bg-emerald-600 py-1.5 rounded-xl hover:bg-emerald-700">Approve</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Mess Members Section (Cards Grid) ─── */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow">
                {/* Header with Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center shrink-0 shadow-sm">
                            <IconUsers size={22} stroke={2.4} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Mess Members</h2>
                                <span className="bg-orange-100 text-[#FF6B00] text-xs font-black px-2.5 py-0.5 rounded-full">
                                    {users.length} Total
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-gray-400 mt-0.5">Active mess members and accounts</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full sm:w-72 relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#FF6B00] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search by name, email, or role..."
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-xs bg-white border-2 border-gray-300 hover:border-gray-400 focus:border-[#FF6B00] rounded-xl outline-none focus:ring-4 focus:ring-orange-500/15 text-gray-900 font-semibold placeholder:text-gray-400 shadow-sm transition-all"
                        />
                        {memberSearchQuery && (
                            <button 
                                onClick={() => setMemberSearchQuery("")} 
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <IconX size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Members Grid */}
                <div className="pt-6">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-400 font-bold">Loading members...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 font-bold">No members found matching your search.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredUsers.map((user, idx) => {
                                const avatar = getMemberAvatarStyle(user.name, idx);
                                const isPositive = (user.balance ?? 0) >= 0;

                                return (
                                    <div 
                                        key={user.id} 
                                        className="bg-white rounded-2xl border border-gray-100/90 p-5 shadow-2xs hover:shadow-md hover:border-orange-200/60 transition-all flex flex-col justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${avatar.bg} ${avatar.text}`}>
                                                        {avatar.initial}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-extrabold text-gray-900 text-sm truncate group-hover:text-[#FF6B00] transition-colors">
                                                            {user.name || "Member"}
                                                        </h3>
                                                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    {renderRoleBadge(user.role)}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-500 font-medium mt-4 pt-3 border-t border-gray-50">
                                                <span className="flex items-center gap-1.5 text-gray-400">
                                                    <IconPhone size={14} className="shrink-0" />
                                                    {user.phone || 'No phone'}
                                                </span>
                                                {user.role === 'suspended' ? (
                                                    <span className="flex items-center gap-1.5 text-rose-600 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded-md">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                                        Suspended
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Financial Badges (Read-Only for Manager) */}
                                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center">
                                            <div className="bg-gray-50 rounded-xl p-2">
                                                <p className="text-[10px] font-bold text-gray-400">Deposit</p>
                                                <p className="text-xs font-black text-gray-800 mt-0.5">৳ {Number(user.deposit || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-2">
                                                <p className="text-[10px] font-bold text-gray-400">Meals</p>
                                                <p className="text-xs font-black text-gray-800 mt-0.5">{user.totalMeals || 0}</p>
                                            </div>
                                            <div className={`rounded-xl p-2 ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                <p className="text-[10px] font-bold opacity-75">Balance</p>
                                                <p className="text-xs font-black mt-0.5">৳ {Math.round(user.balance || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

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

            {/* ─── Modern Confirm Modal ─── */}
            {confirmModalState && (
                <ConfirmModal 
                    isOpen={confirmModalState.isOpen}
                    onClose={() => {
                        if (!isConfirmModalLoading) {
                            setConfirmModalState(null);
                        }
                    }}
                    onConfirm={confirmModalState.onConfirm}
                    type={confirmModalState.type}
                    title={confirmModalState.title}
                    message={confirmModalState.message}
                    confirmText={confirmModalState.confirmText}
                    isLoading={isConfirmModalLoading}
                />
            )}

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
        </div>
    );
}