"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react"; 
import { 
    IconHome, 
    IconUsers, 
    IconToolsKitchen2, 
    IconReceipt, 
    IconChartBar,
    IconSettings,
    IconMenu2, 
    IconX, 
    IconLogout,
    IconSearch,
    IconBell,
    IconChevronDown,
    IconUser,
    IconCalendarEvent,
    IconPlus,
    IconBellOff,
    IconClock,
    IconCheck
} from "@tabler/icons-react";
import { getUserDisplayRole } from "@/lib/user";

interface NoticeItem {
    id: string;
    title: string;
    description: string;
    type?: string;
    createdAt?: string | Date;
    isRead?: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const [notices, setNotices] = useState<NoticeItem[]>([]);
    const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

    const pathname = usePathname();
    const { data: session, status } = useSession(); 

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const res = await fetch("/api/members/dashboard-data");
                if (res.ok) {
                    const data = await res.json();
                    let storedRead: string[] = [];
                    try {
                        storedRead = JSON.parse(localStorage.getItem('mess_read_notices') || '[]');
                    } catch (e) {}

                    const formattedNotices: NoticeItem[] = (data.notices || []).map((n: any) => ({
                        ...n,
                        isRead: storedRead.includes(n.id)
                    }));
                    setNotices(formattedNotices);
                }
            } catch (error) {
                console.error("Error fetching notices in layout:", error);
            }
        };

        if (status === "authenticated") {
            fetchNotices();
        } else if (status === "unauthenticated") {
            signOut({ callbackUrl: "/login" });
        }
    }, [status]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.notif-wrapper')) {
                setIsNotifOpen(false);
            }
            if (!target.closest('.profile-wrapper')) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 💡 Close modal on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedNotice(null);
            }
        };
        if (selectedNotice) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedNotice]);

    const handleClearNotifications = async () => {
        setNotices([]);
        setSelectedNotice(null);
        try {
            await fetch("/api/members/clear-notices", { method: "POST" });
        } catch (error) {
            console.error("Failed to clear notices:", error);
        }
    };

    const handleNoticeClick = (notice: NoticeItem) => {
        // 1. Mark as read in local state
        setNotices((prev) =>
            prev.map((n) => (n.id === notice.id ? { ...n, isRead: true } : n))
        );

        // 2. Persist read ID in localStorage
        try {
            const storedRead: string[] = JSON.parse(localStorage.getItem('mess_read_notices') || '[]');
            if (!storedRead.includes(notice.id)) {
                localStorage.setItem('mess_read_notices', JSON.stringify([...storedRead, notice.id]));
            }
        } catch (e) {
            console.error("Failed to save read notice in localStorage:", e);
        }

        // 3. Open detail modal
        setSelectedNotice({ ...notice, isRead: true });

        // 4. Close the dropdown menu
        setIsNotifOpen(false);
    };

    const unreadCount = notices.filter((n) => !n.isRead).length;

    // 💡 Proper role detection for user (from session, fallback pathname)
    const sessionRole = (session?.user as { role?: string })?.role;
    let basePath = sessionRole || "member";
    if (!sessionRole) {
        if (pathname.startsWith("/admin")) basePath = "admin";
        else if (pathname.startsWith("/manager")) basePath = "manager";
        else basePath = "member";
    }

    const isAdmin = basePath === "admin";

    const getSidebarLinks = () => {
        if (basePath === "admin") {
            return [
                { name: "Dashboard", href: "/admin", icon: IconHome },
                { name: "Monthly Expense", href: "/admin/monthly-expense", icon: IconCalendarEvent },
                { name: "Members", href: "/members-list", icon: IconUsers },
                { name: "Food Management", href: "/meals", icon: IconToolsKitchen2 },
                { name: "Expenses", href: "/bazaar", icon: IconReceipt },
                { name: "Reports", href: "/reports", icon: IconChartBar },
                { name: "My Profile", href: `/${basePath}/profile`, icon: IconUser }, 
                { name: "Settings", href: "/settings", icon: IconSettings },
            ];
        }
        
        if (basePath === "manager") {
            return [
                { name: "Dashboard", href: "/manager", icon: IconHome },
                { name: "Members", href: "/members-list", icon: IconUsers },
                { name: "Food Management", href: "/meals", icon: IconToolsKitchen2 },
                { name: "Expenses", href: "/bazaar", icon: IconReceipt },
                { name: "Reports", href: "/reports", icon: IconChartBar },
                { name: "My Meals", href: "/member/my-meals", icon: IconToolsKitchen2 },
                { name: "My Profile", href: `/${basePath}/profile`, icon: IconUser }, 
            ];
        }
        
        if (basePath === "member") {
            return [
                { name: "Dashboard", href: "/member", icon: IconHome },
                { name: "My Meals", href: "/member/my-meals", icon: IconToolsKitchen2 }, 
                { name: "Reports", href: "/member/reports", icon: IconChartBar }, 
                { name: "My Profile", href: `/${basePath}/profile`, icon: IconUser }, 
            ];
        }

        return [];
    };

    const sidebarLinks = getSidebarLinks();

    const roleTitle = getUserDisplayRole(sessionRole || basePath);

    const displayName = session?.user?.name || "Member";
    const userInitial = displayName.charAt(0);

    return (
        <div className="min-h-screen bg-[url('/MobileDashboardBg.png')] md:bg-[#F8FAFC] lg:bg-[url('/admin_dashboard_desktop_bg.png')] bg-cover bg-center bg-no-repeat md:bg-fixed flex font-sans">
            
            {/* ─── Mobile Sidebar Overlay ─── */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* ─── Sidebar ─── */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen shrink-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                
                {/* ─── Decorative Background ─── */}
                <div className="absolute inset-0 bg-[url('/sidebar_bg.png')] bg-no-repeat bg-cover bg-center z-0 pointer-events-none"></div>

                <div className="pt-8 pb-6 flex items-center justify-center relative z-10">
                    <Link href={`/${basePath}`} className="flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-pointer">
                        <Image src="/logo.png" alt="Amader Mess" width={160} height={160} className="w-32 h-auto object-contain drop-shadow-sm" priority />
                    </Link>
                    <button className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-orange-600 cursor-pointer" onClick={() => setIsSidebarOpen(false)}>
                        <IconX size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2 flex flex-col relative z-10">
                    <nav className="space-y-2">
                        {sidebarLinks.map((link) => {
                            const isActive = link.name === "Dashboard" 
                                ? pathname === link.href 
                                : pathname === link.href || pathname.startsWith(`${link.href}/`);
                                
                            const Icon = link.icon;
                            return (
                                <Link 
                                    key={link.name} 
                                    href={link.href}
                                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all font-bold text-[15px] cursor-pointer ${isActive ? "bg-[#FF6B00] text-white shadow-md shadow-orange-500/20" : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"}`}
                                >
                                    <Icon size={26} stroke={isActive ? 2.5 : 2} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="text-center mt-auto py-6">
                        <div className="flex justify-center mb-2 text-[#D98A6C]">
                           <IconToolsKitchen2 size={36} stroke={1.5} />
                        </div>
                        <p className="text-[#c36d4b] text-sm font-extrabold tracking-wide">Good Food</p>
                        <p className="text-[#d89376] text-xs font-bold mt-0.5">Better Together</p>
                    </div>
                </div>

                {/* ─── Bottom Sidebar: User Profile (Left) & Logout (Right) ─── */}
                <div className="p-4 border-t border-gray-100/70 relative z-10 bg-white/40 backdrop-blur-sm flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {session?.user?.image ? (
                            <Image src={session.user.image} alt="Profile" width={38} height={38} className="rounded-full shadow-sm shrink-0 border-2 border-white object-cover" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-[#1e293b] flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                                {userInitial}
                            </div>
                        )}
                        <div className="overflow-hidden min-w-0">
                            <p className="text-sm font-extrabold text-[#450705] leading-tight truncate" title={displayName}>{displayName}</p>
                            <p className="text-[11px] text-gray-500 font-bold mt-0.5 truncate">{roleTitle}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-xs cursor-pointer shrink-0"
                        title="Log Out"
                        aria-label="Log Out"
                    >
                        <IconLogout size={18} stroke={2.2} />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* ─── Main Content Area ─── */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                
                {/* ─── Top Navbar (Desktop) ─── */}
                <header className="hidden md:flex h-20 bg-white/40 backdrop-blur-md border-b border-white/40 items-center justify-between px-4 sm:px-6 lg:px-10 z-30 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button 
                            className="lg:hidden p-2 text-gray-600 bg-white/60 hover:bg-white hover:shadow-sm rounded-lg transition-all backdrop-blur-sm cursor-pointer"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <IconMenu2 size={24} />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="hidden md:flex relative w-80 items-center">
                            <IconSearch className="absolute left-3 text-gray-500 w-5 h-5 z-10" stroke={2} />
                            <input 
                                type="text" 
                                placeholder="Search members, expenses, etc..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white text-sm text-gray-800 shadow-sm transition-all placeholder-gray-500 font-medium"
                            />
                        </div>
                        
                        {/* ─── Notification Dropdown ─── */}
                        <div className="relative notif-wrapper">
                            <button 
                                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                                className="relative p-2.5 text-gray-600 bg-white/80 backdrop-blur-md hover:bg-white rounded-full transition-all border border-white/80 shadow-md shadow-gray-200/50 hover:shadow-lg cursor-pointer"
                                aria-label="Notifications"
                            >
                                <IconBell size={24} stroke={2} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-orange-600 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow-sm">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {isNotifOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                    <div className="p-4 border-b border-gray-50 bg-[#F8FAFC] flex justify-between items-center">
                                        <span className="font-extrabold text-sm text-gray-800">Notifications</span>
                                        <div className="flex items-center gap-3">
                                            {notices.length > 0 && (
                                                <button onClick={handleClearNotifications} className="text-[10px] text-gray-500 hover:text-red-500 transition-colors cursor-pointer font-bold">Clear All</button>
                                            )}
                                            {unreadCount > 0 ? (
                                                <span className="text-[10px] text-orange-600 font-bold bg-orange-100 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                                            ) : (
                                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">All Read</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                                        {notices.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 opacity-60">
                                                <IconBellOff size={32} className="text-gray-400 mb-2" stroke={1.5} />
                                                <p className="text-center text-xs text-gray-400 font-medium">No new notifications</p>
                                            </div>
                                        ) : (
                                            notices.map((n) => {
                                                const isUnread = !n.isRead;
                                                return (
                                                    <div 
                                                        key={n.id} 
                                                        onClick={() => handleNoticeClick(n)}
                                                        className={`p-3 rounded-xl cursor-pointer transition-colors border-b border-gray-50 last:border-0 relative ${
                                                            isUnread ? 'bg-orange-50/40 hover:bg-orange-50' : 'hover:bg-gray-50 opacity-80 hover:opacity-100'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-xs ${isUnread ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                                {n.title}
                                                            </p>
                                                            {isUnread && (
                                                                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1" />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{n.description}</p>
                                                        {n.createdAt && (
                                                            <p className="text-[9px] text-gray-400 mt-1">
                                                                {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <div className="p-2 border-t border-gray-50 text-center">
                                        <button onClick={() => setIsNotifOpen(false)} className="text-xs font-bold text-orange-600 hover:underline cursor-pointer">Close</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* ─── Profile Dropdown ─── */}
                        <div className="relative profile-wrapper">
                            <div 
                                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                                className="flex items-center gap-2 sm:gap-3 cursor-pointer p-1.5 sm:pr-3.5 rounded-full bg-white/80 backdrop-blur-md hover:bg-white transition-all border border-white/80 shadow-md shadow-gray-200/50 hover:shadow-lg"
                            >
                                {session?.user?.image ? (
                                    <Image src={session.user.image} alt="Profile" width={34} height={34} className="rounded-full shadow-inner shrink-0" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                                        {userInitial}
                                    </div>
                                )}
                                <span className="hidden sm:block text-sm font-bold text-[#450705] truncate max-w-[120px]">
                                    {displayName.split(" ")[0]}
                                </span>
                                <IconChevronDown size={16} className={`text-gray-600 transition-transform hidden sm:block ${isProfileOpen ? "rotate-180" : ""}`} stroke={2} />
                            </div>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                    <div className="p-4 border-b border-gray-50 bg-[#F8FAFC]">
                                        <p className="text-sm font-extrabold text-gray-900 truncate">{displayName}</p>
                                        <p className="text-xs font-medium text-gray-500 truncate mt-0.5">{session?.user?.email || "Member"}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        {/* 💡 My Profile Link (Fixed to dynamic basePath) */}
                                        <Link 
                                            href={`/${basePath}/profile`} 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl cursor-pointer transition-colors"
                                        >
                                            <IconUser size={18} stroke={2} /> My Profile
                                        </Link>
                                        {/* 💡 Settings Link */}
                                        <Link 
                                            href={`/${basePath}`} 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl cursor-pointer transition-colors"
                                        >
                                            <IconSettings size={18} stroke={2} /> Settings
                                        </Link>
                                    </div>
                                    <div className="p-2 border-t border-gray-50">
                                        <button 
                                            onClick={() => signOut({ callbackUrl: "/" })}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors cursor-pointer"
                                        >
                                            <IconLogout size={18} stroke={2} /> Log Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </header>

                {/* ─── Mobile App Header ─── */}
                <header className="md:hidden flex items-center justify-between px-4 pt-4 pb-2 sticky top-0 z-30">
                    <button 
                        className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-gray-800 shadow-sm border border-gray-100/60 cursor-pointer"
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Open sidebar"
                    >
                        <IconMenu2 stroke={2.5} size={20} />
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF6B00] to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 shrink-0">
                            <IconToolsKitchen2 size={17} stroke={2.5} />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-base font-black text-gray-900 leading-tight">Good Food</span>
                            <span className="text-[11px] font-black text-[#FF6B00] leading-tight tracking-tight">Brighter Days</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mobile Notification Dropdown */}
                        <div className="relative notif-wrapper">
                            <button 
                                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                                className="relative w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 shadow-sm border border-gray-100/60 cursor-pointer"
                                aria-label="Notifications"
                            >
                                <IconBell stroke={2} size={20} />
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white shadow-2xs" />
                            </button>

                            {isNotifOpen && (
                                <div className="absolute right-0 top-12 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                                    <div className="p-3 border-b border-gray-50 bg-[#F8FAFC] flex justify-between items-center">
                                        <span className="font-extrabold text-sm text-gray-800">Notifications</span>
                                        <div className="flex items-center gap-2">
                                            {notices.length > 0 && (
                                                <button onClick={handleClearNotifications} className="text-[10px] text-gray-500 hover:text-red-500 transition-colors cursor-pointer font-bold">Clear All</button>
                                            )}
                                            {unreadCount > 0 ? (
                                                <span className="text-[10px] text-orange-600 font-bold bg-orange-100 px-1.5 py-0.5 rounded-full">{unreadCount} New</span>
                                            ) : (
                                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">All Read</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                                        {notices.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-6 opacity-60">
                                                <IconBellOff size={28} className="text-gray-400 mb-2" stroke={1.5} />
                                                <p className="text-center text-xs text-gray-400 font-medium">No new notifications</p>
                                            </div>
                                        ) : (
                                            notices.map((n) => {
                                                const isUnread = !n.isRead;
                                                return (
                                                    <div 
                                                        key={n.id} 
                                                        onClick={() => handleNoticeClick(n)}
                                                        className={`p-2.5 rounded-lg cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${
                                                            isUnread ? 'bg-orange-50/40 hover:bg-orange-50' : 'hover:bg-gray-50 opacity-80 hover:opacity-100'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-1.5">
                                                            <p className={`text-[11px] ${isUnread ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                                {n.title}
                                                            </p>
                                                            {isUnread && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1" />
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{n.description}</p>
                                                        {n.createdAt && (
                                                            <p className="text-[8px] text-gray-400 mt-1">
                                                                {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <div className="p-1 border-t border-gray-50 text-center">
                                        <button onClick={() => setIsNotifOpen(false)} className="text-xs font-bold text-orange-600 hover:underline cursor-pointer w-full py-1">Close</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Mobile Profile Dropdown */}
                        <div className="relative profile-wrapper">
                            <div 
                                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                                className={`w-9 h-9 rounded-full ${basePath === 'manager' ? 'bg-gradient-to-tr from-orange-500 to-amber-500' : 'bg-[#7C3AED]'} flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 cursor-pointer border-2 border-white/90 overflow-hidden relative`}
                            >
                                {session?.user?.image ? (
                                    <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : userInitial}
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                            </div>

                            {isProfileOpen && (
                                <div className="absolute right-0 top-12 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                                    <div className="p-3 border-b border-gray-50 bg-[#F8FAFC]">
                                        <p className="text-sm font-extrabold text-gray-900 truncate">{displayName}</p>
                                        <p className="text-[10px] font-medium text-gray-500 truncate mt-0.5">{session?.user?.email || "Member"}</p>
                                    </div>
                                    <div className="p-1 space-y-1">
                                        <Link 
                                            href={`/${basePath}/profile`} 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <IconUser size={16} stroke={2} /> My Profile
                                        </Link>
                                        <Link 
                                            href={`/${basePath}`} 
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <IconSettings size={16} stroke={2} /> Settings
                                        </Link>
                                    </div>
                                    <div className="p-1 border-t border-gray-50">
                                        <button 
                                            onClick={() => signOut({ callbackUrl: "/" })}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors cursor-pointer"
                                        >
                                            <IconLogout size={16} stroke={2} /> Log Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                
                {/* ─── Page Content ─── */}
                <main className="flex-1 p-4 sm:p-6 pb-28 md:pb-10 lg:px-10 lg:pb-10 overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* ─── Fixed Bottom Navigation (Mobile Only) ─── */}
            <nav 
                className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100/90 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] rounded-t-[28px] z-50"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
                <div className={`grid ${isAdmin ? "grid-cols-5" : "grid-cols-4"} items-center justify-items-center h-16 px-2 relative`}>
                    
                    {/* Elevated FAB Button (Admin Only) */}
                    {isAdmin && (
                        <div className="absolute left-1/2 -translate-x-1/2 -top-5 z-20">
                            <Link 
                                href="/admin/add-member" 
                                className="w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-tr from-[#FF6B00] to-amber-500 text-white rounded-full shadow-lg shadow-orange-500/40 flex items-center justify-center border-4 border-white hover:scale-105 active:scale-95 transition-all"
                                aria-label="Add Member"
                            >
                                <IconPlus stroke={3} size={26} />
                            </Link>
                        </div>
                    )}

                    {/* 1. Dashboard */}
                    <Link 
                        href={`/${basePath}`} 
                        className="flex flex-col items-center justify-center gap-0.5 w-full h-full"
                    >
                        <IconHome 
                            stroke={pathname === `/${basePath}` ? 2.5 : 2} 
                            className={pathname === `/${basePath}` ? "text-[#FF6B00]" : "text-gray-400"} 
                            size={22} 
                        />
                        <span className={`text-[10px] font-bold ${pathname === `/${basePath}` ? "text-[#FF6B00]" : "text-gray-400"}`}>
                            Dashboard
                        </span>
                        {pathname === `/${basePath}` && <span className="w-5 h-1 bg-[#FF6B00] rounded-full mt-0.5" />}
                    </Link>

                    {/* 2. Expenses */}
                    <Link 
                        href="/bazaar" 
                        className="flex flex-col items-center justify-center gap-0.5 w-full h-full"
                    >
                        <IconReceipt 
                            stroke={pathname.includes("/bazaar") || pathname.includes("/monthly-expense") ? 2.5 : 2} 
                            className={pathname.includes("/bazaar") || pathname.includes("/monthly-expense") ? "text-[#FF6B00]" : "text-gray-400"} 
                            size={22} 
                        />
                        <span className={`text-[10px] font-bold ${pathname.includes("/bazaar") || pathname.includes("/monthly-expense") ? "text-[#FF6B00]" : "text-gray-400"}`}>
                            Expenses
                        </span>
                        {(pathname.includes("/bazaar") || pathname.includes("/monthly-expense")) && <span className="w-5 h-1 bg-[#FF6B00] rounded-full mt-0.5" />}
                    </Link>

                    {/* 3. Empty Center Space for FAB (Admin Only) */}
                    {isAdmin && <div className="w-full h-full pointer-events-none" />}

                    {/* 4. Members */}
                    <Link 
                        href="/members-list" 
                        className="flex flex-col items-center justify-center gap-0.5 w-full h-full"
                    >
                        <IconUsers 
                            stroke={pathname.includes("/members-list") ? 2.5 : 2} 
                            className={pathname.includes("/members-list") ? "text-[#FF6B00]" : "text-gray-400"} 
                            size={22} 
                        />
                        <span className={`text-[10px] font-bold ${pathname.includes("/members-list") ? "text-[#FF6B00]" : "text-gray-400"}`}>
                            Members
                        </span>
                        {pathname.includes("/members-list") && <span className="w-5 h-1 bg-[#FF6B00] rounded-full mt-0.5" />}
                    </Link>

                    {/* 5. Reports */}
                    <Link 
                        href="/reports" 
                        className="flex flex-col items-center justify-center gap-0.5 w-full h-full"
                    >
                        <IconChartBar 
                            stroke={pathname.includes("/reports") ? 2.5 : 2} 
                            className={pathname.includes("/reports") ? "text-[#FF6B00]" : "text-gray-400"} 
                            size={22} 
                        />
                        <span className={`text-[10px] font-bold ${pathname.includes("/reports") ? "text-[#FF6B00]" : "text-gray-400"}`}>
                            Reports
                        </span>
                        {pathname.includes("/reports") && <span className="w-5 h-1 bg-[#FF6B00] rounded-full mt-0.5" />}
                    </Link>

                </div>
            </nav>

            {/* ─── Notification Detail Modal ─── */}
            {selectedNotice && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedNotice(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="notification-modal-title"
                >
                    <div 
                        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#F8FAFC] flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm shrink-0">
                                    <IconBell size={20} stroke={2.5} />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60 inline-block mb-1">
                                        {selectedNotice.type ? selectedNotice.type.toUpperCase() : "NOTIFICATION"}
                                    </span>
                                    <h3 id="notification-modal-title" className="text-base sm:text-lg font-extrabold text-gray-900 leading-snug break-words">
                                        {selectedNotice.title}
                                    </h3>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedNotice(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl transition-colors cursor-pointer shrink-0"
                                aria-label="Close modal"
                            >
                                <IconX size={20} stroke={2.5} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                                {selectedNotice.description}
                            </p>

                            {/* Metadata & Read Status */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-semibold gap-2 flex-wrap">
                                <span className="flex items-center gap-1.5">
                                    <IconClock size={15} className="text-gray-400 shrink-0" />
                                    {selectedNotice.createdAt 
                                        ? new Date(selectedNotice.createdAt).toLocaleString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                        : "Recently posted"}
                                </span>
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                    <IconCheck size={12} stroke={3} /> Read
                                </span>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                            <button 
                                onClick={() => setSelectedNotice(null)}
                                className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}