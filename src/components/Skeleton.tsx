"use client";

import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    variant?: "default" | "dark" | "glass" | "text" | "circular";
    rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
}

/**
 * Modern Base Skeleton Component
 * Combines Tailwind pulse with a silky smooth CSS shimmer sweep.
 */
export function Skeleton({
    className = "",
    variant = "default",
    rounded = "xl",
    ...props
}: SkeletonProps) {
    const roundedClasses: Record<string, string> = {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        "3xl": "rounded-3xl",
        full: "rounded-full",
    };

    const variantClasses: Record<string, string> = {
        default: "bg-slate-200/70 dark:bg-slate-800/60 animate-shimmer",
        dark: "bg-slate-800/80 animate-shimmer-dark",
        glass: "bg-white/30 backdrop-blur-xs animate-shimmer",
        text: "bg-slate-200/70 h-4 w-full animate-shimmer",
        circular: "bg-slate-200/70 rounded-full animate-shimmer",
    };

    return (
        <div
            role="status"
            aria-busy="true"
            aria-label="Loading..."
            className={`animate-pulse ${roundedClasses[rounded] || "rounded-xl"} ${
                variantClasses[variant] || variantClasses.default
            } ${className}`}
            {...props}
        />
    );
}

/**
 * Metric Stat Card Skeleton
 * Matches the aesthetic of top metric cards on dashboard and report pages.
 */
export function StatCardSkeleton({ dark = false }: { dark?: boolean }) {
    if (dark) {
        return (
            <div className="bg-gradient-to-b from-slate-950 via-[#0B132B] to-slate-950 rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg border border-slate-800 flex flex-col justify-between min-h-[126px] sm:min-h-[140px] md:min-h-[160px] relative overflow-hidden animate-pulse animate-shimmer-dark">
                <div className="flex items-center justify-between">
                    <Skeleton variant="dark" className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-slate-800/90" />
                    <Skeleton variant="dark" className="w-16 h-5 rounded-full bg-slate-800/70" />
                </div>
                <div className="mt-3 space-y-2">
                    <Skeleton variant="dark" className="h-3 w-16 bg-slate-800/70 rounded-md" />
                    <Skeleton variant="dark" className="h-7 md:h-8 w-28 bg-slate-700/80 rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[126px] sm:min-h-[140px] md:min-h-[160px] relative overflow-hidden">
            <div className="flex items-center justify-between">
                <Skeleton className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-slate-100" />
                <Skeleton className="w-12 h-4 rounded-full bg-slate-100" />
            </div>
            <div className="mt-3 space-y-2">
                <Skeleton className="h-3 w-20 bg-slate-100 rounded-md" />
                <Skeleton className="h-7 md:h-8 w-32 bg-slate-200/90 rounded-lg" />
            </div>
        </div>
    );
}

/**
 * List Item Skeleton
 * For Notices, Requests, Bazaar schedules, and Activity rows.
 */
export function ListItemSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-2.5">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white/80 rounded-2xl border border-gray-100/90 shadow-2xs gap-3"
                >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Skeleton className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <Skeleton
                                className={`h-3.5 rounded-md ${
                                    i % 2 === 0 ? "w-3/4 max-w-[200px]" : "w-1/2 max-w-[150px]"
                                }`}
                            />
                            <Skeleton className="h-2.5 w-1/3 max-w-[100px] rounded-md bg-slate-100" />
                        </div>
                    </div>
                    <Skeleton className="w-16 h-7 rounded-xl shrink-0 bg-slate-100" />
                </div>
            ))}
        </div>
    );
}

/**
 * Data Table Skeleton
 * Used in bazaar histories, expenses, payments, guest meals, member meal matrix.
 */
export function TableSkeleton({
    rows = 5,
    cols = 5,
    showHeader = true,
}: {
    rows?: number;
    cols?: number;
    showHeader?: boolean;
}) {
    return (
        <div className="w-full bg-white rounded-2xl border border-gray-100/90 overflow-hidden shadow-2xs">
            {showHeader && (
                <div className="bg-slate-50/80 px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4">
                    {Array.from({ length: cols }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className={`h-3 rounded-md bg-slate-200/80 ${
                                i === 0 ? "w-24" : i === cols - 1 ? "w-16 ml-auto" : "w-20"
                            }`}
                        />
                    ))}
                </div>
            )}
            <div className="divide-y divide-gray-100/80">
                {Array.from({ length: rows }).map((_, r) => (
                    <div
                        key={r}
                        className="px-4 py-3.5 flex items-center justify-between gap-4"
                    >
                        {Array.from({ length: cols }).map((_, c) => (
                            <Skeleton
                                key={c}
                                className={`h-3.5 rounded-md ${
                                    c === 0
                                        ? "w-28 bg-slate-200/90"
                                        : c === cols - 1
                                        ? "w-14 rounded-full ml-auto bg-slate-100"
                                        : "w-16 bg-slate-100"
                                }`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Member Grid Card Skeleton
 * For 3-column member cards on Admin, Manager, and Members Directory.
 */
export function MemberCardSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100/90 p-5 shadow-2xs flex flex-col justify-between space-y-4"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Skeleton className="w-11 h-11 rounded-2xl bg-slate-100 shrink-0" />
                            <div className="space-y-1.5 flex-1 min-w-0">
                                <Skeleton className="h-4 w-3/4 rounded-md" />
                                <Skeleton className="h-3 w-1/2 rounded-md bg-slate-100" />
                            </div>
                        </div>
                        <Skeleton className="w-16 h-6 rounded-full bg-slate-100 shrink-0" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                        <div className="bg-slate-50/70 p-2.5 rounded-xl space-y-1.5">
                            <Skeleton className="h-2.5 w-12 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded-md bg-slate-200" />
                        </div>
                        <div className="bg-slate-50/70 p-2.5 rounded-xl space-y-1.5">
                            <Skeleton className="h-2.5 w-12 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded-md bg-slate-200" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 gap-2">
                        <Skeleton className="h-8 w-24 rounded-xl bg-slate-100" />
                        <Skeleton className="h-8 w-8 rounded-xl bg-slate-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Meal Grid Table Skeleton
 * Used in Meals page for meal input matrix.
 */
export function MealGridSkeleton() {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <Skeleton className="h-6 w-36 rounded-xl" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24 rounded-xl" />
                    <Skeleton className="h-8 w-20 rounded-xl bg-slate-100" />
                </div>
            </div>
            <div className="space-y-3">
                <div className="grid grid-cols-6 gap-2 bg-slate-50/80 p-3 rounded-2xl">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-3.5 rounded-md" />
                    ))}
                </div>
                {Array.from({ length: 7 }).map((_, r) => (
                    <div key={r} className="grid grid-cols-6 gap-2 px-3 py-2.5 items-center border-b border-gray-50">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-7 h-7 rounded-full bg-slate-100 shrink-0" />
                            <Skeleton className="h-3 w-20 rounded-md" />
                        </div>
                        <Skeleton className="h-7 w-12 rounded-lg bg-slate-100 mx-auto" />
                        <Skeleton className="h-7 w-12 rounded-lg bg-slate-100 mx-auto" />
                        <Skeleton className="h-7 w-12 rounded-lg bg-slate-100 mx-auto" />
                        <Skeleton className="h-7 w-12 rounded-lg bg-slate-100 mx-auto" />
                        <Skeleton className="h-4 w-12 rounded-md bg-slate-200 mx-auto" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Profile View Skeleton
 */
export function ProfileSkeleton() {
    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
            {/* Header Banner Skeleton */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                <Skeleton className="w-24 h-24 rounded-3xl bg-slate-200 shrink-0" />
                <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                    <Skeleton className="h-7 w-48 rounded-xl mx-auto sm:mx-0" />
                    <Skeleton className="h-4 w-36 rounded-md bg-slate-100 mx-auto sm:mx-0" />
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full bg-slate-100" />
                    </div>
                </div>
                <Skeleton className="h-10 w-28 rounded-2xl bg-slate-100 shrink-0" />
            </div>

            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Info Sections Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <Skeleton className="h-5 w-32 rounded-lg" />
                    <div className="space-y-3">
                        <Skeleton className="h-11 rounded-2xl bg-slate-50" />
                        <Skeleton className="h-11 rounded-2xl bg-slate-50" />
                        <Skeleton className="h-11 rounded-2xl bg-slate-50" />
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <Skeleton className="h-5 w-36 rounded-lg" />
                    <div className="space-y-3">
                        <Skeleton className="h-11 rounded-2xl bg-slate-50" />
                        <Skeleton className="h-11 rounded-2xl bg-slate-50" />
                        <Skeleton className="h-11 rounded-2xl bg-slate-50" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Report Summary Skeleton
 */
export function ReportSummarySkeleton() {
    return (
        <div className="space-y-6">
            {/* Filter controls */}
            <div className="bg-white/95 rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-32 rounded-xl" />
                    <Skeleton className="h-9 w-24 rounded-xl bg-slate-100" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24 rounded-xl" />
                    <Skeleton className="h-9 w-28 rounded-xl bg-orange-100/70" />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <StatCardSkeleton key={i} dark={i === 4} />
                ))}
            </div>

            {/* Main Table */}
            <TableSkeleton rows={7} cols={6} />
        </div>
    );
}

/**
 * Full Dashboard Skeleton
 * Used in Next.js `loading.tsx` and full page initial loading states.
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Greeting Skeleton */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-5 sm:p-6 border border-gray-100/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48 sm:w-64 rounded-xl" />
                    <Skeleton className="h-4 w-36 sm:w-48 rounded-md bg-slate-100" />
                </div>
                <div className="flex items-center gap-2.5">
                    <Skeleton className="h-10 w-28 rounded-2xl bg-slate-100" />
                    <Skeleton className="h-10 w-10 rounded-2xl bg-slate-100" />
                </div>
            </div>

            {/* 5-Column Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton dark={true} />
            </div>

            {/* 2-Column Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Table or Main Content (2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white/95 rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-36 rounded-lg" />
                            <Skeleton className="h-7 w-20 rounded-full bg-slate-100" />
                        </div>
                        <TableSkeleton rows={5} cols={5} />
                    </div>
                </div>

                {/* Right: Notice Board & Quick Actions (1 col) */}
                <div className="space-y-6">
                    <div className="bg-white/95 rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-28 rounded-lg" />
                            <Skeleton className="h-6 w-16 rounded-full bg-slate-100" />
                        </div>
                        <ListItemSkeleton count={4} />
                    </div>
                </div>
            </div>
        </div>
    );
}
