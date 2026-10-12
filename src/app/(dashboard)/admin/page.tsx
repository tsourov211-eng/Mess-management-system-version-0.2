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
    IconArrowDownRight
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

export default function AdminDashboardPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [pendingMembers, setPendingMembers] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalFoodCost: 0, messFund: 0, totalMembers: 0, totalMessMeals: 0, liveMealRate: 0 });
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
        // Detect if mobile (roughly) or just fetch for all to be safe
        fetchMobileDashboardData();
    }, []);

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
                }
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to update user role
    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;

        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, newRole })
            });

            if (res.ok) {
                alert(`✅ User role updated successfully!`);
                fetchUsers(); // Refresh data
            } else {
                alert("❌ Failed to update role.");
            }
        } catch (error) {
            console.error(error);
        }
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
                alert(`✅ User updated successfully!`);
                setIsEditModalOpen(false);
                fetchUsers();
            } else {
                alert("❌ Failed to update user.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to completely DELETE this user? This action cannot be undone and will delete all their financial records.")) return;
        
        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                alert("✅ User deleted successfully!");
                fetchUsers();
            } else {
                alert("❌ Failed to delete user.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleMemberApproval = async (userId: string, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this member?`)) return;

        try {
            const res = await fetch("/api/admin/users/approve", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action })
            });

            if (res.ok) {
                alert(`✅ Member ${action}d successfully!`);
                fetchUsers();
            } else {
                alert(`❌ Failed to ${action} member.`);
            }
        } catch (error) {
            console.error(error);
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

            {/* ─── Stats Grid (Desktop - Ported Mobile Design System) ─── */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 order-none">
                
                {/* Food Cost Card */}
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
                            Tk {stats.totalFoodCost > 0 ? stats.totalFoodCost.toLocaleString() : "300"}
                        </h3>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="bg-orange-100/90 text-[#FF6B00] text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit shadow-2xs">
                            <ArrowUpRight size={13} strokeWidth={3} /> +12%
                        </span>
                        <span className="text-xs font-bold text-orange-600/80 bg-orange-50/70 px-2 py-0.5 rounded-md">
                            Meal Rate: ৳ {stats.liveMealRate || 0}
                        </span>
                    </div>
                </div>

                {/* Today's Bazaar Card */}
                <div className="bg-gradient-to-b from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0]/50 rounded-3xl p-5 lg:p-6 border border-emerald-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                            <ShoppingCart size={22} strokeWidth={2.2} />
                        </div>
                        <svg className="w-16 h-8 text-emerald-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M 4,12 C 14,8 24,20 38,14 C 48,10 56,22 66,18" />
                        </svg>
                    </div>
                    <div className="my-auto py-2">
                        <p className="text-xs font-bold text-gray-500 leading-tight">Today's Bazaar</p>
                        <h3 className="text-xl lg:text-2xl font-black text-gray-900 leading-tight mt-1 truncate">
                            Tk {todayBazaarTotal.toLocaleString()}
                        </h3>
                    </div>
                    <div>
                        <span className="bg-emerald-100/90 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit shadow-2xs">
                            <ArrowDownRight size={13} strokeWidth={3} /> -8%
                        </span>
                    </div>
                </div>

                {/* Mess Fund Card */}
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
                            Tk {stats.messFund > 0 ? stats.messFund.toLocaleString() : "4,600"}
                        </h3>
                    </div>
                    <div>
                        <span className="bg-purple-100/90 text-purple-700 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit shadow-2xs">
                            <ArrowUpRight size={13} strokeWidth={3} /> +5%
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
                                            onClick={() => handleMemberApproval(user.id, "approve")}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                            <Check size={12} strokeWidth={3} /> Approve
                                        </button>
                                        <button 
                                            onClick={() => handleMemberApproval(user.id, "reject")}
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
                    <div className="w-72 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name, email, or role..."
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/30 focus:bg-white text-gray-900 font-medium transition-all"
                        />
                        {memberSearchQuery && (
                            <button 
                                onClick={() => setMemberSearchQuery("")} 
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                {/* 2. 3 Key Metrics Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    
                    {/* Food Cost Card */}
                    <div className="bg-gradient-to-b from-[#FFF5ED] via-[#FFEADB] to-[#FED7AA]/50 rounded-[28px] p-3 sm:p-3.5 border border-orange-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[148px]">
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                                <Receipt size={18} strokeWidth={2.2} />
                            </div>
                            <svg className="w-12 sm:w-14 h-7 text-orange-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M 4,22 C 16,22 24,10 36,16 C 48,22 56,8 66,6" />
                            </svg>
                        </div>
                        <div className="my-auto py-1">
                            <p className="text-[11px] font-bold text-gray-500 leading-tight">Food Cost</p>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight mt-1 truncate">
                                Tk {stats.totalFoodCost > 0 ? stats.totalFoodCost.toLocaleString() : "300"}
                            </h3>
                        </div>
                        <div>
                            <span className="bg-orange-100/90 text-[#FF6B00] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 w-fit shadow-2xs">
                                <ArrowUpRight size={11} strokeWidth={3} /> +12%
                            </span>
                        </div>
                    </div>

                    {/* Today's Bazaar Card */}
                    <div className="bg-gradient-to-b from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0]/50 rounded-[28px] p-3 sm:p-3.5 border border-emerald-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[148px]">
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                                <ShoppingCart size={18} strokeWidth={2.2} />
                            </div>
                            <svg className="w-12 sm:w-14 h-7 text-emerald-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M 4,12 C 14,8 24,20 38,14 C 48,10 56,22 66,18" />
                            </svg>
                        </div>
                        <div className="my-auto py-1">
                            <p className="text-[11px] font-bold text-gray-500 leading-tight">Today's Bazaar</p>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight mt-1 truncate">
                                Tk {todayBazaarTotal.toLocaleString()}
                            </h3>
                        </div>
                        <div>
                            <span className="bg-emerald-100/90 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 w-fit shadow-2xs">
                                <ArrowDownRight size={11} strokeWidth={3} /> -8%
                            </span>
                        </div>
                    </div>

                    {/* Mess Fund Card */}
                    <div className="bg-gradient-to-b from-[#FAF5FF] via-[#F3E8FF] to-[#E9D5FF]/50 rounded-[28px] p-3 sm:p-3.5 border border-purple-200/40 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[148px]">
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
                                <Coins size={18} strokeWidth={2.2} />
                            </div>
                            <svg className="w-12 sm:w-14 h-7 text-purple-400/80 shrink-0" viewBox="0 0 70 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M 4,22 C 16,20 26,8 38,14 C 50,20 58,10 66,6" />
                            </svg>
                        </div>
                        <div className="my-auto py-1">
                            <p className="text-[11px] font-bold text-gray-500 leading-tight">Mess Fund</p>
                            <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight mt-1 truncate">
                                Tk {stats.messFund > 0 ? stats.messFund.toLocaleString() : "4,600"}
                            </h3>
                        </div>
                        <div>
                            <span className="bg-purple-100/90 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 w-fit shadow-2xs">
                                <ArrowUpRight size={11} strokeWidth={3} /> +5%
                            </span>
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
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, email, or role..."
                                    value={memberSearchQuery}
                                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                                    autoFocus
                                    className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/40 focus:bg-white text-gray-900 font-medium"
                                />
                                {memberSearchQuery && (
                                    <button 
                                        onClick={() => setMemberSearchQuery("")} 
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
        </div>
    );
}