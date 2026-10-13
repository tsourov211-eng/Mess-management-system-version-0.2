"use client";

import { useState, useEffect } from "react";
import { 
    IconUsersGroup, 
    IconWallet, 
    IconTrendingDown, 
    IconCalendarEvent,
    IconCalendar,
    IconChevronRight,
    IconEdit,
    IconDotsVertical,
    IconPlus,
    IconTrendingUp,
    IconUserPlus,
    IconClock,
    IconCheck,
    IconX,
    IconMail,
    IconPhone,
    IconChevronUp,
    IconChevronDown,
    IconShoppingBag,
    IconReceipt2,
    IconCalculator,
    IconArrowUpRight,
    IconArrowDownRight,
    IconCreditCard,
    IconShoppingCart as TablerShoppingCart,
    IconUsers as TablerUsers,
    IconBell,
    IconCalendarUser,
    IconArrowRight,
    IconFileText,
    IconAlertCircle,
    IconTrash
} from "@tabler/icons-react";
import {
    Crown,
    ShieldCheck,
    User as UserIcon,
    Users,
    Search,
    ShoppingCart,
    Coins,
    Calculator,
    Receipt,
    Clock,
    UserPlus,
    ChevronDown,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Check,
    X,
    Calendar
} from "lucide-react";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";

export default function AdminDashboardPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [pendingMembers, setPendingMembers] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalFoodCost: 0, mealFund: 0, messFund: 0, totalFund: 0, totalMembers: 0, totalMessMeals: 0, liveMealRate: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isPendingExpanded, setIsPendingExpanded] = useState(false);

    // Mobile specific states
    const [todayBazaarTotal, setTodayBazaarTotal] = useState(0);
    const [bazaarSchedules, setBazaarSchedules] = useState<any[]>([]);
    const [todayExpenses, setTodayExpenses] = useState<any[]>([]);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [activeMobileDropdown, setActiveMobileDropdown] = useState<string | null>(null);

    // Operational queues & management states
    const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
    const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
    const [pendingBazaarSchedules, setPendingBazaarSchedules] = useState<any[]>([]);
    const [pendingGuestMeals, setPendingGuestMeals] = useState<any[]>([]);
    const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
    const [notices, setNotices] = useState<any[]>([]);
    const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        type: "approve" | "reject" | "danger" | "warning";
        title: string;
        message: React.ReactNode;
        confirmText?: string;
        onConfirm: () => Promise<void> | void;
    } | null>(null);
    const [isConfirmModalLoading, setIsConfirmModalLoading] = useState(false);

    const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveDropdown(null);
            setActiveMobileDropdown(null);
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // To show today's date dynamically
    const today = new Date();
    const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const todayFormattedShort = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const getMemberAvatarStyle = (name: string, index: number) => {
        const initial = (name || "M").trim().charAt(0).toUpperCase();
        const palettes = [
            { bg: "bg-[#FFEADB]", text: "text-[#EA580C]" }, // Peach / Orange
            { bg: "bg-[#DBEAFE]", text: "text-[#2563EB]" }, // Sky Blue
            { bg: "bg-[#DCFCE7]", text: "text-[#16A34A]" }, // Mint Green
            { bg: "bg-[#FCE7F3]", text: "text-[#DB2777]" }, // Pink
            { bg: "bg-[#EDE9FE]", text: "text-[#7C3AED]" }, // Lavender
        ];
        return {
            initial,
            ...palettes[index % palettes.length]
        };
    };

    const renderRoleBadge = (role: string) => {
        const r = (role || "member").toLowerCase();
        if (r === "admin") {
            return (
                <span className="bg-[#F3E8FF] text-[#7C3AED] border border-purple-200/50 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs shrink-0">
                    <Crown size={12} strokeWidth={2.5} className="shrink-0" /> ADMIN
                </span>
            );
        }
        if (r === "manager") {
            return (
                <span className="bg-[#E0F2FE] text-[#0284C7] border border-sky-200/50 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs shrink-0">
                    <ShieldCheck size={12} strokeWidth={2.5} className="shrink-0" /> MANAGER
                </span>
            );
        }
        if (r === "suspended") {
            return (
                <span className="bg-rose-50 text-rose-600 border border-rose-200/50 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs shrink-0">
                    SUSPENDED
                </span>
            );
        }
        return (
            <span className="bg-[#DCFCE7] text-[#16A34A] border border-emerald-200/50 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs shrink-0">
                <UserIcon size={12} strokeWidth={2.5} className="shrink-0" /> MEMBER
            </span>
        );
    };

    const filteredUsers = users.filter((u) => {
        if (!memberSearchQuery.trim()) return true;
        const q = memberSearchQuery.toLowerCase();
        return (
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.role && u.role.toLowerCase().includes(q))
        );
    });
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    useEffect(() => {
        fetchUsers();
        fetchMobileDashboardData();
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch("/api/manager/dashboard");
            if (res.ok) {
                const data = await res.json();
                setPendingDeposits(data.pendingDeposits || []);
                setPendingExpenses(data.pendingExpenses || []);
                setPendingBazaarSchedules(data.pendingBazaarSchedules || []);
                setPendingGuestMeals(data.pendingGuestMeals || []);
                setNotices(data.notices || []);
                setSelectedSchedules([]);
            }
        } catch (error) {
            console.error("Error fetching manager dashboard data for admin:", error);
        }
    };

    // Notice Board Handlers
    const handleClearAllNotices = async () => {
        if (notices.length === 0) return;
        setNotices([]);
        showToast("All notices cleared successfully.", "success");
        try {
            await fetch("/api/members/clear-notices", { method: "POST" });
        } catch (error) {
            console.error("Failed to clear notices:", error);
        }
    };

    const handleDismissNotice = async (noticeId: string) => {
        setNotices((prev) => prev.filter((n) => n.id !== noticeId));
        setSelectedNotice(null);
        showToast("Notice dismissed successfully.", "success");
        try {
            await fetch("/api/members/clear-notices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noticeId }),
            });
        } catch (error) {
            console.error("Failed to dismiss notice:", error);
        }
    };

    // Actions for operational queues (deposits, expenses, guest meals)
    const handleQueueAction = (id: string, type: 'deposit' | 'expense' | 'guestMeal', action: 'Approve' | 'Reject') => {
        const label = type === 'guestMeal' ? 'guest meal request' : type;
        setConfirmModalState({
            isOpen: true,
            type: action === "Approve" ? "approve" : "reject",
            title: `${action} ${label.charAt(0).toUpperCase() + label.slice(1)}`,
            message: `Are you sure you want to ${action.toLowerCase()} this ${label}?`,
            confirmText: action,
            onConfirm: async () => {
                setIsConfirmModalLoading(true);
                try {
                    const res = await fetch("/api/manager/action", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, type, action })
                    });

                    if (res.ok) {
                        showToast(`✅ ${label.charAt(0).toUpperCase() + label.slice(1)} ${action.toLowerCase()}d successfully.`, "success");
                        setConfirmModalState(null);
                        fetchDashboardData();
                        fetchUsers();
                    } else {
                        showToast(`❌ Failed to ${action.toLowerCase()} ${type}.`, "error");
                    }
                } catch (error) {
                    console.error(error);
                    showToast(`❌ Error processing ${type}.`, "error");
                } finally {
                    setIsConfirmModalLoading(false);
                }
            }
        });
    };

    const handleScheduleAction = (id: string, action: 'Approve' | 'Reject') => {
        const status = action === 'Approve' ? 'approved' : 'rejected';
        setConfirmModalState({
            isOpen: true,
            type: action === "Approve" ? "approve" : "reject",
            title: `${action} Bazaar Schedule`,
            message: `Are you sure you want to ${action.toLowerCase()} this schedule request?`,
            confirmText: action,
            onConfirm: async () => {
                setIsConfirmModalLoading(true);
                try {
                    const res = await fetch("/api/members/bazaar-schedule", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ scheduleId: id, status })
                    });

                    if (res.ok) {
                        showToast(`✅ Schedule ${status} successfully.`, "success");
                        setConfirmModalState(null);
                        fetchDashboardData();
                        fetchUsers();
                    } else {
                        showToast(`❌ Failed to ${action.toLowerCase()} schedule.`, "error");
                    }
                } catch (error) {
                    console.error(error);
                    showToast("❌ Error processing schedule.", "error");
                } finally {
                    setIsConfirmModalLoading(false);
                }
            }
        });
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

    const handleApproveSelectedSchedules = () => {
        if (selectedSchedules.length === 0) return;
        setConfirmModalState({
            isOpen: true,
            type: "approve",
            title: "Approve Selected Schedules",
            message: `Are you sure you want to approve ${selectedSchedules.length} selected schedule(s)?`,
            confirmText: "Approve All",
            onConfirm: async () => {
                setIsConfirmModalLoading(true);
                try {
                    const promises = selectedSchedules.map(id => 
                        fetch("/api/members/bazaar-schedule", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ scheduleId: id, status: "approved" })
                        })
                    );
                    await Promise.all(promises);
                    setSelectedSchedules([]);
                    showToast("✅ Selected schedules approved successfully.", "success");
                    setConfirmModalState(null);
                    fetchDashboardData();
                    fetchUsers();
                } catch (error) {
                    console.error(error);
                    showToast("❌ Failed to approve schedules.", "error");
                } finally {
                    setIsConfirmModalLoading(false);
                }
            }
        });
    };

    const fetchMobileDashboardData = async () => {
        try {
            const res = await fetch("/api/bazaar");
            if (res.ok) {
                const data = await res.json();
                setBazaarSchedules(data.schedules?.slice(0, 4) || []);
                setTodayExpenses(data.expenses || []);
                setTodayBazaarTotal(data.todayTotal || 0);
            }
        } catch (e) {
            console.error("Error fetching mobile dashboard data:", e);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                const allUsers = data.users || [];
                setUsers(allUsers.filter((u: any) => u.role !== 'pending'));
                setPendingMembers(allUsers.filter((u: any) => u.role === 'pending'));
                if (data.stats) {
                    setStats(data.stats);
                    if (data.stats.totalBazaarToday !== undefined) {
                        setTodayBazaarTotal(data.stats.totalBazaarToday);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to update user role
    const handleRoleChange = (userId: string, newRole: string) => {
        setConfirmModalState({
            isOpen: true,
            type: "warning",
            title: "Change Member Role",
            message: `Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`,
            confirmText: "Change Role",
            onConfirm: async () => {
                setIsConfirmModalLoading(true);
                try {
                    const res = await fetch("/api/admin/users", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, newRole })
                    });

                    if (res.ok) {
                        showToast(`✅ User role updated to ${newRole.toUpperCase()}!`, "success");
                        setConfirmModalState(null);
                        fetchUsers();
                    } else {
                        showToast("❌ Failed to update role.", "error");
                    }
                } catch (error) {
                    console.error(error);
                    showToast("❌ Error updating role.", "error");
                } finally {
                    setIsConfirmModalLoading(false);
                }
            }
        });
    };

    const handleEditClick = (user: any) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: editingUser.id,
                    name: editingUser.name,
                    phone: editingUser.phone,
                    newRole: editingUser.role
                })
            });

            if (res.ok) {
                showToast("✅ User updated successfully!", "success");
                setIsEditModalOpen(false);
                fetchUsers();
            } else {
                showToast("❌ Failed to update user.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("❌ Network error.", "error");
        }
    };

    const handleDeleteUser = (userId: string) => {
        setConfirmModalState({
            isOpen: true,
            type: "danger",
            title: "Delete Member",
            message: "Are you sure you want to completely DELETE this user? This action cannot be undone and will delete all their financial records.",
            confirmText: "Delete User",
            onConfirm: async () => {
                setIsConfirmModalLoading(true);
                try {
                    const res = await fetch(`/api/admin/users?userId=${userId}`, {
                        method: "DELETE",
                    });
                    if (res.ok) {
                        showToast("✅ User deleted successfully!", "success");
                        setConfirmModalState(null);
                        fetchUsers();
                    } else {
                        showToast("❌ Failed to delete user.", "error");
                    }
                } catch (error) {
                    console.error(error);
                    showToast("❌ Error deleting user.", "error");
                } finally {
                    setIsConfirmModalLoading(false);
                }
            }
        });
    };

    const handleMemberApproval = (user: { id: string; name?: string; email?: string }, action: 'approve' | 'reject') => {
        const memberName = user.name || "Member";
        const email = user.email || "";

        if (action === "approve") {
            setConfirmModalState({
                isOpen: true,
                type: "approve",
                title: "Approve Member Request",
                message: `Are you sure you want to approve ${memberName} (${email}) to join this mess? They will be granted active member access.`,
                confirmText: "Approve Member",
                onConfirm: async () => {
                    await executeMemberApproval(user.id, "approve", memberName);
                }
            });
        } else {
            setConfirmModalState({
                isOpen: true,
                type: "reject",
                title: "Reject Member Request",
                message: `Are you sure you want to decline ${memberName}'s request to join? This action cannot be undone.`,
                confirmText: "Reject Request",
                onConfirm: async () => {
                    await executeMemberApproval(user.id, "reject", memberName);
                }
            });
        }
    };

    const executeMemberApproval = async (userId: string, action: 'approve' | 'reject', memberName: string) => {
        setIsConfirmModalLoading(true);

        // Optimistic UI update: Remove member from pending list immediately
        const previousPending = [...pendingMembers];
        setPendingMembers(prev => prev.filter(u => u.id !== userId));

        try {
            const res = await fetch("/api/admin/users/approve", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action })
            });

            if (res.ok) {
                showToast(
                    action === "approve"
                        ? `✅ ${memberName} was approved successfully!`
                        : `✅ ${memberName}'s request was rejected.`,
                    "success"
                );
                setConfirmModalState(null);
                fetchUsers();
            } else {
                const data = await res.json().catch(() => ({}));
                setPendingMembers(previousPending);
                showToast(data.error || `❌ Failed to ${action} member.`, "error");
            }
        } catch (error) {
            console.error(error);
            setPendingMembers(previousPending);
            showToast(`❌ Network error while trying to ${action} member.`, "error");
        } finally {
            setIsConfirmModalLoading(false);
        }
    };

    return (
        <div className="flex flex-col max-w-7xl mx-auto gap-5 md:gap-8 pb-6 md:pb-0 animate-in fade-in zoom-in-95 duration-300">
            
            {/* ─── Header Section (Desktop) ─── */}
            <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-5 order-none">
                <div>
                    <p className="text-[#450705] text-base font-medium mb-1">Welcome back,</p>
                    <h1 className="text-3xl sm:text-[32px] font-extrabold text-[#450705] tracking-tight">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1.5 font-medium">Manage your mess members, expenses and food operations from one place.</p>
                </div>

                {/* Date Widget */}
                <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-sm w-full sm:w-fit">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                        <IconCalendar className="text-gray-600 w-5 h-5" stroke={1.5} />
                    </div>
                    <div>
                        <p className="text-sm font-extrabold text-gray-900">{formattedDate}</p>
                        <p className="text-xs text-gray-500 font-medium">Have a productive day!</p>
                    </div>
                </div>
            </div>

            {/* ─── Stats Grid (Desktop - Separated Meal & Mess Funds) ─── */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 order-none">
                
                {/* 1. Meal Fund Card */}
                <div className="bg-gradient-to-b from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0]/50 rounded-3xl p-5 lg:p-6 border border-emerald-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                            <Coins size={22} strokeWidth={2.2} />
                        </div>
                        <svg className="w-16 h-8 text-emerald-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M 4,12 C 14,8 24,20 38,14 C 48,10 56,22 66,18" />
                        </svg>
                    </div>
                    <div className="my-auto py-2">
                        <p className="text-xs font-bold text-gray-500 leading-tight">Meal Fund</p>
                        <h3 className="text-xl lg:text-2xl font-black text-gray-900 leading-tight mt-1 truncate">
                            Tk {(stats.mealFund ?? 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="bg-emerald-100/90 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit shadow-2xs">
                            Food Reserve
                        </span>
                    </div>
                </div>

                {/* 2. Mess Fund Card */}
                <div className="bg-gradient-to-b from-[#FAF5FF] via-[#F3E8FF] to-[#E9D5FF]/50 rounded-3xl p-5 lg:p-6 border border-purple-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
                            <Coins size={22} strokeWidth={2.2} />
                        </div>
                        <svg className="w-16 h-8 text-purple-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M 4,22 C 16,20 26,8 38,14 C 50,20 58,10 66,6" />
                        </svg>
                    </div>
                    <div className="my-auto py-2">
                        <p className="text-xs font-bold text-gray-500 leading-tight">Mess Fund</p>
                        <h3 className="text-xl lg:text-2xl font-black text-gray-900 leading-tight mt-1 truncate">
                            Tk {(stats.messFund ?? 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="bg-purple-100/90 text-purple-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit shadow-2xs">
                            Overhead Reserve
                        </span>
                    </div>
                </div>

                {/* 3. Food Cost Card */}
                <div className="bg-gradient-to-b from-[#FFF5ED] via-[#FFEADB] to-[#FED7AA]/50 rounded-3xl p-5 lg:p-6 border border-orange-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                            <Receipt size={22} strokeWidth={2.2} />
                        </div>
                        <svg className="w-16 h-8 text-orange-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M 4,22 C 16,22 24,10 36,16 C 48,22 56,8 66,6" />
                        </svg>
                    </div>
                    <div className="my-auto py-2">
                        <p className="text-xs font-bold text-gray-500 leading-tight">Food Cost</p>
                        <h3 className="text-xl lg:text-2xl font-black text-gray-900 leading-tight mt-1 truncate">
                            Tk {(stats.totalFoodCost ?? 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-orange-600/90 bg-orange-50/80 px-2 py-0.5 rounded-md">
                            Meal Rate: ৳ {stats.liveMealRate || 0}
                        </span>
                    </div>
                </div>

                {/* 4. Today's Bazaar Card */}
                <div className="bg-gradient-to-b from-sky-50 via-blue-50 to-indigo-50/50 rounded-3xl p-5 lg:p-6 border border-blue-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                            <ShoppingCart size={22} strokeWidth={2.2} />
                        </div>
                        <svg className="w-16 h-8 text-blue-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M 4,12 C 14,8 24,20 38,14 C 48,10 56,22 66,18" />
                        </svg>
                    </div>
                    <div className="my-auto py-2">
                        <p className="text-xs font-bold text-gray-500 leading-tight">Today's Bazaar</p>
                        <h3 className="text-xl lg:text-2xl font-black text-gray-900 leading-tight mt-1 truncate">
                            Tk {todayBazaarTotal.toLocaleString()}
                        </h3>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="bg-blue-100/90 text-blue-700 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit shadow-2xs">
                            Today Market
                        </span>
                    </div>
                </div>

            </div>

            {/* ─── Desktop Action & Management Grid (Monthly Expense & Pending Requests) ─── */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Monthly Expense Action Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-orange-100/60 shadow-sm p-6 flex items-center justify-between relative overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 z-10 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                            <Calculator size={26} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg font-black text-gray-900 tracking-tight leading-tight truncate">
                                Monthly Expense
                            </h3>
                            <p className="text-xs font-semibold text-gray-400 mt-1">Configure & split shared monthly costs</p>
                        </div>
                    </div>

                    {/* Curled receipt graphic positioned in background */}
                    <div className="absolute right-36 top-1/2 -translate-y-1/2 pointer-events-none opacity-85">
                        <svg className="w-24 h-16" viewBox="0 0 80 50" fill="none">
                            <defs>
                                <linearGradient id="receiptCurlDesktop" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFFFFF" />
                                    <stop offset="60%" stopColor="#FFF7F2" />
                                    <stop offset="100%" stopColor="#FED7AA" />
                                </linearGradient>
                            </defs>
                            <path d="M10,8 C25,2 45,18 65,10 C72,6 76,9 78,16 L68,46 C52,40 35,52 18,44 C10,38 8,24 10,8 Z" fill="url(#receiptCurlDesktop)" stroke="#FDBA74" strokeWidth="0.8" />
                            <line x1="22" y1="20" x2="55" y2="18" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" />
                            <line x1="20" y1="26" x2="52" y2="24" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" />
                            <line x1="18" y1="32" x2="50" y2="30" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" />
                            <line x1="16" y1="38" x2="42" y2="36" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" />
                        </svg>
                    </div>

                    <Link 
                        href="/admin/monthly-expense" 
                        className="bg-[#FF6B00] hover:bg-orange-600 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/25 flex items-center gap-1.5 shrink-0 z-10 transition-transform active:scale-95 cursor-pointer"
                    >
                        <span>Configure</span>
                        <ChevronRight size={16} strokeWidth={3} />
                    </Link>
                </div>

                {/* 2. Pending Member Requests Card */}
                <div className="bg-gradient-to-r from-[#EBF5FF] via-[#EEF2FF] to-[#E8F0FE] rounded-3xl border border-blue-100/70 shadow-sm p-6 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-[#DCEBFF] text-[#2563EB] flex items-center justify-center shrink-0 shadow-sm">
                                <UserPlus size={24} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-black text-gray-900 leading-tight truncate">
                                    Pending Member Requests
                                </h3>
                                <div className="bg-[#DBEAFE] text-[#1D4ED8] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit mt-1">
                                    <Clock size={12} strokeWidth={2.5} />
                                    <span>{pendingMembers.length} Pending Approval</span>
                                </div>
                            </div>
                        </div>

                        {/* 3D Glossy Overlapping Blue Avatars Graphic */}
                        <svg className="w-16 h-10 shrink-0" viewBox="0 0 70 45" fill="none">
                            <defs>
                                <radialGradient id="avGradCenterDesk" cx="35%" cy="30%" r="70%">
                                    <stop offset="0%" stopColor="#93C5FD" />
                                    <stop offset="55%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#1D4ED8" />
                                </radialGradient>
                                <radialGradient id="avGradSideDesk" cx="35%" cy="30%" r="70%">
                                    <stop offset="0%" stopColor="#BFDBFE" />
                                    <stop offset="60%" stopColor="#60A5FA" />
                                    <stop offset="100%" stopColor="#2563EB" />
                                </radialGradient>
                            </defs>
                            <circle cx="20" cy="16" r="8" fill="url(#avGradSideDesk)" opacity="0.8" />
                            <path d="M8,38 C8,28 14,26 20,26 C26,26 32,28 32,38 Z" fill="url(#avGradSideDesk)" opacity="0.8" />
                            <circle cx="50" cy="16" r="8" fill="url(#avGradSideDesk)" opacity="0.8" />
                            <path d="M38,38 C38,28 44,26 50,26 C56,26 62,28 62,38 Z" fill="url(#avGradSideDesk)" opacity="0.8" />
                            <circle cx="35" cy="13" r="10" fill="url(#avGradCenterDesk)" />
                            <path d="M19,41 C19,29 26,24 35,24 C44,24 51,29 51,41 Z" fill="url(#avGradCenterDesk)" />
                        </svg>
                    </div>

                    {/* Pending Requests List in Desktop Card */}
                    <div className="mt-4 pt-3 border-t border-blue-100/80 space-y-2 max-h-[160px] overflow-y-auto">
                        {isLoading ? (
                            <p className="text-center text-gray-400 font-bold py-2 text-xs">Loading requests...</p>
                        ) : pendingMembers.length === 0 ? (
                            <p className="text-center text-gray-500 font-bold py-2 text-xs">No pending requests at this time.</p>
                        ) : (
                            pendingMembers.map((user: any, idx: number) => (
                                <div key={user.id} className="flex items-center justify-between bg-white/90 backdrop-blur-sm border border-blue-100 rounded-xl p-2.5 shadow-2xs">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="text-xs font-bold text-gray-400 w-4 text-center">{idx + 1}</span>
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                                            {user.name ? user.name.charAt(0).toUpperCase() : "M"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-extrabold text-gray-900 text-xs truncate">{user.name || "Member"}</p>
                                            <p className="text-[10px] font-medium text-gray-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        <button 
                                            onClick={() => handleMemberApproval(user, "approve")}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                            <Check size={12} strokeWidth={3} /> Approve
                                        </button>
                                        <button 
                                            onClick={() => handleMemberApproval(user, "reject")}
                                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                            <X size={12} strokeWidth={3} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Management Action & Operational Queue Cards (Matching Image) ─── */}
            <div className="hidden md:block space-y-6">
                {/* 1. Top Row of 4 Action Cards (Bazaar Requests, Payments, Expenses, Guest Meals) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {/* 1. Bazaar Requests */}
                    <Link 
                        href="/bazaar-requests"
                        className="bg-white/95 backdrop-blur-sm rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[145px]"
                    >
                        <div>
                            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-2xs">
                                <IconCalendar size={22} stroke={2.2} />
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 mt-3 truncate group-hover:text-[#FF6B00] transition-colors">
                                Bazaar Requests
                            </h3>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-1">
                            <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                                <IconClock size={13} stroke={2.5} />
                                <span>{pendingBazaarSchedules.length}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <IconChevronRight size={16} stroke={2.5} />
                            </div>
                        </div>
                    </Link>

                    {/* 2. Payments */}
                    <Link 
                        href="/payments"
                        className="bg-white/95 backdrop-blur-sm rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[145px]"
                    >
                        <div>
                            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-2xs">
                                <IconCreditCard size={22} stroke={2.2} />
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 mt-3 truncate group-hover:text-blue-600 transition-colors">
                                Payments
                            </h3>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-1">
                            <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                                <IconClock size={13} stroke={2.5} />
                                <span>{pendingDeposits.length}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <IconChevronRight size={16} stroke={2.5} />
                            </div>
                        </div>
                    </Link>

                    {/* 3. Expenses */}
                    <Link 
                        href="/expenses"
                        className="bg-white/95 backdrop-blur-sm rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[145px]"
                    >
                        <div>
                            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-2xs">
                                <TablerShoppingCart size={22} stroke={2.2} />
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 mt-3 truncate group-hover:text-[#FF6B00] transition-colors">
                                Expenses
                            </h3>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-1">
                            <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                                <IconClock size={13} stroke={2.5} />
                                <span>{pendingExpenses.length}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <IconChevronRight size={16} stroke={2.5} />
                            </div>
                        </div>
                    </Link>

                    {/* 4. Guest Meals */}
                    <Link 
                        href="/guest-meals"
                        className="bg-white/95 backdrop-blur-sm rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[145px]"
                    >
                        <div>
                            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                                <TablerUsers size={22} stroke={2.2} />
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 mt-3 truncate group-hover:text-purple-600 transition-colors">
                                Guest Meals
                            </h3>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-1">
                            <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                                <IconClock size={13} stroke={2.5} />
                                <span>{pendingGuestMeals.length}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <IconChevronRight size={16} stroke={2.5} />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* 2. Notice Board Card */}
                <div className="bg-white/95 backdrop-blur-sm p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-nowrap min-w-0">
                        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl sm:rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-sm shadow-orange-500/20 shrink-0">
                                <IconBell size={18} stroke={2.2} className="sm:w-5 sm:h-5" />
                            </div>
                            <h2 className="text-sm sm:text-base font-black text-slate-900 whitespace-nowrap shrink-0">Notice</h2>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-nowrap">
                            {notices.length > 0 && (
                                <span className="bg-[#FF6B00] text-white text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 leading-tight">
                                    {notices.length} New
                                </span>
                            )}
                            {notices.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearAllNotices}
                                    className="text-[11px] sm:text-xs font-semibold text-gray-500 hover:text-rose-600 px-2 sm:px-2.5 py-1 rounded-full hover:bg-rose-50 transition-colors cursor-pointer whitespace-nowrap shrink-0 leading-tight"
                                >
                                    Clear All
                                </button>
                            )}
                            <button 
                                type="button"
                                onClick={() => setSelectedNotice(notices[0] || null)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap shrink-0 leading-tight"
                            >
                                View All
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 mt-3">
                        {isLoading ? (
                            <div className="py-6 text-center text-xs font-bold text-slate-400">Loading notices...</div>
                        ) : notices.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-xs font-bold text-slate-600">All caught up! 🪶 No new notices.</p>
                                <p className="text-[11px] text-slate-400 mt-1">Check back later for new announcements.</p>
                            </div>
                        ) : (
                            notices.slice(0, 5).map((notice, index) => {
                                const isGuestMeal = notice.type === "guest_meal";
                                const nDate = notice.createdAt 
                                    ? new Date(notice.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                                    : todayFormattedShort;

                                return (
                                    <div 
                                        key={notice.id || index}
                                        onClick={() => setSelectedNotice(notice)}
                                        className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-2xl transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {isGuestMeal ? (
                                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                                                    <TablerUsers size={18} stroke={2.2} />
                                                </div>
                                            ) : (
                                                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shrink-0">
                                                    <IconFileText size={18} stroke={2.2} />
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <h4 className="text-xs font-black text-slate-900 leading-tight truncate">
                                                    {notice.title}
                                                </h4>
                                                <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                                                    {notice.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0 text-slate-400">
                                            <span className="text-[10px] font-bold whitespace-nowrap">{nDate}</span>
                                            <IconChevronRight size={14} stroke={2.5} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 3. Member Bazaar Date Requests */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5 flex items-center justify-between gap-4 border-b border-gray-100 bg-[#F8FAFC]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                                <IconCalendarUser className="w-5 h-5" stroke={2} />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-gray-900">Member Bazaar Date Requests</h2>
                                <p className="text-xs text-gray-500">Review and approve members' requested bazaar dates for this month.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className="bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-orange-200">
                                <IconClock size={14} /> {pendingBazaarSchedules.length} Pending
                            </span>
                            <Link href="/bazaar-requests" className="text-xs font-bold text-gray-700 hover:text-orange-600 transition-colors flex items-center gap-1 bg-white px-3.5 py-2 rounded-xl border border-gray-200 hover:border-orange-200 shadow-sm">
                                Full Queue <IconArrowRight size={14} />
                            </Link>
                            {selectedSchedules.length > 0 && (
                                <button onClick={handleApproveSelectedSchedules} className="bg-[#00B050] hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer">
                                    <IconCheck size={14} stroke={3} /> Approve Selected ({selectedSchedules.length})
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
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
                                    <th className="p-4">Note</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-400 font-bold text-sm">Loading...</td>
                                    </tr>
                                ) : pendingBazaarSchedules.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-400 font-bold text-sm">No pending bazaar requests.</td>
                                    </tr>
                                ) : pendingBazaarSchedules.map((item, idx) => (
                                    <tr key={item.id} className={`hover:bg-orange-50/30 transition-colors ${selectedSchedules.includes(item.id) ? 'bg-orange-50/50' : ''}`}>
                                        <td className="p-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer" 
                                                checked={selectedSchedules.includes(item.id)}
                                                onChange={() => handleSelectSchedule(item.id)}
                                            />
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-400">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-[#0B132B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                                    {item.user?.name?.charAt(0) || 'M'}
                                                </div>
                                                <span className="font-extrabold text-gray-900 text-sm">{item.user?.name || 'Member'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-700">
                                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-600">
                                            {item.note || "I will go to the bazar."}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-orange-100 text-orange-600 px-2.5 py-1 rounded-md text-xs font-bold border border-orange-200">
                                                Pending
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleScheduleAction(item.id, 'Approve')} className="bg-[#00B050] hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer">
                                                    <IconCheck size={14} stroke={3} /> Approve
                                                </button>
                                                <button onClick={() => handleScheduleAction(item.id, 'Reject')} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer">
                                                    <IconX size={14} stroke={3} /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. 3-Column Split for Payments, Expenses, and Guest Meals */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pending Payments */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[400px] hover:shadow-md transition-shadow">
                        <div className="p-4 border-b border-gray-100 bg-[#F8FAFC] flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <IconWallet size={18} stroke={2.5} />
                                </div>
                                <h3 className="text-sm font-extrabold text-gray-900">Payments ({pendingDeposits.length})</h3>
                            </div>
                            <Link href="/payments" className="text-xs font-bold text-blue-600 hover:underline">
                                View
                            </Link>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-3">
                            {pendingDeposits.length === 0 ? (
                                <p className="text-center text-gray-400 font-bold py-12 text-xs">No pending payments.</p>
                            ) : (
                                pendingDeposits.map(item => (
                                    <div key={item.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-sm text-gray-900">{item.user?.name}</span>
                                            <span className="font-black text-emerald-600 text-sm">৳ {item.amount}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium">Method: {item.method}</p>
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={() => handleQueueAction(item.id, 'deposit', 'Reject')} className="flex-1 text-xs font-bold text-red-600 bg-white border border-red-200 py-1.5 rounded-xl hover:bg-red-50 cursor-pointer">Reject</button>
                                            <button onClick={() => handleQueueAction(item.id, 'deposit', 'Approve')} className="flex-1 text-xs font-bold text-white bg-blue-600 py-1.5 rounded-xl hover:bg-blue-700 cursor-pointer">Approve</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pending Expenses */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[400px] hover:shadow-md transition-shadow">
                        <div className="p-4 border-b border-gray-100 bg-[#F8FAFC] flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <IconShoppingBag size={18} stroke={2.5} />
                                </div>
                                <h3 className="text-sm font-extrabold text-gray-900">Expenses ({pendingExpenses.length})</h3>
                            </div>
                            <Link href="/expenses" className="text-xs font-bold text-orange-600 hover:underline">
                                View
                            </Link>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-3">
                            {pendingExpenses.length === 0 ? (
                                <p className="text-center text-gray-400 font-bold py-12 text-xs">No pending expenses.</p>
                            ) : (
                                pendingExpenses.map(item => (
                                    <div key={item.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-sm text-gray-900">{item.user?.name}</span>
                                            <span className="font-black text-orange-600 text-sm">৳ {item.amount}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium">{item.description || "Bazaar Expense"}</p>
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={() => handleQueueAction(item.id, 'expense', 'Reject')} className="flex-1 text-xs font-bold text-red-600 bg-white border border-red-200 py-1.5 rounded-xl hover:bg-red-50 cursor-pointer">Reject</button>
                                            <button onClick={() => handleQueueAction(item.id, 'expense', 'Approve')} className="flex-1 text-xs font-bold text-white bg-[#FF6B00] py-1.5 rounded-xl hover:bg-orange-600 cursor-pointer">Approve</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pending Guest Meals */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[400px] hover:shadow-md transition-shadow">
                        <div className="p-4 border-b border-gray-100 bg-[#F8FAFC] flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <TablerUsers size={18} stroke={2.5} />
                                </div>
                                <h3 className="text-sm font-extrabold text-gray-900">Guest Meals ({pendingGuestMeals.length})</h3>
                            </div>
                            <Link href="/guest-meals" className="text-xs font-bold text-purple-600 hover:underline">
                                View
                            </Link>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-3">
                            {pendingGuestMeals.length === 0 ? (
                                <p className="text-center text-gray-400 font-bold py-12 text-xs">No pending guest meals.</p>
                            ) : (
                                pendingGuestMeals.map(item => (
                                    <div key={item.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-sm text-gray-900">{item.user?.name}</span>
                                            <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">
                                                {item.guests} {item.guests > 1 ? 'Guests' : 'Guest'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium">{item.mealType} meal</p>
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={() => handleQueueAction(item.id, 'guestMeal', 'Reject')} className="flex-1 text-xs font-bold text-red-600 bg-white border border-red-200 py-1.5 rounded-xl hover:bg-red-50 cursor-pointer">Reject</button>
                                            <button onClick={() => handleQueueAction(item.id, 'guestMeal', 'Approve')} className="flex-1 text-xs font-bold text-white bg-emerald-600 py-1.5 rounded-xl hover:bg-emerald-700 cursor-pointer">Approve</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Mess Members Section (Desktop Responsive Card Grid) ─── */}
            <div className="hidden md:block bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                
                {/* Header with Search */}
                <div className="flex items-center justify-between gap-4 pb-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center shrink-0 shadow-sm">
                            <Users size={22} strokeWidth={2.4} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Mess Members</h2>
                                <span className="bg-orange-100 text-[#FF6B00] text-xs font-black px-2.5 py-0.5 rounded-full">
                                    {users.length} Total
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-gray-400 mt-0.5">Manage member roles, permissions, and active statuses</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="w-72 relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#FF6B00] transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search by name, email, or role..."
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-xs bg-white border-2 border-gray-300 hover:border-gray-400 focus:border-[#FF6B00] rounded-xl outline-none focus:ring-4 focus:ring-orange-500/15 text-gray-900 font-semibold placeholder:text-gray-400 shadow-sm transition-all"
                        />
                        {memberSearchQuery && (
                            <button 
                                onClick={() => setMemberSearchQuery("")} 
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Members Multi-Column Grid */}
                <div className="pt-6">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-400 font-bold">Loading members...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 font-bold">No members found matching your search.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredUsers.map((user, idx) => {
                                const avatar = getMemberAvatarStyle(user.name, idx);
                                const isDropdownOpen = activeDropdown === user.id;

                                return (
                                    <div 
                                        key={user.id} 
                                        className="bg-white rounded-2xl border border-gray-100/90 p-5 shadow-2xs hover:shadow-md hover:border-orange-200/60 transition-all flex flex-col justify-between group"
                                    >
                                        {/* Card Top: Avatar, Name, Email & Role */}
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${avatar.bg} ${avatar.text}`}>
                                                        {avatar.initial}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-extrabold text-gray-900 text-sm truncate group-hover:text-[#FF6B00] transition-colors">
                                                            {user.name || "Member"}
                                                        </h3>
                                                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    {renderRoleBadge(user.role)}
                                                </div>
                                            </div>

                                            {/* Phone & Status Line */}
                                            <div className="flex items-center justify-between text-xs text-gray-500 font-medium mt-4 pt-3 border-t border-gray-50">
                                                <span className="flex items-center gap-1.5 text-gray-400">
                                                    <IconPhone size={14} className="shrink-0" />
                                                    {user.phone || 'No phone'}
                                                </span>
                                                {user.role === 'suspended' ? (
                                                    <span className="flex items-center gap-1.5 text-rose-600 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded-md">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                                        Suspended
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Bottom: Role Select & Action Controls */}
                                        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                                            {/* Role Selector */}
                                            <select 
                                                value={user.role} 
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-xl border outline-none cursor-pointer transition-colors ${
                                                    user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    user.role === 'manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    user.role === 'suspended' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}
                                            >
                                                <option value="member">Member</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                                {user.role === 'suspended' && <option value="suspended">Suspended</option>}
                                            </select>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1.5 relative">
                                                <button 
                                                    onClick={() => handleEditClick(user)} 
                                                    className="border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                                                >
                                                    <IconEdit className="w-3.5 h-3.5" stroke={2} />
                                                    <span>Edit</span>
                                                </button>

                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setActiveDropdown(isDropdownOpen ? null : user.id); 
                                                        }} 
                                                        className="p-1.5 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                                                    >
                                                        <IconDotsVertical className="w-4 h-4" stroke={2} />
                                                    </button>

                                                    {isDropdownOpen && (
                                                        <div 
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-150"
                                                        >
                                                            <button 
                                                                onClick={() => { setActiveDropdown(null); handleRoleChange(user.id, user.role === 'suspended' ? 'member' : 'suspended'); }} 
                                                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer border-b border-gray-50"
                                                            >
                                                                {user.role === 'suspended' ? "Unsuspend" : "Suspend User"}
                                                            </button>
                                                            <button 
                                                                onClick={() => { setActiveDropdown(null); handleDeleteUser(user.id); }} 
                                                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                            >
                                                                Delete User
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── MOBILE VIEW (Pixel-for-pixel matching Reference Design) ─── */}
            <div className="md:hidden flex flex-col gap-3.5 w-full max-w-md mx-auto">
                
                {/* 1. Greeting & Date Capsule Section */}
                <div className="flex justify-between items-center pt-1 px-0.5">
                    <div>
                        <p className="text-gray-500 text-xs sm:text-sm font-semibold">Welcome Back,</p>
                        <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight flex items-center gap-1.5 mt-0.5">
                            Super Admin 👋
                        </h1>
                    </div>
                    
                    {/* Date Capsule Card */}
                    <div className="bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-sm border border-gray-100/90 shrink-0">
                        <Calendar className="w-5 h-5 text-gray-700" strokeWidth={1.8} />
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold text-gray-400 leading-tight">{todayDayName}</span>
                            <span className="text-xs font-black text-gray-900 leading-tight mt-0.5">{todayFormattedShort}</span>
                        </div>
                    </div>
                </div>

                {/* 2. 4 Key Metrics Cards (Separated Meal & Mess Funds) */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    
                    {/* Meal Fund Card */}
                    <div className="bg-gradient-to-b from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0]/50 rounded-[24px] p-3 sm:p-3.5 border border-emerald-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                        <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-xl bg-[#10B981] text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                                <Coins size={16} strokeWidth={2.2} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tight bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                Food
                            </span>
                        </div>
                        <div className="my-auto py-1">
                            <p className="text-[11px] font-bold text-gray-500 leading-tight">Meal Fund</p>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight mt-0.5 truncate">
                                Tk {(stats.mealFund ?? 0).toLocaleString()}
                            </h3>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-emerald-700">Food Reserve</span>
                        </div>
                    </div>

                    {/* Mess Fund Card */}
                    <div className="bg-gradient-to-b from-[#FAF5FF] via-[#F3E8FF] to-[#E9D5FF]/50 rounded-[24px] p-3 sm:p-3.5 border border-purple-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                        <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
                                <Coins size={16} strokeWidth={2.2} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tight bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                Overhead
                            </span>
                        </div>
                        <div className="my-auto py-1">
                            <p className="text-[11px] font-bold text-gray-500 leading-tight">Mess Fund</p>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight mt-0.5 truncate">
                                Tk {(stats.messFund ?? 0).toLocaleString()}
                            </h3>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-purple-700">Rent & Utility</span>
                        </div>
                    </div>

                    {/* Food Cost Card */}
                    <div className="bg-gradient-to-b from-[#FFF5ED] via-[#FFEADB] to-[#FED7AA]/50 rounded-[24px] p-3 sm:p-3.5 border border-orange-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                        <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                                <Receipt size={16} strokeWidth={2.2} />
                            </div>
                            <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-md">
                                ৳{stats.liveMealRate || 0}/m
                            </span>
                        </div>
                        <div className="my-auto py-1">
                            <p className="text-[11px] font-bold text-gray-500 leading-tight">Food Cost</p>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight mt-0.5 truncate">
                                Tk {(stats.totalFoodCost ?? 0).toLocaleString()}
                            </h3>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-orange-600">Total bazaar cost</span>
                        </div>
                    </div>

                    {/* Today's Bazaar Card */}
                    <div className="bg-gradient-to-b from-sky-50 via-blue-50 to-indigo-50/50 rounded-[24px] p-3 sm:p-3.5 border border-blue-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                        <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                                <ShoppingCart size={16} strokeWidth={2.2} />
                            </div>
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-md">
                                Today
                            </span>
                        </div>
                        <div className="my-auto py-1">
                            <p className="text-[11px] font-bold text-gray-500 leading-tight">Today's Bazaar</p>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight mt-0.5 truncate">
                                Tk {todayBazaarTotal.toLocaleString()}
                            </h3>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-blue-600">Daily Expense</span>
                        </div>
                    </div>

                </div>

                {/* 3. "Set Monthly Expense" Action Banner */}
                <div className="bg-white/95 backdrop-blur-sm rounded-[26px] border border-orange-100/60 shadow-sm p-3.5 sm:p-4 flex items-center justify-between relative overflow-hidden">
                    <div className="flex items-center gap-3 z-10 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                            <Calculator size={22} strokeWidth={2.2} />
                        </div>
                        <h3 className="text-base sm:text-[17px] font-black text-gray-900 tracking-tight leading-tight truncate">
                            Monthly Expense
                        </h3>
                    </div>

                    {/* Curled receipt graphic positioned in background */}
                    <div className="absolute right-32 top-1/2 -translate-y-1/2 pointer-events-none opacity-85 hidden xs:block">
                        <svg className="w-20 h-14" viewBox="0 0 80 50" fill="none">
                            <defs>
                                <linearGradient id="receiptCurl" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFFFFF" />
                                    <stop offset="60%" stopColor="#FFF7F2" />
                                    <stop offset="100%" stopColor="#FED7AA" />
                                </linearGradient>
                            </defs>
                            <path d="M10,8 C25,2 45,18 65,10 C72,6 76,9 78,16 L68,46 C52,40 35,52 18,44 C10,38 8,24 10,8 Z" fill="url(#receiptCurl)" stroke="#FDBA74" strokeWidth="0.8" />
                            <line x1="22" y1="20" x2="55" y2="18" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" />
                            <line x1="20" y1="26" x2="52" y2="24" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" />
                            <line x1="18" y1="32" x2="50" y2="30" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" />
                            <line x1="16" y1="38" x2="42" y2="36" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="3 2" strokeLinecap="round" />
                        </svg>
                    </div>

                    <Link 
                        href="/admin/monthly-expense" 
                        className="bg-[#FF6B00] hover:bg-orange-600 text-white font-extrabold text-xs px-4 sm:px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/25 flex items-center gap-1 shrink-0 z-10 transition-transform active:scale-95"
                    >
                        <span>Configure</span>
                        <ChevronRight size={15} strokeWidth={3} />
                    </Link>
                </div>

                {/* 4. "Pending Member Requests" Collapsible Card */}
                <div className="bg-gradient-to-r from-[#EBF5FF] via-[#EEF2FF] to-[#E8F0FE] rounded-[26px] border border-blue-100/70 shadow-sm p-3.5 relative overflow-hidden transition-all duration-300">
                    <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-[#DCEBFF] text-[#2563EB] flex items-center justify-center shrink-0">
                                <UserPlus size={22} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-extrabold text-gray-900 leading-tight truncate">
                                    Pending Member Requests
                                </h3>
                                <div className="bg-[#DBEAFE] text-[#1D4ED8] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit mt-1">
                                    <Clock size={12} strokeWidth={2.5} />
                                    <span>{pendingMembers.length} Pending</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* 3D Glossy Overlapping Blue Avatars Graphic */}
                            <svg className="w-14 h-9 shrink-0" viewBox="0 0 70 45" fill="none">
                                <defs>
                                    <radialGradient id="avGradCenter" cx="35%" cy="30%" r="70%">
                                        <stop offset="0%" stopColor="#93C5FD" />
                                        <stop offset="55%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#1D4ED8" />
                                    </radialGradient>
                                    <radialGradient id="avGradSide" cx="35%" cy="30%" r="70%">
                                        <stop offset="0%" stopColor="#BFDBFE" />
                                        <stop offset="60%" stopColor="#60A5FA" />
                                        <stop offset="100%" stopColor="#2563EB" />
                                    </radialGradient>
                                </defs>
                                <circle cx="20" cy="16" r="8" fill="url(#avGradSide)" opacity="0.8" />
                                <path d="M8,38 C8,28 14,26 20,26 C26,26 32,28 32,38 Z" fill="url(#avGradSide)" opacity="0.8" />
                                <circle cx="50" cy="16" r="8" fill="url(#avGradSide)" opacity="0.8" />
                                <path d="M38,38 C38,28 44,26 50,26 C56,26 62,28 62,38 Z" fill="url(#avGradSide)" opacity="0.8" />
                                <circle cx="35" cy="13" r="10" fill="url(#avGradCenter)" />
                                <path d="M19,41 C19,29 26,24 35,24 C44,24 51,29 51,41 Z" fill="url(#avGradCenter)" />
                            </svg>

                            {/* Toggle Arrow Button */}
                            <button
                                onClick={() => setIsPendingExpanded(!isPendingExpanded)}
                                className="w-9 h-9 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 cursor-pointer hover:bg-gray-50 transition-all shrink-0"
                                aria-label="Toggle pending member requests"
                            >
                                <ChevronDown size={18} strokeWidth={2.5} className={`transition-transform duration-300 ${isPendingExpanded ? "rotate-180" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {/* Expanded Pending List */}
                    {isPendingExpanded && (
                        <div className="mt-3 pt-3 border-t border-blue-100/80 space-y-2.5 animate-in slide-in-from-top-2 fade-in duration-200">
                            {isLoading ? (
                                <p className="text-center text-gray-400 font-bold py-3 text-xs">Loading requests...</p>
                            ) : pendingMembers.length === 0 ? (
                                <p className="text-center text-gray-400 font-bold py-3 text-xs">No pending requests at this time.</p>
                            ) : (
                                pendingMembers.map((user: any, idx: number) => (
                                    <div key={user.id} className="flex items-center justify-between bg-white/90 backdrop-blur-sm border border-blue-100 rounded-2xl p-2.5 shadow-2xs">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-xs font-bold text-gray-400 w-3 text-center">{idx + 1}</span>
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                                                {user.name ? user.name.charAt(0).toUpperCase() : "M"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-extrabold text-gray-900 text-xs truncate">{user.name || "Member"}</p>
                                                <p className="text-[10px] font-medium text-gray-400 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <button 
                                                onClick={() => handleMemberApproval(user.id, "approve")}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm transition-colors flex items-center gap-1"
                                            >
                                                <Check size={12} strokeWidth={3} /> Approve
                                            </button>
                                            <button 
                                                onClick={() => handleMemberApproval(user.id, "reject")}
                                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                                            >
                                                <X size={12} strokeWidth={3} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* ─── Operational & Management Action Cards (Mobile View) ─── */}
                <div className="grid grid-cols-2 gap-2.5">
                    {/* Bazaar Requests */}
                    <Link 
                        href="/bazaar-requests"
                        className="bg-white/95 backdrop-blur-sm rounded-3xl p-3.5 sm:p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[130px]"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-2xs">
                                <IconCalendar size={20} stroke={2.2} />
                            </div>
                            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-2.5 truncate group-hover:text-[#FF6B00] transition-colors">
                                Bazaar Requests
                            </h3>
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-1">
                            <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-bold">
                                <IconClock size={12} stroke={2.5} />
                                <span>{pendingBazaarSchedules.length}</span>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <IconChevronRight size={14} stroke={2.5} />
                            </div>
                        </div>
                    </Link>

                    {/* Payments */}
                    <Link 
                        href="/payments"
                        className="bg-white/95 backdrop-blur-sm rounded-3xl p-3.5 sm:p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[130px]"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-2xs">
                                <IconCreditCard size={20} stroke={2.2} />
                            </div>
                            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-2.5 truncate group-hover:text-blue-600 transition-colors">
                                Payments
                            </h3>
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-1">
                            <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-bold">
                                <IconClock size={12} stroke={2.5} />
                                <span>{pendingDeposits.length}</span>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <IconChevronRight size={14} stroke={2.5} />
                            </div>
                        </div>
                    </Link>

                    {/* Expenses */}
                    <Link 
                        href="/expenses"
                        className="bg-white/95 backdrop-blur-sm rounded-3xl p-3.5 sm:p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[130px]"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-2xs">
                                <TablerShoppingCart size={20} stroke={2.2} />
                            </div>
                            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-2.5 truncate group-hover:text-[#FF6B00] transition-colors">
                                Expenses
                            </h3>
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-1">
                            <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-bold">
                                <IconClock size={12} stroke={2.5} />
                                <span>{pendingExpenses.length}</span>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <IconChevronRight size={14} stroke={2.5} />
                            </div>
                        </div>
                    </Link>

                    {/* Guest Meals */}
                    <Link 
                        href="/guest-meals"
                        className="bg-white/95 backdrop-blur-sm rounded-3xl p-3.5 sm:p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all active:scale-[0.98] group min-h-[130px]"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                                <TablerUsers size={20} stroke={2.2} />
                            </div>
                            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-2.5 truncate group-hover:text-purple-600 transition-colors">
                                Guest Meals
                            </h3>
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-1">
                            <div className="bg-orange-50/80 border border-orange-100 text-orange-600 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-bold">
                                <IconClock size={12} stroke={2.5} />
                                <span>{pendingGuestMeals.length}</span>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <IconChevronRight size={14} stroke={2.5} />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Notice Board (Mobile) */}
                <div className="bg-white/95 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shadow-sm shrink-0">
                                <IconBell size={17} stroke={2.2} />
                            </div>
                            <h2 className="text-sm font-black text-slate-900 whitespace-nowrap">Notice</h2>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {notices.length > 0 && (
                                <span className="bg-[#FF6B00] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {notices.length} New
                                </span>
                            )}
                            <button 
                                type="button"
                                onClick={() => setSelectedNotice(notices[0] || null)}
                                className="bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                            >
                                View All
                            </button>
                        </div>
                    </div>
                    <div className="mt-2.5 divide-y divide-slate-100">
                        {isLoading ? (
                            <p className="py-4 text-center text-xs text-slate-400 font-bold">Loading notices...</p>
                        ) : notices.length === 0 ? (
                            <div className="py-4 text-center">
                                <p className="text-xs font-bold text-slate-600">All caught up! 🪶 No new notices.</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Check back later for new announcements.</p>
                            </div>
                        ) : (
                            notices.slice(0, 3).map((notice, idx) => (
                                <div 
                                    key={notice.id || idx}
                                    onClick={() => setSelectedNotice(notice)}
                                    className="py-2.5 flex items-center justify-between gap-2 cursor-pointer"
                                >
                                    <p className="text-xs font-black text-slate-800 truncate">{notice.title}</p>
                                    <IconChevronRight size={13} className="text-slate-400 shrink-0" />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Member Bazaar Date Requests (Mobile) */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                <IconCalendarUser className="w-4 h-4" stroke={2} />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900">Bazaar Date Requests</h3>
                                <p className="text-[10px] text-gray-400">{pendingBazaarSchedules.length} pending requests</p>
                            </div>
                        </div>
                        <Link href="/bazaar-requests" className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1">
                            Full Queue <IconArrowRight size={12} />
                        </Link>
                    </div>

                    <div className="divide-y divide-gray-100 mt-2 max-h-60 overflow-y-auto">
                        {pendingBazaarSchedules.length === 0 ? (
                            <p className="py-6 text-center text-xs text-gray-400 font-bold">No pending bazaar requests.</p>
                        ) : (
                            pendingBazaarSchedules.map((item) => (
                                <div key={item.id} className="py-2.5 flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-gray-900">{item.user?.name || "Member"}</span>
                                        <span className="text-[11px] font-bold text-orange-600">
                                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500">{item.note || "I will go to the bazar."}</p>
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={() => handleScheduleAction(item.id, 'Reject')} className="flex-1 text-[11px] font-bold text-red-600 border border-red-200 py-1 rounded-lg">Reject</button>
                                        <button onClick={() => handleScheduleAction(item.id, 'Approve')} className="flex-1 text-[11px] font-bold text-white bg-[#00B050] py-1 rounded-lg">Approve</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 3 Mobile Pending Queue Cards (Payments, Expenses, Guest Meals) */}
                <div className="space-y-2.5">
                    {/* Payments */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-100 p-3.5 shadow-sm">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <IconWallet size={15} stroke={2.5} />
                                </div>
                                <h4 className="text-xs font-extrabold text-gray-900">Payments ({pendingDeposits.length})</h4>
                            </div>
                            <Link href="/payments" className="text-[11px] font-bold text-blue-600 hover:underline">View</Link>
                        </div>
                        {pendingDeposits.length === 0 ? (
                            <p className="py-4 text-center text-xs text-gray-400 font-bold">No pending payments.</p>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto mt-1">
                                {pendingDeposits.slice(0, 3).map(item => (
                                    <div key={item.id} className="py-2 space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-extrabold text-gray-900">{item.user?.name}</span>
                                            <span className="font-black text-emerald-600">৳ {item.amount}</span>
                                        </div>
                                        <div className="flex gap-1.5 pt-1">
                                            <button onClick={() => handleQueueAction(item.id, 'deposit', 'Reject')} className="flex-1 text-[10px] font-bold text-red-600 border border-red-200 py-0.5 rounded-md">Reject</button>
                                            <button onClick={() => handleQueueAction(item.id, 'deposit', 'Approve')} className="flex-1 text-[10px] font-bold text-white bg-blue-600 py-0.5 rounded-md">Approve</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Expenses */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-100 p-3.5 shadow-sm">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <IconShoppingBag size={15} stroke={2.5} />
                                </div>
                                <h4 className="text-xs font-extrabold text-gray-900">Expenses ({pendingExpenses.length})</h4>
                            </div>
                            <Link href="/expenses" className="text-[11px] font-bold text-orange-600 hover:underline">View</Link>
                        </div>
                        {pendingExpenses.length === 0 ? (
                            <p className="py-4 text-center text-xs text-gray-400 font-bold">No pending expenses.</p>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto mt-1">
                                {pendingExpenses.slice(0, 3).map(item => (
                                    <div key={item.id} className="py-2 space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-extrabold text-gray-900">{item.user?.name}</span>
                                            <span className="font-black text-orange-600">৳ {item.amount}</span>
                                        </div>
                                        <div className="flex gap-1.5 pt-1">
                                            <button onClick={() => handleQueueAction(item.id, 'expense', 'Reject')} className="flex-1 text-[10px] font-bold text-red-600 border border-red-200 py-0.5 rounded-md">Reject</button>
                                            <button onClick={() => handleQueueAction(item.id, 'expense', 'Approve')} className="flex-1 text-[10px] font-bold text-white bg-[#FF6B00] py-0.5 rounded-md">Approve</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Guest Meals */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-100 p-3.5 shadow-sm">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <TablerUsers size={15} stroke={2.5} />
                                </div>
                                <h4 className="text-xs font-extrabold text-gray-900">Guest Meals ({pendingGuestMeals.length})</h4>
                            </div>
                            <Link href="/guest-meals" className="text-[11px] font-bold text-purple-600 hover:underline">View</Link>
                        </div>
                        {pendingGuestMeals.length === 0 ? (
                            <p className="py-4 text-center text-xs text-gray-400 font-bold">No pending guest meals.</p>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto mt-1">
                                {pendingGuestMeals.slice(0, 3).map(item => (
                                    <div key={item.id} className="py-2 space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-extrabold text-gray-900">{item.user?.name}</span>
                                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                                {item.guests} Guest(s)
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5 pt-1">
                                            <button onClick={() => handleQueueAction(item.id, 'guestMeal', 'Reject')} className="flex-1 text-[10px] font-bold text-red-600 border border-red-200 py-0.5 rounded-md">Reject</button>
                                            <button onClick={() => handleQueueAction(item.id, 'guestMeal', 'Approve')} className="flex-1 text-[10px] font-bold text-white bg-emerald-600 py-0.5 rounded-md">Approve</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. "Mess Members" Section (Main List Card) */}
                <div className="bg-white/95 backdrop-blur-sm rounded-[28px] border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col mb-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-gray-100/80">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center shrink-0">
                                <Users size={19} strokeWidth={2.4} />
                            </div>
                            <h2 className="text-base sm:text-[17px] font-black text-gray-900 tracking-tight">
                                Mess Members
                            </h2>
                        </div>

                        <button 
                            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                                isMobileSearchOpen ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                            }`}
                            aria-label="Search members"
                        >
                            <Search size={16} strokeWidth={2.4} />
                        </button>
                    </div>

                    {/* Search Input Bar (Toggled or active) */}
                    {isMobileSearchOpen && (
                        <div className="pt-3 pb-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#FF6B00] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, email, or role..."
                                    value={memberSearchQuery}
                                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                                    autoFocus
                                    className="w-full pl-9 pr-8 py-2 text-xs bg-white border-2 border-gray-300 hover:border-gray-400 focus:border-[#FF6B00] rounded-xl outline-none focus:ring-4 focus:ring-orange-500/15 text-gray-900 font-semibold placeholder:text-gray-400 shadow-sm transition-all"
                                />
                                {memberSearchQuery && (
                                    <button 
                                        onClick={() => setMemberSearchQuery("")} 
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Members List */}
                    <div className="divide-y divide-gray-100/80">
                        {isLoading ? (
                            <p className="text-center text-gray-400 font-bold py-10 text-xs">Loading members...</p>
                        ) : filteredUsers.length === 0 ? (
                            <p className="text-center text-gray-400 font-bold py-10 text-xs">No members found.</p>
                        ) : (
                            filteredUsers.map((user, idx) => {
                                const avatar = getMemberAvatarStyle(user.name, idx);
                                const isDropdownOpen = activeMobileDropdown === user.id;

                                return (
                                    <div key={user.id} className="py-3 flex items-center justify-between gap-2 relative">
                                        {/* 1. Index */}
                                        <span className="text-xs font-bold text-gray-400 w-3 text-center shrink-0">
                                            {idx + 1}
                                        </span>

                                        {/* 2. Avatar */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${avatar.bg} ${avatar.text}`}>
                                            {avatar.initial}
                                        </div>

                                        {/* 3. Name & Email */}
                                        <div className="flex-1 min-w-0 pr-1">
                                            <p className="text-xs sm:text-[13px] font-black text-gray-900 truncate leading-snug">
                                                {user.name || "Member"}
                                            </p>
                                            <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 truncate leading-tight mt-0.5">
                                                {user.email}
                                            </p>
                                        </div>

                                        {/* 4. Role Badge */}
                                        <div className="shrink-0">
                                            {renderRoleBadge(user.role)}
                                        </div>

                                        {/* 5. Actions: Edit + 3-dots */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className="border border-gray-200/90 text-gray-700 hover:bg-gray-50 text-xs font-bold px-3 py-1 rounded-xl transition-colors shadow-2xs cursor-pointer"
                                            >
                                                Edit
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMobileDropdown(isDropdownOpen ? null : user.id);
                                                    }}
                                                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer member-dropdown-btn"
                                                    aria-label="Member options"
                                                >
                                                    <MoreVertical size={16} strokeWidth={2.2} />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {isDropdownOpen && (
                                                    <div 
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 member-dropdown-menu animate-in fade-in zoom-in-95 duration-150"
                                                    >
                                                        <div className="px-3 py-1.5 border-b border-gray-50">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Change Role</p>
                                                        </div>
                                                        {user.role !== 'admin' && (
                                                            <button 
                                                                onClick={() => { setActiveMobileDropdown(null); handleRoleChange(user.id, 'admin'); }}
                                                                className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-50 transition-colors flex items-center gap-1.5"
                                                            >
                                                                <Crown size={12} /> Make Admin
                                                            </button>
                                                        )}
                                                        {user.role !== 'manager' && (
                                                            <button 
                                                                onClick={() => { setActiveMobileDropdown(null); handleRoleChange(user.id, 'manager'); }}
                                                                className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 transition-colors flex items-center gap-1.5"
                                                            >
                                                                <ShieldCheck size={12} /> Make Manager
                                                            </button>
                                                        )}
                                                        {user.role !== 'member' && (
                                                            <button 
                                                                onClick={() => { setActiveMobileDropdown(null); handleRoleChange(user.id, 'member'); }}
                                                                className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                                                            >
                                                                <UserIcon size={12} /> Make Member
                                                            </button>
                                                        )}
                                                        <div className="my-1 border-t border-gray-50" />
                                                        <button 
                                                            onClick={() => { setActiveMobileDropdown(null); handleRoleChange(user.id, user.role === 'suspended' ? 'member' : 'suspended'); }}
                                                            className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors"
                                                        >
                                                            {user.role === 'suspended' ? "Unsuspend User" : "Suspend User"}
                                                        </button>
                                                        <button 
                                                            onClick={() => { setActiveMobileDropdown(null); handleDeleteUser(user.id); }}
                                                            className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                                        >
                                                            Delete User
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

        {/* ─── Shared Modals ─── */}
        {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#F8FAFC]">
                            <h2 className="text-xl font-extrabold text-[#0B132B]">Edit Member</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 cursor-pointer">
                                <IconX size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateUser} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={editingUser.name || ""} 
                                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all font-medium text-gray-900 text-sm"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
                                <input 
                                    type="text" 
                                    value={editingUser.phone || ""} 
                                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all font-medium text-gray-900 text-sm"
                                    placeholder="Enter phone number"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Role</label>
                                <select 
                                    value={editingUser.role} 
                                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all font-medium text-gray-900 text-sm cursor-pointer"
                                >
                                    <option value="member">Member</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                    {editingUser.role === 'suspended' && <option value="suspended">Suspended</option>}
                                </select>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer">
                                    <IconCheck size={18} stroke={3} /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Floating Toast Notification ─── */}
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

            {/* ─── Notice Detail Modal ─── */}
            {selectedNotice && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedNotice(null)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-5 sm:p-6 space-y-3 relative z-10 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                    <IconBell size={18} stroke={2.5} />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 line-clamp-1">
                                    {selectedNotice.title}
                                </h3>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setSelectedNotice(null)}
                                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            >
                                <IconX size={18} stroke={2.5} />
                            </button>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium pt-1">
                            {selectedNotice.description}
                        </p>

                        {selectedNotice.createdAt && (
                            <p className="text-[10px] text-slate-400 font-bold pt-2 border-t border-slate-100">
                                {new Date(selectedNotice.createdAt).toLocaleString("en-US", { 
                                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" 
                                })}
                            </p>
                        )}

                        <div className="flex items-center gap-2.5 pt-2">
                            <button 
                                type="button"
                                onClick={() => handleDismissNotice(selectedNotice.id)}
                                className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/70 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <IconTrash size={15} stroke={2.2} />
                                <span>Dismiss</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setSelectedNotice(null)}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Modern Confirm Modal ─── */}
            {confirmModalState && (
                <ConfirmModal 
                    isOpen={confirmModalState.isOpen}
                    onClose={() => {
                        if (!isConfirmModalLoading) {
                            setConfirmModalState(null);
                        }
                    }}
                    onConfirm={confirmModalState.onConfirm}
                    type={confirmModalState.type}
                    title={confirmModalState.title}
                    message={confirmModalState.message}
                    confirmText={confirmModalState.confirmText}
                    isLoading={isConfirmModalLoading}
                />
            )}
        </div>
    );
}