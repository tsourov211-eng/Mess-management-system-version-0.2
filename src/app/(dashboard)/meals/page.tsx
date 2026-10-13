"use client";

import { useState, useEffect } from "react";
import { 
    IconToolsKitchen2, 
    IconShoppingBag,
    IconDeviceFloppy, 
    IconCheck, 
    IconX 
} from "@tabler/icons-react";
import { 
    Coins, 
    CalendarDays, 
    Calendar, 
    ChevronLeft, 
    ChevronRight 
} from "lucide-react";
import { Skeleton } from "@/components/Skeleton";

interface MemberMeal {
    userId: string;
    name: string;
    role: string;
    image?: string | null;
    breakfast: number | string;
    lunch: number | string;
    dinner: number | string;
    guest: number;
}

export default function FoodManagementPage() {
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    });

    const [members, setMembers] = useState<MemberMeal[]>([]);
    const [stats, setStats] = useState({
        totalMealsToday: 0,
        currentMealRate: 0,
        todayBazaar: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        fetchMeals();
    }, [currentDate]);

    // Automatically dismiss toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const fetchMeals = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/meals?date=${currentDate}`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
                if (data.stats) {
                    setStats(data.stats);
                }
            }
        } catch (error) {
            console.error("Error fetching meals:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMealChange = (index: number, field: "breakfast" | "lunch" | "dinner", val: string) => {
        const updated = [...members];
        const numVal = val === "" ? ("" as any) : Math.max(0, Number(val));
        updated[index] = {
            ...updated[index],
            [field]: numVal,
        };
        setMembers(updated);
    };

    const handlePrevDay = () => {
        const [y, m, d] = currentDate.split("-").map(Number);
        const date = new Date(y, m - 1, d - 1);
        const yearStr = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, "0");
        const dayStr = String(date.getDate()).padStart(2, "0");
        setCurrentDate(`${yearStr}-${monthStr}-${dayStr}`);
    };

    const handleNextDay = () => {
        const [y, m, d] = currentDate.split("-").map(Number);
        const date = new Date(y, m - 1, d + 1);
        const yearStr = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, "0");
        const dayStr = String(date.getDate()).padStart(2, "0");
        setCurrentDate(`${yearStr}-${monthStr}-${dayStr}`);
    };

    const handleSaveMeals = async () => {
        setIsSaving(true);
        try {
            const payload = members.map((m) => ({
                userId: m.userId,
                breakfast: Number(m.breakfast) || 0,
                lunch: Number(m.lunch) || 0,
                dinner: Number(m.dinner) || 0,
                guest: Number(m.guest) || 0,
            }));

            const res = await fetch("/api/meals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: currentDate,
                    meals: payload,
                }),
            });

            if (res.ok) {
                setToast({ type: "success", message: "Today's meals saved successfully!" });
                fetchMeals();
            } else {
                setToast({ type: "error", message: "Failed to save meals!" });
            }
        } catch (error) {
            console.error("Save meals error:", error);
            setToast({ type: "error", message: "Server error occurred!" });
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate Formatted Date string
    const [y, m, d] = currentDate.split("-").map(Number);
    const targetDateObj = new Date(y, m - 1, d);
    const todayObj = new Date();
    const isToday = 
        targetDateObj.getFullYear() === todayObj.getFullYear() &&
        targetDateObj.getMonth() === todayObj.getMonth() &&
        targetDateObj.getDate() === todayObj.getDate();

    const formattedDateText = isToday 
        ? `Today, ${targetDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : targetDateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    // Live total calculation for bottom card footer
    const totalMealsAdded = members.reduce((acc, m) => {
        return acc + (Number(m.breakfast) || 0) + (Number(m.lunch) || 0) + (Number(m.dinner) || 0) + (Number(m.guest) || 0);
    }, 0);

    // Format display names to match reference image (e.g., "Admin", "Rajib", "Sourov", "Tanvir", "tanvir0...")
    const formatMemberName = (fullName: string) => {
        if (!fullName) return "Member";
        const trimmed = fullName.trim();
        if (!trimmed.includes(" ") && trimmed.length > 7) {
            return trimmed.slice(0, 7) + "...";
        }
        return trimmed.split(" ")[0];
    };

    return (
        <div className="w-full pb-36 md:pb-16 animate-in fade-in duration-200">
            
            {/* Toast Alert Notification */}
            {toast && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-top-3 fade-in duration-200 ${
                    toast.type === "success" 
                        ? "bg-emerald-500 text-white border-emerald-400" 
                        : "bg-rose-500 text-white border-rose-400"
                }`}>
                    <IconCheck size={20} stroke={3} className="shrink-0" />
                    <span className="text-xs font-bold flex-1">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="text-white/80 hover:text-white cursor-pointer">
                        <IconX size={16} stroke={2.5} />
                    </button>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                MOBILE VIEW: Matching FoodManagement.png Pixel-for-Pixel
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="md:hidden flex flex-col gap-3.5 w-full max-w-md mx-auto">
                
                {/* 1. Screen Title Section */}
                <div className="pt-1 px-0.5">
                    <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                        Food Management
                    </h1>
                    <p className="text-xs sm:text-[13px] font-medium text-slate-500 leading-snug mt-1">
                        Manage daily meals, track consumption and calculate meal rates.
                    </p>
                </div>

                {/* 2. Top 3 Metric Cards Row */}
                <div className="grid grid-cols-3 gap-2.5">
                    
                    {/* Card 1: Total Meals */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2.5 sm:p-3 border border-gray-100/80 shadow-xs relative overflow-hidden flex flex-col items-center justify-between min-h-[96px] text-center">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFF5ED] text-[#FF6B00] flex items-center justify-center shrink-0 shadow-2xs">
                            <IconToolsKitchen2 size={17} stroke={2.4} />
                        </div>
                        <div className="my-auto py-0.5 z-10">
                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 leading-tight">
                                Total Meals
                            </p>
                            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight mt-0.5">
                                {isLoading ? <Skeleton className="h-4 w-12 rounded mx-auto inline-block" /> : stats.totalMealsToday}
                            </h3>
                        </div>
                        {/* Soft bottom orange gradient wave */}
                        <svg className="absolute inset-x-0 bottom-0 w-full h-8 pointer-events-none" viewBox="0 0 100 35" preserveAspectRatio="none" fill="none">
                            <defs>
                                <linearGradient id="fmOrangeWave" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FB923C" stopOpacity="0.32" />
                                    <stop offset="100%" stopColor="#FED7AA" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>
                            <path d="M0,28 C25,20 60,32 100,12 L100,35 L0,35 Z" fill="url(#fmOrangeWave)" />
                        </svg>
                    </div>

                    {/* Card 2: Meal Rate */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2.5 sm:p-3 border border-gray-100/80 shadow-xs relative overflow-hidden flex flex-col items-center justify-between min-h-[96px] text-center">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0 shadow-2xs">
                            <Coins size={16} strokeWidth={2.4} />
                        </div>
                        <div className="my-auto py-0.5 z-10">
                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 leading-tight">
                                Meal Rate
                            </p>
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight mt-0.5 truncate max-w-full">
                                {isLoading ? <Skeleton className="h-4 w-16 rounded mx-auto inline-block" /> : `Tk ${Number(stats.currentMealRate || 0).toFixed(2)}`}
                            </h3>
                        </div>
                        {/* Soft bottom blue gradient wave */}
                        <svg className="absolute inset-x-0 bottom-0 w-full h-8 pointer-events-none" viewBox="0 0 100 35" preserveAspectRatio="none" fill="none">
                            <defs>
                                <linearGradient id="fmBlueWave" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.32" />
                                    <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>
                            <path d="M0,24 C35,32 65,15 100,20 L100,35 L0,35 Z" fill="url(#fmBlueWave)" />
                        </svg>
                    </div>

                    {/* Card 3: Bazaar */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2.5 sm:p-3 border border-gray-100/80 shadow-xs relative overflow-hidden flex flex-col items-center justify-between min-h-[96px] text-center">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F0FDF4] text-[#10B981] flex items-center justify-center shrink-0 shadow-2xs">
                            <IconShoppingBag size={17} stroke={2.4} />
                        </div>
                        <div className="my-auto py-0.5 z-10">
                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 leading-tight">
                                Bazaar
                            </p>
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight mt-0.5 truncate max-w-full">
                                {isLoading ? <Skeleton className="h-4 w-16 rounded mx-auto inline-block" /> : `Tk ${Math.round(stats.todayBazaar)}`}
                            </h3>
                        </div>
                        {/* Soft bottom green gradient wave */}
                        <svg className="absolute inset-x-0 bottom-0 w-full h-8 pointer-events-none" viewBox="0 0 100 35" preserveAspectRatio="none" fill="none">
                            <defs>
                                <linearGradient id="fmGreenWave" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.32" />
                                    <stop offset="100%" stopColor="#BBF7D0" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>
                            <path d="M0,26 C30,18 70,30 100,16 L100,35 L0,35 Z" fill="url(#fmGreenWave)" />
                        </svg>
                    </div>

                </div>

                {/* 3. Main Card: "Daily Meal Entry" */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm relative overflow-hidden space-y-3.5">
                    
                    {/* Card Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#FFF7ED] border border-orange-100/80 text-[#FF6B00] flex items-center justify-center shadow-2xs shrink-0">
                            <CalendarDays size={22} strokeWidth={2.3} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base sm:text-[17px] font-black text-slate-900 tracking-tight leading-tight">
                                Daily Meal Entry
                            </h2>
                            <p className="text-xs font-semibold text-slate-400 leading-tight mt-0.5">
                                Enter meal counts for members
                            </p>
                        </div>
                    </div>

                    {/* Date Selector Pill */}
                    <div className="relative bg-white border border-gray-100/90 rounded-2xl p-1.5 flex items-center justify-between shadow-2xs">
                        <button
                            onClick={handlePrevDay}
                            className="w-8 h-8 rounded-xl bg-gray-50/80 hover:bg-gray-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
                            aria-label="Previous day"
                        >
                            <ChevronLeft size={16} strokeWidth={2.8} />
                        </button>

                        <div className="flex items-center gap-2 text-xs sm:text-[13px] font-black text-slate-900">
                            <Calendar size={15} className="text-slate-700" strokeWidth={2.2} />
                            <span>{formattedDateText}</span>
                        </div>

                        <button
                            onClick={handleNextDay}
                            className="w-8 h-8 rounded-xl bg-gray-50/80 hover:bg-gray-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
                            aria-label="Next day"
                        >
                            <ChevronRight size={16} strokeWidth={2.8} />
                        </button>

                        {/* Hidden native date input allowing direct date tap */}
                        <input 
                            type="date"
                            value={currentDate}
                            onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-auto"
                            style={{ clipPath: "polygon(25% 0, 75% 0, 75% 100%, 25% 100%)" }}
                            aria-label="Pick date"
                        />
                    </div>

                    {/* Daily Meal Entry Table (Zero Horizontal Scroll on Mobile) */}
                    <div className="w-full overflow-hidden pt-1">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="border-b border-gray-100/90">
                                    <th className="w-[32%] py-2 pl-1 pr-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left">
                                        MEMBER
                                    </th>
                                    <th className="w-[17%] py-2 px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                        BREAK.
                                    </th>
                                    <th className="w-[17%] py-2 px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                        LUNCH
                                    </th>
                                    <th className="w-[17%] py-2 px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                        DINNER
                                    </th>
                                    <th className="w-[17%] py-2 px-1 text-[11px] font-black text-[#FF6B00] uppercase tracking-wider text-center bg-[#FFF9F5] rounded-t-xl">
                                        TOTAL
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/80">
                                {isLoading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="py-2.5 px-2">
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="w-7 h-7 rounded-full" />
                                                    <Skeleton className="w-16 h-3 rounded" />
                                                </div>
                                            </td>
                                            <td className="py-2 px-1 text-center"><Skeleton className="w-7 h-6 mx-auto rounded-md" /></td>
                                            <td className="py-2 px-1 text-center"><Skeleton className="w-7 h-6 mx-auto rounded-md" /></td>
                                            <td className="py-2 px-1 text-center"><Skeleton className="w-7 h-6 mx-auto rounded-md" /></td>
                                            <td className="py-2 px-1 text-center"><Skeleton className="w-7 h-6 mx-auto rounded-md bg-orange-100" /></td>
                                        </tr>
                                    ))
                                ) : members.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-xs font-bold text-slate-400">
                                            No members found.
                                        </td>
                                    </tr>
                                ) : (
                                    members.map((member, idx) => {
                                        const guestCount = Number(member.guest) || 0;
                                        const rowTotal = (Number(member.breakfast) || 0) + (Number(member.lunch) || 0) + (Number(member.dinner) || 0) + guestCount;
                                        const initial = member.name ? member.name.trim().charAt(0).toUpperCase() : "M";
                                        const displayName = formatMemberName(member.name);
                                        const isLast = idx === members.length - 1;

                                        return (
                                            <tr key={member.userId} className="hover:bg-orange-50/20 transition-colors">
                                                {/* Member Info */}
                                                <td className="py-2.5 pl-1 pr-1">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFEADB] text-[#EA580C] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                            {initial}
                                                        </div>
                                                        <span className="text-xs sm:text-[13px] font-black text-slate-900 truncate leading-tight" title={member.name}>
                                                            {displayName}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Breakfast Input */}
                                                <td className="py-2.5 px-0.5 text-center">
                                                    <input 
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        value={member.breakfast}
                                                        onChange={(e) => handleMealChange(idx, "breakfast", e.target.value)}
                                                        className="w-11 sm:w-12 h-8 bg-white border border-gray-200/90 rounded-xl text-xs font-bold text-center text-slate-800 shadow-2xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </td>

                                                {/* Lunch Input */}
                                                <td className="py-2.5 px-0.5 text-center">
                                                    <input 
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        value={member.lunch}
                                                        onChange={(e) => handleMealChange(idx, "lunch", e.target.value)}
                                                        className="w-11 sm:w-12 h-8 bg-white border border-gray-200/90 rounded-xl text-xs font-bold text-center text-slate-800 shadow-2xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </td>

                                                {/* Dinner Input */}
                                                <td className="py-2.5 px-0.5 text-center">
                                                    <input 
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        value={member.dinner}
                                                        onChange={(e) => handleMealChange(idx, "dinner", e.target.value)}
                                                        className="w-11 sm:w-12 h-8 bg-white border border-gray-200/90 rounded-xl text-xs font-bold text-center text-slate-800 shadow-2xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all mx-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </td>

                                                {/* Total Column (Warm shaded vertical column matching FoodManagement.png) */}
                                                <td className={`py-2.5 px-1 text-center bg-[#FFF9F5] ${isLast ? "rounded-b-xl" : ""}`}>
                                                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                                        {rowTotal.toFixed(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Card Footer Total Summary */}
                    <div className="flex items-center justify-end pt-2 pb-0.5 px-1 text-right">
                        <span className="text-xs sm:text-[13px] font-bold text-slate-500">
                            Total Meals Added:
                        </span>
                        <span className="text-base sm:text-lg font-black text-[#FF6B00] ml-1.5 tracking-tight">
                            {totalMealsAdded.toFixed(1)}
                        </span>
                    </div>

                </div>

                {/* 4. "Save Today's Meals" Button */}
                <button
                    onClick={handleSaveMeals}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-[#FF6B00] to-[#F97316] hover:opacity-95 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/30 text-sm sm:text-base active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 mb-8"
                >
                    <IconDeviceFloppy size={20} stroke={2.5} />
                    <span>{isSaving ? "Saving..." : "Save Today's Meals"}</span>
                </button>

            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                DESKTOP VIEW: Spacious Responsive Layout
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="hidden md:block max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex items-center justify-between gap-5 bg-white/95 backdrop-blur-sm p-6 lg:p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Food Management</h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium">Manage daily meals, track consumption and calculate meal rates.</p>
                    </div>

                    <button
                        onClick={handleSaveMeals}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[#FF6B00] to-[#F97316] hover:opacity-95 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-md shadow-orange-500/25 text-sm transition-all cursor-pointer disabled:opacity-60"
                    >
                        <IconDeviceFloppy size={18} stroke={2.5} />
                        <span>{isSaving ? "Saving..." : "Save Today's Meals"}</span>
                    </button>
                </div>

                {/* Quick Stats Grid with Pastel Highlights & Subtle Curves */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Meals */}
                    <div className="bg-gradient-to-b from-[#FFF5ED] via-[#FFEADB] to-[#FED7AA]/50 p-5 lg:p-6 rounded-3xl border border-orange-200/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[148px]">
                        <svg className="absolute -bottom-1 -right-1 w-32 h-18 pointer-events-none opacity-30 text-orange-400" viewBox="0 0 100 50" fill="currentColor">
                            <path d="M0,35 C20,20 50,45 80,25 C90,18 95,20 100,15 L100,50 L0,50 Z" />
                        </svg>

                        <div className="flex items-center justify-between z-10">
                            <div className="w-11 h-11 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                                <IconToolsKitchen2 size={22} stroke={2.2} />
                            </div>
                        </div>
                        <div className="z-10 mt-3">
                            <p className="text-xs font-bold text-gray-500">Total Meals Today</p>
                            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 mt-0.5">{stats.totalMealsToday}</h3>
                        </div>
                    </div>

                    {/* Live Meal Rate */}
                    <div className="bg-gradient-to-b from-[#FAF5FF] via-[#F3E8FF] to-[#E9D5FF]/50 p-5 lg:p-6 rounded-3xl border border-purple-200/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[148px]">
                        <svg className="absolute -bottom-1 -right-1 w-32 h-18 pointer-events-none opacity-30 text-purple-400" viewBox="0 0 100 50" fill="currentColor">
                            <path d="M0,35 C20,20 50,45 80,25 C90,18 95,20 100,15 L100,50 L0,50 Z" />
                        </svg>

                        <div className="flex items-center justify-between z-10">
                            <div className="w-11 h-11 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
                                <Coins size={22} strokeWidth={2.2} />
                            </div>
                        </div>
                        <div className="z-10 mt-3">
                            <p className="text-xs font-bold text-gray-500">Live Meal Rate</p>
                            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 mt-0.5">Tk {Number(stats.currentMealRate || 0).toFixed(2)}</h3>
                        </div>
                    </div>

                    {/* Today's Bazaar */}
                    <div className="bg-gradient-to-b from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0]/50 p-5 lg:p-6 rounded-3xl border border-emerald-200/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[148px]">
                        <svg className="absolute -bottom-1 -right-1 w-32 h-18 pointer-events-none opacity-30 text-emerald-400" viewBox="0 0 100 50" fill="currentColor">
                            <path d="M0,35 C20,20 50,45 80,25 C90,18 95,20 100,15 L100,50 L0,50 Z" />
                        </svg>

                        <div className="flex items-center justify-between z-10">
                            <div className="w-11 h-11 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                                <IconShoppingBag size={22} stroke={2.2} />
                            </div>
                        </div>
                        <div className="z-10 mt-3">
                            <p className="text-xs font-bold text-gray-500">Today's Bazaar</p>
                            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 mt-0.5">Tk {Math.round(stats.todayBazaar)}</h3>
                        </div>
                    </div>
                </div>

                {/* Daily Meal Entry Card (Desktop) */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    
                    {/* Date Navigation Bar */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200/80 text-[#FF6B00] flex items-center justify-center shadow-2xs">
                                <CalendarDays size={22} strokeWidth={2.2} />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-900">Daily Meal Entry</h2>
                                <p className="text-xs font-semibold text-slate-400 mt-0.5">Enter meal counts for members</p>
                            </div>
                        </div>

                        <div className="flex items-center bg-white border border-gray-200/90 rounded-2xl p-1.5 shadow-2xs">
                            <button
                                onClick={handlePrevDay}
                                className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                <ChevronLeft size={16} strokeWidth={2.8} />
                            </button>
                            <span className="px-5 text-sm font-black text-slate-800">
                                {formattedDateText}
                            </span>
                            <button
                                onClick={handleNextDay}
                                className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                <ChevronRight size={16} strokeWidth={2.8} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-white">
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Member</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Breakfast</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Lunch</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Dinner</th>
                                    <th className="py-4 px-6 text-xs font-black text-[#FF6B00] uppercase tracking-wider text-center bg-orange-50/40">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="w-10 h-10 rounded-2xl" />
                                                    <div className="space-y-1">
                                                        <Skeleton className="w-28 h-4 rounded" />
                                                        <Skeleton className="w-16 h-3 rounded bg-slate-100" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="w-16 h-8 mx-auto rounded-xl" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="w-16 h-8 mx-auto rounded-xl" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="w-16 h-8 mx-auto rounded-xl" /></td>
                                            <td className="py-4 px-6 text-center"><Skeleton className="w-16 h-8 mx-auto rounded-xl bg-orange-100" /></td>
                                        </tr>
                                    ))
                                ) : members.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-sm font-bold text-slate-400">
                                            No members registered.
                                        </td>
                                    </tr>
                                ) : (
                                    members.map((member, idx) => {
                                        const guestCount = Number(member.guest) || 0;
                                        const rowTotal = (Number(member.breakfast) || 0) + (Number(member.lunch) || 0) + (Number(member.dinner) || 0) + guestCount;
                                        const initial = member.name ? member.name.trim().charAt(0).toUpperCase() : "M";

                                        return (
                                            <tr key={member.userId} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3.5 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-[#FFEADB] text-[#EA580C] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                                            {initial}
                                                        </div>
                                                        <span className="font-extrabold text-slate-900 text-sm">
                                                            {member.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-6 text-center">
                                                    <input 
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        value={member.breakfast}
                                                        onChange={(e) => handleMealChange(idx, "breakfast", e.target.value)}
                                                        className="w-16 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-center text-slate-800 shadow-2xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all mx-auto"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-6 text-center">
                                                    <input 
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        value={member.lunch}
                                                        onChange={(e) => handleMealChange(idx, "lunch", e.target.value)}
                                                        className="w-16 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-center text-slate-800 shadow-2xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all mx-auto"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-6 text-center">
                                                    <input 
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        value={member.dinner}
                                                        onChange={(e) => handleMealChange(idx, "dinner", e.target.value)}
                                                        className="w-16 py-1.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-center text-slate-800 shadow-2xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all mx-auto"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-6 text-center bg-orange-50/30">
                                                    <span className="font-extrabold text-slate-900 text-base">
                                                        {rowTotal.toFixed(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50/70 p-5 border-t border-gray-100 flex items-center justify-between px-8">
                        <span className="text-xs font-bold text-slate-400">
                            Showing {members.length} members
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-600">Total Meals Added:</span>
                            <span className="text-xl font-black text-[#FF6B00]">{totalMealsAdded.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}