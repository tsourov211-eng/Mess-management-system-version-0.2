"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
    IconArrowLeft, 
    IconShoppingCart, 
    IconCheck, 
    IconX, 
    IconRefresh,
    IconCalendar,
    IconReceipt
} from "@tabler/icons-react";

import ConfirmModal from "@/components/ConfirmModal";

export default function ExpensesQueuePage() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role;
    const backHref = userRole === "admin" ? "/admin" : "/manager";

    const [expenses, setExpenses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        type: "approve" | "reject";
        title: string;
        message: React.ReactNode;
        confirmText: string;
        onConfirm: () => Promise<void> | void;
    } | null>(null);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/manager/dashboard");
            if (res.ok) {
                const data = await res.json();
                setExpenses(data.pendingExpenses || []);
            }
        } catch (error) {
            console.error("Error fetching expenses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = (id: string, action: "Approve" | "Reject") => {
        setConfirmModalState({
            isOpen: true,
            type: action === "Approve" ? "approve" : "reject",
            title: `${action} Expense`,
            message: `Are you sure you want to ${action.toLowerCase()} this mess expense?`,
            confirmText: action,
            onConfirm: async () => {
                setIsProcessing(true);
                try {
                    const res = await fetch("/api/manager/action", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, type: "expense", action })
                    });

                    if (res.ok) {
                        setConfirmModalState(null);
                        fetchExpenses();
                    } else {
                        alert(`Failed to ${action.toLowerCase()} expense.`);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsProcessing(false);
                }
            }
        });
    };

    return (
        <div className="w-full max-w-md sm:max-w-xl md:max-w-7xl mx-auto space-y-4 md:space-y-6 pb-12">
            {/* Header & Back Navigation */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link 
                        href={backHref} 
                        className="w-10 h-10 rounded-2xl bg-white/90 border border-gray-100 flex items-center justify-center text-gray-700 shadow-sm hover:bg-white transition-all cursor-pointer"
                        aria-label={userRole === "admin" ? "Back to Admin Dashboard" : "Back to Manager Dashboard"}
                    >
                        <IconArrowLeft size={20} stroke={2.5} />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            Bazaar Expenses
                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
                                {expenses.length} Pending
                            </span>
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">Verify and approve market bazaar spending</p>
                    </div>
                </div>
                <button 
                    onClick={fetchExpenses} 
                    className="w-10 h-10 rounded-2xl bg-white/90 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-orange-600 shadow-sm transition-all cursor-pointer"
                    title="Refresh"
                >
                    <IconRefresh size={18} stroke={2.2} className={isLoading ? "animate-spin text-orange-500" : ""} />
                </button>
            </div>

            {/* Expenses List */}
            {isLoading ? (
                <div className="p-12 text-center text-gray-400 font-bold bg-white/90 rounded-3xl border border-gray-100 shadow-sm">
                    Loading expenses...
                </div>
            ) : expenses.length === 0 ? (
                <div className="p-12 text-center bg-white/90 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                        <IconShoppingCart size={28} stroke={2} />
                    </div>
                    <p className="font-extrabold text-slate-800 text-base">No pending bazaar expenses</p>
                    <p className="text-xs text-gray-400 font-medium">All member market cost submissions have been reviewed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {expenses.map((item, idx) => (
                        <div 
                            key={item.id} 
                            className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 border border-gray-100 hover:border-orange-200 transition-all shadow-sm hover:shadow-md space-y-3.5 flex flex-col justify-between"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                                        {item.user?.name?.charAt(0) || "M"}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-extrabold text-slate-900 text-sm truncate">{item.user?.name || "Member"}</h4>
                                        <p className="text-[11px] text-gray-400 font-medium truncate">Expense #{idx + 1}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-base sm:text-lg font-black text-orange-600 block leading-tight">
                                        ৳ {item.amount?.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        Bazaar Cost
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
                                <div className="flex items-center gap-1.5 font-bold text-gray-600 bg-orange-50/70 px-3 py-2 rounded-xl border border-orange-100">
                                    <IconReceipt size={15} className="text-orange-500 shrink-0" />
                                    <span className="truncate">{item.description || "Market Bazaar"}</span>
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
                                    className="flex-1 bg-[#FF6B00] hover:bg-orange-600 text-white py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    <IconCheck size={15} stroke={3} /> Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Modern Confirm Modal ─── */}
            {confirmModalState && (
                <ConfirmModal 
                    isOpen={confirmModalState.isOpen}
                    onClose={() => setConfirmModalState(null)}
                    onConfirm={confirmModalState.onConfirm}
                    type={confirmModalState.type}
                    title={confirmModalState.title}
                    message={confirmModalState.message}
                    confirmText={confirmModalState.confirmText}
                    isLoading={isProcessing}
                />
            )}
        </div>
    );
}
