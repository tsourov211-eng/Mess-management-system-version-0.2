"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    IconArrowLeft, 
    IconCreditCard, 
    IconCheck, 
    IconX, 
    IconRefresh,
    IconCalendar,
    IconCurrencyTaka
} from "@tabler/icons-react";

export default function PaymentsPage() {
    const [deposits, setDeposits] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchDeposits();
    }, []);

    const fetchDeposits = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/manager/dashboard");
            if (res.ok) {
                const data = await res.json();
                setDeposits(data.pendingDeposits || []);
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, action: "Approve" | "Reject") => {
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this payment?`)) return;

        setIsProcessing(true);
        try {
            const res = await fetch("/api/manager/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, type: "deposit", action })
            });

            if (res.ok) {
                fetchDeposits();
            } else {
                alert(`Failed to ${action.toLowerCase()} payment.`);
            }
        } catch (error) {
            console.error(error);
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
                            Pending Payments
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                                {deposits.length} Pending
                            </span>
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">Verify and approve member deposit submissions</p>
                    </div>
                </div>
                <button 
                    onClick={fetchDeposits} 
                    className="w-10 h-10 rounded-2xl bg-white/90 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 shadow-sm transition-all cursor-pointer"
                    title="Refresh"
                >
                    <IconRefresh size={18} stroke={2.2} className={isLoading ? "animate-spin text-blue-500" : ""} />
                </button>
            </div>

            {/* Payments List */}
            {isLoading ? (
                <div className="p-12 text-center text-gray-400 font-bold bg-white/90 rounded-3xl border border-gray-100 shadow-sm">
                    Loading payments...
                </div>
            ) : deposits.length === 0 ? (
                <div className="p-12 text-center bg-white/90 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
                        <IconCreditCard size={28} stroke={2} />
                    </div>
                    <p className="font-extrabold text-slate-800 text-base">No pending payments</p>
                    <p className="text-xs text-gray-400 font-medium">All member deposits have been verified and processed.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {deposits.map((item, idx) => (
                        <div 
                            key={item.id} 
                            className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 border border-gray-100 hover:border-blue-100 transition-all shadow-sm space-y-3.5"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                                        {item.user?.name?.charAt(0) || "M"}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-extrabold text-slate-900 text-sm truncate">{item.user?.name || "Member"}</h4>
                                        <p className="text-[11px] text-gray-400 font-medium truncate">Payment #{idx + 1}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-base sm:text-lg font-black text-emerald-600 block leading-tight">
                                        ৳ {item.amount?.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {item.method || "Cash"}
                                    </span>
                                </div>
                            </div>

                            {/* Details Row */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-slate-700 bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-100">
                                    <IconCalendar size={15} className="text-gray-400 shrink-0" />
                                    <span className="truncate">
                                        {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 font-bold text-blue-600 bg-blue-50/80 px-3 py-2 rounded-xl border border-blue-100">
                                    <IconCurrencyTaka size={15} className="text-blue-500 shrink-0" />
                                    <span className="truncate">Method: {item.method || "Cash"}</span>
                                </div>
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
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    <IconCheck size={15} stroke={3} /> Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
