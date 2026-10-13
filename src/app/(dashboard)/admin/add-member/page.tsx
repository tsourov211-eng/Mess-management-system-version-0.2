"use client";

import Link from "next/link";
import { FormEvent, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    IconArrowLeft, 
    IconUserPlus, 
    IconUser, 
    IconMail, 
    IconPhone, 
    IconBriefcase,
    IconShieldLock,
    IconShieldCheck,
    IconChevronDown,
    IconCheck,
    IconKey
} from "@tabler/icons-react";

interface RoleOption {
    value: string;
    label: string;
    sublabel?: string;
    badge?: string;
    badgeStyle?: string;
    icon?: React.ReactNode;
}

const roleOptions: RoleOption[] = [
    {
        value: "member",
        label: "General Member",
        sublabel: "Regular mess dining & bazaars",
        badge: "Member",
        badgeStyle: "bg-blue-100 text-blue-800 border border-blue-200/70",
        icon: <IconUser className="w-4 h-4 text-blue-500 shrink-0" stroke={2.5} />
    },
    {
        value: "manager",
        label: "Mess Manager",
        sublabel: "Meal approvals, expenses & bazars",
        badge: "Manager",
        badgeStyle: "bg-purple-100 text-purple-800 border border-purple-200/70",
        icon: <IconShieldLock className="w-4 h-4 text-purple-500 shrink-0" stroke={2.5} />
    },
    {
        value: "admin",
        label: "Administrator",
        sublabel: "Full mess & member control",
        badge: "Admin",
        badgeStyle: "bg-amber-100 text-amber-900 border border-amber-300",
        icon: <IconShieldCheck className="w-4 h-4 text-amber-600 shrink-0" stroke={2.5} />
    }
];

function RoleDropdown({
    value,
    onChange,
    options
}: {
    value: string;
    onChange: (val: string) => void;
    options: RoleOption[];
}) {
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

    const selected = options.find((o) => o.value === value) || options[0];

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-full pl-3.5 pr-4 py-3 bg-white/95 border rounded-xl text-sm font-bold text-slate-900 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none ${
                    isOpen 
                        ? "border-orange-500 ring-4 ring-orange-500/10 shadow-xs" 
                        : "border-slate-200/90 hover:border-slate-300"
                }`}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                        {selected.icon || <IconBriefcase className="w-4 h-4 text-orange-600" stroke={2.2} />}
                    </div>
                    <div className="flex flex-col text-left truncate">
                        <span className="text-sm font-bold text-slate-900 truncate leading-tight">
                            {selected.label}
                        </span>
                        {selected.sublabel && (
                            <span className="text-[11px] font-medium text-slate-400 truncate leading-tight mt-0.5">
                                {selected.sublabel}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {selected.badge && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${selected.badgeStyle || "bg-slate-100 text-slate-600"}`}>
                            {selected.badge}
                        </span>
                    )}
                    <IconChevronDown 
                        size={16} 
                        stroke={2.5} 
                        className={`transition-transform duration-200 ease-out text-slate-400 ${
                            isOpen ? "rotate-180 text-orange-500" : ""
                        }`} 
                    />
                </div>
            </button>

            {isOpen && (
                <div 
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                >
                    {options.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected 
                                        ? "bg-orange-50/90 text-orange-950 font-black border border-orange-200/80 shadow-2xs" 
                                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                                        {opt.icon}
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className="text-sm font-bold truncate leading-tight">
                                            {opt.label}
                                        </span>
                                        {opt.sublabel && (
                                            <span className="text-[11px] font-medium text-slate-500 truncate leading-tight mt-0.5">
                                                {opt.sublabel}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    {opt.badge && (
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${opt.badgeStyle || "bg-slate-100 text-slate-500"}`}>
                                            {opt.badge}
                                        </span>
                                    )}
                                    {isSelected && (
                                        <IconCheck size={16} stroke={3} className="text-orange-600" />
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

export default function AddMemberPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("member");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    role,
                    password: password || "123456"
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to add member");
            } else {
                alert("✅ Member added successfully!");
                router.push("/members-list");
            }
        } catch (err) {
            console.error("Add Member Error:", err);
            setError("Server error while adding member.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            
            {/* ─── Header Section ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#450705] tracking-tight">Add New Member</h1>
                    <p className="text-gray-500 text-sm mt-1.5 font-medium">Fill in the details to add a new member to your mess.</p>
                </div>
                <Link 
                    href="/members-list" 
                    className="flex items-center justify-center gap-2 bg-white/95 border border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-2xs transition-all w-full sm:w-auto cursor-pointer"
                >
                    <IconArrowLeft className="w-4 h-4" stroke={2.5} />
                    Back to Members
                </Link>
            </div>

            {/* ─── Form Section Card ─── */}
            <div className="bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 rounded-3xl border border-orange-100/80 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-7 md:p-8 relative">
                {error && (
                    <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold shadow-2xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Grid Layout for Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3.5 text-slate-400">
                                    <IconUser className="w-5 h-5 text-orange-500/80" stroke={2} />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Rajib Hasan"
                                    className="w-full pl-11 pr-4 py-3 bg-white/95 border border-slate-200/90 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder-slate-400 text-sm text-slate-900 font-bold shadow-2xs hover:border-slate-300"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Address */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3.5 text-slate-400">
                                    <IconMail className="w-5 h-5 text-blue-500/80" stroke={2} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. rajib@gmail.com"
                                    className="w-full pl-11 pr-4 py-3 bg-white/95 border border-slate-200/90 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder-slate-400 text-sm text-slate-900 font-bold shadow-2xs hover:border-slate-300"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">
                                Phone Number
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3.5 text-slate-400">
                                    <IconPhone className="w-5 h-5 text-emerald-500/80" stroke={2} />
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="e.g. 01700000000"
                                    className="w-full pl-11 pr-4 py-3 bg-white/95 border border-slate-200/90 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder-slate-400 text-sm text-slate-900 font-bold shadow-2xs hover:border-slate-300"
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">
                                Member Role <span className="text-red-500">*</span>
                            </label>
                            <RoleDropdown
                                value={role}
                                onChange={setRole}
                                options={roleOptions}
                            />
                        </div>

                        {/* Password (Optional, default 123456) */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-900 mb-2 ml-1 flex items-center justify-between">
                                <span>Initial Password</span>
                                <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md">Default: 123456</span>
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3.5 text-slate-400">
                                    <IconKey className="w-5 h-5 text-purple-500/80" stroke={2} />
                                </div>
                                <input
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter custom password or leave blank for 123456"
                                    className="w-full pl-11 pr-4 py-3 bg-white/95 border border-slate-200/90 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder-slate-400 text-sm text-slate-900 font-bold shadow-2xs hover:border-slate-300"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
                        <Link 
                            href="/members-list"
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-900 hover:bg-white transition-all text-center cursor-pointer border border-transparent hover:border-slate-200"
                        >
                            Cancel
                        </Link>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-7 py-2.5 rounded-xl font-black text-sm shadow-md shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <IconUserPlus className="w-5 h-5" stroke={2.5} />
                            {isSubmitting ? "Saving..." : "Save Member"}
                        </button>
                    </div>

                </form>
            </div>

        </div>
    );
}