"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
    Pencil, 
    Phone, 
    MapPin, 
    Mail, 
    Wallet, 
    Utensils, 
    Settings, 
    Sun, 
    Moon, 
    X, 
    Check 
} from "lucide-react";

export default function ProfileView() {
    const [profileData, setProfileData] = useState<any>(null);
    const [stats, setStats] = useState({ totalDeposit: 0, totalMeals: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Modal States
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isEditMealsOpen, setIsEditMealsOpen] = useState(false);

    // Form States
    const [profileForm, setProfileForm] = useState({
        name: "",
        phone: "",
        address: "",
    });

    const [mealsForm, setMealsForm] = useState({
        breakfast: 0.5,
        lunch: 1,
        dinner: 1,
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/members/profile");
            if (res.ok) {
                const data = await res.json();
                setProfileData(data.profile);
                if (data.stats) {
                    setStats(data.stats);
                }
                setProfileForm({
                    name: data.profile.name || "",
                    phone: data.profile.phone || "",
                    address: data.profile.address || "",
                });
                setMealsForm({
                    breakfast: data.profile.defaultBreakfast ?? 0.5,
                    lunch: data.profile.defaultLunch ?? 1,
                    dinner: data.profile.defaultDinner ?? 1,
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch("/api/members/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileForm),
            });

            if (res.ok) {
                setToast({ type: "success", message: "Profile details updated successfully!" });
                setIsEditProfileOpen(false);
                fetchProfile();
            } else {
                const data = await res.json();
                setToast({ type: "error", message: data.error || "Failed to update profile." });
            }
        } catch (error) {
            console.error("Save profile error:", error);
            setToast({ type: "error", message: "Server error occurred." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDefaultMeals = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch("/api/members/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    defaultBreakfast: Number(mealsForm.breakfast) || 0,
                    defaultLunch: Number(mealsForm.lunch) || 0,
                    defaultDinner: Number(mealsForm.dinner) || 0,
                }),
            });

            if (res.ok) {
                setToast({ type: "success", message: "Default meals updated successfully!" });
                setIsEditMealsOpen(false);
                fetchProfile();
            } else {
                const data = await res.json();
                setToast({ type: "error", message: data.error || "Failed to update default meals." });
            }
        } catch (error) {
            console.error("Save default meals error:", error);
            setToast({ type: "error", message: "Server error occurred." });
        } finally {
            setIsSaving(false);
        }
    };

    const userInitial = profileData?.name ? profileData.name.trim().charAt(0).toUpperCase() : "A";

    return (
        <div className="w-full pb-12 md:pb-16 animate-in fade-in duration-200">
            
            {/* Toast Notification Alert */}
            {toast && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-top-3 fade-in duration-200 ${
                    toast.type === "success" 
                        ? "bg-emerald-500 text-white border-emerald-400" 
                        : "bg-rose-500 text-white border-rose-400"
                }`}>
                    <Check size={20} strokeWidth={3} className="shrink-0" />
                    <span className="text-xs font-bold flex-1">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="text-white/80 hover:text-white cursor-pointer">
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                MOBILE VIEW: Matching myprofile.png Pixel-for-Pixel
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="md:hidden flex flex-col gap-3.5 w-full max-w-md mx-auto">
                
                {/* 1. Hero Profile Card (Main Card) */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col">
                    
                    {/* Top Abstract Wave Graphic */}
                    <div className="absolute top-0 inset-x-0 h-28 overflow-hidden pointer-events-none">
                        <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none" fill="none">
                            <defs>
                                <linearGradient id="profileWaveGrad" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.8" />
                                    <stop offset="50%" stopColor="#FDBA74" stopOpacity="0.45" />
                                    <stop offset="100%" stopColor="#FFEDD5" stopOpacity="0.25" />
                                </linearGradient>
                                <pattern id="dotsPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                                    <circle cx="2" cy="2" r="1" fill="#EA580C" fillOpacity="0.22" />
                                </pattern>
                            </defs>
                            {/* Dot grid decoration on edges */}
                            <rect width="60" height="60" fill="url(#dotsPattern)" />
                            <rect x="340" width="60" height="60" fill="url(#dotsPattern)" />
                            {/* Wave curve */}
                            <path d="M0,0 L400,0 L400,55 C320,105 230,35 150,80 C90,115 35,65 0,85 Z" fill="url(#profileWaveGrad)" />
                        </svg>
                    </div>

                    {/* "Edit Profile" Button (Top Right) */}
                    <div className="flex justify-end relative z-10">
                        <button
                            onClick={() => {
                                setProfileForm({
                                    name: profileData?.name || "",
                                    phone: profileData?.phone || "",
                                    address: profileData?.address || "",
                                });
                                setIsEditProfileOpen(true);
                            }}
                            className="bg-white/95 border border-gray-200/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xs hover:bg-gray-50 cursor-pointer active:scale-95 transition-all"
                        >
                            <Pencil size={13} strokeWidth={2.4} />
                            <span>Edit Profile</span>
                        </button>
                    </div>

                    {/* Large Centered Avatar */}
                    <div className="relative z-10 flex flex-col items-center mt-1">
                        <div className="w-24 h-24 rounded-full bg-[#0F172A] text-white font-black text-3xl flex items-center justify-center border-4 border-white shadow-md relative overflow-hidden">
                            {profileData?.image ? (
                                <Image 
                                    src={profileData.image} 
                                    alt="Avatar" 
                                    width={96} 
                                    height={96} 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <span>{userInitial}</span>
                            )}
                        </div>

                        {/* User Name & Email */}
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2.5 text-center leading-tight">
                            {isLoading ? "..." : (profileData?.name || "Admin")}
                        </h2>
                        
                        <div className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5 mt-1 leading-tight">
                            <Mail size={14} className="text-[#FF6B00]" strokeWidth={2.2} />
                            <span className="truncate">{isLoading ? "..." : (profileData?.email || "ourmess001@gmail.com")}</span>
                        </div>
                    </div>

                    {/* Contact Details Stack Inside Hero Card */}
                    <div className="mt-4 space-y-2.5 relative z-10">
                        
                        {/* Phone Number Capsule */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 shadow-2xs">
                            <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] text-[#FF6B00] flex items-center justify-center shrink-0 shadow-2xs">
                                <Phone size={18} strokeWidth={2.3} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-none">
                                    PHONE NUMBER
                                </p>
                                <p className="font-black text-sm sm:text-base text-slate-900 leading-tight mt-1 truncate">
                                    {isLoading ? "..." : (profileData?.phone || "01729326783")}
                                </p>
                            </div>
                        </div>

                        {/* Address Capsule */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 shadow-2xs">
                            <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] text-[#FF6B00] flex items-center justify-center shrink-0 shadow-2xs">
                                <MapPin size={18} strokeWidth={2.3} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-none">
                                    ADDRESS
                                </p>
                                <p className="font-black text-sm sm:text-base text-slate-900 leading-tight mt-1 truncate">
                                    {isLoading ? "..." : (profileData?.address || "dhaka")}
                                </p>
                            </div>
                        </div>

                    </div>

                </div>

                {/* 2. Personal Financial & Meal Summary (2-Column Row) */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    
                    {/* Total Deposit Card */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0 shadow-2xs">
                            <Wallet size={20} strokeWidth={2.3} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-none">
                                TOTAL DEPOSIT
                            </p>
                            <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight mt-1 truncate">
                                Tk {isLoading ? "..." : Number(stats.totalDeposit || 0).toLocaleString()}
                            </h3>
                        </div>
                    </div>

                    {/* Total Meals Card */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] text-[#10B981] flex items-center justify-center shrink-0 shadow-2xs">
                            <Utensils size={20} strokeWidth={2.3} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-none">
                                TOTAL MEALS
                            </p>
                            <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight mt-1">
                                {isLoading ? "..." : Number(stats.totalMeals || 0)}
                            </h3>
                        </div>
                    </div>

                </div>

                {/* 3. "Default Meal Setup" Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col">
                    
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#FFF7ED] text-[#FF6B00] flex items-center justify-center shrink-0 shadow-2xs">
                            <Settings size={22} strokeWidth={2.3} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base sm:text-[17px] font-black text-slate-900 leading-tight">
                                Default Meal Setup
                            </h3>
                            <p className="text-xs font-semibold text-slate-400 leading-snug mt-0.5">
                                This standard meal count will be automatically applied every day.
                            </p>
                        </div>
                    </div>

                    {/* "Edit Default" Button */}
                    <button
                        onClick={() => {
                            setMealsForm({
                                breakfast: profileData?.defaultBreakfast ?? 0.5,
                                lunch: profileData?.defaultLunch ?? 1,
                                dinner: profileData?.defaultDinner ?? 1,
                            });
                            setIsEditMealsOpen(true);
                        }}
                        className="bg-[#FFF7ED] border border-orange-200/60 text-[#EA580C] text-xs font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 w-fit mt-3 mb-3.5 hover:bg-orange-100/60 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                    >
                        <Pencil size={13} strokeWidth={2.4} />
                        <span>Edit Default</span>
                    </button>

                    {/* 3 Meal Counter Tiles */}
                    <div className="grid grid-cols-3 gap-2.5">
                        
                        {/* Breakfast Tile */}
                        <div className="bg-[#FFFBEB]/70 border border-amber-200/50 rounded-2xl p-2.5 sm:p-3 text-center flex flex-col items-center justify-center shadow-2xs">
                            <Sun size={20} className="text-[#F59E0B]" strokeWidth={2.4} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 leading-tight">
                                BREAKFAST
                            </span>
                            <span className="font-black text-lg sm:text-xl text-slate-900 mt-0.5 leading-tight">
                                {isLoading ? "..." : (profileData?.defaultBreakfast ?? 0.5)}
                            </span>
                        </div>

                        {/* Lunch Tile */}
                        <div className="bg-[#EFF6FF]/70 border border-blue-200/50 rounded-2xl p-2.5 sm:p-3 text-center flex flex-col items-center justify-center shadow-2xs">
                            <Utensils size={20} className="text-[#3B82F6]" strokeWidth={2.4} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 leading-tight">
                                LUNCH
                            </span>
                            <span className="font-black text-lg sm:text-xl text-slate-900 mt-0.5 leading-tight">
                                {isLoading ? "..." : (profileData?.defaultLunch ?? 1)}
                            </span>
                        </div>

                        {/* Dinner Tile */}
                        <div className="bg-[#FAF5FF]/70 border border-purple-200/50 rounded-2xl p-2.5 sm:p-3 text-center flex flex-col items-center justify-center shadow-2xs">
                            <Moon size={20} className="text-[#8B5CF6]" strokeWidth={2.4} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 leading-tight">
                                DINNER
                            </span>
                            <span className="font-black text-lg sm:text-xl text-slate-900 mt-0.5 leading-tight">
                                {isLoading ? "..." : (profileData?.defaultDinner ?? 1)}
                            </span>
                        </div>

                    </div>

                </div>

            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                DESKTOP VIEW: Spacious Responsive Layout
               ═══════════════════════════════════════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════════════════
                DESKTOP VIEW: Spacious Responsive Layout
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="hidden md:block max-w-5xl mx-auto space-y-6">
                
                {/* Hero Profile Card (Desktop) */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-8 relative overflow-hidden hover:shadow-md transition-shadow">
                    {/* Bottom wave decoration */}
                    <svg className="absolute -bottom-2 -right-2 w-72 h-36 pointer-events-none opacity-15 text-orange-500" viewBox="0 0 200 80" fill="currentColor">
                        <path d="M0,60 C50,20 120,70 200,30 L200,80 L0,80 Z" />
                    </svg>

                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-[#0F172A] text-white font-black text-4xl flex items-center justify-center shadow-md border-4 border-white">
                                {profileData?.image ? (
                                    <Image src={profileData.image} alt="Avatar" width={96} height={96} className="w-full h-full rounded-2xl object-cover" />
                                ) : (
                                    <span>{userInitial}</span>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-black text-slate-900">{profileData?.name || "Member Name"}</h1>
                                <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
                                    <Mail size={16} className="text-[#FF6B00]" /> {profileData?.email}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setProfileForm({
                                    name: profileData?.name || "",
                                    phone: profileData?.phone || "",
                                    address: profileData?.address || "",
                                });
                                setIsEditProfileOpen(true);
                            }}
                            className="bg-[#FFF7ED] border border-orange-200 text-[#EA580C] text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-orange-100/70 transition-colors cursor-pointer shadow-2xs"
                        >
                            <Pencil size={15} /> Edit Profile
                        </button>
                    </div>

                    {/* Contact Details Stack */}
                    <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                        <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-[#FFF7ED] text-[#FF6B00] flex items-center justify-center shrink-0 shadow-2xs">
                                <Phone size={20} strokeWidth={2.2} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Phone Number</p>
                                <p className="text-base font-black text-slate-900 mt-0.5">{profileData?.phone || "Not set"}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-[#FFF7ED] text-[#FF6B00] flex items-center justify-center shrink-0 shadow-2xs">
                                <MapPin size={20} strokeWidth={2.2} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Address</p>
                                <p className="text-base font-black text-slate-900 mt-0.5">{profileData?.address || "Not set"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Summary & Default Meals (Desktop 3-Column Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Deposit */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <Wallet size={24} strokeWidth={2.2} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Deposit</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-0.5">Tk {Number(stats.totalDeposit || 0).toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Total Meals */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <Utensils size={24} strokeWidth={2.2} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Meals</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{Number(stats.totalMeals || 0)}</h3>
                        </div>
                    </div>

                    {/* Default Meals */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Default Meals</span>
                            <button
                                onClick={() => {
                                    setMealsForm({
                                        breakfast: profileData?.defaultBreakfast ?? 0.5,
                                        lunch: profileData?.defaultLunch ?? 1,
                                        dinner: profileData?.defaultDinner ?? 1,
                                    });
                                    setIsEditMealsOpen(true);
                                }}
                                className="text-xs font-bold text-[#EA580C] hover:underline cursor-pointer flex items-center gap-1"
                            >
                                <Pencil size={12} />
                                <span>Edit</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                            <div className="bg-amber-50/70 border border-amber-200/50 rounded-xl p-2">
                                <span className="block text-[9px] font-bold text-amber-700 uppercase">Breakfast</span>
                                <span className="text-base font-black text-slate-900">{profileData?.defaultBreakfast ?? 0.5}</span>
                            </div>
                            <div className="bg-blue-50/70 border border-blue-200/50 rounded-xl p-2">
                                <span className="block text-[9px] font-bold text-blue-700 uppercase">Lunch</span>
                                <span className="text-base font-black text-slate-900">{profileData?.defaultLunch ?? 1}</span>
                            </div>
                            <div className="bg-purple-50/70 border border-purple-200/50 rounded-xl p-2">
                                <span className="block text-[9px] font-bold text-purple-700 uppercase">Dinner</span>
                                <span className="text-base font-black text-slate-900">{profileData?.defaultDinner ?? 1}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                MODAL 1: Edit Profile (Full Name, Phone, Address)
               ═══════════════════════════════════════════════════════════════════ */}
            {isEditProfileOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsEditProfileOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <h3 className="text-base font-black text-slate-900">Edit Profile</h3>
                            <button 
                                onClick={() => setIsEditProfileOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                <input 
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    required
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                                <input 
                                    type="text"
                                    value={profileForm.phone}
                                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                    placeholder="e.g. 01729326783"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                                <input 
                                    type="text"
                                    value={profileForm.address}
                                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                    placeholder="e.g. Dhaka"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditProfileOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#F97316] text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-60"
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                MODAL 2: Edit Default Meals (Breakfast, Lunch, Dinner)
               ═══════════════════════════════════════════════════════════════════ */}
            {isEditMealsOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsEditMealsOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <h3 className="text-base font-black text-slate-900">Default Meal Setup</h3>
                            <button 
                                onClick={() => setIsEditMealsOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDefaultMeals} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Breakfast Count</label>
                                <input 
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="10"
                                    value={mealsForm.breakfast}
                                    onChange={(e) => setMealsForm({ ...mealsForm, breakfast: Number(e.target.value) })}
                                    required
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all text-center"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Lunch Count</label>
                                <input 
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="10"
                                    value={mealsForm.lunch}
                                    onChange={(e) => setMealsForm({ ...mealsForm, lunch: Number(e.target.value) })}
                                    required
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all text-center"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Dinner Count</label>
                                <input 
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="10"
                                    value={mealsForm.dinner}
                                    onChange={(e) => setMealsForm({ ...mealsForm, dinner: Number(e.target.value) })}
                                    required
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all text-center"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditMealsOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#F97316] text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-60"
                                >
                                    {isSaving ? "Saving..." : "Save Defaults"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}