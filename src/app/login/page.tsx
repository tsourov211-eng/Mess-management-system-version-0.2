"use client";

import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IconBrandGoogle, IconMail, IconLock, IconEye, IconEyeOff, IconLogin } from "@tabler/icons-react";

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const oauthError = params.get("error");
            if (oauthError) {
                if (oauthError === "OAuthCallback" || oauthError === "OAuthSignin") {
                    return "Google Sign-In session expired or failed. Please click 'Continue with Google' again.";
                } else if (oauthError === "OAuthAccountNotLinked") {
                    return "An account with this email already exists under another sign-in method.";
                } else if (oauthError === "PendingApproval") {
                    return "Your account is pending admin approval! Please wait for the admin to approve.";
                } else if (oauthError === "Suspended") {
                    return "Your account has been suspended! Please contact the admin.";
                } else if (oauthError === "AccessDenied") {
                    return "Access denied. You are not authorized to sign in.";
                } else {
                    return `Sign-in error: ${oauthError}`;
                }
            }
        }
        return "";
    });

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError(res.error === "CredentialsSignin" ? "Invalid email or password!" : res.error);
            } else {
                const session = await getSession();
                const userRole = (session?.user as { role?: string })?.role;

                if (userRole === "admin") {
                    router.push("/admin");
                } else if (userRole === "manager") {
                    router.push("/manager");
                } else {
                    router.push("/member");
                }
            }
        } catch (err) {
            console.log(err);
        }
    };

    return (
        // Replaced min-h-screen with min-h-[100dvh] for perfect centering on mobile
        <div className="min-h-[100dvh] w-full bg-[url('/login-bg-mobile.png')] lg:bg-[url('/login-bg.png')] bg-cover bg-center bg-no-repeat flex items-center justify-center lg:justify-end px-4 sm:px-6 lg:pr-[18%] xl:pr-[22%] relative py-6 lg:py-0">

            {/* Overlay to highlight the card */}
            <div className="absolute inset-0 bg-black/10 sm:bg-black/5"></div>

            {/* Main container */}
            <div className="w-full max-w-md flex flex-col items-center relative z-10">
                
                {/* ─── Mobile View Header (Logo and Text - gap reduced) ─── */}
                <div className="lg:hidden flex flex-col items-center text-center mb-5 sm:mb-6">
                    <Link href="/" className="flex items-center justify-center mb-2 transition-transform hover:scale-105">
                        <Image
                            src="/logo.png"
                            alt="Amader Mess Logo"
                            width={180} 
                            height={180}
                            priority
                            className="w-28 sm:w-32 h-auto object-contain drop-shadow-md"
                        />
                    </Link>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#5e2818] leading-tight drop-shadow-sm mb-6">
                        Good Food <br />
                        Brighter Days
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base mt-1.5 font-bold ">
                        Sign in to manage your mess with ease
                    </p>
                </div>

                {/* ─── Login Card (Glassmorphism Effect) ─── */}
                <div className="bg-white/30 backdrop-blur-xl w-full rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] p-6 sm:p-8 border border-white/50">
                    
                    {/* ─── Desktop View Title ─── */}
                    <div className="hidden lg:block text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-[#5e2818] tracking-tight drop-shadow-sm mb-6">
                            Welcome Back
                        </h2>
                        <p className="text-gray-600 text-sm sm:text-base font-bold mt-2 drop-shadow-sm">
                            Sign in to your Amader Mess account
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 backdrop-blur-md text-red-700 p-3 rounded-xl text-sm font-bold mb-5 text-center border border-red-500/30">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2.5 ml-1 drop-shadow-sm">
                                Email Address
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-1.5 w-10 h-10 bg-white/50 rounded-lg flex items-center justify-center shadow-sm">
                                    <IconMail className="h-5 w-5 text-orange-600" stroke={2} />
                                </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@gmail.com"
                                        className="w-full pl-14 pr-4 py-3 sm:py-3.5 bg-white/40 border border-white/50 rounded-xl outline-none focus:bg-white/60 focus:ring-2 focus:ring-orange-400 transition-all placeholder-gray-400 text-base text-gray-900 font-normal shadow-inner [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827]"
                                        required
                                    />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5 ml-1 drop-shadow-sm">
                                Password
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-1.5 w-10 h-10 bg-white/50 rounded-lg flex items-center justify-center shadow-sm">
                                    <IconLock className="h-5 w-5 text-orange-600" stroke={2} />
                                </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-14 pr-12 py-3 sm:py-3.5 bg-white/40 border border-white/50 rounded-xl outline-none focus:bg-white/60 focus:ring-2 focus:ring-orange-400 transition-all placeholder-gray-400 text-base text-gray-900 font-normal shadow-inner [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827]"
                                        required
                                    />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-700 hover:text-orange-600 transition-colors">
                                    {showPassword ? <IconEyeOff className="h-5 w-5" stroke={2} /> : <IconEye className="h-5 w-5" stroke={2} />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex justify-end pt-1">
                            <Link href="/forgot-password" className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors drop-shadow-sm">
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            className="w-full py-3.5 mt-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 transition-all duration-300 tracking-wide cursor-pointer"
                        >
                            <IconLogin className="w-5 h-5" stroke={2.5} />
                            Sign In
                        </button>
                    </form>

                    {/* OR Divider */}
                    <div className="my-5 flex items-center gap-4">
                        <div className="h-px bg-gray-400/30 flex-1"></div>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-widest drop-shadow-sm">Or</span>
                        <div className="h-px bg-gray-400/30 flex-1"></div>
                    </div>

                    {/* Google Sign In Button */}
                    <button
                        type="button"
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="w-full py-3.5 flex items-center justify-center gap-3 bg-white/40 backdrop-blur-sm border border-white/50 text-gray-900 text-base font-bold rounded-xl shadow-sm hover:bg-white/60 transition-all duration-300 cursor-pointer"
                    >
                        <IconBrandGoogle className="w-6 h-6 text-orange-600" stroke={1.5} />
                        Continue with Google
                    </button>

                    {/* Create Account Link */}
                    <div className="mt-6 text-center text-sm font-bold text-gray-800 drop-shadow-sm">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-orange-600 font-extrabold hover:text-orange-700 transition-colors">
                            Create New Account
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}