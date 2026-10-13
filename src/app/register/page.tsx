"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
    IconMail, 
    IconLock, 
    IconEye,
    IconEyeOff, 
    IconUserPlus,
    IconUser,
    IconPhone,
    IconRefresh,
    IconUsersGroup
} from "@tabler/icons-react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const router = useRouter();

    const handleReset = () => {
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");https://127.0.0.1:50262/static/artifacts/4528a56f-6948-42b6-abbf-44c8e2f3b448/.user_uploaded/media_1791706607390.png?csrf=65b9c87c-3034-4b02-81aa-d616f705aa56
        setConfirmPassword("");
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Registration failed!");
            } else {
                setSuccess(data.message || "Registration successful! Awaiting admin approval.");
                setTimeout(() => {
                    setIsExiting(true);
                }, 1500);
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            }
        } catch (err) {
            console.error("Register Error:", err);
            setError("Server error! Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`min-h-screen w-full bg-[url('/registration-bg.png')] bg-cover bg-center bg-no-repeat relative overflow-hidden flex items-center transition-all duration-500 ${isExiting ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>
            
            {/* Overlay for better readability if needed */}
            <div className="absolute inset-0 bg-black/5"></div>

            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10 p-4 sm:p-6 lg:p-12">
                
                {/* Empty div for left-side background content spacing */}
                <div className="hidden lg:block"></div>

                {/* ─── Right Side: Registration Card ─── */}
                <div className="w-full max-w-lg mx-auto lg:ml-auto">
                    <div className="bg-white/30 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] p-6 sm:p-8 border border-white/50 relative overflow-hidden">
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/50 flex items-center justify-center text-orange-600 shrink-0 shadow-sm">
                                <IconUserPlus size={28} stroke={2} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-extrabold text-[#5e2818] drop-shadow-sm">Join as New Member</h2>
                                <p className="text-sm font-bold text-gray-600 mt-1 drop-shadow-sm">Create your account and join your mess community</p>
                            </div>
                        </div>

                        {/* Fixed Toast Messages */}
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-sm px-4">
                            {error && (
                                <div className="bg-white text-red-600 p-4 rounded-2xl text-sm font-extrabold border-2 border-red-100 flex items-center gap-3 shadow-2xl transition-all">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">❌</div>
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-white text-emerald-600 p-4 rounded-2xl text-sm font-extrabold border-2 border-emerald-100 flex items-center gap-3 shadow-2xl transition-all">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">✅</div>
                                    {success}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2.5 ml-1 drop-shadow-sm">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-1.5 w-10 h-10 bg-white/50 rounded-lg flex items-center justify-center shadow-sm">
                                        <IconUser className="h-5 w-5 text-orange-600" stroke={2} />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Tanvir Sourov"
                                        className="w-full pl-14 pr-4 py-3 sm:py-3.5 bg-white/40 border border-white/50 rounded-xl outline-none focus:bg-white/60 focus:ring-2 focus:ring-orange-400 transition-all placeholder-gray-400 text-base text-gray-900 font-normal shadow-inner [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827]"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2.5 ml-1 drop-shadow-sm">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-1.5 w-10 h-10 bg-white/50 rounded-lg flex items-center justify-center shadow-sm">
                                        <IconMail className="h-5 w-5 text-orange-600" stroke={2} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="e.g. tanvir@gmail.com"
                                        className="w-full pl-14 pr-4 py-3 sm:py-3.5 bg-white/40 border border-white/50 rounded-xl outline-none focus:bg-white/60 focus:ring-2 focus:ring-orange-400 transition-all placeholder-gray-400 text-base text-gray-900 font-normal shadow-inner [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827]"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2.5 ml-1 drop-shadow-sm">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-1.5 w-10 h-10 bg-white/50 rounded-lg flex items-center justify-center shadow-sm">
                                        <IconPhone className="h-5 w-5 text-orange-600" stroke={2} />
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="e.g. 01903626256"
                                        className="w-full pl-14 pr-4 py-3 sm:py-3.5 bg-white/40 border border-white/50 rounded-xl outline-none focus:bg-white/60 focus:ring-2 focus:ring-orange-400 transition-all placeholder-gray-400 text-base text-gray-900 font-normal shadow-inner [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827]"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2.5 ml-1 drop-shadow-sm">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-1.5 w-10 h-10 bg-white/50 rounded-lg flex items-center justify-center shadow-sm">
                                        <IconLock className="h-5 w-5 text-orange-600" stroke={2} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Create a password"
                                        className="w-full pl-14 pr-12 py-3 sm:py-3.5 bg-white/40 border border-white/50 rounded-xl outline-none focus:bg-white/60 focus:ring-2 focus:ring-orange-400 transition-all placeholder-gray-400 text-base text-gray-900 font-normal shadow-inner [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827]"
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-700 hover:text-orange-600 transition-colors"
                                    >
                                        {showPassword ? <IconEyeOff className="h-5 w-5" stroke={2} /> : <IconEye className="h-5 w-5" stroke={2} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2.5 ml-1 drop-shadow-sm">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-1.5 w-10 h-10 bg-white/50 rounded-lg flex items-center justify-center shadow-sm">
                                        <IconLock className="h-5 w-5 text-orange-600" stroke={2} />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
                                        className="w-full pl-14 pr-12 py-3 sm:py-3.5 bg-white/40 border border-white/50 rounded-xl outline-none focus:bg-white/60 focus:ring-2 focus:ring-orange-400 transition-all placeholder-gray-400 text-base text-gray-900 font-normal shadow-inner [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827]"
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-700 hover:text-orange-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <IconEyeOff className="h-5 w-5" stroke={2} /> : <IconEye className="h-5 w-5" stroke={2} />}
                                    </button>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex-1 sm:flex-[0.4] py-3.5 flex items-center justify-center gap-2 bg-white/40 backdrop-blur-sm hover:bg-white/60 text-gray-900 text-sm font-bold rounded-xl transition-all border border-white/50 shadow-sm"
                                >
                                    <IconRefresh size={18} stroke={2.5} />
                                    Reset
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3.5 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 transition-all duration-300 tracking-wide cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    <IconUserPlus size={20} stroke={2.5} />
                                    {isSubmitting ? "Registering..." : "Register"}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 pt-5 border-t border-white/30 flex items-center justify-center gap-3 text-xs font-bold text-gray-700 uppercase tracking-widest drop-shadow-sm">
                            <IconUsersGroup size={16} />
                            <span>Good People</span>
                            <span>•</span>
                            <span>Good Food</span>
                            <span>•</span>
                            <span>Better Days</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}