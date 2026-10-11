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
    IconShoppingBag
} from "@tabler/icons-react";

export default function ManagerDashboard() {
    const [stats, setStats] = useState({
        totalMealsToday: 0,
        totalBazaarToday: 0,
        currentMealRate: 46.15,
        liveMealRate: 46.15,
        marketDuty: "Super Admin",
    });
    const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
    const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
    const [pendingBazaarSchedules, setPendingBazaarSchedules] = useState<any[]>([]);
    const [pendingGuestMeals, setPendingGuestMeals] = useState<any[]>([]);
    const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const today = new Date();
    // Short date for mobile capsule: "Sun, Oct 11"
    const formattedShortDate = today.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch("/api/manager/dashboard");
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
                setSelectedSchedules([]);
            }
        } catch (error) {
            console.error("Error fetching manager dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Actions for desktop inline queues
    const handleAction = async (id: string, type: 'deposit' | 'expense' | 'guestMeal', action: 'Approve' | 'Reject') => {
        const label = type === 'guestMeal' ? 'guest meal request' : type;
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this ${label}?`)) return;

        try {
            const res = await fetch("/api/manager/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, type, action })
            });

            if (res.ok) {
                fetchDashboardData();
            } else {
                alert(`Failed to ${action.toLowerCase()} ${type}.`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleScheduleAction = async (id: string, action: 'Approve' | 'Reject') => {
        const status = action === 'Approve' ? 'approved' : 'rejected';
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this schedule?`)) return;

        try {
            const res = await fetch("/api/members/bazaar-schedule", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scheduleId: id, status })
            });

            if (res.ok) {
                fetchDashboardData();
            } else {
                alert(`Failed to ${action.toLowerCase()} schedule.`);
            }
        } catch (error) {
            console.error(error);
        }
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

    const handleApproveSelectedSchedules = async () => {
        if (selectedSchedules.length === 0) return;
        if (!confirm(`Are you sure you want to approve ${selectedSchedules.length} selected schedule(s)?`)) return;
        
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
            fetchDashboardData();
        } catch (error) {
            console.error(error);
            alert("Failed to approve schedules.");
        }
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
                            ৳ {Number(stats.currentMealRate || stats.liveMealRate || 46.15).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── C. Top 2 Metric Cards (Meals & Bazaar) ─── */}
            <div className="grid grid-cols-2 gap-3">
                {/* 1. Meals Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between min-h-[126px]">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <IconToolsKitchen2 size={20} stroke={2.5} />
                    </div>
                    <div className="z-10 mt-2">
                        <p className="text-xs font-semibold text-gray-500">Meals</p>
                        <p className="text-2xl font-black text-slate-900 mt-0.5 leading-none">
                            {isLoading ? "..." : (stats.totalMealsToday ?? 0)}
                        </p>
                    </div>
                    {/* Bottom soft mint-green wave illustration */}
                    <div className="absolute right-0 bottom-0 pointer-events-none w-28 h-16 opacity-80">
                        <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M0 60C30 40 60 55 100 25V60H0Z" fill="#D1FAE5" fillOpacity="0.7"/>
                            <path d="M40 60C65 48 80 50 100 38V60H40Z" fill="#A7F3D0" fillOpacity="0.5"/>
                            <path d="M75 35C80 25 92 28 95 35C88 40 78 38 75 35Z" fill="#10B981" fillOpacity="0.4"/>
                        </svg>
                    </div>
                </div>

                {/* 2. Bazaar Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between min-h-[126px]">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                        <IconShoppingCart size={20} stroke={2.2} />
                    </div>
                    <div className="z-10 mt-2">
                        <p className="text-xs font-semibold text-gray-500">Bazaar</p>
                        <p className="text-2xl font-black text-slate-900 mt-0.5 leading-none">
                            ৳ {isLoading ? "..." : (stats.totalBazaarToday ?? 0)}
                        </p>
                    </div>
                    {/* Bottom soft peach/orange wave illustration */}
                    <div className="absolute right-0 bottom-0 pointer-events-none w-28 h-16 opacity-80">
                        <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M0 60C35 42 65 52 100 28V60H0Z" fill="#FFEDD5" fillOpacity="0.75"/>
                            <path d="M45 60C70 50 85 52 100 40V60H45Z" fill="#FDBA74" fillOpacity="0.45"/>
                        </svg>
                    </div>
                </div>
            </div>

            {/* ─── D. "Market Duty" Hero Card (Dark Navy Theme) ─── */}
            <div className="bg-gradient-to-r from-slate-950 via-[#0B132B] to-slate-950 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-800 mb-4 relative overflow-hidden">
                <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 text-orange-400 flex items-center justify-center border border-white/10 shrink-0">
                            <IconShoppingCart size={22} stroke={2.2} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-gray-400 font-medium">Market Duty</p>
                            <p className="text-lg font-black text-white mt-0.5 tracking-tight truncate">
                                {stats.marketDuty || "Super Admin"}
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-[#00B050] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm shrink-0">
                        <IconCheck size={14} stroke={3} />
                        <span>Assigned</span>
                    </div>
                </div>

                {/* Bottom subtle dark orange/amber organic curve */}
                <div className="absolute inset-x-0 bottom-0 pointer-events-none h-6 overflow-hidden">
                    <svg viewBox="0 0 400 30" fill="none" preserveAspectRatio="none" className="w-full h-full">
                        <path d="M0 30C120 10 280 25 400 5V30H0Z" fill="#FF6B00" fillOpacity="0.25"/>
                        <path d="M0 30C150 18 250 12 400 15V30H0Z" fill="#EA580C" fillOpacity="0.35"/>
                    </svg>
                </div>
            </div>

            {/* ─── E. 4 Action & Management Cards (2x2 Grid) ─── */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                
                {/* 1. Bazaar Requests Card */}
                <Link 
                    href="/bazaar-requests"
                    className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group"
                >
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                            <IconCalendar size={20} stroke={2.2} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-2.5">
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
                    className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group"
                >
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <IconCreditCard size={20} stroke={2.2} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-2.5">
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
                    className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group"
                >
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                            <IconShoppingCart size={20} stroke={2.2} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-2.5">
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
                    className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group"
                >
                    <div>
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <IconUsers size={20} stroke={2.2} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-2.5">
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

            {/* ─── Desktop-Only Detailed Queue Sections (md: and above) ─── */}
            <div className="hidden md:block space-y-6 pt-2">
                {/* 1. Member Bazaar Date Requests */}
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Pending Payments */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[400px]">
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
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[400px]">
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
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[400px]">
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
                                        <p className="text-[11px] text-gray-400 font-medium">{item.mealType} meal</p>
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

        </div>
    );
}