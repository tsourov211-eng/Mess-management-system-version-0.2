"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    IconReceipt2, 
    IconToolsKitchen2, 
    IconCalendarUser,
    IconArrowRight,
    IconShoppingBag,
    IconClock,
    IconCheck,
    IconX,
    IconWallet
} from "@tabler/icons-react";

export default function ManagerDashboard() {
    const [stats, setStats] = useState({ totalMealsToday: 0, totalBazaarToday: 0 });
    const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
    const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
    const [pendingBazaarSchedules, setPendingBazaarSchedules] = useState<any[]>([]);
    const [pendingGuestMeals, setPendingGuestMeals] = useState<any[]>([]);
    const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const today = new Date();
    const formattedToday = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch("/api/manager/dashboard");
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setPendingDeposits(data.pendingDeposits);
                setPendingExpenses(data.pendingExpenses);
                setPendingBazaarSchedules(data.pendingBazaarSchedules || []);
                setPendingGuestMeals(data.pendingGuestMeals || []);
                setSelectedSchedules([]);

            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 💡 Function to Approve or Reject
    const handleAction = async (id: string, type: 'deposit' | 'expense' | 'guestMeal', action: 'Approve' | 'Reject') => {
        const label = type === 'guestMeal' ? 'guest meal request' : type;
        if (!confirm(`Are you sure you want to ${action} this ${label}?`)) return;

        try {
            const res = await fetch("/api/manager/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, type, action })
            });

            if (res.ok) {
                alert(`✅ ${type} ${action.toLowerCase()}ed successfully!`);
                fetchDashboardData(); // Refresh list
            } else {
                alert(`❌ Failed to ${action.toLowerCase()} ${type}.`);
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
                alert(`✅ Schedule ${action.toLowerCase()}ed successfully!`);
                fetchDashboardData();
            } else {
                alert(`❌ Failed to ${action.toLowerCase()} schedule.`);
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
            alert(`✅ ${selectedSchedules.length} schedule(s) approved successfully!`);
            setSelectedSchedules([]);
            fetchDashboardData();
        } catch (error) {
            console.error(error);
            alert("❌ Failed to approve schedules.");
        }
    };    return (
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 p-4">
            
            {/* ─── Greeting Section ─── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                <div>
                    <p className="text-gray-500 font-bold mb-1">Welcome back,</p>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight">Manager Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-2 font-medium">Overview of today's mess operations and pending approvals.</p>
                </div>
                
                <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <IconClock className="w-5 h-5" stroke={2} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today</p>
                        <p className="text-sm font-extrabold text-gray-900">{formattedToday}</p>
                    </div>
                </div>
            </div>



            {/* ─── Top Stats ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:border-orange-200 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                            <IconToolsKitchen2 className="w-6 h-6" stroke={2} />
                        </div>
                    </div>
                    <div className="mt-4 z-10">
                        <p className="text-gray-500 text-sm font-semibold mb-1">Total Meals Today</p>
                        <h3 className="text-3xl font-extrabold text-gray-900">{isLoading ? "..." : stats.totalMealsToday}</h3>
                    </div>
                    <IconToolsKitchen2 className="absolute -bottom-4 -right-4 w-24 h-24 text-teal-50/50 transform group-hover:scale-110 transition-transform" stroke={1} />
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px] group hover:border-orange-200 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                            <IconShoppingBag className="w-6 h-6" stroke={2} />
                        </div>
                    </div>
                    <div className="mt-4 z-10">
                        <p className="text-gray-500 text-sm font-semibold mb-1">Today's Bazaar Cost</p>
                        <h3 className="text-3xl font-extrabold text-gray-900">Tk {isLoading ? "..." : stats.totalBazaarToday}</h3>
                    </div>
                    <IconShoppingBag className="absolute -bottom-4 -right-4 w-24 h-24 text-orange-50/50 transform group-hover:scale-110 transition-transform" stroke={1} />
                </div>

                <div className="bg-gradient-to-br from-[#0B132B] to-[#1c2a53] p-6 rounded-3xl border border-gray-800 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-orange-400 shrink-0 backdrop-blur-sm">
                            <IconCalendarUser className="w-6 h-6" stroke={2} />
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">Assigned</span>
                    </div>
                    <div className="mt-4 z-10">
                        <p className="text-gray-400 text-sm font-semibold mb-1">Market Duty (Today)</p>
                        <h3 className="text-2xl font-extrabold text-white">Super Admin</h3>
                    </div>
                </div>
            </div>

            {/* ─── NEW: Member Bazaar Date Requests Section ─── */}
            <div className="mt-8 bg-orange-50/50 rounded-3xl border border-orange-200 overflow-hidden shadow-sm">
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-orange-200 bg-white">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                            <IconCalendarUser className="w-5 h-5" stroke={2} />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-900">Member Bazaar Date Requests</h2>
                            <p className="text-xs font-bold text-gray-500 mt-0.5">Review and approve members' requested bazar dates for this month.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                        <div className="bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-orange-200">
                            <IconClock size={14} /> {pendingBazaarSchedules.length} Pending
                        </div>
                        <button className="text-sm font-bold text-gray-700 hover:text-orange-600 transition-colors flex items-center gap-1 bg-white px-4 py-2 rounded-xl border border-gray-200 hover:border-orange-200 shadow-sm">
                            View All <IconArrowRight size={16} />
                        </button>
                        {selectedSchedules.length > 0 && (
                            <button onClick={handleApproveSelectedSchedules} className="bg-[#00B050] hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all">
                                <IconCheck size={16} stroke={3} /> Approve Selected ({selectedSchedules.length})
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="bg-white">
                    {/* Desktop View: Preserved Tabular Layout (md and above) */}
                    <div className="hidden md:block overflow-x-auto">
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
                                    <th className="p-4">Request Time</th>
                                    <th className="p-4">Note</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-400 font-bold">Loading...</td>
                                    </tr>
                                ) : pendingBazaarSchedules.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-400 font-bold">No pending bazaar requests.</td>
                                    </tr>
                                ) : pendingBazaarSchedules.map((item, idx) => (
                                    <tr key={item.id} className={`hover:bg-orange-50/30 transition-colors group ${selectedSchedules.includes(item.id) ? 'bg-orange-50/50' : ''}`}>
                                        <td className="p-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer" 
                                                checked={selectedSchedules.includes(item.id)}
                                                onChange={() => handleSelectSchedule(item.id)}
                                            />
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-500">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                                    {item.user.name?.charAt(0) || 'M'}
                                                </div>
                                                <span className="font-extrabold text-gray-900 text-sm">{item.user.name || 'Member'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                                                <IconCalendarUser size={16} className="text-gray-400" />
                                                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500">
                                                <IconClock size={16} className="text-gray-400" />
                                                {/* using date for fallback since createdAt is missing */}
                                                {new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-600">
                                            I will go to the bazar.
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-md text-xs font-bold border border-orange-200">
                                                Pending
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleScheduleAction(item.id, 'Approve')} className="bg-[#00B050] hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors">
                                                    <IconCheck size={14} stroke={3} /> Approve
                                                </button>
                                                <button onClick={() => handleScheduleAction(item.id, 'Reject')} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors">
                                                    <IconX size={14} stroke={3} /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View: Compact Stacked Cards (< md) */}
                    <div className="block md:hidden">
                        {/* Mobile Select All Bar */}
                        {pendingBazaarSchedules.length > 0 && (
                            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer" 
                                        checked={pendingBazaarSchedules.length > 0 && selectedSchedules.length === pendingBazaarSchedules.length}
                                        onChange={handleSelectAllSchedules}
                                    />
                                    <span>Select All</span>
                                </label>
                                <span>
                                    {selectedSchedules.length > 0 ? (
                                        <span className="text-orange-600 font-extrabold">{selectedSchedules.length} selected</span>
                                    ) : (
                                        <span>{pendingBazaarSchedules.length} requests</span>
                                    )}
                                </span>
                            </div>
                        )}

                        <div className="divide-y divide-gray-100">
                            {isLoading ? (
                                <div className="p-8 text-center text-gray-400 font-bold text-sm">Loading...</div>
                            ) : pendingBazaarSchedules.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 font-bold text-sm">No pending bazaar requests.</div>
                            ) : (
                                pendingBazaarSchedules.map((item, idx) => {
                                    const isSelected = selectedSchedules.includes(item.id);
                                    return (
                                        <div 
                                            key={item.id} 
                                            className={`p-4 transition-colors space-y-3 ${isSelected ? 'bg-orange-50/50' : 'bg-white hover:bg-orange-50/20'}`}
                                        >
                                            {/* Card Header: Checkbox, #, Member info, and Status badge */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer shrink-0" 
                                                        checked={isSelected}
                                                        onChange={() => handleSelectSchedule(item.id)}
                                                    />
                                                    <span className="text-xs font-bold text-gray-400 shrink-0">#{idx + 1}</span>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                                            {item.user.name?.charAt(0) || 'M'}
                                                        </div>
                                                        <span className="font-extrabold text-gray-900 text-sm truncate">
                                                            {item.user.name || 'Member'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="bg-orange-100 text-orange-600 px-2.5 py-1 rounded-md text-xs font-bold border border-orange-200 shrink-0">
                                                    Pending
                                                </span>
                                            </div>

                                            {/* Date & Time info pill cards */}
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-center gap-1.5 font-bold text-gray-700 bg-gray-50/80 px-2.5 py-2 rounded-xl border border-gray-100">
                                                    <IconCalendarUser size={15} className="text-gray-400 shrink-0" />
                                                    <span className="truncate">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 font-bold text-gray-500 bg-gray-50/80 px-2.5 py-2 rounded-xl border border-gray-100">
                                                    <IconClock size={15} className="text-gray-400 shrink-0" />
                                                    <span className="truncate">{new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })}</span>
                                                </div>
                                            </div>

                                            {/* Note */}
                                            <div className="text-xs font-medium text-gray-600 bg-gray-50/60 px-3 py-2 rounded-xl border border-gray-100 flex items-center gap-1.5">
                                                <span className="font-bold text-gray-400 shrink-0">Note:</span>
                                                <span className="truncate">I will go to the bazar.</span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 pt-0.5">
                                                <button 
                                                    onClick={() => handleScheduleAction(item.id, 'Approve')} 
                                                    className="flex-1 bg-[#00B050] hover:bg-emerald-600 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                                                >
                                                    <IconCheck size={14} stroke={3} /> Approve
                                                </button>
                                                <button 
                                                    onClick={() => handleScheduleAction(item.id, 'Reject')} 
                                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                                                >
                                                    <IconX size={14} stroke={3} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 pt-4">
                
                {/* 1. Pending Payments */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[450px]">
                    <div className="p-6 border-b border-gray-100 bg-[#F8FAFC] flex justify-between items-center sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <IconWallet size={20} stroke={2.5} />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900">Pending Payments</h2>
                                <p className="text-xs font-bold text-gray-500 mt-0.5">Approve member deposits</p>
                            </div>
                        </div>
                        {pendingDeposits.length > 0 && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full animate-pulse">{pendingDeposits.length} New</span>
                        )}
                    </div>
                    
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                        {isLoading ? (
                            <p className="text-center text-gray-400 font-bold py-10">Loading...</p>
                        ) : pendingDeposits.length === 0 ? (
                            <p className="text-center text-gray-400 font-bold py-10">No pending payments.</p>
                        ) : (
                            pendingDeposits.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-200 transition-all gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#0B132B] text-white flex items-center justify-center font-bold text-lg shrink-0">
                                            {item.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-gray-900 text-sm">{item.user.name}</h4>
                                            <p className="text-xs font-bold text-gray-500 mt-0.5">Tk {item.amount} • {item.method}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button onClick={() => handleAction(item.id, 'deposit', 'Reject')} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 text-xs font-bold px-4 py-2 rounded-xl transition-all">
                                            <IconX size={16} /> Reject
                                        </button>
                                        <button onClick={() => handleAction(item.id, 'deposit', 'Approve')} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20">
                                            <IconCheck size={16} /> Approve
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Pending Bazaar Expenses */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[450px]">
                    <div className="p-6 border-b border-gray-100 bg-[#F8FAFC] flex justify-between items-center sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                <IconShoppingBag size={20} stroke={2.5} />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900">Bazaar Expenses</h2>
                                <p className="text-xs font-bold text-gray-500 mt-0.5">Approve market costs</p>
                            </div>
                        </div>
                        {pendingExpenses.length > 0 && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full animate-pulse">{pendingExpenses.length} New</span>
                        )}
                    </div>
                    
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                        {isLoading ? (
                            <p className="text-center text-gray-400 font-bold py-10">Loading...</p>
                        ) : pendingExpenses.length === 0 ? (
                            <p className="text-center text-gray-400 font-bold py-10">No pending expenses.</p>
                        ) : (
                            pendingExpenses.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-orange-200 transition-all gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg shrink-0">
                                            {item.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-gray-900 text-sm">{item.user.name}</h4>
                                            <p className="text-xs font-bold text-gray-500 mt-0.5">Tk {item.amount} • {new Date(item.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button onClick={() => handleAction(item.id, 'expense', 'Reject')} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 text-xs font-bold px-4 py-2 rounded-xl transition-all">
                                            <IconX size={16} /> Reject
                                        </button>
                                        <button onClick={() => handleAction(item.id, 'expense', 'Approve')} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-orange-500/20">
                                            <IconCheck size={16} /> Approve
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Pending Guest Meal Requests */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[450px]">
                    <div className="p-6 border-b border-gray-100 bg-[#F8FAFC] flex justify-between items-center sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                <IconToolsKitchen2 size={20} stroke={2.5} />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900">Guest Meals</h2>
                                <p className="text-xs font-bold text-gray-500 mt-0.5">Approve member guest meals</p>
                            </div>
                        </div>
                        {pendingGuestMeals.length > 0 && (
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">{pendingGuestMeals.length} New</span>
                        )}
                    </div>
                    
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                        {isLoading ? (
                            <p className="text-center text-gray-400 font-bold py-10">Loading...</p>
                        ) : pendingGuestMeals.length === 0 ? (
                            <p className="text-center text-gray-400 font-bold py-10">No pending guest meals.</p>
                        ) : (
                            pendingGuestMeals.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-orange-200 transition-all gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-[#0B132B] text-white flex items-center justify-center font-bold text-lg shrink-0">
                                            {item.user.name?.charAt(0) || 'M'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-extrabold text-gray-900 text-sm truncate">{item.user.name}</h4>
                                                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                    {item.guests} {item.guests > 1 ? 'Guests' : 'Guest'}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-500 mt-0.5">
                                                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {item.mealType}
                                            </p>
                                            {item.note && (
                                                <p className="text-xs text-gray-600 font-medium mt-1 italic truncate max-w-[200px]" title={item.note}>
                                                    "{item.note}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                        <button onClick={() => handleAction(item.id, 'guestMeal', 'Reject')} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white hover:bg-rose-50 text-gray-600 hover:text-rose-600 border border-gray-200 hover:border-rose-200 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer">
                                            <IconX size={16} /> Reject
                                        </button>
                                        <button onClick={() => handleAction(item.id, 'guestMeal', 'Approve')} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-[#00B050] hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer">
                                            <IconCheck size={16} /> Approve
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}