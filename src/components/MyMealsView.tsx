"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
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
    IconChevronLeft,
    IconChevronRight,
    IconAlertCircle,
    IconLock
} from "@tabler/icons-react";
import { getGuestMealPortion, calculateGuestMealUnits } from "@/lib/calculations";

// ─── Guest Meal Type Options ───
const MEAL_TYPE_OPTIONS = [
    { label: "Lunch Only", portion: "1.0 meal", bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500", badgeClass: "bg-blue-100/70 text-blue-700" },
    { label: "Breakfast Only", portion: "0.5 meal", bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", badgeClass: "bg-amber-100/70 text-amber-700" },
    { label: "Dinner Only", portion: "1.0 meal", bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", badgeClass: "bg-purple-100/70 text-purple-700" },
    { label: "Breakfast & Dinner", portion: "1.5 meals", bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500", badgeClass: "bg-rose-100/70 text-rose-700" },
    { label: "Lunch & Dinner", portion: "2.0 meals", bg: "bg-indigo-50", text: "text-indigo-600", dot: "bg-indigo-500", badgeClass: "bg-indigo-100/70 text-indigo-700" },
    { label: "All Meals", portion: "2.5 meals", bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", badgeClass: "bg-emerald-100/70 text-emerald-700" },
];

function getDhakaHour(): number {
    try {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Dhaka",
            hour: "numeric",
            hourCycle: "h23",
        }).formatToParts(new Date());
        const hourPart = parts.find((p) => p.type === "hour");
        return hourPart ? parseInt(hourPart.value, 10) : new Date().getHours();
    } catch {
        return new Date().getHours();
    }
}

function getInitialCutoffs() {
    const currentHour = getDhakaHour();
    return {
        breakfast: { passed: currentHour >= 8, time: "8:00 AM" },
        lunch: { passed: currentHour >= 12, time: "12:00 PM" },
        dinner: { passed: currentHour >= 21, time: "9:00 PM" },
    };
}

export default function MyMealsView() {
    // ─── Current Dates ───
    const today = new Date();
    const todayFormatted = today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    // ─── State: Request Guest Meal Form ───
    const [date, setDate] = useState(tomorrowIso);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());
    const [mealType, setMealType] = useState("Lunch Only");
    const [isMealTypeDropdownOpen, setIsMealTypeDropdownOpen] = useState(false);
    const [guestCount, setGuestCount] = useState<number>(1); 
    const [guestNote, setGuestNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── State: Today's Live Meal Toggles ───
    const [todayStatus, setTodayStatus] = useState({ breakfast: "OFF", lunch: "OFF", dinner: "OFF" });
    const [todayCounts, setTodayCounts] = useState({ breakfast: 0.5, lunch: 1.0, dinner: 1.0, guest: 0 });
    const [cutoffs, setCutoffs] = useState<{
        breakfast?: { passed: boolean; time: string };
        lunch?: { passed: boolean; time: string };
        dinner?: { passed: boolean; time: string };
        isManagerOrAdmin?: boolean;
    }>(getInitialCutoffs);
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

    const [selectedY, selectedM] = selectedMonthYear.split("-");
    const { data: mealsData, isLoading, mutate: mutateMeals } = useSWR<any>(`/api/members/my-meals?month=${selectedM}&year=${selectedY}`);
    const isHistoryLoading = isLoading;
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

    // ─── Live Cutoff Polling ───
    useEffect(() => {
        const checkCutoffs = () => {
            const live = getInitialCutoffs();
            setCutoffs((prev) => ({
                ...prev,
                breakfast: { ...prev.breakfast, passed: live.breakfast.passed, time: "8:00 AM" },
                lunch: { ...prev.lunch, passed: live.lunch.passed, time: "12:00 PM" },
                dinner: { ...prev.dinner, passed: live.dinner.passed, time: "9:00 PM" },
            }));
        };
        const timer = setInterval(checkCutoffs, 30000);
        return () => clearInterval(timer);
    }, []);

    // ─── Sync SWR Cached Data with State ───
    useEffect(() => {
        if (mealsData) {
            if (mealsData.todayStatus) setTodayStatus(mealsData.todayStatus);
            if (mealsData.todayCounts) setTodayCounts(mealsData.todayCounts);
            if (mealsData.cutoffs) setCutoffs(mealsData.cutoffs);
            if (mealsData.tomorrowPlan) {
                setPlanBreakfast(mealsData.tomorrowPlan.breakfast?.toString() ?? "0.5");
                setPlanLunch(mealsData.tomorrowPlan.lunch?.toString() ?? "1");
                setPlanDinner(mealsData.tomorrowPlan.dinner?.toString() ?? "1");
                setPlanGuest(mealsData.tomorrowPlan.guest?.toString() ?? "0");
            }
            if (mealsData.guestRequests) setGuestHistory(mealsData.guestRequests);
            if (mealsData.monthlyMeals) setMonthlyMeals(mealsData.monthlyMeals);
        }
    }, [mealsData]);

    // ─── Live Toggle for Today's Meal ───
    const handleToggleTodayMeal = async (meal: "breakfast" | "lunch" | "dinner") => {
        // Immediate cutoff guard (check both state and current Dhaka time)
        const liveCutoffs = getInitialCutoffs();
        if (cutoffs[meal]?.passed || liveCutoffs[meal]?.passed) {
            setCutoffs((prev) => ({
                ...prev,
                [meal]: { ...prev[meal], passed: true, time: liveCutoffs[meal].time },
            }));
            const cutoffTime = cutoffs[meal]?.time || liveCutoffs[meal].time;
            showToast(`${meal.charAt(0).toUpperCase() + meal.slice(1)} cutoff time (${cutoffTime}) has passed for today.`, "error");
            return;
        }

        const currentVal = todayStatus[meal];
        const nextVal = currentVal === "ON" ? "OFF" : "ON";
        const defaultMealVal = meal === "breakfast" ? 0.5 : 1.0;
        const currentMealCount = todayCounts[meal] > 0 ? todayCounts[meal] : defaultMealVal;
        const nextMealCount = nextVal === "ON" ? currentMealCount : 0;

        // Optimistic UI updates
        setTodayStatus((prev) => ({ ...prev, [meal]: nextVal }));
        setTodayCounts((prev) => ({ ...prev, [meal]: nextMealCount }));

        // Live sync with monthlyMeals so the table and monthly summary live update
        setMonthlyMeals((prevMeals) => {
            const todayDateString = new Date().toDateString();
            const existingIdx = prevMeals.findIndex((m) => new Date(m.date).toDateString() === todayDateString);

            if (existingIdx >= 0) {
                const updated = [...prevMeals];
                updated[existingIdx] = {
                    ...updated[existingIdx],
                    [meal]: nextMealCount,
                };
                return updated;
            } else {
                const newTodayLog = {
                    id: "temp-today",
                    date: new Date().toISOString(),
                    breakfast: meal === "breakfast" ? nextMealCount : (todayStatus.breakfast === "ON" ? (todayCounts.breakfast || 0.5) : 0),
                    lunch: meal === "lunch" ? nextMealCount : (todayStatus.lunch === "ON" ? (todayCounts.lunch || 1.0) : 0),
                    dinner: meal === "dinner" ? nextMealCount : (todayStatus.dinner === "ON" ? (todayCounts.dinner || 1.0) : 0),
                    guest: todayCounts.guest || 0,
                };
                return [newTodayLog, ...prevMeals];
            }
        });

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
                if (data.todayCounts) setTodayCounts(data.todayCounts);
                if (data.cutoffs) setCutoffs(data.cutoffs);
                if (data.mealLog) {
                    setMonthlyMeals((prevMeals) => {
                        const todayDateString = new Date(data.mealLog.date).toDateString();
                        const existingIdx = prevMeals.findIndex((m) => new Date(m.date).toDateString() === todayDateString);
                        if (existingIdx >= 0) {
                            const updated = [...prevMeals];
                            updated[existingIdx] = data.mealLog;
                            return updated;
                        }
                        return [data.mealLog, ...prevMeals];
                    });
                }
                const activeQty = nextVal === "ON" ? (data.todayCounts?.[meal] ?? currentMealCount) : 0;
                showToast(`Today's ${meal} turned ${nextVal}! (${activeQty} meal)`, "success");
                mutateMeals();
            } else {
                // Revert on error
                setTodayStatus((prev) => ({ ...prev, [meal]: currentVal }));
                setTodayCounts((prev) => ({ ...prev, [meal]: currentMealCount }));
                mutateMeals();
                showToast(data.error || `Failed to update ${meal} meal.`, "error");
            }
        } catch (error) {
            // Revert on error
            setTodayStatus((prev) => ({ ...prev, [meal]: currentVal }));
            setTodayCounts((prev) => ({ ...prev, [meal]: currentMealCount }));
            mutateMeals();
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
                mutateMeals();
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
                mutateMeals();
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

    // ─── Today's Live Active Meals Calculation ───
    const todayTotalMeals = useMemo(() => {
        const b = todayStatus.breakfast === "ON" ? (todayCounts.breakfast || 0.5) : 0;
        const l = todayStatus.lunch === "ON" ? (todayCounts.lunch || 1.0) : 0;
        const d = todayStatus.dinner === "ON" ? (todayCounts.dinner || 1.0) : 0;
        const g = todayCounts.guest || 0;
        return Number((b + l + d + g).toFixed(1));
    }, [todayStatus, todayCounts]);

    // ─── Monthly Summary Calculations ───
    const totalMonthlyBfast = monthlyMeals.reduce((sum, meal) => sum + (meal.breakfast || 0), 0);
    const totalMonthlyLunch = monthlyMeals.reduce((sum, meal) => sum + (meal.lunch || 0), 0);
    const totalMonthlyDinner = monthlyMeals.reduce((sum, meal) => sum + (meal.dinner || 0), 0);
    const totalMonthlyGuest = monthlyMeals.reduce((sum, meal) => sum + (meal.guest || 0), 0);
    const grandTotalMonthly = totalMonthlyBfast + totalMonthlyLunch + totalMonthlyDinner + totalMonthlyGuest;

    return (
        <div className="w-full max-w-md sm:max-w-xl md:max-w-7xl mx-auto space-y-4 md:space-y-6 pb-12 animate-in fade-in duration-300">
            
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

            {/* ─── Responsive Multi-Column Desktop Grid ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

                {/* ──────────────────────────────────────────────────────────
                    CARD A: TODAY'S MEAL (Live Meal Toggles)
                ────────────────────────────────────────────────────────── */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-sm shadow-orange-500/20 shrink-0">
                                <IconCalendarEvent size={20} stroke={2.2} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Today's Meal</h2>
                                <p className="text-[11px] font-semibold text-slate-500 leading-tight mt-0.5 truncate">Live daily meal switcher</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {/* Dynamic Active Count Pill */}
                            <span className={`text-[11px] sm:text-xs font-black px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0 transition-all ${
                                todayTotalMeals > 0 
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200/70" 
                                    : "bg-slate-100 text-slate-500 border-slate-200/70"
                            }`}>
                                {todayTotalMeals > 0 ? `${todayTotalMeals} Active` : "0 Active"}
                            </span>

                            {/* Date Pill */}
                            <div className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0">
                                <IconCalendar size={13} className="text-slate-500 shrink-0" stroke={2.5} />
                                <span className="whitespace-nowrap">{todayFormatted}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3 Meal Toggle Slots Responsive Grid */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3.5">
                        
                        {/* 1. Breakfast */}
                        <div className={`border rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-between text-center gap-2 shadow-2xs transition-all ${
                            cutoffs.breakfast?.passed ? "border-amber-200/90 bg-amber-50/40" : "border-gray-100 bg-gray-50/70 hover:bg-gray-50/90"
                        }`}>
                            {/* Icon */}
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100/70 text-amber-500 flex items-center justify-center shrink-0">
                                <IconSunHigh size={17} stroke={2.5} />
                            </div>

                            {/* Title & Status Block (ABOVE the toggle button) */}
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">Breakfast</p>
                                <div className="flex flex-col items-center gap-0.5 mt-0.5">
                                    <p className={`text-[10px] font-extrabold leading-tight ${
                                        todayStatus.breakfast === "ON" ? "text-emerald-500" : "text-rose-500"
                                    }`}>
                                        {todayStatus.breakfast === "ON" ? `ON • ${todayCounts.breakfast || 0.5}` : "OFF"}
                                    </p>
                                    {cutoffs.breakfast?.passed && (
                                        <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
                                            <IconLock size={9} stroke={2.5} /> Passed
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Toggle Switch (BELOW the title) */}
                            <button 
                                type="button"
                                onClick={() => handleToggleTodayMeal("breakfast")}
                                disabled={Boolean(cutoffs.breakfast?.passed || isTogglingMeal === "breakfast")}
                                aria-label="Toggle Breakfast"
                                title={
                                    cutoffs.breakfast?.passed 
                                        ? `Breakfast cutoff time (${cutoffs.breakfast.time}) has passed for today` 
                                        : `Click to turn ${todayStatus.breakfast === "ON" ? "OFF" : "ON"}`
                                }
                                className={`w-10 sm:w-11 h-6 relative inline-flex items-center rounded-full transition-colors shrink-0 ${
                                    cutoffs.breakfast?.passed ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                } disabled:opacity-50 disabled:cursor-not-allowed ${
                                    todayStatus.breakfast === "ON" ? "bg-[#FF6B00]" : "bg-slate-300"
                                }`}
                            >
                                <span className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-white transition-transform shadow-sm inline-block ${
                                    todayStatus.breakfast === "ON" ? "translate-x-5 sm:translate-x-5.5" : "translate-x-1"
                                }`} />
                            </button>
                        </div>

                        {/* 2. Lunch */}
                        <div className={`border rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-between text-center gap-2 shadow-2xs transition-all ${
                            cutoffs.lunch?.passed ? "border-amber-200/90 bg-amber-50/40" : "border-gray-100 bg-gray-50/70 hover:bg-gray-50/90"
                        }`}>
                            {/* Icon */}
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100/70 text-amber-500 flex items-center justify-center shrink-0">
                                <IconSunHigh size={17} stroke={2.5} />
                            </div>

                            {/* Title & Status Block (ABOVE the toggle button) */}
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">Lunch</p>
                                <div className="flex flex-col items-center gap-0.5 mt-0.5">
                                    <p className={`text-[10px] font-extrabold leading-tight ${
                                        todayStatus.lunch === "ON" ? "text-emerald-500" : "text-rose-500"
                                    }`}>
                                        {todayStatus.lunch === "ON" ? `ON • ${todayCounts.lunch || 1.0}` : "OFF"}
                                    </p>
                                    {cutoffs.lunch?.passed && (
                                        <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
                                            <IconLock size={9} stroke={2.5} /> Passed
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Toggle Switch (BELOW the title) */}
                            <button 
                                type="button"
                                onClick={() => handleToggleTodayMeal("lunch")}
                                disabled={Boolean(cutoffs.lunch?.passed || isTogglingMeal === "lunch")}
                                aria-label="Toggle Lunch"
                                title={
                                    cutoffs.lunch?.passed 
                                        ? `Lunch cutoff time (${cutoffs.lunch.time}) has passed for today` 
                                        : `Click to turn ${todayStatus.lunch === "ON" ? "OFF" : "ON"}`
                                }
                                className={`w-10 sm:w-11 h-6 relative inline-flex items-center rounded-full transition-colors shrink-0 ${
                                    cutoffs.lunch?.passed ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                } disabled:opacity-50 disabled:cursor-not-allowed ${
                                    todayStatus.lunch === "ON" ? "bg-[#FF6B00]" : "bg-slate-300"
                                }`}
                            >
                                <span className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-white transition-transform shadow-sm inline-block ${
                                    todayStatus.lunch === "ON" ? "translate-x-5 sm:translate-x-5.5" : "translate-x-1"
                                }`} />
                            </button>
                        </div>

                        {/* 3. Dinner */}
                        <div className={`border rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-between text-center gap-2 shadow-2xs transition-all ${
                            cutoffs.dinner?.passed ? "border-amber-200/90 bg-amber-50/40" : "border-gray-100 bg-gray-50/70 hover:bg-gray-50/90"
                        }`}>
                            {/* Icon */}
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-100/70 text-purple-600 flex items-center justify-center shrink-0">
                                <IconMoonStars size={17} stroke={2.2} />
                            </div>

                            {/* Title & Status Block (ABOVE the toggle button) */}
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">Dinner</p>
                                <div className="flex flex-col items-center gap-0.5 mt-0.5">
                                    <p className={`text-[10px] font-extrabold leading-tight ${
                                        todayStatus.dinner === "ON" ? "text-emerald-500" : "text-rose-500"
                                    }`}>
                                        {todayStatus.dinner === "ON" ? `ON • ${todayCounts.dinner || 1.0}` : "OFF"}
                                    </p>
                                    {cutoffs.dinner?.passed && (
                                        <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
                                            <IconLock size={9} stroke={2.5} /> Passed
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Toggle Switch (BELOW the title) */}
                            <button 
                                type="button"
                                onClick={() => handleToggleTodayMeal("dinner")}
                                disabled={Boolean(cutoffs.dinner?.passed || isTogglingMeal === "dinner")}
                                aria-label="Toggle Dinner"
                                title={
                                    cutoffs.dinner?.passed 
                                        ? `Dinner cutoff time (${cutoffs.dinner.time}) has passed for today` 
                                        : `Click to turn ${todayStatus.dinner === "ON" ? "OFF" : "ON"}`
                                }
                                className={`w-10 sm:w-11 h-6 relative inline-flex items-center rounded-full transition-colors shrink-0 ${
                                    cutoffs.dinner?.passed ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                } disabled:opacity-50 disabled:cursor-not-allowed ${
                                    todayStatus.dinner === "ON" ? "bg-[#FF6B00]" : "bg-slate-300"
                                }`}
                            >
                                <span className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-white transition-transform shadow-sm inline-block ${
                                    todayStatus.dinner === "ON" ? "translate-x-5 sm:translate-x-5.5" : "translate-x-1"
                                }`} />
                            </button>
                        </div>

                    </div>
                </div>

                {/* ──────────────────────────────────────────────────────────
                    CARD B: REQUEST GUEST MEAL (Guest Request Form)
                ────────────────────────────────────────────────────────── */}
                <div className={`bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative ${
                    isDatePickerOpen || isMealTypeDropdownOpen ? "z-50" : "z-10"
                }`}>
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
                                    
                                    <div className={`relative flex-1 ${isDatePickerOpen ? "z-50" : ""}`}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (date) {
                                                    const parts = date.split("-");
                                                    if (parts.length === 3) {
                                                        setCalendarViewDate(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
                                                    }
                                                }
                                                setIsDatePickerOpen((prev) => !prev);
                                                setIsMealTypeDropdownOpen(false);
                                            }}
                                            className="w-full bg-slate-50/90 border border-slate-200/80 rounded-2xl px-2.5 sm:px-3 py-2 sm:py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-100/80 transition-colors cursor-pointer text-left select-none"
                                        >
                                            <span className="truncate">{getFormattedFormDate(date)}</span>
                                            <IconChevronDown size={14} className={`text-slate-400 shrink-0 ml-1 transition-transform ${isDatePickerOpen ? "rotate-180" : ""}`} stroke={2.5} />
                                        </button>

                                        {/* Modern Coloring Calendar Popover */}
                                        {isDatePickerOpen && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-30" 
                                                    onClick={() => setIsDatePickerOpen(false)} 
                                                />
                                                <div className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-3 z-40 animate-in fade-in zoom-in-95 duration-100 select-none">
                                                    {/* Quick Presets */}
                                                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDate(todayIso);
                                                                setIsDatePickerOpen(false);
                                                            }}
                                                            className={`flex-1 py-1 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                                date === todayIso
                                                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                                                                    : "bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-100/80"
                                                            }`}
                                                        >
                                                            Today
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDate(tomorrowIso);
                                                                setIsDatePickerOpen(false);
                                                            }}
                                                            className={`flex-1 py-1 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                                date === tomorrowIso
                                                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                                                                    : "bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100/80"
                                                            }`}
                                                        >
                                                            Tomorrow
                                                        </button>
                                                    </div>

                                                    {/* Calendar Navigation */}
                                                    <div className="flex items-center justify-between py-2 px-0.5">
                                                        <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                                                            {calendarViewDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1));
                                                                }}
                                                                disabled={
                                                                    calendarViewDate.getFullYear() < today.getFullYear() ||
                                                                    (calendarViewDate.getFullYear() === today.getFullYear() && calendarViewDate.getMonth() <= today.getMonth())
                                                                }
                                                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none text-slate-600 cursor-pointer transition-colors"
                                                                title="Previous Month"
                                                            >
                                                                <IconChevronLeft size={15} stroke={2.5} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1));
                                                                }}
                                                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
                                                                title="Next Month"
                                                            >
                                                                <IconChevronRight size={15} stroke={2.5} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Days of week header */}
                                                    <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 py-1 uppercase tracking-wider">
                                                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName, idx) => (
                                                            <span key={dayName} className={idx === 5 || idx === 6 ? "text-amber-500" : ""}>
                                                                {dayName}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Days Grid */}
                                                    <div className="grid grid-cols-7 gap-1 pt-0.5">
                                                        {(() => {
                                                            const year = calendarViewDate.getFullYear();
                                                            const month = calendarViewDate.getMonth();
                                                            const firstDay = new Date(year, month, 1).getDay();
                                                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                                                            const gridItems = [];

                                                            for (let i = 0; i < firstDay; i++) {
                                                                gridItems.push(<div key={`b-${i}`} className="w-7 h-7 sm:w-8 sm:h-8" />);
                                                            }

                                                            for (let d = 1; d <= daysInMonth; d++) {
                                                                const dIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                                                                const isPast = dIso < todayIso;
                                                                const isToday = dIso === todayIso;
                                                                const isSelected = dIso === date;

                                                                gridItems.push(
                                                                    <button
                                                                        key={dIso}
                                                                        type="button"
                                                                        disabled={isPast}
                                                                        onClick={() => {
                                                                            setDate(dIso);
                                                                            setIsDatePickerOpen(false);
                                                                        }}
                                                                        className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                                                                            isPast
                                                                                ? "text-slate-300 cursor-not-allowed"
                                                                                : isSelected
                                                                                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black shadow-md shadow-orange-500/25 scale-105 cursor-pointer"
                                                                                : isToday
                                                                                ? "border border-orange-500 text-orange-600 bg-orange-50 font-black cursor-pointer hover:bg-orange-100"
                                                                                : "text-slate-700 hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
                                                                        }`}
                                                                    >
                                                                        {d}
                                                                    </button>
                                                                );
                                                            }

                                                            return gridItems;
                                                        })()}
                                                    </div>
                                                </div>
                                            </>
                                        )}
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

                                    <div className={`relative flex-1 ${isMealTypeDropdownOpen ? "z-50" : ""}`}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsMealTypeDropdownOpen((prev) => !prev);
                                                setIsDatePickerOpen(false);
                                            }}
                                            className="w-full bg-slate-50/90 border border-slate-200/80 rounded-2xl px-2.5 sm:px-3 py-2 sm:py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-100/80 transition-colors cursor-pointer text-left select-none"
                                        >
                                            <span className="truncate">{mealType}</span>
                                            <IconChevronDown size={14} className={`text-slate-400 shrink-0 ml-1 transition-transform ${isMealTypeDropdownOpen ? "rotate-180" : ""}`} stroke={2.5} />
                                        </button>

                                        {/* Colorful & Professional Meal Type Dropdown */}
                                        {isMealTypeDropdownOpen && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-40" 
                                                    onClick={() => setIsMealTypeDropdownOpen(false)} 
                                                />
                                                <div className="absolute right-0 top-full mt-1.5 w-56 sm:w-60 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                                                    <div className="space-y-0.5">
                                                        {MEAL_TYPE_OPTIONS.map((opt) => {
                                                            const isSelected = mealType === opt.label;
                                                            return (
                                                                <button
                                                                    key={opt.label}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setMealType(opt.label);
                                                                        setIsMealTypeDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                                                        isSelected
                                                                            ? `${opt.bg} ${opt.text} font-bold`
                                                                            : "hover:bg-slate-50 text-slate-700 font-semibold"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                                                                        <span className="text-xs truncate">{opt.label}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${opt.badgeClass}`}>
                                                                            {opt.portion}
                                                                        </span>
                                                                        {isSelected && (
                                                                            <IconCheck size={13} className={opt.text} stroke={3} />
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </>
                                        )}
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

                        {/* Calculated Guest Meals Preview */}
                        {(() => {
                            const portion = getGuestMealPortion(mealType);
                            const totalMeals = calculateGuestMealUnits(guestCount, mealType);
                            return (
                                <div className="bg-orange-50/70 border border-orange-100/90 rounded-2xl px-3 py-2 flex items-center justify-between text-xs mt-2">
                                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                                        <span className="text-orange-600 font-black">Total Guest Meals:</span>
                                        <span className="text-[11px] text-slate-500 font-semibold">
                                            ({guestCount} {guestCount > 1 ? "guests" : "guest"} × {portion} meal{portion > 1 ? "s" : ""})
                                        </span>
                                    </div>
                                    <span className="font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-lg text-xs">
                                        {totalMeals} {totalMeals > 1 ? "meals" : "meal"}
                                    </span>
                                </div>
                            );
                        })()}

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
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center shadow-sm shrink-0">
                                <IconCalendarEvent size={20} stroke={2.2} />
                            </div>
                            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Tomorrow's Meal Plan</h2>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0">
                            <IconCalendar size={13} className="text-slate-500 shrink-0" stroke={2.5} />
                            <span className="whitespace-nowrap">{tomorrowFormatted}</span>
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

                        {/* 4. Guest (Display-Only: reflects previously requested/selected guest meals for tomorrow) */}
                        <div className="bg-emerald-50/80 border border-emerald-100/90 rounded-2xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                            <IconUsers size={20} className="text-emerald-500 shrink-0" stroke={2.2} />
                            <span className="text-[10px] sm:text-xs font-bold text-slate-600 mt-1">Guest</span>
                            <div className="flex items-center justify-center h-4 sm:h-5 mt-0.5" title="Displays guest meals requested for tomorrow (non-editable here)">
                                <span className={`text-sm sm:text-base font-black select-none ${
                                    Number(planGuest) > 0 ? "text-emerald-700" : "text-slate-900"
                                }`}>
                                    {planGuest}
                                </span>
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
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
                                        <div className="text-center leading-tight">
                                            <span className="font-black text-slate-800">{item.guests}</span>
                                            <span className="text-[10px] font-bold text-emerald-600 block">({calculateGuestMealUnits(item.guests, item.mealType)}m)</span>
                                        </div>
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
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 md:col-span-2 lg:col-span-2 hover:shadow-md transition-shadow">
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
                                            <span>Guests: <strong className="text-slate-800">{item.guests} ({calculateGuestMealUnits(item.guests, item.mealType)} meals)</strong></span>
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