"use client";

import { useState, useEffect } from "react";
import { 
    IconToolsKitchen2, 
    IconCalendarEvent, 
    IconUsers, 
    IconPlus, 
    IconClock, 
    IconCheck, 
    IconX,
    IconHistory,
    IconDeviceFloppy,
    IconUsersGroup,
    IconCalendarStats
} from "@tabler/icons-react";

export default function MyMealsView() {
    const [date, setDate] = useState("");
    const [mealType, setMealType] = useState("Lunch");
    const [guestCount, setGuestCount] = useState<number | "">(""); 
    const [guestNote, setGuestNote] = useState("");
    
    const [history, setHistory] = useState<any[]>([]);
    const [todayStatus, setTodayStatus] = useState({ lunch: "OFF", dinner: "OFF" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Meal Plan States
    const [planBreakfast, setPlanBreakfast] = useState("0");
    const [planLunch, setPlanLunch] = useState("0");
    const [planDinner, setPlanDinner] = useState("0");
    const [planGuest, setPlanGuest] = useState("0");
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    // 💡 Monthly Meal History States
    const [monthlyMeals, setMonthlyMeals] = useState<any[]>([]);
    const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // Format: YYYY-MM
    });
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedTomorrow = tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'long' });

    useEffect(() => {
        fetchMealsData();
        fetchDefaultMeals();
    }, [selectedMonthYear]); // 💡 Fetch data again on month change

    const fetchMealsData = async () => {
        setIsHistoryLoading(true);
        try {
            const [year, month] = selectedMonthYear.split('-');
            const res = await fetch(`/api/members/my-meals?month=${month}&year=${year}`);
            if (res.ok) {
                const data = await res.json();
                if (data.todayStatus) setTodayStatus(data.todayStatus);
                if (data.guestRequests) setHistory(data.guestRequests);
                if (data.monthlyMeals) setMonthlyMeals(data.monthlyMeals); // 💡 New data
            }
        } catch (error) {
            console.error("Error fetching meals data:", error);
        } finally {
            setIsLoading(false);
            setIsHistoryLoading(false);
        }
    };

    const fetchDefaultMeals = async () => {
        try {
            const res = await fetch("/api/members/dashboard-data");
            if (res.ok) {
                const data = await res.json();
                setPlanBreakfast(data.defaultMeals.breakfast.toString());
                setPlanLunch(data.defaultMeals.lunch.toString());
                setPlanDinner(data.defaultMeals.dinner.toString());
            }
        } catch (error) {
            console.error("Error fetching default meals:", error);
        }
    };

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

            if (res.ok) {
                alert("✅ Tomorrow's meal plan saved successfully!");
                setPlanGuest("0");
            } else {
                alert("❌ Failed to save meal plan.");
            }
        } catch (error) {
            console.error(error);
            alert("❌ An error occurred while saving.");
        } finally {
            setIsSavingPlan(false);
        }
    };

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date) return alert("Please select a date!");
        if (!guestCount) return alert("Please enter the number of guests!");
        
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
                alert("✅ Guest meal requested successfully! Waiting for manager approval.");
                setDate("");
                setGuestCount("");
                setMealType("Lunch");
                setGuestNote("");
                fetchMealsData(); 
            } else {
                alert(`❌ ${data.error || "Failed to submit request."}`);
            }
        } catch (error) {
            console.error(error);
            alert("❌ An error occurred while submitting request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 💡 Monthly total calculation logic
    const totalMonthlyBfast = monthlyMeals.reduce((sum, meal) => sum + (meal.breakfast || 0), 0);
    const totalMonthlyLunch = monthlyMeals.reduce((sum, meal) => sum + (meal.lunch || 0), 0);
    const totalMonthlyDinner = monthlyMeals.reduce((sum, meal) => sum + (meal.dinner || 0), 0);
    const totalMonthlyGuest = monthlyMeals.reduce((sum, meal) => sum + (meal.guest || 0), 0);
    const grandTotalMonthly = totalMonthlyBfast + totalMonthlyLunch + totalMonthlyDinner + totalMonthlyGuest;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* ─── Header Section ─── */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-extrabold text-[#0B132B]">My Meals</h1>
                <p className="text-sm text-gray-500 font-medium mt-1">Manage your daily meals and request guest meals.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ─── Left Side: Form & Status ─── */}
                <div className="space-y-6 lg:col-span-1">
                    
                    {/* Today's Meal Status Card */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 rounded-2xl border border-orange-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-500 text-white rounded-lg shadow-sm">
                                <IconToolsKitchen2 size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">Today's Meal</h2>
                        </div>
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-orange-50">
                            <div>
                                <p className="text-sm font-bold text-gray-800">Lunch</p>
                                <p className={`text-xs font-extrabold ${todayStatus.lunch === 'ON' ? 'text-green-600' : 'text-red-500'}`}>
                                    {todayStatus.lunch}
                                </p>
                            </div>
                            <div className="w-px h-8 bg-gray-100"></div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">Dinner</p>
                                <p className={`text-xs font-extrabold ${todayStatus.dinner === 'ON' ? 'text-green-600' : 'text-red-500'}`}>
                                    {todayStatus.dinner}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Guest Meal Request Form */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                            <IconPlus className="text-orange-500" size={20} />
                            Request Guest Meal
                        </h2>
                        
                        <form onSubmit={handleRequestSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 uppercase mb-1.5">Date</label>
                                <div className="relative">
                                    <IconCalendarEvent className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 w-5 h-5" />
                                    <input 
                                        type="date" 
                                        value={date} 
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setDate(e.target.value)} 
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 focus:bg-white text-sm font-bold text-gray-800 transition-all cursor-pointer" 
                                        required 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 uppercase mb-1.5">Meal Type</label>
                                <div className="relative">
                                    <IconToolsKitchen2 className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 w-5 h-5" />
                                    <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 focus:bg-white text-sm font-bold text-gray-800 transition-all appearance-none cursor-pointer">
                                        <option value="Breakfast">Breakfast Only</option>
                                        <option value="Lunch">Lunch Only</option>
                                        <option value="Dinner">Dinner Only</option>
                                        <option value="Both">Both (Lunch & Dinner)</option>
                                        <option value="All Day">All Day (Breakfast, Lunch & Dinner)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 uppercase mb-1.5">Number of Guests</label>
                                <div className="relative">
                                    <IconUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 w-5 h-5" />
                                    <input type="number" min="1" max="50" value={guestCount} onChange={(e) => setGuestCount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="E.g. 2" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 focus:bg-white text-sm font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-medium transition-all" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 uppercase mb-1.5">Note (Optional)</label>
                                <input 
                                    type="text" 
                                    value={guestNote} 
                                    onChange={(e) => setGuestNote(e.target.value)} 
                                    placeholder="E.g., Two college friends visiting" 
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 focus:bg-white text-sm font-medium text-gray-800 placeholder:text-gray-400 transition-all" 
                                />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-[#FF6B00] hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 transition-all mt-4 disabled:opacity-50 cursor-pointer">
                                {isSubmitting ? "Submitting..." : "Submit Request"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ─── Right Side: Meal Plan & History ─── */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Tomorrow's Meal Plan */}
                    <div className="bg-white rounded-3xl border border-blue-200 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                        <div className="p-6 flex flex-col gap-5 pl-8 bg-blue-50/30">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div>
                                    <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-extrabold tracking-wide mb-3">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Daily Update
                                    </span>
                                    <h3 className="text-xl font-extrabold text-gray-900">Tomorrow's Meal Plan</h3>
                                    <p className="text-sm font-medium text-gray-600 mt-1">Adjust your meal counts or add guest meals for <span className="font-bold text-gray-800">{formattedTomorrow}</span>.</p>
                                </div>
                                <span className="hidden sm:flex text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 h-fit">Auto-filled from default</span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 mb-1.5 text-center uppercase tracking-wider">Breakfast</label>
                                        <input type="number" value={planBreakfast} onChange={(e) => setPlanBreakfast(e.target.value)} step="0.5" min="0" className="w-full text-center py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-extrabold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 mb-1.5 text-center uppercase tracking-wider">Lunch</label>
                                        <input type="number" value={planLunch} onChange={(e) => setPlanLunch(e.target.value)} step="0.5" min="0" className="w-full text-center py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-extrabold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 mb-1.5 text-center uppercase tracking-wider">Dinner</label>
                                        <input type="number" value={planDinner} onChange={(e) => setPlanDinner(e.target.value)} step="0.5" min="0" className="w-full text-center py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-extrabold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[11px] font-bold text-orange-500 mb-1.5 text-center uppercase tracking-wider flex justify-center items-center gap-1">
                                            <IconUsersGroup className="w-3.5 h-3.5" /> Guest
                                        </label>
                                        <input type="number" value={planGuest} onChange={(e) => setPlanGuest(e.target.value)} step="1" min="0" className="w-full text-center py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm font-extrabold text-orange-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" />
                                    </div>
                                </div>
                                <button onClick={handleSaveMealPlan} disabled={isSavingPlan} className="w-full sm:w-auto h-full flex items-center justify-center gap-2 bg-[#0B132B] hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all sm:mt-5 disabled:opacity-50 cursor-pointer">
                                    <IconDeviceFloppy className="w-5 h-5" stroke={2.5} />
                                    {isSavingPlan ? "Saving..." : "Save Plan"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Guest Request History Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                                <IconHistory className="text-gray-500" size={20} />
                                Guest Request History
                            </h2>
                        </div>
                        <div className="overflow-x-auto flex-1 w-full max-h-[300px]">
                            <table className="w-full text-left border-collapse min-w-full relative">
                                <thead className="sticky top-0 bg-gray-50 z-10">
                                    <tr className="border-b border-gray-100">
                                        <th className="px-2 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-tight sm:tracking-wider">Date</th>
                                        <th className="px-2 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-tight sm:tracking-wider">Type</th>
                                        <th className="px-2 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-tight sm:tracking-wider text-center">Guests</th>
                                        <th className="px-2 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-tight sm:tracking-wider text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <tr><td colSpan={4} className="text-center py-12 text-gray-400 font-bold text-sm">Loading history...</td></tr>
                                    ) : history.length === 0 ? (
                                        <tr><td colSpan={4} className="text-center py-12 text-gray-500 font-medium text-xs sm:text-sm">No guest meal requests yet.</td></tr>
                                    ) : (
                                        history.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-2 sm:px-6 py-3 sm:py-4">
                                                    <p className="text-[11px] sm:text-sm font-bold text-gray-800 whitespace-nowrap">
                                                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </td>
                                                <td className="px-2 sm:px-6 py-3 sm:py-4">
                                                    <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-gray-100 text-gray-700 whitespace-nowrap">{item.mealType}</span>
                                                    {item.note && (
                                                        <p className="text-[10px] text-gray-500 font-medium mt-0.5 max-w-[140px] truncate" title={item.note}>
                                                            "{item.note}"
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-2 sm:px-6 py-3 sm:py-4 text-center">
                                                    <p className="text-[11px] sm:text-sm font-extrabold text-gray-800">{item.guests}</p>
                                                </td>
                                                <td className="px-2 sm:px-6 py-3 sm:py-4 text-right">
                                                    <div className="flex justify-end">
                                                        <div className={`flex items-center gap-1 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold w-fit whitespace-nowrap border
                                                            ${item.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}
                                                            ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                                                            ${item.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border-rose-200' : ''}
                                                        `}>
                                                            {item.status === 'Pending' && <IconClock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                                            {item.status === 'Approved' && <IconCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                                            {item.status === 'Rejected' && <IconX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                                            {item.status}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 💡 NEW: Monthly Full Meal Log Table ─── */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col w-full mt-6">
                <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8FAFC]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                            <IconCalendarStats size={22} stroke={2} />
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-gray-900">Monthly Meal History</h2>
                            <p className="text-xs font-bold text-gray-500 mt-0.5">Your complete day-by-day meal log</p>
                        </div>
                    </div>
                    {/* Month Picker */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Select Month:</label>
                        <input 
                            type="month" 
                            value={selectedMonthYear} 
                            onChange={(e) => setSelectedMonthYear(e.target.value)} 
                            className="bg-white border border-gray-200 text-gray-800 text-sm font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm cursor-pointer"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-full relative">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="py-3 px-4 sm:py-4 sm:px-6 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-tight sm:tracking-wider whitespace-nowrap">Date</th>
                                <th className="py-3 px-2 sm:py-4 sm:px-6 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-tight sm:tracking-wider text-center">B'fast</th>
                                <th className="py-3 px-2 sm:py-4 sm:px-6 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-tight sm:tracking-wider text-center">Lunch</th>
                                <th className="py-3 px-2 sm:py-4 sm:px-6 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-tight sm:tracking-wider text-center">Dinner</th>
                                <th className="py-3 px-2 sm:py-4 sm:px-6 text-[10px] sm:text-xs font-extrabold text-orange-500 uppercase tracking-tight sm:tracking-wider text-center">Guest</th>
                                <th className="py-3 px-4 sm:py-4 sm:px-6 text-[10px] sm:text-xs font-extrabold text-indigo-600 uppercase tracking-tight sm:tracking-wider text-center bg-indigo-50/50">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isHistoryLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-xs font-bold text-gray-400">Loading data...</td>
                                </tr>
                            ) : monthlyMeals.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-xs font-bold text-gray-400">No meal records found for {selectedMonthYear}.</td>
                                </tr>
                            ) : (
                                monthlyMeals.map((meal: any, index: number) => {
                                    const mealDate = new Date(meal.date);
                                    const formattedDate = mealDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
                                    const isToday = mealDate.toDateString() === new Date().toDateString();
                                    const totalDayMeal = (meal.breakfast || 0) + (meal.lunch || 0) + (meal.dinner || 0) + (meal.guest || 0);

                                    return (
                                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap">
                                                <p className="font-extrabold text-gray-900 text-[11px] sm:text-sm flex items-center gap-2">
                                                    {formattedDate} 
                                                    {isToday && <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">Today</span>}
                                                </p>
                                            </td>
                                            <td className="py-3 px-2 sm:py-4 sm:px-6 text-center font-bold text-gray-700 text-[11px] sm:text-sm">{meal.breakfast || 0}</td>
                                            <td className="py-3 px-2 sm:py-4 sm:px-6 text-center font-bold text-gray-700 text-[11px] sm:text-sm">{meal.lunch || 0}</td>
                                            <td className="py-3 px-2 sm:py-4 sm:px-6 text-center font-bold text-gray-700 text-[11px] sm:text-sm">{meal.dinner || 0}</td>
                                            <td className="py-3 px-2 sm:py-4 sm:px-6 text-center font-bold text-orange-600 text-[11px] sm:text-sm">{meal.guest || 0}</td>
                                            <td className="py-3 px-4 sm:py-4 sm:px-6 text-center bg-indigo-50/30 font-extrabold text-gray-900 text-xs sm:text-base border-l border-indigo-100/50">
                                                {totalDayMeal}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {/* 💡 Total Summary Row */}
                        {!isHistoryLoading && monthlyMeals.length > 0 && (
                            <tfoot className="bg-gray-800 text-white">
                                <tr>
                                    <td className="py-3 px-4 sm:py-4 sm:px-6 font-extrabold text-xs sm:text-sm uppercase tracking-wider text-right">Month Total:</td>
                                    <td className="py-3 px-2 sm:py-4 sm:px-6 text-center font-extrabold text-[11px] sm:text-sm">{totalMonthlyBfast}</td>
                                    <td className="py-3 px-2 sm:py-4 sm:px-6 text-center font-extrabold text-[11px] sm:text-sm">{totalMonthlyLunch}</td>
                                    <td className="py-3 px-2 sm:py-4 sm:px-6 text-center font-extrabold text-[11px] sm:text-sm">{totalMonthlyDinner}</td>
                                    <td className="py-3 px-2 sm:py-4 sm:px-6 text-center font-extrabold text-[11px] sm:text-sm text-orange-300">{totalMonthlyGuest}</td>
                                    <td className="py-3 px-4 sm:py-4 sm:px-6 text-center font-extrabold text-sm sm:text-xl text-indigo-300 border-l border-gray-700">
                                        {grandTotalMonthly}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

        </div>
    );
}