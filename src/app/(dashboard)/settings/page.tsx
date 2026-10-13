"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import useSWR from "swr";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { 
    IconSettings, 
    IconBuilding, 
    IconUser, 
    IconLock, 
    IconDeviceFloppy,
    IconBell,
    IconCheck,
    IconX,
    IconUpload,
    IconTrash,
    IconToolsKitchen2,
    IconShieldLock,
    IconAlertCircle,
    IconLogout,
    IconMail,
    IconPhone,
    IconMapPin,
    IconEye,
    IconEyeOff,
    IconChevronDown
} from "@tabler/icons-react";
import { getUserDisplayRole, getRoleBadgeStyle } from "@/lib/user";

type TabType = "mess" | "profile" | "security" | "notifications";

interface ToastState {
    message: string;
    type: "success" | "error";
}

// ─── Modern Dropdown Component ───
interface ModernDropdownOption<T> {
    value: T;
    label: string;
    badge?: string;
    badgeStyle?: string;
    icon?: React.ReactNode;
}

interface ModernDropdownProps<T> {
    value: T;
    onChange: (val: T) => void;
    options: ModernDropdownOption<T>[];
    className?: string;
    theme?: "orange" | "amber" | "indigo" | "blue";
    ariaLabel?: string;
    placement?: "top" | "bottom";
}

function ModernDropdown<T extends string | number>({
    value,
    onChange,
    options,
    className = "",
    theme = "orange",
    ariaLabel,
    placement = "bottom",
}: ModernDropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    const themeBorderFocus = {
        orange: "border-orange-500 ring-4 ring-orange-500/10",
        amber: "border-amber-500 ring-4 ring-amber-500/10",
        indigo: "border-indigo-500 ring-4 ring-indigo-500/10",
        blue: "border-blue-500 ring-4 ring-blue-500/10",
    }[theme];

    const themeSelectedBg = {
        orange: "bg-orange-50/90 text-orange-950 font-black border border-orange-200/80 shadow-2xs",
        amber: "bg-amber-50/90 text-amber-950 font-black border border-amber-200/80 shadow-2xs",
        indigo: "bg-indigo-50/90 text-indigo-950 font-black border border-indigo-200/80 shadow-2xs",
        blue: "bg-blue-50/90 text-blue-950 font-black border border-blue-200/80 shadow-2xs",
    }[theme];

    const themeCheckColor = {
        orange: "text-orange-600",
        amber: "text-amber-600",
        indigo: "text-indigo-600",
        blue: "text-blue-600",
    }[theme];

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                type="button"
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-bold text-slate-800 flex items-center justify-between shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer select-none ${
                    isOpen 
                        ? `${themeBorderFocus} shadow-xs` 
                        : "border-slate-200/90"
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && (
                        <span className="shrink-0">{selectedOption.icon}</span>
                    )}
                    <span className="truncate">{selectedOption?.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {selectedOption?.badge && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${selectedOption.badgeStyle || "bg-slate-100 text-slate-600"}`}>
                            {selectedOption.badge}
                        </span>
                    )}
                    <IconChevronDown 
                        size={15} 
                        stroke={2.5} 
                        className={`transition-transform duration-200 ease-out text-slate-400 ${
                            isOpen ? `rotate-180 ${themeCheckColor}` : ""
                        }`} 
                    />
                </div>
            </button>

            {isOpen && (
                <div 
                    role="listbox"
                    className={`absolute left-0 right-0 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 min-w-[150px] ${
                        placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
                    }`}
                >
                    {options.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={String(opt.value)}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer text-left ${
                                    isSelected 
                                        ? themeSelectedBg 
                                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                                    <span className="truncate">{opt.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    {opt.badge && (
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${opt.badgeStyle || "bg-slate-100 text-slate-500"}`}>
                                            {opt.badge}
                                        </span>
                                    )}
                                    {isSelected && (
                                        <IconCheck size={14} stroke={3} className={themeCheckColor} />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Meal Preferences Dropdown Options ───
const breakfastOptions = [
    { 
        value: 0, 
        label: "0 (Off)", 
        badge: "Off", 
        badgeStyle: "bg-slate-100 text-slate-500 border border-slate-200", 
        icon: <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" /> 
    },
    { 
        value: 0.5, 
        label: "0.5 Meal", 
        badge: "Half", 
        badgeStyle: "bg-amber-100 text-amber-800 border border-amber-200/80", 
        icon: <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" /> 
    },
    { 
        value: 1, 
        label: "1.0 Meal", 
        badge: "Full", 
        badgeStyle: "bg-emerald-100 text-emerald-800 border border-emerald-200/80", 
        icon: <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> 
    },
];

const lunchOptions = [
    { 
        value: 0, 
        label: "0 (Off)", 
        badge: "Off", 
        badgeStyle: "bg-slate-100 text-slate-500 border border-slate-200", 
        icon: <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" /> 
    },
    { 
        value: 1, 
        label: "1.0 Meal", 
        badge: "Standard", 
        badgeStyle: "bg-orange-100 text-orange-800 border border-orange-200/80", 
        icon: <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" /> 
    },
    { 
        value: 2, 
        label: "2.0 Meals", 
        badge: "Double", 
        badgeStyle: "bg-rose-100 text-rose-800 border border-rose-200/80", 
        icon: <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" /> 
    },
];

const dinnerOptions = [
    { 
        value: 0, 
        label: "0 (Off)", 
        badge: "Off", 
        badgeStyle: "bg-slate-100 text-slate-500 border border-slate-200", 
        icon: <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" /> 
    },
    { 
        value: 1, 
        label: "1.0 Meal", 
        badge: "Standard", 
        badgeStyle: "bg-indigo-100 text-indigo-800 border border-indigo-200/80", 
        icon: <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" /> 
    },
    { 
        value: 2, 
        label: "2.0 Meals", 
        badge: "Double", 
        badgeStyle: "bg-purple-100 text-purple-800 border border-purple-200/80", 
        icon: <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" /> 
    },
];

const currencyOptions = [
    { 
        value: "BDT", 
        label: "Tk (BDT)", 
        badge: "Taka", 
        badgeStyle: "bg-emerald-100 text-emerald-800 border border-emerald-200/80", 
        icon: <span className="text-xs font-black text-emerald-700">৳</span> 
    },
    { 
        value: "USD", 
        label: "$ (USD)", 
        badge: "USD", 
        badgeStyle: "bg-blue-100 text-blue-800 border border-blue-200/80", 
        icon: <span className="text-xs font-black text-blue-700">$</span> 
    },
];

const monthStartOptions = [
    { 
        value: "1", 
        label: "1st of the Month", 
        badge: "Standard", 
        badgeStyle: "bg-blue-100 text-blue-800 border border-blue-200/80", 
        icon: <span className="text-xs font-black text-blue-700">01</span> 
    },
    { 
        value: "15", 
        label: "15th of the Month", 
        badge: "Mid-month", 
        badgeStyle: "bg-purple-100 text-purple-800 border border-purple-200/80", 
        icon: <span className="text-xs font-black text-purple-700">15</span> 
    },
];

function SettingsContent() {
    const { data: session, status, update } = useSession();
    const searchParams = useSearchParams();
    const tabQuery = searchParams.get("tab") as TabType | null;

    const { data: profileData, isLoading: isLoadingProfile, mutate } = useSWR<{ profile?: any }>("/api/members/profile");

    // Unified display role and role resolution
    const effectiveRole = (profileData?.profile?.role || (session?.user as any)?.role || "member").toLowerCase();
    const isAdmin = effectiveRole === "admin";

    // Non-admin (members & managers) only have access to personal profile, security & notifications
    const [activeTab, setActiveTab] = useState<TabType>(() => {
        if (tabQuery && (tabQuery !== "mess" || isAdmin)) {
            return tabQuery;
        }
        return isAdmin ? "mess" : "profile";
    });

    // Mess Configuration Tab States (Admin only)
    const [messName, setMessName] = useState("Amader Mess");
    const [currencySymbol, setCurrencySymbol] = useState("BDT");
    const [monthStartDay, setMonthStartDay] = useState("1");

    // Profile Details Tab States
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [role, setRole] = useState<string>("");
    const [avatarImage, setAvatarImage] = useState<string | null>(null);
    const [defaultBreakfast, setDefaultBreakfast] = useState(0.5);
    const [defaultLunch, setDefaultLunch] = useState(1.0);
    const [defaultDinner, setDefaultDinner] = useState(1.0);

    // Security & Password Tab States
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Notification Preferences Tab States
    const [notifications, setNotifications] = useState({
        dailyMealReminder: true,
        bazaarDutyAlert: true,
        depositConfirmation: true,
        emailNotifications: true,
        inAppAlerts: false,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<ToastState | null>(null);

    // Sync tab from URL query param if valid or fallback based on role
    useEffect(() => {
        if (tabQuery) {
            if (tabQuery === "mess" && !isAdmin) {
                setActiveTab("profile");
            } else if (["mess", "profile", "security", "notifications"].includes(tabQuery)) {
                setActiveTab(tabQuery);
            }
        } else {
            if (!isAdmin && activeTab === "mess") {
                setActiveTab("profile");
            }
        }
    }, [tabQuery, isAdmin, activeTab]);

    // Load notification preferences from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("mess_notification_preferences");
            if (saved) {
                setNotifications((prev) => ({ ...prev, ...JSON.parse(saved) }));
            }
        } catch (e) {
            console.error("Failed to load notification preferences:", e);
        }
    }, []);

    // Sync profile state when SWR data is loaded/revalidated
    useEffect(() => {
        if (profileData?.profile) {
            const prof = profileData.profile;
            setFullName(prof.name || "");
            setEmail(prof.email || "");
            setPhone(prof.phone || "");
            setAddress(prof.address || "");
            if (prof.role) setRole(prof.role);
            if (prof.messName) setMessName(prof.messName);
            if (prof.image) setAvatarImage(prof.image);
            if (prof.defaultBreakfast !== undefined) {
                setDefaultBreakfast(prof.defaultBreakfast);
            }
            if (prof.defaultLunch !== undefined) {
                setDefaultLunch(prof.defaultLunch);
            }
            if (prof.defaultDinner !== undefined) {
                setDefaultDinner(prof.defaultDinner);
            }
        }
    }, [profileData]);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast((prev) => (prev?.message === message ? null : prev));
        }, 4000);
    };

    const handleTabChange = (tab: TabType) => {
        if (tab === "mess" && !isAdmin) return;
        setActiveTab(tab);
        try {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", tab);
            window.history.replaceState({}, "", url.toString());
        } catch (e) {}
    };

    // Unified display role and badge resolution
    const displayName = fullName || session?.user?.name || "User";
    const displayEmail = email || session?.user?.email || "No email";
    const displayRole = getUserDisplayRole(effectiveRole);
    const badgeStyle = getRoleBadgeStyle(effectiveRole);
    const initial = (displayName ? displayName.charAt(0) : "U").toUpperCase();

    // Image upload handler
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast("Photo must be less than 5MB", "error");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarImage(reader.result as string);
            showToast("Photo selected! Click 'Save All Changes' to save.", "success");
        };
        reader.readAsDataURL(file);
    };

    // Remove photo
    const handleRemoveImage = () => {
        setAvatarImage(null);
        showToast("Photo removed! Click 'Save All Changes' to save.", "success");
    };

    // Unified Save Handler based on active tab
    const handleSave = async () => {
        setIsSaving(true);
        setToast(null);

        try {
            if (activeTab === "mess") {
                if (!isAdmin) {
                    showToast("Only administrators can update mess configuration.", "error");
                    setIsSaving(false);
                    return;
                }
                // Tab 1: Save Mess Config & Account Profile
                const res = await fetch("/api/members/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: fullName,
                        messName,
                        phone,
                    }),
                });

                if (res.ok) {
                    showToast("Mess configuration saved successfully!", "success");
                    mutate();
                    if (update) await update({ name: fullName });
                } else {
                    const data = await res.json();
                    showToast(data.error || "Failed to save mess settings.", "error");
                }
            } else if (activeTab === "profile") {
                // Tab 2: Save Profile Details & Default Meals
                if (!fullName.trim() || fullName.trim().length < 2) {
                    showToast("Full Name must be at least 2 characters.", "error");
                    setIsSaving(false);
                    return;
                }

                const res = await fetch("/api/members/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: fullName,
                        phone,
                        address,
                        image: avatarImage,
                        defaultBreakfast,
                        defaultLunch,
                        defaultDinner,
                    }),
                });

                if (res.ok) {
                    showToast("Profile details updated successfully!", "success");
                    mutate();
                    if (update) await update({ name: fullName });
                } else {
                    const data = await res.json();
                    showToast(data.error || "Failed to update profile details.", "error");
                }
            } else if (activeTab === "security") {
                // Tab 3: Security & Password Update
                if (!currentPassword) {
                    showToast("Please enter your current password.", "error");
                    setIsSaving(false);
                    return;
                }
                if (newPassword.length < 6) {
                    showToast("New password must be at least 6 characters.", "error");
                    setIsSaving(false);
                    return;
                }
                if (newPassword !== confirmPassword) {
                    showToast("New password and confirmation do not match.", "error");
                    setIsSaving(false);
                    return;
                }

                const res = await fetch("/api/members/change-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                        confirmPassword,
                    }),
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast("Password updated successfully!", "success");
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                } else {
                    showToast(data.error || "Failed to update password.", "error");
                }
            } else if (activeTab === "notifications") {
                // Tab 4: Save Notification Preferences
                try {
                    localStorage.setItem("mess_notification_preferences", JSON.stringify(notifications));
                    showToast("Notification preferences saved successfully!", "success");
                } catch (e) {
                    showToast("Failed to save notification preferences.", "error");
                }
            }
        } catch (error) {
            console.error("Save settings error:", error);
            showToast("An unexpected error occurred while saving.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full max-w-md sm:max-w-xl md:max-w-7xl mx-auto space-y-6 lg:space-y-8">
            
            {/* ─── Toast Notification ─── */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-5 duration-200 ${
                    toast.type === "success" 
                        ? "bg-[#0B132B] text-white border-gray-800" 
                        : "bg-red-600 text-white border-red-700"
                }`}>
                    {toast.type === "success" ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <IconCheck size={16} stroke={3} />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                            <IconAlertCircle size={16} stroke={2.5} />
                        </div>
                    )}
                    <p className="text-sm font-bold">{toast.message}</p>
                    <button 
                        onClick={() => setToast(null)} 
                        className="ml-3 text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                    >
                        <IconX size={16} />
                    </button>
                </div>
            )}

            {/* ─── Header Section ─── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] tracking-tight">System Settings</h1>
                    <p className="text-gray-500 text-sm mt-1.5 font-medium">
                        {isAdmin 
                            ? "Manage your mess preferences, profile, and security." 
                            : "Manage your personal profile details, password, and notifications."}
                    </p>
                </div>

                {/* Save All Button (Desktop md and above) */}
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="hidden md:flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                    {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <IconDeviceFloppy className="w-5 h-5" stroke={2.5} />
                    )}
                    {isSaving ? "Saving Changes..." : "Save All Changes"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                
                {/* ─── Left Sidebar (Dynamic Navigation Tabs) ─── */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-2 flex flex-col gap-1">
                        
                        {/* Tab 1: Mess Information (Admin only) */}
                        {isAdmin && (
                            <button 
                                onClick={() => handleTabChange("mess")}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all w-full text-left cursor-pointer ${
                                    activeTab === "mess"
                                        ? "bg-orange-50 text-orange-600 shadow-xs"
                                        : "text-gray-600 hover:bg-orange-50/50 hover:text-orange-600"
                                }`}
                            >
                                <IconBuilding className="w-5 h-5 shrink-0" stroke={2} />
                                <span>Mess Information</span>
                            </button>
                        )}

                        {/* Tab 2: Profile Details */}
                        <button 
                            onClick={() => handleTabChange("profile")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all w-full text-left cursor-pointer ${
                                activeTab === "profile"
                                    ? "bg-orange-50 text-orange-600 shadow-xs"
                                    : "text-gray-600 hover:bg-orange-50/50 hover:text-orange-600"
                            }`}
                        >
                            <IconUser className="w-5 h-5 shrink-0" stroke={2} />
                            <span>Profile Details</span>
                        </button>

                        {/* Tab 3: Security & Password */}
                        <button 
                            onClick={() => handleTabChange("security")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all w-full text-left cursor-pointer ${
                                activeTab === "security"
                                    ? "bg-orange-50 text-orange-600 shadow-xs"
                                    : "text-gray-600 hover:bg-orange-50/50 hover:text-orange-600"
                            }`}
                        >
                            <IconLock className="w-5 h-5 shrink-0" stroke={2} />
                            <span>Security & Password</span>
                        </button>

                        {/* Tab 4: Notifications */}
                        <button 
                            onClick={() => handleTabChange("notifications")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all w-full text-left cursor-pointer ${
                                activeTab === "notifications"
                                    ? "bg-orange-50 text-orange-600 shadow-xs"
                                    : "text-gray-600 hover:bg-orange-50/50 hover:text-orange-600"
                            }`}
                        >
                            <IconBell className="w-5 h-5 shrink-0" stroke={2} />
                            <span>Notifications</span>
                        </button>
                    </div>

                    <div className="hidden lg:block bg-gradient-to-br from-[#0B132B] to-[#1c2a53] rounded-3xl border border-gray-800 p-6 shadow-md text-white text-center mt-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm text-orange-400">
                            <IconSettings className="w-6 h-6" stroke={2} />
                        </div>
                        <h3 className="font-extrabold text-lg mb-1">System Version</h3>
                        <p className="text-gray-400 text-sm font-medium">Goriber Mess v2.0</p>
                    </div>
                </div>

                {/* ─── Right Content Area (Dynamic Panels) ─── */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* ═══════════════════════════════════════════
                        PANEL 1: MESS INFORMATION (Admin only)
                       ═══════════════════════════════════════════ */}
                    {isAdmin && activeTab === "mess" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* Mess Information Card */}
                            <div className="bg-gradient-to-br from-white via-orange-50/15 to-amber-50/25 rounded-3xl border border-orange-100/70 shadow-sm p-6 sm:p-8">
                                <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                                        <IconBuilding className="w-5 h-5" stroke={2.2} />
                                    </div>
                                    <span>Mess Configuration</span>
                                </h2>
                                
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Mess Name</label>
                                        <input
                                            type="text"
                                            value={messName}
                                            onChange={(e) => setMessName(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-sm text-gray-900 font-bold shadow-2xs"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Currency Symbol</label>
                                            <ModernDropdown
                                                value={currencySymbol}
                                                onChange={setCurrencySymbol}
                                                options={currencyOptions}
                                                theme="orange"
                                                ariaLabel="Select currency symbol"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Month Starts On</label>
                                            <ModernDropdown
                                                value={monthStartDay}
                                                onChange={setMonthStartDay}
                                                options={monthStartOptions}
                                                theme="orange"
                                                ariaLabel="Select month start day"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Profile Card */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                                <h2 className="text-lg font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                                    <IconUser className="w-5 h-5 text-blue-500" stroke={2} />
                                    Account Profile
                                </h2>
                                
                                {isLoadingProfile && !fullName && status === "loading" ? (
                                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 animate-pulse">
                                        <div className="w-20 h-20 rounded-full bg-slate-200 shrink-0" />
                                        <div className="space-y-2 text-center sm:text-left">
                                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                                <div className="h-5 w-24 bg-gray-200 rounded-md" />
                                                <div className="h-5 w-20 bg-gray-200 rounded-full" />
                                            </div>
                                            <div className="h-4 w-40 bg-gray-100 rounded-md" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0 overflow-hidden">
                                            {avatarImage ? (
                                                <img src={avatarImage} alt={displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                initial
                                            )}
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                                                <p className="font-extrabold text-gray-900 text-lg leading-tight">
                                                    {displayName}
                                                </p>
                                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${badgeStyle}`}>
                                                    {displayRole}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-500 mt-1">
                                                {displayEmail}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-gray-900 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="01700000000"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-gray-900 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                        PANEL 2: PROFILE DETAILS
                       ═══════════════════════════════════════════ */}
                    {activeTab === "profile" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* 1. Personal Profile Details Card */}
                            <div className="bg-gradient-to-br from-white via-sky-50/25 to-blue-50/30 rounded-3xl border border-blue-100/80 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8 relative overflow-hidden">
                                <div className="flex items-center gap-3.5 mb-6">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 border border-blue-200/60 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
                                        <IconUser className="w-5 h-5" stroke={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                            Personal Profile Details
                                        </h2>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                                            Update your personal identity, contact numbers, and profile avatar.
                                        </p>
                                    </div>
                                </div>

                                {/* Avatar Upload Section */}
                                <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-sky-50/40 rounded-2xl border border-blue-100/80 mb-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 shadow-2xs">
                                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-white font-extrabold text-2xl shadow-md shrink-0 overflow-hidden ring-4 ring-white">
                                        {avatarImage ? (
                                            <img src={avatarImage} alt={displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            initial
                                        )}
                                    </div>
                                    <div className="flex-1 text-center sm:text-left space-y-2">
                                        <p className="text-sm font-black text-gray-900">Profile Picture</p>
                                        <p className="text-xs text-slate-500 font-medium">Upload a square image (PNG, JPG, or WebP) up to 5MB.</p>
                                        <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                                            <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold cursor-pointer transition-all shadow-xs shadow-orange-500/20">
                                                <IconUpload size={14} stroke={2.5} />
                                                <span>Upload Photo</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={handleImageUpload} 
                                                    className="hidden" 
                                                />
                                            </label>
                                            {avatarImage && (
                                                <button 
                                                    type="button"
                                                    onClick={handleRemoveImage}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-red-50 hover:text-red-600 text-slate-700 border border-slate-200 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                                                >
                                                    <IconTrash size={14} />
                                                    <span>Remove</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Your full name"
                                                className="w-full px-4 py-3 bg-white/95 border border-slate-200/90 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm text-slate-900 font-bold shadow-2xs hover:border-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Phone Number</label>
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="01700000000"
                                                className="w-full px-4 py-3 bg-white/95 border border-slate-200/90 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm text-slate-900 font-bold shadow-2xs hover:border-slate-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <div className="flex items-center justify-between mb-2 ml-1">
                                                <label className="text-sm font-bold text-gray-900">Email Address</label>
                                                <span className="text-[10px] font-black text-blue-700 bg-blue-100/80 border border-blue-200/60 px-2.5 py-0.5 rounded-full">Account Primary</span>
                                            </div>
                                            <input
                                                type="email"
                                                value={displayEmail}
                                                disabled
                                                className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-500 font-bold cursor-not-allowed outline-none shadow-2xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Room / Address</label>
                                            <input
                                                type="text"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="e.g. Room 204, 3rd Floor"
                                                className="w-full px-4 py-3 bg-white/95 border border-slate-200/90 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm text-slate-900 font-bold shadow-2xs hover:border-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Default Meals Configuration Card */}
                            <div className="bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30 rounded-3xl border border-orange-100/80 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8 relative">
                                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-200/60 text-orange-600 flex items-center justify-center shadow-xs shrink-0">
                                            <IconToolsKitchen2 className="w-5 h-5" stroke={2.5} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                                                    Default Meal Preferences
                                                </h2>
                                                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200/70">
                                                    Daily Routine
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium text-slate-500 mt-0.5">
                                                Automatic headcount applied to daily mess logs unless customized.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                    {/* Breakfast */}
                                    <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-yellow-50/60 border border-amber-200/80 hover:border-amber-300 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all relative group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-amber-100/90 text-amber-800 border border-amber-200/80 flex items-center justify-center shadow-2xs text-xs font-extrabold shrink-0">
                                                    🌅
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-amber-950">Breakfast</label>
                                                    <span className="text-[10px] text-amber-700/80 font-bold">Morning</span>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs ${
                                                defaultBreakfast === 0 
                                                    ? "bg-slate-100 text-slate-500 border-slate-200" 
                                                    : "bg-amber-100/90 text-amber-900 border-amber-300"
                                            }`}>
                                                {defaultBreakfast === 0 ? "Off" : `${defaultBreakfast} Meal`}
                                            </span>
                                        </div>
                                        <ModernDropdown
                                            value={defaultBreakfast}
                                            onChange={setDefaultBreakfast}
                                            options={breakfastOptions}
                                            theme="amber"
                                            placement="top"
                                            ariaLabel="Select Breakfast meal count"
                                        />
                                    </div>

                                    {/* Lunch */}
                                    <div className="bg-gradient-to-br from-orange-50/90 via-orange-50/40 to-amber-50/60 border border-orange-200/80 hover:border-orange-300 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all relative group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-orange-100/90 text-orange-800 border border-orange-200/80 flex items-center justify-center shadow-2xs text-xs font-extrabold shrink-0">
                                                    ☀️
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-orange-950">Lunch</label>
                                                    <span className="text-[10px] text-orange-700/80 font-bold">Afternoon</span>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs ${
                                                defaultLunch === 0 
                                                    ? "bg-slate-100 text-slate-500 border-slate-200" 
                                                    : "bg-orange-100/90 text-orange-900 border-orange-300"
                                            }`}>
                                                {defaultLunch === 0 ? "Off" : `${defaultLunch} Meal${defaultLunch > 1 ? "s" : ""}`}
                                            </span>
                                        </div>
                                        <ModernDropdown
                                            value={defaultLunch}
                                            onChange={setDefaultLunch}
                                            options={lunchOptions}
                                            theme="orange"
                                            placement="top"
                                            ariaLabel="Select Lunch meal count"
                                        />
                                    </div>

                                    {/* Dinner */}
                                    <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-purple-50/50 border border-indigo-200/80 hover:border-indigo-300 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all relative group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-100/90 text-indigo-800 border border-indigo-200/80 flex items-center justify-center shadow-2xs text-xs font-extrabold shrink-0">
                                                    🌙
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-wider text-indigo-950">Dinner</label>
                                                    <span className="text-[10px] text-indigo-700/80 font-bold">Night</span>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs ${
                                                defaultDinner === 0 
                                                    ? "bg-slate-100 text-slate-500 border-slate-200" 
                                                    : "bg-indigo-100/90 text-indigo-900 border-indigo-300"
                                            }`}>
                                                {defaultDinner === 0 ? "Off" : `${defaultDinner} Meal${defaultDinner > 1 ? "s" : ""}`}
                                            </span>
                                        </div>
                                        <ModernDropdown
                                            value={defaultDinner}
                                            onChange={setDefaultDinner}
                                            options={dinnerOptions}
                                            theme="indigo"
                                            placement="top"
                                            ariaLabel="Select Dinner meal count"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                        PANEL 3: SECURITY & PASSWORD
                       ═══════════════════════════════════════════ */}
                    {activeTab === "security" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* Change Password Card */}
                            <div className="bg-gradient-to-br from-white via-emerald-50/20 to-slate-50/30 rounded-3xl border border-emerald-100/70 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8">
                                <div className="flex items-center gap-3.5 mb-6">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shadow-xs shrink-0">
                                        <IconLock className="w-5 h-5" stroke={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                            Change Password
                                        </h2>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                                            Ensure your account is protected with a secure password of at least 6 characters.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Current Password</label>
                                        <div className="relative flex items-center">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Enter your current password"
                                                className="w-full pl-4 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-gray-900 font-bold"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3.5 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg cursor-pointer flex items-center justify-center"
                                                title={showCurrentPassword ? "Hide password" : "Show password"}
                                                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                            >
                                                {showCurrentPassword ? <IconEyeOff size={18} stroke={2} /> : <IconEye size={18} stroke={2} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">New Password</label>
                                            <div className="relative flex items-center">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="At least 6 characters"
                                                    className="w-full pl-4 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-gray-900 font-bold"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3.5 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg cursor-pointer flex items-center justify-center"
                                                    title={showNewPassword ? "Hide password" : "Show password"}
                                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showNewPassword ? <IconEyeOff size={18} stroke={2} /> : <IconEye size={18} stroke={2} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Confirm New Password</label>
                                            <div className="relative flex items-center">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Re-type new password"
                                                    className="w-full pl-4 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm text-gray-900 font-bold"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3.5 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg cursor-pointer flex items-center justify-center"
                                                    title={showConfirmPassword ? "Hide password" : "Show password"}
                                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showConfirmPassword ? <IconEyeOff size={18} stroke={2} /> : <IconEye size={18} stroke={2} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-100 flex items-start gap-3">
                                        <IconLock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" stroke={2} />
                                        <p className="text-xs font-semibold text-orange-950">
                                            Password must contain at least 6 characters. After saving, remember to keep your credentials confidential.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Device & Session Security Card */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                                <h2 className="text-lg font-extrabold text-gray-900 mb-1 flex items-center gap-2">
                                    <IconShieldLock className="w-5 h-5 text-blue-500" stroke={2} />
                                    Session Security & Devices
                                </h2>
                                <p className="text-xs font-medium text-gray-500 mb-6">
                                    Active authentication session details for this web browser.
                                </p>

                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                                            <IconCheck size={20} stroke={2.5} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-extrabold text-gray-900">Current Active Session</p>
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                    Online Now
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">Signed in as {displayEmail}</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => signOut({ callbackUrl: "/login" })}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors cursor-pointer w-full sm:w-auto justify-center"
                                    >
                                        <IconLogout size={16} stroke={2.5} />
                                        <span>Sign Out of Account</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                        PANEL 4: NOTIFICATIONS
                       ═══════════════════════════════════════════ */}
                    {activeTab === "notifications" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            <div className="bg-gradient-to-br from-white via-purple-50/20 to-slate-50/30 rounded-3xl border border-purple-100/70 shadow-sm hover:shadow-md transition-shadow p-6 sm:p-8">
                                <div className="flex items-center gap-3.5 mb-6">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 border border-purple-200/60 text-purple-600 flex items-center justify-center shadow-xs shrink-0">
                                        <IconBell className="w-5 h-5" stroke={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                            Notification Preferences
                                        </h2>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                                            Choose which reminders and automated alerts you receive across mess activities.
                                        </p>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    
                                    {/* 1. Daily Meal Reminder */}
                                    <div className="py-4.5 flex items-center justify-between gap-4 first:pt-0">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-extrabold text-gray-900">Daily Meal Cutoff Reminders</p>
                                            <p className="text-xs text-gray-500">
                                                Get reminded before daily meal finalization cutoffs (Lunch: 9:00 AM, Dinner: 5:00 PM).
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={notifications.dailyMealReminder}
                                            onClick={() => setNotifications({ ...notifications, dailyMealReminder: !notifications.dailyMealReminder })}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                notifications.dailyMealReminder ? "bg-[#FF6B00]" : "bg-gray-200"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    notifications.dailyMealReminder ? "translate-x-5" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* 2. Bazaar Duty Alert */}
                                    <div className="py-4.5 flex items-center justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-extrabold text-gray-900">Market Duty Alerts</p>
                                            <p className="text-xs text-gray-500">
                                                Receive early notifications when you are scheduled for daily bazaar and grocery purchases.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={notifications.bazaarDutyAlert}
                                            onClick={() => setNotifications({ ...notifications, bazaarDutyAlert: !notifications.bazaarDutyAlert })}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                notifications.bazaarDutyAlert ? "bg-[#FF6B00]" : "bg-gray-200"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    notifications.bazaarDutyAlert ? "translate-x-5" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* 3. Deposit Confirmation */}
                                    <div className="py-4.5 flex items-center justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-extrabold text-gray-900">Deposit & Payment Confirmations</p>
                                            <p className="text-xs text-gray-500">
                                                Immediate notification whenever your mess fund deposit is confirmed or approved by management.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={notifications.depositConfirmation}
                                            onClick={() => setNotifications({ ...notifications, depositConfirmation: !notifications.depositConfirmation })}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                notifications.depositConfirmation ? "bg-[#FF6B00]" : "bg-gray-200"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    notifications.depositConfirmation ? "translate-x-5" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* 4. Email Notifications */}
                                    <div className="py-4.5 flex items-center justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-extrabold text-gray-900">Monthly Email Summaries</p>
                                            <p className="text-xs text-gray-500">
                                                Send end-of-month cost breakdowns and active statements to your primary email address.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={notifications.emailNotifications}
                                            onClick={() => setNotifications({ ...notifications, emailNotifications: !notifications.emailNotifications })}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                notifications.emailNotifications ? "bg-[#FF6B00]" : "bg-gray-200"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    notifications.emailNotifications ? "translate-x-5" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* 5. In-App Sound Alerts */}
                                    <div className="py-4.5 flex items-center justify-between gap-4 last:pb-0">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-extrabold text-gray-900">In-App Sound & Chimes</p>
                                            <p className="text-xs text-gray-500">
                                                Play subtle audio alerts when new mess announcements and notices arrive in the dashboard.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={notifications.inAppAlerts}
                                            onClick={() => setNotifications({ ...notifications, inAppAlerts: !notifications.inAppAlerts })}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                notifications.inAppAlerts ? "bg-[#FF6B00]" : "bg-gray-200"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    notifications.inAppAlerts ? "translate-x-5" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>

                                </div>
                            </div>

                        </div>
                    )}

                    {/* Mobile Save Button (Visible only on < md) */}
                    <div className="md:hidden mt-6">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <IconDeviceFloppy className="w-5 h-5" stroke={2.5} />
                            )}
                            {isSaving ? "Saving Changes..." : "Save All Changes"}
                        </button>
                    </div>

                </div>
            </div>

        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="max-w-5xl mx-auto p-12 text-center text-gray-400 font-bold animate-pulse">
                Loading settings...
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}