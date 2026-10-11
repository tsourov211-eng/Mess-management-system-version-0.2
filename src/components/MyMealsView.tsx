"use client";

import { useState, useEffect } from "react";
import { 
    IconToolsKitchen2, 
    IconCalendarEvent, 
    IconCalendar,
    IconUsers, 
    IconPlus, 
    IconMinus,
    IconClock, 
    IconCheck, 
    IconX,
    IconHistory,
    IconDeviceFloppy,
    IconChartBar,
    IconSend,
    IconSunHigh,
    IconMoonStars,
    IconFileText,
    IconChevronDown,
    IconAlertCircle
} from "@tabler/icons-react";

export default function MyMealsView() {
    // ─── Current Dates ───
    const today = new Date();
    const todayFormatted = today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const todayIso = today.toISOString().split("T")[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const tomorrowIso = tomorrow.toISOString().split("T")[0];

    // ─── State: Request Guest Meal Form ───
    const [date, setDate] = useState(tomorrowIso);
    const [mealType, setMealType] = useState("Lunch Only");
    const [guestCount, setGuestCount] = useState<number>(1); 
    const [guestNote, setGuestNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── State: Today's Live Meal Toggles ───
    const [todayStatus, setTodayStatus] = useState({ breakfast: "OFF", lunch: "OFF", dinner: "OFF" });
    const [isTogglingMeal, setIsTogglingMeal] = useState<string | null>(null);

    // ─── State: Tomorrow's Meal Plan ───
    const [planBreakfast, setPlanBreakfast] = useState("0.5");
    const [planLunch, setPlanLunch] = useState("1");
    const [planDinner, setPlanDinner] = useState("1");
    const [planGuest, setPlanGuest] = useState("0");
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    // ─── State: Histories & Lists ───
    const [guestHistory, setGuestHistory] = useState<any[]>([]);
    const [monthlyMeals, setMonthlyMeals] = useState<any[]>([]);
    const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [showAllGuestModal, setShowAllGuestModal] = useState(false);

    // ─── In-App Toast ───
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    // Format selected month e.g. "October 2026"
    const getFormattedMonth = (ymStr: string) => {
        try {
            const [y, m] = ymStr.split("-");
            const d = new Date(parseInt(y), parseInt(m) - 1, 1);
            return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        } catch {
            return ymStr;
        }
    };

    // Format guest form date e.g. "Mon, Oct 12"
    const getFormattedFormDate = (dStr: string) => {
        if (!dStr) return "Select Date";
        try {
            const parts = dStr.split("-");
            if (parts.length === 3) {
                const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            }
            return dStr;
        } catch {
            return dStr;
        }
    };

    // ─── Fetch Data ───
    useEffect(() => {
        fetchMealsData();
    }, [selectedMonthYear]);

    const fetchMealsData = async () => {
        setIsHistoryLoading(true);
        try {
            const [year, month] = selectedMonthYear.split("-");
            const res = await fetch(`/api/members/my-meals?month=${month}&year=${year}`);
            if (res.ok) {
                const data = await res.json();
                if (data.todayStatus) setTodayStatus(data.todayStatus);
                if (data.tomorrowPlan) {
                    setPlanBreakfast(data.tomorrowPlan.breakfast?.toString() ?? "0.5");
                    setPlanLunch(data.tomorrowPlan.lunch?.toString() ?? "1");
                    setPlanDinner(data.tomorrowPlan.dinner?.toString() ?? "1");
                    setPlanGuest(data.tomorrowPlan.guest?.toString() ?? "0");
                }
                if (data.guestRequests) setGuestHistory(data.guestRequests);
                if (data.monthlyMeals) setMonthlyMeals(data.monthlyMeals);
            }
        } catch (error) {
            console.error("Error fetching meals data:", error);
        } finally {
            setIsLoading(false);
            setIsHistoryLoading(false);
        }
    };

    // ─── Live Toggle for Today's Meal ───
    const handleToggleTodayMeal = async (meal: "breakfast" | "lunch" | "dinner") => {
        const currentVal = todayStatus[meal];
        const nextVal = currentVal === "ON" ? "OFF" : "ON";

        // Optimistic UI update
        setTodayStatus((prev) => ({ ...prev, [meal]: nextVal }));
        setIsTogglingMeal(meal);

        try {
            const res = await fetch("/api/members/my-meals", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meal, enabled: nextVal === "ON" }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                if (data.todayStatus) setTodayStatus(data.todayStatus);
                showToast(`Today's ${meal} meal turned ${nextVal}!`, "success");
            } else {
                // Revert on error
                setTodayStatus((prev) => ({ ...prev, [meal]: currentVal }));
                showToast(data.error || `Failed to update ${meal} meal.`, "error");
            }
        } catch (error) {
            // Revert on error
            setTodayStatus((prev) => ({ ...prev, [meal]: currentVal }));
            showToast("Network error while toggling meal.", "error");
        } finally {
            setIsTogglingMeal(null);
        }
    };

    // ─── Request Guest Meal Submit ───
    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date) {
            showToast("Please choose a date for the guest meal.", "error");
            return;
        }
        if (!guestCount || guestCount < 1) {
            showToast("Number of guests must be at least 1.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/members/my-meals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    date, 
                    mealType, 
                    guests: guestCount,
                    note: guestNote.trim() || undefined
                })
            });

            const data = await res.json();
            if (res.ok) {
                showToast("Guest meal requested successfully! Waiting for approval.", "success");
                setGuestNote("");
                fetchMealsData();
            } else {
                showToast(data.error || "Failed to submit request.", "error");
            }
        } catch (error) {
            showToast("An error occurred while submitting request.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Save Tomorrow's Meal Plan ───
    const handleSaveMealPlan = async () => {
        setIsSavingPlan(true);
        try {
            const nextDay = new Date();
            nextDay.setDate(nextDay.getDate() + 1);

            const res = await fetch("/api/members/meal-plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: nextDay.toISOString(),
                    breakfast: planBreakfast,
                    lunch: planLunch,
                    dinner: planDinner,
                    guest: planGuest,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                showToast("Tomorrow's meal plan saved successfully!", "success");
            } else {
                showToast(data.error || "Failed to save meal plan.", "error");
            }
        } catch (error) {
            showToast("Network error while saving plan.", "error");
        } finally {
            setIsSavingPlan(false);
        }
    };

    // Helper for adjusting meal plan counts
    const adjustPlan = (
        setter: React.Dispatch<React.SetStateAction<string>>,
        delta: number,
        min: number = 0,
        max: number = 10,
        step: number = 0.5
    ) => {
        setter((prev) => {
            const num = Number(prev) || 0;
            const updated = Math.min(max, Math.max(min, Math.round((num + delta) * 10) / 10));
            return updated.toString();
        });
    };

    // ─── Monthly Summary Calculations ───
    const totalMonthlyBfast = monthlyMeals.reduce((sum, meal) => sum + (meal.breakfast || 0), 0);
    const totalMonthlyLunch = monthlyMeals.reduce((sum, meal) => sum + (meal.lunch || 0), 0);
    const totalMonthlyDinner = monthlyMeals.reduce((sum, meal) => sum + (meal.dinner || 0), 0);
    const totalMonthlyGuest = monthlyMeals.reduce((sum, meal) => sum + (meal.guest || 0), 0);
    const grandTotalMonthly = totalMonthlyBfast + totalMonthlyLunch + totalMonthlyDinner + totalMonthlyGuest;

    return (
        <div className="max-w-md sm:max-w-xl mx-auto space-y-4 pb-12 animate-in fade-in duration-300">
            
            {/* ─── Floating In-App Toast ─── */}
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

            {/* ─── Screen Header ─── */}
            <div className="pt-1 pb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Meals</h1>
                <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">Manage your meals and request guest meals</p>
            </div>

            {/* ──────────────────────────────────────────────────────────
                CARD A: TODAY'S MEAL (Live Meal Toggles)
            ────────────────────────────────────────────────────────── */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-sm shadow-orange-500/20 shrink-0">
                            <IconCalendarEvent size={20} stroke={2.2} />
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">Today's Meal</h2>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                        <IconCalendar size={13} className="text-slate-500" stroke={2.5} />
                        <span>{todayFormatted}</span>
                    </div>
                </div>

                {/* 3 Meal Toggle Columns */}
                <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-2.5 sm:p-3 mt-3.5 grid grid-cols-3 divide-x divide-slate-200/80">
                    
                    {/* 1. Breakfast */}
                    <div className="flex items-center justify-between px-1 sm:px-2 gap-1 sm:gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100/70 text-amber-500 flex items-center justify-center shrink-0">
                                <IconSunHigh size={17} stroke={2.5} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight truncate">Breakfast</p>
                                <p className={`text-[10px] sm:text-xs font-black leading-tight ${todayStatus.breakfast === "ON" ? "text-emerald-500" : "text-rose-500"}`}>
                                    {todayStatus.breakfast}
                                </p>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={() => handleToggleTodayMeal("breakfast")}
                            disabled={isTogglingMeal === "breakfast"}
                            aria-label="Toggle Breakfast"
                            className={`w-8 sm:w-9 h-4.5 sm:h-5 rounded-full p-0.5 transition-colors relative cursor-pointer shrink-0 ${
                                todayStatus.breakfast === "ON" ? "bg-[#FF6B00]" : "bg-slate-300"
                            }`}
                        >
                            <div className={`w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-white transition-transform shadow-sm ${
                                todayStatus.breakfast === "ON" ? "translate-x-3.5 sm:translate-x-4" : "translate-x-0"
                            }`} />
                        </button>
                    </div>

                    {/* 2. Lunch */}
                    <div className="flex items-center justify-between px-1.5 sm:px-2 gap-1 sm:gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100/70 text-amber-500 flex items-center justify-center shrink-0">
                                <IconSunHigh size={17} stroke={2.5} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight truncate">Lunch</p>
                                <p className={`text-[10px] sm:text-xs font-black leading-tight ${todayStatus.lunch === "ON" ? "text-emerald-500" : "text-rose-500"}`}>
                                    {todayStatus.lunch}
                                </p>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={() => handleToggleTodayMeal("lunch")}
                            disabled={isTogglingMeal === "lunch"}
                            aria-label="Toggle Lunch"
                            className={`w-8 sm:w-9 h-4.5 sm:h-5 rounded-full p-0.5 transition-colors relative cursor-pointer shrink-0 ${
                                todayStatus.lunch === "ON" ? "bg-[#FF6B00]" : "bg-slate-300"
                            }`}
                        >
                            <div className={`w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-white transition-transform shadow-sm ${
                                todayStatus.lunch === "ON" ? "translate-x-3.5 sm:translate-x-4" : "translate-x-0"
                            }`} />
                        </button>
                    </div>

                    {/* 3. Dinner */}
                    <div className="flex items-center justify-between px-1.5 sm:px-2 gap-1 sm:gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-100/70 text-purple-600 flex items-center justify-center shrink-0">
                                <IconMoonStars size={17} stroke={2.2} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight truncate">Dinner</p>
                                <p className={`text-[10px] sm:text-xs font-black leading-tight ${todayStatus.dinner === "ON" ? "text-emerald-500" : "text-rose-500"}`}>
                                    {todayStatus.dinner}
                                </p>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={() => handleToggleTodayMeal("dinner")}
                            disabled={isTogglingMeal === "dinner"}
                            aria-label="Toggle Dinner"
                            className={`w-8 sm:w-9 h-4.5 sm:h-5 rounded-full p-0.5 transition-colors relative cursor-pointer shrink-0 ${
                                todayStatus.dinner === "ON" ? "bg-[#FF6B00]" : "bg-slate-300"
                            }`}
                        >
                            <div className={`w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-white transition-transform shadow-sm ${
                                todayStatus.dinner === "ON" ? "translate-x-3.5 sm:translate-x-4" : "translate-x-0"
                            }`} />
                        </button>
                    </div>

                </div>
            </div>

            {/* ──────────────────────────────────────────────────────────
                CARD B: REQUEST GUEST MEAL (Guest Request Form)
            ────────────────────────────────────────────────────────── */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center shadow-sm shrink-0">
                        <IconUsers size={20} stroke={2.2} />
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">Request Guest Meal</h2>
                </div>

                {/* 2x2 Form */}
                <form onSubmit={handleRequestSubmit} className="mt-3.5 space-y-3">
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                        
                        {/* 1. Date (Top Left) */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 text-orange-500 border border-orange-100/80 flex items-center justify-center shrink-0">
                                    <IconCalendarEvent size={18} stroke={2.2} />
                                </div>
                                
                                <div className="relative flex-1">
                                    <div className="w-full bg-slate-50/90 border border-slate-200/80 rounded-2xl px-2.5 sm:px-3 py-2 sm:py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-100/80 transition-colors pointer-events-none">
                                        <span className="truncate">{getFormattedFormDate(date)}</span>
                                        <IconChevronDown size={14} className="text-slate-400 shrink-0 ml-1" stroke={2.5} />
                                    </div>
                                    <input 
                                        type="date" 
                                        value={date} 
                                        min={todayIso}
                                        onChange={(e) => setDate(e.target.value)} 
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Meal Type (Top Right) */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Meal Type</label>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 text-orange-500 border border-orange-100/80 flex items-center justify-center shrink-0">
                                    <IconToolsKitchen2 size={18} stroke={2.2} />
                                </div>

                                <div className="relative flex-1">
                                    <div className="w-full bg-slate-50/90 border border-slate-200/80 rounded-2xl px-2.5 sm:px-3 py-2 sm:py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-100/80 transition-colors pointer-events-none">
                                        <span className="truncate">{mealType}</span>
                                        <IconChevronDown size={14} className="text-slate-400 shrink-0 ml-1" stroke={2.5} />
                                    </div>
                                    <select 
                                        value={mealType} 
                                        onChange={(e) => setMealType(e.target.value)}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                    >
                                        <option value="Lunch Only">Lunch Only</option>
                                        <option value="Breakfast Only">Breakfast Only</option>
                                        <option value="Dinner Only">Dinner Only</option>
                                        <option value="All Meals">All Meals</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 3. Guests Stepper (Bottom Left) */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Guests</label>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 text-orange-500 border border-orange-100/80 flex items-center justify-center shrink-0">
                                    <IconUsers size={18} stroke={2.2} />
                                </div>

                                <div className="flex-1 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-1 flex items-center justify-between shadow-2xs">
                                    <button 
                                        type="button"
                                        onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-700 font-black flex items-center justify-center transition-colors cursor-pointer text-sm shrink-0"
                                    >
                                        <IconMinus size={14} stroke={3} />
                                    </button>
                                    <span className="text-xs sm:text-sm font-black text-slate-900 px-2">{guestCount}</span>
                                    <button 
                                        type="button"
                                        onClick={() => setGuestCount((prev) => Math.min(50, prev + 1))}
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-600 font-black flex items-center justify-center transition-colors cursor-pointer text-sm shrink-0"
                                    >
                                        <IconPlus size={14} stroke={3} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4. Note (Bottom Right) */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Note (Optional)</label>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 text-orange-500 border border-orange-100/80 flex items-center justify-center shrink-0">
                                    <IconFileText size={18} stroke={2.2} />
                                </div>

                                <input 
                                    type="text" 
                                    value={guestNote} 
                                    onChange={(e) => setGuestNote(e.target.value)} 
                                    placeholder="Add a note..." 
                                    className="flex-1 min-w-0 bg-slate-50/90 border border-slate-200/80 rounded-2xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs transition-all"
                                />
                            </div>
                        </div>

                    </div>

                    {/* Submit Request Button */}
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-orange-500/30 mt-3.5 text-sm cursor-pointer transition-all disabled:opacity-50"
                    >
                        <IconSend size={16} stroke={2.5} />
                        <span>{isSubmitting ? "Submitting..." : "Submit Request"}</span>
                    </button>
                </form>
            </div>

            {/* ──────────────────────────────────────────────────────────
                CARD C: TOMORROW'S MEAL PLAN (Default Next-Day Setup)
            ────────────────────────────────────────────────────────── */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center shadow-sm shrink-0">
                            <IconCalendarEvent size={20} stroke={2.2} />
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">Tomorrow's Meal Plan</h2>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                        <IconCalendar size={13} className="text-slate-500" stroke={2.5} />
                        <span>{tomorrowFormatted}</span>
                    </div>
                </div>

                {/* 4 Meal Plan Tiles */}
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5 mt-3.5">
                    
                    {/* 1. Breakfast */}
                    <div className="bg-amber-50/80 border border-amber-100/90 rounded-2xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                        <IconSunHigh size={20} className="text-amber-500 shrink-0" stroke={2.5} />
                        <span className="text-[10px] sm:text-xs font-bold text-slate-600 mt-1">Breakfast</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                            <button 
                                type="button" 
                                onClick={() => adjustPlan(setPlanBreakfast, -0.5, 0, 5, 0.5)}
                                className="w-4 h-4 rounded text-[9px] font-black text-amber-700/60 hover:text-amber-900 hover:bg-amber-200/50 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                -
                            </button>
                            <span className="text-sm sm:text-base font-black text-slate-900 px-0.5">{planBreakfast}</span>
                            <button 
                                type="button" 
                                onClick={() => adjustPlan(setPlanBreakfast, 0.5, 0, 5, 0.5)}
                                className="w-4 h-4 rounded text-[9px] font-black text-amber-700/60 hover:text-amber-900 hover:bg-amber-200/50 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* 2. Lunch */}
                    <div className="bg-blue-50/80 border border-blue-100/90 rounded-2xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                        <IconToolsKitchen2 size={20} className="text-blue-500 shrink-0" stroke={2.5} />
                        <span className="text-[10px] sm:text-xs font-bold text-slate-600 mt-1">Lunch</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                            <button 
                                type="button" 
                                onClick={() => adjustPlan(setPlanLunch, -0.5, 0, 5, 0.5)}
                                className="w-4 h-4 rounded text-[9px] font-black text-blue-700/60 hover:text-blue-900 hover:bg-blue-200/50 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                -
                            </button>
                            <span className="text-sm sm:text-base font-black text-slate-900 px-0.5">{planLunch}</span>
                            <button 
                                type="button" 
                                onClick={() => adjustPlan(setPlanLunch, 0.5, 0, 5, 0.5)}
                                className="w-4 h-4 rounded text-[9px] font-black text-blue-700/60 hover:text-blue-900 hover:bg-blue-200/50 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* 3. Dinner */}
                    <div className="bg-purple-50/80 border border-purple-100/90 rounded-2xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                        <IconMoonStars size={20} className="text-purple-500 shrink-0" stroke={2.2} />
                        <span className="text-[10px] sm:text-xs font-bold text-slate-600 mt-1">Dinner</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                            <button 
                                type="button" 
                                onClick={() => adjustPlan(setPlanDinner, -0.5, 0, 5, 0.5)}
                                className="w-4 h-4 rounded text-[9px] font-black text-purple-700/60 hover:text-purple-900 hover:bg-purple-200/50 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                -
                            </button>
                            <span className="text-sm sm:text-base font-black text-slate-900 px-0.5">{planDinner}</span>
                            <button 
                                type="button" 
                                onClick={() => adjustPlan(setPlanDinner, 0.5, 0, 5, 0.5)}
                                className="w-4 h-4 rounded text-[9px] font-black text-purple-700/60 hover:text-purple-900 hover:bg-purple-200/50 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* 4. Guest */}
                    <div className="bg-emerald-50/80 border border-emerald-100/90 rounded-2xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                        <IconUsers size={20} className="text-emerald-500 shrink-0" stroke={2.2} />
                        <span className="text-[10px] sm:text-xs font-bold text-slate-600 mt-1">Guest</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                            <button 
                                type="button" 
                                onClick={() => adjustPlan(setPlanGuest, -1, 0, 20, 1)}
                                className="w-4 h-4 rounded text-[9px] font-black text-emerald-700/60 hover:text-emerald-900 hover:bg-emerald-200/50 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                -
                            </button>
                            <span className="text-sm sm:text-base font-black text-slate-900 px-0.5">{planGuest}</span>
                            <button 
                                type="button" 
                                onClick={() => adjustPlan(setPlanGuest, 1, 0, 20, 1)}
                                className="w-4 h-4 rounded text-[9px] font-black text-emerald-700/60 hover:text-emerald-900 hover:bg-emerald-200/50 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                </div>

                {/* Save Plan Button */}
                <button 
                    onClick={handleSaveMealPlan} 
                    disabled={isSavingPlan}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 sm:py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm mt-3.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                    <IconDeviceFloppy size={18} stroke={2.2} />
                    <span>{isSavingPlan ? "Saving Plan..." : "Save Plan"}</span>
                </button>
            </div>

            {/* ──────────────────────────────────────────────────────────
                CARD D: GUEST REQUEST HISTORY
            ────────────────────────────────────────────────────────── */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shadow-sm shrink-0">
                            <IconHistory size={20} stroke={2.2} />
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">Guest Request History</h2>
                    </div>

                    <button 
                        onClick={() => setShowAllGuestModal(true)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-0.5 transition-colors cursor-pointer"
                    >
                        <span>View All &gt;</span>
                    </button>
                </div>

                {/* Table Header Bar */}
                <div className="bg-slate-50/90 rounded-xl px-4 py-2 grid grid-cols-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider mt-3.5">
                    <span className="text-left">DATE</span>
                    <span className="text-left">TYPE</span>
                    <span className="text-center">GUESTS</span>
                    <span className="text-right">STATUS</span>
                </div>

                {/* Table Content */}
                <div className="divide-y divide-slate-100 min-h-[70px] flex flex-col justify-center">
                    {isLoading ? (
                        <div className="py-6 text-center text-xs font-bold text-slate-400">Loading requests...</div>
                    ) : guestHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-1.5">
                            <IconFileText size={22} className="text-slate-300" stroke={1.5} />
                            <p className="text-xs font-semibold text-slate-500">No guest requests yet.</p>
                        </div>
                    ) : (
                        guestHistory.slice(0, 4).map((item) => {
                            const reqDate = new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                            return (
                                <div key={item.id} className="grid grid-cols-4 items-center px-4 py-2.5 text-xs hover:bg-slate-50/50 transition-colors">
                                    <span className="font-bold text-slate-800 text-left">{reqDate}</span>
                                    <span className="font-semibold text-slate-700 text-left truncate pr-1">{item.mealType}</span>
                                    <span className="font-black text-slate-800 text-center">{item.guests}</span>
                                    <div className="text-right">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                            item.status === "Approved"
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-200/80"
                                                : item.status === "Rejected"
                                                ? "bg-rose-50 text-rose-600 border-rose-200/80"
                                                : "bg-amber-50 text-amber-600 border-amber-200/80"
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ──────────────────────────────────────────────────────────
                CARD E: MONTHLY MEAL HISTORY
            ────────────────────────────────────────────────────────── */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shadow-sm shrink-0">
                            <IconChartBar size={20} stroke={2.2} />
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">Monthly Meal History</h2>
                    </div>

                    {/* Month Dropdown Pill */}
                    <div className="relative">
                        <div className="bg-white border border-slate-200/90 rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors pointer-events-none">
                            <IconCalendar size={13} className="text-slate-500" stroke={2.5} />
                            <span>{getFormattedMonth(selectedMonthYear)}</span>
                            <IconChevronDown size={13} className="text-slate-400" stroke={2.5} />
                        </div>
                        <input 
                            type="month" 
                            value={selectedMonthYear} 
                            onChange={(e) => setSelectedMonthYear(e.target.value)} 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                        />
                    </div>
                </div>

                {/* Table Header Bar */}
                <div className="bg-slate-50/90 rounded-xl px-2.5 sm:px-3 py-2 grid grid-cols-6 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider text-center mt-3.5">
                    <span className="text-left pl-1">DATE</span>
                    <span>B'FAST</span>
                    <span>LUNCH</span>
                    <span>DINNER</span>
                    <span>GUEST</span>
                    <span>TOTAL</span>
                </div>

                {/* Table Content */}
                <div className="divide-y divide-slate-100 min-h-[70px] flex flex-col justify-center">
                    {isHistoryLoading ? (
                        <div className="py-6 text-center text-xs font-bold text-slate-400">Loading monthly history...</div>
                    ) : monthlyMeals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-1.5">
                            <IconFileText size={22} className="text-slate-300" stroke={1.5} />
                            <p className="text-xs font-semibold text-slate-500">No records found.</p>
                        </div>
                    ) : (
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                            {monthlyMeals.map((meal: any, idx: number) => {
                                const mDate = new Date(meal.date);
                                const fDate = mDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                const isCurDay = mDate.toDateString() === new Date().toDateString();
                                const total = (meal.breakfast || 0) + (meal.lunch || 0) + (meal.dinner || 0) + (meal.guest || 0);

                                return (
                                    <div key={idx} className="grid grid-cols-6 items-center px-2.5 sm:px-3 py-2 text-xs text-center hover:bg-slate-50/50 transition-colors">
                                        <div className="text-left pl-1 font-bold text-slate-800 flex items-center gap-1">
                                            <span>{fDate}</span>
                                            {isCurDay && <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1 py-0.2 rounded font-black">Today</span>}
                                        </div>
                                        <span className="font-semibold text-slate-700">{meal.breakfast || 0}</span>
                                        <span className="font-semibold text-slate-700">{meal.lunch || 0}</span>
                                        <span className="font-semibold text-slate-700">{meal.dinner || 0}</span>
                                        <span className="font-semibold text-orange-600">{meal.guest || 0}</span>
                                        <span className="font-black text-indigo-600">{total}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Total Summary Footer Row */}
                {!isHistoryLoading && monthlyMeals.length > 0 && (
                    <div className="bg-slate-900 text-white rounded-2xl px-2.5 sm:px-3 py-2.5 grid grid-cols-6 text-xs font-black text-center mt-3 shadow-sm">
                        <span className="text-left pl-1 uppercase text-[10px] sm:text-xs text-slate-400">Total</span>
                        <span>{totalMonthlyBfast}</span>
                        <span>{totalMonthlyLunch}</span>
                        <span>{totalMonthlyDinner}</span>
                        <span className="text-amber-400">{totalMonthlyGuest}</span>
                        <span className="text-emerald-400 text-sm sm:text-base">{grandTotalMonthly}</span>
                    </div>
                )}
            </div>

            {/* ─── Modal: View All Guest Requests ─── */}
            {showAllGuestModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowAllGuestModal(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 p-5 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                    <IconHistory size={18} stroke={2.2} />
                                </div>
                                <h3 className="text-base font-black text-slate-900">All Guest Requests</h3>
                            </div>
                            <button 
                                onClick={() => setShowAllGuestModal(false)}
                                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <IconX size={18} stroke={2.5} />
                            </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                            {guestHistory.length === 0 ? (
                                <p className="text-xs text-center py-6 text-slate-400">No guest requests yet.</p>
                            ) : (
                                guestHistory.map((item) => (
                                    <div key={item.id} className="py-2.5 space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-black text-slate-900">
                                                {new Date(item.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                                item.status === "Approved"
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                    : item.status === "Rejected"
                                                    ? "bg-rose-50 text-rose-600 border-rose-200"
                                                    : "bg-amber-50 text-amber-600 border-amber-200"
                                            }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                                            <span>Type: <strong className="text-slate-700">{item.mealType}</strong></span>
                                            <span>Guests: <strong className="text-slate-800">{item.guests}</strong></span>
                                        </div>
                                        {item.note && (
                                            <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                                "{item.note}"
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <button 
                            onClick={() => setShowAllGuestModal(false)}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}