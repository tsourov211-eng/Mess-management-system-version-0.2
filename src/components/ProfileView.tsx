"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
    IconToolsKitchen2, 
    IconWallet, 
    IconEdit, 
    IconCheck, 
    IconX,
    IconPhone,
    IconMapPin,
    IconMail,
    IconUser
} from "@tabler/icons-react";

export default function ProfileView() {
    const [profileData, setProfileData] = useState<any>(null);
    const [stats, setStats] = useState({ totalDeposit: 0, totalMeals: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Edit States
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [isEditingMeals, setIsEditingMeals] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        name: "", phone: "", address: "",
        defaultBreakfast: 0.5, defaultLunch: 1, defaultDinner: 1
    });

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/members/profile");
            if (res.ok) {
                const data = await res.json();
                setProfileData(data.profile);
                setStats(data.stats);
                setFormData({
                    name: data.profile.name || "",
                    phone: data.profile.phone || "",
                    address: data.profile.address || "",
                    defaultBreakfast: data.profile.defaultBreakfast ?? 0.5,
                    defaultLunch: data.profile.defaultLunch ?? 1,
                    defaultDinner: data.profile.defaultDinner ?? 1
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/members/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert("✅ Profile updated successfully!");
                setIsEditingInfo(false);
                setIsEditingMeals(false);
                fetchProfile(); // Refresh data
            } else {
                alert("❌ Failed to update profile.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-[60vh] font-bold text-gray-400">Loading Profile Data...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-10">
            
            {/* ─── Premium Profile Card ─── */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative">
                
                {/* Cover Photo Area */}
                <div className="h-32 sm:h-40 bg-gradient-to-r from-[#FF6B00]/10 to-orange-50 w-full relative">
                    <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10 mix-blend-multiply"></div>
                </div>

                <div className="px-6 sm:px-10 pb-8 relative">
                    
                    {/* Action Buttons */}
                    <div className="absolute top-4 right-6 sm:right-10 flex gap-2">
                        {!isEditingInfo ? (
                            <button onClick={() => setIsEditingInfo(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-white hover:text-[#FF6B00] hover:bg-orange-50 border border-gray-200 rounded-xl transition-all shadow-sm">
                                <IconEdit size={18} stroke={2.5} /> Edit Profile
                            </button>
                        ) : (
                            <>
                                <button onClick={() => setIsEditingInfo(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-600 bg-white hover:text-red-500 hover:bg-red-50 border border-gray-200 rounded-xl transition-all shadow-sm">
                                    <IconX size={18} stroke={2.5} /> Cancel
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#FF6B00] hover:bg-orange-600 rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50">
                                    <IconCheck size={18} stroke={2.5} /> {isSaving ? "Saving..." : "Save"}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Avatar & Basic Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 -mt-16 sm:-mt-20 mb-8">
                        <div className="relative p-1.5 bg-white rounded-full shadow-md">
                            {profileData?.image ? (
                                <Image src={profileData.image} alt="Profile" width={120} height={120} className="rounded-full w-24 h-24 sm:w-32 sm:h-32 object-cover border-4 border-orange-50" />
                            ) : (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white font-extrabold text-4xl sm:text-5xl shadow-inner border-4 border-white">
                                    {formData.name.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                        </div>
                        <div className="text-center sm:text-left mb-2">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B]">{profileData?.name || "Member Name"}</h1>
                            <p className="text-sm font-bold text-gray-500 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                                <IconMail size={16} className="text-orange-400" /> {profileData?.email}
                            </p>
                        </div>
                    </div>

                    {/* Editable Form / Display Info */}
                    <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5 sm:p-6">
                        {!isEditingInfo ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                        <IconPhone size={20} stroke={2} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Phone Number</p>
                                        <p className="text-sm font-bold text-gray-800">{profileData?.phone || <span className="text-gray-400 italic font-medium">Not added yet</span>}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                        <IconMapPin size={20} stroke={2} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Address</p>
                                        <p className="text-sm font-bold text-gray-800">{profileData?.address || <span className="text-gray-400 italic font-medium">Not added yet</span>}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2">
                                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-gray-500 uppercase mb-2">
                                        <IconUser size={16} className="text-orange-500" /> Display Name
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Tanvir Sourov" 
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder:text-gray-400 placeholder:font-medium shadow-sm transition-all" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-gray-500 uppercase mb-2">
                                        <IconPhone size={16} className="text-orange-500" /> Phone Number
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.phone} 
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                        placeholder="e.g. 017XXXXXXXX" 
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder:text-gray-400 placeholder:font-medium shadow-sm transition-all" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-gray-500 uppercase mb-2">
                                        <IconMapPin size={16} className="text-orange-500" /> Address
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.address} 
                                        onChange={(e) => setFormData({...formData, address: e.target.value})} 
                                        placeholder="e.g. Mirpur, Dhaka" 
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder:text-gray-400 placeholder:font-medium shadow-sm transition-all" 
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ─── Financial & Meal Stats ─── */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <IconWallet size={28} stroke={2} />
                        </div>
                        <div>
                            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1">Total Deposit</p>
                            <p className="text-2xl font-extrabold text-gray-900">Tk {stats.totalDeposit}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            <IconToolsKitchen2 size={28} stroke={2} />
                        </div>
                        <div>
                            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1">Total Meals</p>
                            <p className="text-2xl font-extrabold text-gray-900">{stats.totalMeals}</p>
                        </div>
                    </div>
                </div>

                {/* ─── Default Meal Configuration ─── */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col justify-center">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div>
                            <h3 className="text-lg font-extrabold text-gray-900">Default Meal Setup</h3>
                            <p className="text-sm font-medium text-gray-500 mt-1">This standard meal count will be automatically applied every day.</p>
                        </div>
                        {!isEditingMeals ? (
                            <button onClick={() => setIsEditingMeals(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 hover:text-orange-600 hover:bg-orange-50 border border-gray-200 rounded-xl transition-all shadow-sm shrink-0">
                                <IconEdit size={18} stroke={2.5} /> Edit Default
                            </button>
                        ) : (
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => setIsEditingMeals(false)} className="px-3 py-2 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#FF6B00] hover:bg-orange-600 rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50">
                                    <IconCheck size={18} stroke={2.5} /> Save
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className={`p-5 rounded-2xl text-center border transition-all ${isEditingMeals ? 'bg-orange-50/50 border-orange-200 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                            <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Breakfast</p>
                            {!isEditingMeals ? (
                                <p className="text-3xl font-extrabold text-gray-900">{profileData?.defaultBreakfast}</p>
                            ) : (
                                <input type="number" step="0.5" min="0" value={formData.defaultBreakfast} onChange={(e) => setFormData({...formData, defaultBreakfast: Number(e.target.value)})} className="w-full max-w-[80px] mx-auto text-center py-2 bg-white border border-orange-200 rounded-xl text-lg font-extrabold text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 shadow-inner" />
                            )}
                        </div>
                        <div className={`p-5 rounded-2xl text-center border transition-all ${isEditingMeals ? 'bg-orange-50/50 border-orange-200 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                            <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Lunch</p>
                            {!isEditingMeals ? (
                                <p className="text-3xl font-extrabold text-gray-900">{profileData?.defaultLunch}</p>
                            ) : (
                                <input type="number" step="0.5" min="0" value={formData.defaultLunch} onChange={(e) => setFormData({...formData, defaultLunch: Number(e.target.value)})} className="w-full max-w-[80px] mx-auto text-center py-2 bg-white border border-orange-200 rounded-xl text-lg font-extrabold text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 shadow-inner" />
                            )}
                        </div>
                        <div className={`p-5 rounded-2xl text-center border transition-all ${isEditingMeals ? 'bg-orange-50/50 border-orange-200 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                            <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Dinner</p>
                            {!isEditingMeals ? (
                                <p className="text-3xl font-extrabold text-gray-900">{profileData?.defaultDinner}</p>
                            ) : (
                                <input type="number" step="0.5" min="0" value={formData.defaultDinner} onChange={(e) => setFormData({...formData, defaultDinner: Number(e.target.value)})} className="w-full max-w-[80px] mx-auto text-center py-2 bg-white border border-orange-200 rounded-xl text-lg font-extrabold text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 shadow-inner" />
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}