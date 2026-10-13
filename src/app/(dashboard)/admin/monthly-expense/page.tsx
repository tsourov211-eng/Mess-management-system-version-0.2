"use client";

import { useState, useEffect } from "react";
import { 
    Home, 
    Zap, 
    Wifi, 
    Broom, 
    MoreHorizontal, 
    Utensils, 
    RotateCcw, 
    Save, 
    PieChart, 
    Users, 
    Calendar, 
    ChevronDown, 
    CalendarDays 
} from "lucide-react";
import { 
    IconCalendarEvent, 
    IconHome, 
    IconBolt, 
    IconWifi, 
    IconUser, 
    IconDots, 
    IconToolsKitchen2, 
    IconRefresh,
    IconReceipt,
    IconCalculator,
    IconInfoCircle,
    IconChartPie
} from "@tabler/icons-react";

export default function MonthlyExpenseSetup() {
    const generateMonths = () => {
        const months = [];
        const date = new Date();
        for (let i = -3; i <= 9; i++) {
            const m = new Date(date.getFullYear(), date.getMonth() + i, 1);
            months.push(m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        }
        return months;
    };

    const monthOptions = generateMonths();

    // Default to current month or first option
    const currentMonthString = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const initialMonth = monthOptions.find(m => m === currentMonthString) || monthOptions[3] || monthOptions[0];

    const [month, setMonth] = useState(initialMonth);
    const [seatRent, setSeatRent] = useState<number | string>(0);
    const [electricityGas, setElectricityGas] = useState<number | string>(0);
    const [internet, setInternet] = useState<number | string>(0);
    const [maid, setMaid] = useState<number | string>(0);
    const [additional, setAdditional] = useState<number | string>(0);
    const [mealCharge, setMealCharge] = useState<number | string>(0);

    const [savedConfig, setSavedConfig] = useState({
        seatRent: 0,
        electricityGas: 0,
        internet: 0,
        maid: 0,
        additional: 0,
        mealCharge: 0,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
    const [lastBeforeReset, setLastBeforeReset] = useState<{
        seatRent: number | string;
        electricityGas: number | string;
        internet: number | string;
        maid: number | string;
        additional: number | string;
        mealCharge: number | string;
    } | null>(null);

    // Fetch existing configuration if available
    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            setLastBeforeReset(null);
            setMessage(null);
            try {
                const res = await fetch(`/api/admin/monthly-expense?month=${encodeURIComponent(month)}`);
                if (res.ok) {
                    const { data } = await res.json();
                    if (data) {
                        const loaded = {
                            seatRent: data.seatRent ?? 0,
                            electricityGas: data.electricityGas ?? 0,
                            internet: data.internet ?? 0,
                            maid: data.maid ?? 0,
                            additional: data.additional ?? 0,
                            mealCharge: data.mealCharge ?? 0,
                        };
                        setSeatRent(loaded.seatRent);
                        setElectricityGas(loaded.electricityGas);
                        setInternet(loaded.internet);
                        setMaid(loaded.maid);
                        setAdditional(loaded.additional);
                        setMealCharge(loaded.mealCharge);
                        setSavedConfig(loaded);
                    } else {
                        const empty = { seatRent: 0, electricityGas: 0, internet: 0, maid: 0, additional: 0, mealCharge: 0 };
                        setSeatRent(0);
                        setElectricityGas(0);
                        setInternet(0);
                        setMaid(0);
                        setAdditional(0);
                        setMealCharge(0);
                        setSavedConfig(empty);
                    }
                }
            } catch (error) {
                console.error("Error loading monthly expense config:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, [month]);

    const handleReset = () => {
        // Save current values so admin can undo if reset was clicked accidentally
        setLastBeforeReset({
            seatRent,
            electricityGas,
            internet,
            maid,
            additional,
            mealCharge,
        });

        // Reset all overhead fields to 0
        setSeatRent(0);
        setElectricityGas(0);
        setInternet(0);
        setMaid(0);
        setAdditional(0);
        setMealCharge(0);

        setMessage({
            type: 'success',
            text: `All monthly expense fields for ${month} have been reset to ৳0. Click 'Save Monthly Expense' to apply.`
        });
    };

    const handleUndoReset = () => {
        if (lastBeforeReset) {
            setSeatRent(lastBeforeReset.seatRent);
            setElectricityGas(lastBeforeReset.electricityGas);
            setInternet(lastBeforeReset.internet);
            setMaid(lastBeforeReset.maid);
            setAdditional(lastBeforeReset.additional);
            setMealCharge(lastBeforeReset.mealCharge);
            setLastBeforeReset(null);
            setMessage({
                type: 'info',
                text: `Restored previous expense values for ${month}.`
            });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/monthly-expense", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    month,
                    seatRent: Number(seatRent) || 0,
                    electricityGas: Number(electricityGas) || 0,
                    internet: Number(internet) || 0,
                    maid: Number(maid) || 0,
                    additional: Number(additional) || 0,
                    mealCharge: Number(mealCharge) || 0,
                })
            });

            const data = await res.json();
            if (res.ok) {
                const updated = {
                    seatRent: Number(seatRent) || 0,
                    electricityGas: Number(electricityGas) || 0,
                    internet: Number(internet) || 0,
                    maid: Number(maid) || 0,
                    additional: Number(additional) || 0,
                    mealCharge: Number(mealCharge) || 0,
                };
                setSavedConfig(updated);
                setLastBeforeReset(null);
                setMessage({ type: 'success', text: "Monthly expense successfully saved!" });
            } else {
                setMessage({ type: 'error', text: data.error || "Failed to save expense." });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "An error occurred while saving." });
        } finally {
            setIsSaving(false);
        }
    };

    const total = 
        (Number(seatRent) || 0) + 
        (Number(electricityGas) || 0) + 
        (Number(internet) || 0) + 
        (Number(maid) || 0) + 
        (Number(additional) || 0) + 
        (Number(mealCharge) || 0);

    // Format "October 2026" to "Oct 2026"
    const formatShortMonth = (fullMonthStr: string) => {
        try {
            const parts = fullMonthStr.split(" ");
            if (parts.length >= 2) {
                return `${parts[0].slice(0, 3)} ${parts[1]}`;
            }
        } catch (e) {}
        return fullMonthStr;
    };

    return (
        <div className="w-full pb-12 md:pb-16 animate-in fade-in duration-200">
            
            {/* ═══════════════════════════════════════════════════════════════════
                MOBILE VIEW: Matching monthlyExpenses.png Pixel-for-Pixel
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="md:hidden flex flex-col gap-3.5 w-full max-w-md mx-auto">
                
                {/* 1. Header Bar & Title Section */}
                <div className="flex items-center gap-3 pt-1 px-0.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-orange-500 shrink-0">
                        <CalendarDays size={24} strokeWidth={2.2} />
                    </div>
                    <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                        Monthly Expense
                    </h1>
                </div>

                {/* Toast Notification Alert */}
                {message && (
                    <div className={`p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
                        message.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : message.type === 'info'
                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                        <div className="flex-1 pr-2">
                            <span>{message.text}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {lastBeforeReset && (
                                <button 
                                    type="button"
                                    onClick={handleUndoReset} 
                                    className="text-[11px] font-black px-2 py-0.5 bg-white border border-emerald-200 rounded-md hover:bg-emerald-100/50 transition-colors cursor-pointer text-emerald-800"
                                >
                                    Undo
                                </button>
                            )}
                            <button type="button" onClick={() => setMessage(null)} className="text-xs font-black underline cursor-pointer">Dismiss</button>
                        </div>
                    </div>
                )}

                {/* 2. Month Selector Capsule */}
                <div className="relative bg-white/95 rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Calendar size={18} className="text-slate-700 shrink-0" strokeWidth={2.2} />
                        <span className="text-sm font-bold text-slate-800 truncate">{month}</span>
                    </div>
                    <ChevronDown size={18} className="text-slate-500 shrink-0" strokeWidth={2.5} />
                    
                    <select 
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    >
                        {monthOptions.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* 3. 6 Expense Category Cards (2-Column Grid) */}
                <div className="grid grid-cols-2 gap-3 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 rounded-2xl flex items-center justify-center">
                            <span className="text-xs font-black text-orange-600 animate-pulse">Loading...</span>
                        </div>
                    )}

                    {/* Card 1: Seat Rent */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Home size={18} strokeWidth={2.5} />
                            </div>
                            <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 leading-tight">
                                Seat Rent
                            </h4>
                        </div>
                        <div className="bg-[#F1F5F9]/80 rounded-xl px-3 py-2 flex items-center justify-between border border-slate-100/60 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 focus-within:bg-white transition-all">
                            <input 
                                type="number"
                                value={seatRent === "" ? "" : seatRent}
                                onChange={(e) => setSeatRent(e.target.value)}
                                onFocus={(e) => { if (e.target.value === "0") e.target.select(); }}
                                placeholder="0"
                                min="0"
                                className="w-full bg-transparent font-black text-sm text-slate-900 outline-none placeholder-slate-400"
                            />
                            <span className="text-slate-400 font-bold text-sm shrink-0 ml-1 select-none">
                                ৳
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Electricity + Gas */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-[#FACC15] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Zap size={18} strokeWidth={2.5} />
                            </div>
                            <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 leading-tight">
                                Electricity + Gas
                            </h4>
                        </div>
                        <div className="bg-[#F1F5F9]/80 rounded-xl px-3 py-2 flex items-center justify-between border border-slate-100/60 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 focus-within:bg-white transition-all">
                            <input 
                                type="number"
                                value={electricityGas === "" ? "" : electricityGas}
                                onChange={(e) => setElectricityGas(e.target.value)}
                                onFocus={(e) => { if (e.target.value === "0") e.target.select(); }}
                                placeholder="0"
                                min="0"
                                className="w-full bg-transparent font-black text-sm text-slate-900 outline-none placeholder-slate-400"
                            />
                            <span className="text-slate-400 font-bold text-sm shrink-0 ml-1 select-none">
                                ৳
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Internet */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-[#60A5FA] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Wifi size={18} strokeWidth={2.5} />
                            </div>
                            <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 leading-tight">
                                Internet
                            </h4>
                        </div>
                        <div className="bg-[#F1F5F9]/80 rounded-xl px-3 py-2 flex items-center justify-between border border-slate-100/60 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 focus-within:bg-white transition-all">
                            <input 
                                type="number"
                                value={internet === "" ? "" : internet}
                                onChange={(e) => setInternet(e.target.value)}
                                onFocus={(e) => { if (e.target.value === "0") e.target.select(); }}
                                placeholder="0"
                                min="0"
                                className="w-full bg-transparent font-black text-sm text-slate-900 outline-none placeholder-slate-400"
                            />
                            <span className="text-slate-400 font-bold text-sm shrink-0 ml-1 select-none">
                                ৳
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Maid Charge */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-[#4ADE80] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Broom size={18} strokeWidth={2.5} />
                            </div>
                            <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 leading-tight">
                                Maid Charge
                            </h4>
                        </div>
                        <div className="bg-[#F1F5F9]/80 rounded-xl px-3 py-2 flex items-center justify-between border border-slate-100/60 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 focus-within:bg-white transition-all">
                            <input 
                                type="number"
                                value={maid === "" ? "" : maid}
                                onChange={(e) => setMaid(e.target.value)}
                                onFocus={(e) => { if (e.target.value === "0") e.target.select(); }}
                                placeholder="0"
                                min="0"
                                className="w-full bg-transparent font-black text-sm text-slate-900 outline-none placeholder-slate-400"
                            />
                            <span className="text-slate-400 font-bold text-sm shrink-0 ml-1 select-none">
                                ৳
                            </span>
                        </div>
                    </div>

                    {/* Card 5: Additional */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-[#C084FC] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <MoreHorizontal size={18} strokeWidth={2.5} />
                            </div>
                            <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 leading-tight">
                                Additional
                            </h4>
                        </div>
                        <div className="bg-[#F1F5F9]/80 rounded-xl px-3 py-2 flex items-center justify-between border border-slate-100/60 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 focus-within:bg-white transition-all">
                            <input 
                                type="number"
                                value={additional === "" ? "" : additional}
                                onChange={(e) => setAdditional(e.target.value)}
                                onFocus={(e) => { if (e.target.value === "0") e.target.select(); }}
                                placeholder="0"
                                min="0"
                                className="w-full bg-transparent font-black text-sm text-slate-900 outline-none placeholder-slate-400"
                            />
                            <span className="text-slate-400 font-bold text-sm shrink-0 ml-1 select-none">
                                ৳
                            </span>
                        </div>
                    </div>

                    {/* Card 6: Meal Charge */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-[#F472B6] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Utensils size={18} strokeWidth={2.5} />
                            </div>
                            <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 leading-tight">
                                Meal Charge
                            </h4>
                        </div>
                        <div className="bg-[#F1F5F9]/80 rounded-xl px-3 py-2 flex items-center justify-between border border-slate-100/60 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 focus-within:bg-white transition-all">
                            <input 
                                type="number"
                                value={mealCharge === "" ? "" : mealCharge}
                                onChange={(e) => setMealCharge(e.target.value)}
                                onFocus={(e) => { if (e.target.value === "0") e.target.select(); }}
                                placeholder="0"
                                min="0"
                                className="w-full bg-transparent font-black text-sm text-slate-900 outline-none placeholder-slate-400"
                            />
                            <span className="text-slate-400 font-bold text-sm shrink-0 ml-1 select-none">
                                ৳
                            </span>
                        </div>
                    </div>

                </div>

                {/* 4. Action Buttons Row (Side-by-Side) */}
                <div className="flex items-center gap-3">
                    {/* Reset Button */}
                    <button 
                        onClick={() => handleReset()}
                        className="bg-white/95 text-[#FF6B00] font-bold py-3.5 px-4 rounded-2xl border border-orange-200 flex-1 flex items-center justify-center gap-2 shadow-sm hover:bg-orange-50/50 cursor-pointer active:scale-95 transition-all text-sm"
                    >
                        <RotateCcw size={17} strokeWidth={2.5} />
                        <span>Reset</span>
                    </button>

                    {/* Save Button */}
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 px-4 rounded-2xl flex-1 flex items-center justify-center gap-2 shadow-md shadow-orange-500/30 hover:opacity-95 cursor-pointer active:scale-95 transition-all text-sm disabled:opacity-70"
                    >
                        <Save size={17} strokeWidth={2.5} />
                        <span>{isSaving ? "Saving..." : "Save"}</span>
                    </button>
                </div>

                {/* 5. "Summary" Card */}
                <div className="bg-white/95 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-gray-100/80 space-y-3.5 mt-0.5">
                    
                    {/* Card Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-[#FFF5ED] text-[#FF6B00] flex items-center justify-center shrink-0 shadow-2xs">
                                <PieChart size={19} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                                Summary
                            </h3>
                        </div>
                        <div className="bg-orange-50 text-orange-600 text-xs px-2.5 py-1 rounded-full font-bold border border-orange-100 flex items-center gap-1.5 shadow-2xs">
                            <Calendar size={12} strokeWidth={2.5} />
                            <span>{formatShortMonth(month)}</span>
                        </div>
                    </div>

                    {/* Itemized Breakdown List */}
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between py-1 text-xs sm:text-[13px]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shrink-0" />
                                <span className="font-bold text-slate-700">Seat Rent</span>
                            </div>
                            <span className="font-black text-slate-900">৳ {Number(seatRent) || 0}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 text-xs sm:text-[13px]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15] shrink-0" />
                                <span className="font-bold text-slate-700">Electricity + Gas</span>
                            </div>
                            <span className="font-black text-slate-900">৳ {Number(electricityGas) || 0}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 text-xs sm:text-[13px]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#60A5FA] shrink-0" />
                                <span className="font-bold text-slate-700">Internet</span>
                            </div>
                            <span className="font-black text-slate-900">৳ {Number(internet) || 0}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 text-xs sm:text-[13px]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] shrink-0" />
                                <span className="font-bold text-slate-700">Maid Charge</span>
                            </div>
                            <span className="font-black text-slate-900">৳ {Number(maid) || 0}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 text-xs sm:text-[13px]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#C084FC] shrink-0" />
                                <span className="font-bold text-slate-700">Additional</span>
                            </div>
                            <span className="font-black text-slate-900">৳ {Number(additional) || 0}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 text-xs sm:text-[13px]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#F472B6] shrink-0" />
                                <span className="font-bold text-slate-700">Meal Charge</span>
                            </div>
                            <span className="font-black text-slate-900">৳ {Number(mealCharge) || 0}</span>
                        </div>
                    </div>

                    {/* "Per Member" Highlight Bar */}
                    <div className="bg-[#F0FDF4] text-emerald-900 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between border border-emerald-100/70 mt-3 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 shadow-2xs">
                                <Users size={19} strokeWidth={2.5} />
                            </div>
                            <span className="font-black text-xs sm:text-sm text-slate-900">
                                Per Member
                            </span>
                        </div>
                        <span className="font-black text-lg sm:text-xl text-slate-900">
                            ৳ {total.toLocaleString()}
                        </span>
                    </div>

                </div>

            </div>


            {/* ═══════════════════════════════════════════════════════════════════
                DESKTOP VIEW: Comprehensive Setup View
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="hidden md:block max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center shrink-0">
                            <IconCalendarEvent size={28} stroke={2} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#0B132B]">Monthly Expense Setup</h1>
                            <p className="text-sm text-gray-500 font-medium mt-0.5">Set the monthly overhead charges for all mess members for {month}.</p>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-gray-900 font-bold shadow-sm cursor-pointer"
                        >
                            {monthOptions.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl border font-bold text-sm flex items-center justify-between gap-4 animate-in fade-in duration-200 ${
                        message.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : message.type === 'info'
                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <div className="flex items-center gap-2">
                            <span>{message.text}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            {lastBeforeReset && (
                                <button
                                    type="button"
                                    onClick={handleUndoReset}
                                    className="text-xs font-black px-3 py-1 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100/50 transition-colors cursor-pointer text-emerald-800 shadow-2xs"
                                >
                                    Undo Reset
                                </button>
                            )}
                            <button 
                                type="button"
                                onClick={() => setMessage(null)} 
                                className="text-xs font-black underline cursor-pointer opacity-70 hover:opacity-100"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Column - Form */}
                    <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h2 className="text-base font-extrabold text-[#0B132B]">Overhead Expense Categories</h2>
                            <span className="text-xs font-semibold text-gray-500">Amounts will be shared equally</span>
                        </div>

                        <div className="p-6 space-y-3 relative">
                            {isLoading && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-b-2xl">
                                    <p className="font-bold text-orange-600 animate-pulse">Loading data...</p>
                                </div>
                            )}

                            <DesktopInputField icon={IconHome} color="text-orange-500" title="Seat Rent / Room Value" desc="Monthly room/seat rent per member" value={seatRent} setValue={setSeatRent} />
                            <DesktopInputField icon={IconBolt} color="text-yellow-500" title="Electricity Bill + Gas" desc="Total electricity and gas bill per member" value={electricityGas} setValue={setElectricityGas} />
                            <DesktopInputField icon={IconWifi} color="text-blue-500" title="Internet Bill" desc="Total internet bill per member" value={internet} setValue={setInternet} />
                            <DesktopInputField icon={IconUser} color="text-green-500" title="Maid Charge" desc="Maid/cleaning service per member" value={maid} setValue={setMaid} />
                            <DesktopInputField icon={IconDots} color="text-purple-500" title="Additional (Optional)" desc="Any other expense (water, maintenance, etc.)" value={additional} setValue={setAdditional} />
                            <DesktopInputField icon={IconToolsKitchen2} color="text-pink-500" title="Monthly Meal Charge" desc="Monthly food/kitchen charge per member" value={mealCharge} setValue={setMealCharge} />
                        </div>

                        <div className="p-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button 
                                type="button"
                                onClick={handleReset}
                                className="px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-bold text-sm transition-all shadow-sm cursor-pointer flex items-center gap-2 active:scale-95"
                            >
                                <RotateCcw size={15} strokeWidth={2.5} className="text-gray-500" />
                                <span>Reset</span>
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-[#FF6B00] hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-70"
                            >
                                {isSaving ? "Saving..." : "Save Monthly Expense"}
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center shrink-0">
                                    <IconChartPie size={20} stroke={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-[#0B132B]">Expense Summary</h3>
                                    <p className="text-xs text-gray-500 font-bold mt-0.5">Total amount per member for {month}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <DesktopSummaryRow color="bg-orange-500" label="Seat Rent" value={seatRent} />
                                <DesktopSummaryRow color="bg-yellow-500" label="Electricity + Gas" value={electricityGas} />
                                <DesktopSummaryRow color="bg-blue-500" label="Internet" value={internet} />
                                <DesktopSummaryRow color="bg-green-500" label="Maid Charge" value={maid} />
                                <DesktopSummaryRow color="bg-purple-500" label="Additional" value={additional} />
                                <DesktopSummaryRow color="bg-pink-500" label="Meal Charge" value={mealCharge} />
                            </div>

                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Per Member Total</p>
                                    <p className="text-2xl font-black text-slate-900 mt-0.5">৳ {total.toLocaleString()}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 shadow-sm flex items-center justify-center shrink-0">
                                    <IconCalculator size={22} stroke={2} />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}

function DesktopInputField({ icon: Icon, color, title, desc, value, setValue }: any) {
    return (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100/60">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={18} stroke={2.5} />
                </div>
                <div>
                    <p className="text-sm font-extrabold text-[#0B132B]">{title}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{desc}</p>
                </div>
            </div>
            <div className="relative shrink-0 w-32">
                <input 
                    type="number"
                    value={value === "" ? "" : value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={(e) => {
                        if (e.target.value === "0") {
                            e.target.select();
                        }
                    }}
                    placeholder="0"
                    min="0"
                    className="w-full pr-8 pl-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-gray-900 font-black shadow-sm text-right focus:bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">৳</span>
            </div>
        </div>
    );
}

function DesktopSummaryRow({ color, label, value }: any) {
    return (
        <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
                <p className="font-semibold text-gray-700">{label}</p>
            </div>
            <p className="font-black text-slate-900">
                ৳ {Number(value) || 0}
            </p>
        </div>
    );
}
