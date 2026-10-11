"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    IconArrowLeft, 
    IconCalendarUser, 
    IconClock, 
    IconCheck, 
    IconX, 
    IconRefresh,
    IconCalendar
} from "@tabler/icons-react";

export default function BazaarRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/manager/dashboard");
            if (res.ok) {
                const data = await res.json();
                setRequests(data.pendingBazaarSchedules || []);
                setSelectedIds([]);
            }
        } catch (error) {
            console.error("Error fetching bazaar requests:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, action: "Approve" | "Reject") => {
        const status = action === "Approve" ? "approved" : "rejected";
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this schedule request?`)) return;

        setIsProcessing(true);
        try {
            const res = await fetch("/api/members/bazaar-schedule", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scheduleId: id, status })
            });

            if (res.ok) {
                fetchRequests();
            } else {
                alert(`Failed to ${action.toLowerCase()} schedule.`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(requests.map(r => r.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleApproveSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Approve ${selectedIds.length} selected schedule(s)?`)) return;

        setIsProcessing(true);
        try {
            const promises = selectedIds.map(id =>
                fetch("/api/members/bazaar-schedule", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ scheduleId: id, status: "approved" })
                })
            );
            await Promise.all(promises);
            fetchRequests();
        } catch (error) {
            console.error(error);
            alert("Failed to approve selected schedules.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-4 pb-12">
            {/* Header & Back Navigation */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link 
                        href="/manager" 
                        className="w-10 h-10 rounded-2xl bg-white/90 border border-gray-100 flex items-center justify-center text-gray-700 shadow-sm hover:bg-white transition-all cursor-pointer"
                        aria-label="Back to Manager Dashboard"
                    >
                        <IconArrowLeft size={20} stroke={2.5} />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            Bazaar Requests
                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
                                {requests.length} Pending
                            </span>
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">Review and approve members' requested bazaar dates</p>
                    </div>
                </div>
                <button 
                    onClick={fetchRequests} 
                    className="w-10 h-10 rounded-2xl bg-white/90 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-orange-600 shadow-sm transition-all cursor-pointer"
                    title="Refresh"
                >
                    <IconRefresh size={18} stroke={2.2} className={isLoading ? "animate-spin text-orange-500" : ""} />
                </button>
            </div>

            {/* Batch Action Bar */}
            {requests.length > 0 && (
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2.5 text-xs font-bold text-gray-600 cursor-pointer pl-1">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                            checked={requests.length > 0 && selectedIds.length === requests.length}
                            onChange={handleSelectAll}
                        />
                        <span>Select All ({requests.length})</span>
                    </label>

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleApproveSelected}
                            disabled={isProcessing}
                            className="bg-[#00B050] hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                        >
                            <IconCheck size={14} stroke={3} />
                            <span>Approve ({selectedIds.length})</span>
                        </button>
                    )}
                </div>
            )}

            {/* Request Cards List */}
            {isLoading ? (
                <div className="p-12 text-center text-gray-400 font-bold bg-white/90 rounded-3xl border border-gray-100 shadow-sm">
                    Loading requests...
                </div>
            ) : requests.length === 0 ? (
                <div className="p-12 text-center bg-white/90 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                        <IconCalendar size={28} stroke={2} />
                    </div>
                    <p className="font-extrabold text-slate-800 text-base">No pending bazaar requests</p>
                    <p className="text-xs text-gray-400 font-medium">All member date schedule requests have been reviewed.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((item, idx) => {
                        const isSelected = selectedIds.includes(item.id);
                        return (
                            <div 
                                key={item.id} 
                                className={`bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 border transition-all shadow-sm space-y-3.5 ${
                                    isSelected ? "border-orange-300 bg-orange-50/30" : "border-gray-100 hover:border-orange-100"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer shrink-0"
                                            checked={isSelected}
                                            onChange={() => handleToggleSelect(item.id)}
                                        />
                                        <div className="w-10 h-10 rounded-full bg-[#0B132B] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                                            {item.user?.name?.charAt(0) || "M"}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-extrabold text-slate-900 text-sm truncate">{item.user?.name || "Member"}</h4>
                                            <p className="text-[11px] text-gray-400 font-medium truncate">Request #{idx + 1}</p>
                                        </div>
                                    </div>
                                    <span className="bg-orange-100 text-orange-600 px-2.5 py-1 rounded-xl text-xs font-bold border border-orange-200 shrink-0">
                                        Pending
                                    </span>
                                </div>

                                {/* Details Row */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-700 bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-100">
                                        <IconCalendarUser size={15} className="text-gray-400 shrink-0" />
                                        <span className="truncate">
                                            {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 font-bold text-gray-500 bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-100">
                                        <IconClock size={15} className="text-gray-400 shrink-0" />
                                        <span className="truncate">
                                            {new Date(item.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="text-xs font-medium text-gray-600 bg-amber-50/50 px-3.5 py-2.5 rounded-xl border border-amber-100/60 flex items-center gap-2">
                                    <span className="font-bold text-amber-600 shrink-0">Note:</span>
                                    <span className="truncate">{item.note || "I will go to the bazar."}</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-1">
                                    <button 
                                        onClick={() => handleAction(item.id, "Reject")} 
                                        disabled={isProcessing}
                                        className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        <IconX size={15} stroke={3} /> Reject
                                    </button>
                                    <button 
                                        onClick={() => handleAction(item.id, "Approve")} 
                                        disabled={isProcessing}
                                        className="flex-1 bg-[#00B050] hover:bg-emerald-600 text-white py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        <IconCheck size={15} stroke={3} /> Approve
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
