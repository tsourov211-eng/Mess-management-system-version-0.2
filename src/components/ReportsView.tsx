"use client";

import { useState, useEffect } from "react";
import { 
    IconReportAnalytics, 
    IconWallet, 
    IconReceipt2, 
    IconChartPie,
    IconCalendarStats
} from "@tabler/icons-react";

export default function ReportsView() {
    const [stats, setStats] = useState({
        totalDeposit: 0,
        totalMeals: 0,
        liveMealRate: 0,
        currentBalance: 0,
        mealCost: 0,
        fixedCost: 0,
        totalCost: 0,
        isPositive: true,
        balanceFormatted: "",
    });
    const [isLoading, setIsLoading] = useState(true);

    const today = new Date();
    const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                // Using Dashboard API, because all calculations are there
                const res = await fetch("/api/members/dashboard-data");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReportData();
    }, []);

    const computedMealCost = stats.mealCost || (stats.totalMeals * stats.liveMealRate);
    const computedTotalCost = stats.totalCost || (computedMealCost + (stats.fixedCost || 0));

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
            
            {/* ─── Header Section ─── */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] flex items-center gap-3">
                        <IconReportAnalytics className="text-blue-500 w-8 h-8" stroke={2.5} />
                        Financial Reports
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Your detailed financial summary and meal expenses for {currentMonth}.</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-blue-700 font-bold text-sm shadow-sm">
                    {currentMonth}
                </div>
            </div>

            {/* ─── Summary Cards ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                
                {/* 1. Total Deposit */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                            <IconWallet size={18} stroke={2.5} />
                        </div>
                        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Total Deposit</p>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 ml-11">
                        Tk {isLoading ? "..." : stats.totalDeposit.toLocaleString()}
                    </h3>
                </div>

                {/* 2. Total Meals */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                            <IconChartPie size={18} stroke={2.5} />
                        </div>
                        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Total Meals</p>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 ml-11">
                        {isLoading ? "..." : stats.totalMeals}
                    </h3>
                </div>

                {/* 3. Meal Rate */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <IconReceipt2 size={18} stroke={2.5} />
                        </div>
                        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Meal Rate</p>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 ml-11">
                        Tk {isLoading ? "..." : stats.liveMealRate.toFixed(2)}
                    </h3>
                </div>

                {/* 4. Current Balance */}
                <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-center ${stats.currentBalance < 0 ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.currentBalance < 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            <IconWallet size={18} stroke={2.5} />
                        </div>
                        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Current Balance</p>
                    </div>
                    <h3 className={`text-2xl font-extrabold ml-11 ${stats.currentBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isLoading ? "..." : `${stats.currentBalance >= 0 ? "+" : "-"} Tk ${Math.abs(stats.currentBalance).toLocaleString()}`}
                    </h3>
                </div>
            </div>

            {/* ─── Detailed Calculation Section ─── */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#F8FAFC] flex items-center gap-3">
                    <IconCalendarStats className="text-gray-500" size={20} stroke={2} />
                    <h3 className="font-extrabold text-gray-900 text-lg">Detailed Calculation</h3>
                </div>
                
                <div className="p-6 sm:p-8">
                    {isLoading ? (
                        <p className="text-center text-gray-400 font-bold py-10">Calculating your data...</p>
                    ) : (
                        <div className="max-w-2xl mx-auto space-y-4">
                            
                            <div className="flex justify-between items-center py-3 border-b border-dashed border-gray-200">
                                <span className="font-bold text-gray-600">Total Approved Deposit</span>
                                <span className="font-extrabold text-gray-900 text-lg">Tk {stats.totalDeposit.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center py-3 border-b border-dashed border-gray-200">
                                <span className="font-bold text-gray-600">Total Meals Consumed</span>
                                <span className="font-extrabold text-gray-900 text-lg">{stats.totalMeals}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-dashed border-gray-200">
                                <span className="font-bold text-gray-600">Current Meal Rate</span>
                                <span className="font-extrabold text-gray-900 text-lg">× Tk {stats.liveMealRate.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-dashed border-gray-200">
                                <span className="font-bold text-gray-600">Total Meal Cost</span>
                                <span className="font-extrabold text-red-500 text-lg">- Tk {computedMealCost.toFixed(2)}</span>
                            </div>

                            {stats.fixedCost > 0 && (
                                <div className="flex justify-between items-center py-3 border-b border-dashed border-gray-200">
                                    <span className="font-bold text-gray-600">Fixed Overhead (Room / Utilities / Maid)</span>
                                    <span className="font-extrabold text-red-500 text-lg">- Tk {stats.fixedCost.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center py-3 border-b-2 border-gray-800">
                                <span className="font-bold text-gray-800">Total Month Cost</span>
                                <span className="font-extrabold text-red-500 text-xl">- Tk {computedTotalCost.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <span className="font-extrabold text-gray-900 text-lg uppercase tracking-wide">Final Balance</span>
                                <span className={`font-black text-3xl ${stats.currentBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {stats.currentBalance >= 0 ? "+" : "-"} Tk {Math.abs(stats.currentBalance).toFixed(2)}
                                </span>
                            </div>
                            
                            {stats.currentBalance < 0 && (
                                <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                                    <p className="text-sm font-bold text-red-600">
                                        ⚠️ You have a due of Tk {Math.abs(stats.currentBalance).toFixed(2)}. Please clear your payment to avoid interruption.
                                    </p>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}