"use client";

import { useState, useEffect } from "react";
import { 
    IconFileReport, 
    IconWallet, 
    IconShoppingBag,
    IconUsers,
    IconToolsKitchen2,
    IconCalendar,
    IconChevronDown,
    IconSearch,
    IconUser,
    IconUserMinus,
    IconChartPie,
    IconDotsVertical,
    IconFileSpreadsheet,
    IconFileTypePdf
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminReportsView() {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [searchTerm, setSearchTerm] = useState("");
    
    const [isLoading, setIsLoading] = useState(true);
    const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalBazaarCost: 0,
        totalDeposit: 0,
        totalMealsConsumed: 0,
        currentBalance: 0,
        liveMealRate: 0,
        fixedCostPerMember: 0,
    });
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
        fetchReports();
    }, [selectedMonth, selectedYear]);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/reports?month=${selectedMonth}&year=${selectedYear}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setMembers(data.memberReports || []);
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter members for the table in real-time
    const filteredMembers = members.filter(m => 
        (m.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate dynamic totals based on currently filtered members
    const filteredTotals = filteredMembers.reduce(
        (acc, curr) => ({
            bazaarAmount: acc.bazaarAmount + (curr.bazaarAmount || 0),
            depositAmount: acc.depositAmount + (curr.depositAmount || 0),
            mealsConsumed: acc.mealsConsumed + (curr.mealsConsumed || 0),
            mealCost: acc.mealCost + (curr.mealCost || 0),
            fixedCost: acc.fixedCost + (curr.fixedCost || 0),
            totalCost: acc.totalCost + (curr.totalCost || 0),
            currentBalance: acc.currentBalance + (curr.currentBalance || 0),
        }),
        { bazaarAmount: 0, depositAmount: 0, mealsConsumed: 0, mealCost: 0, fixedCost: 0, totalCost: 0, currentBalance: 0 }
    );

    const negativeMembers = filteredMembers.filter(m => (m.currentBalance || 0) < 0);
    const negativeMembersCount = negativeMembers.length;
    const totalNegativeAmount = negativeMembers.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);

    const generateMonthOptions = () => {
        const months = [];
        for (let i = 1; i <= 12; i++) {
            const date = new Date(2000, i - 1, 1);
            months.push({ value: i, label: date.toLocaleString('default', { month: 'long' }) });
        }
        return months;
    };

    const generateYearOptions = () => {
        const years = [];
        const currentY = today.getFullYear();
        for (let i = currentY - 2; i <= currentY + 1; i++) {
            years.push(i);
        }
        return years;
    };

    const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('default', { month: 'long' });

    const handleExportExcel = () => {
        const excelData = filteredMembers.map((m, index) => ({
            "#": index + 1,
            "Member Name": m.name,
            "Bazaar Amount (Tk)": m.bazaarAmount || 0,
            "Deposit Amount (Tk)": m.depositAmount || 0,
            "Meals Consumed": m.mealsConsumed || 0,
            "Meal Cost (Tk)": m.mealCost ?? Math.round((m.mealsConsumed || 0) * (stats.liveMealRate || 0) * 100) / 100,
            "Fixed Overhead (Tk)": m.fixedCost ?? stats.fixedCostPerMember ?? 0,
            "Total Cost (Tk)": m.totalCost ?? ((m.mealCost ?? 0) + (m.fixedCost ?? 0)),
            "Net Balance (Tk)": m.currentBalance || 0
        }));
        
        excelData.push({
            "#": "Total",
            "Member Name": "-",
            "Bazaar Amount (Tk)": filteredTotals.bazaarAmount,
            "Deposit Amount (Tk)": filteredTotals.depositAmount,
            "Meals Consumed": filteredTotals.mealsConsumed,
            "Meal Cost (Tk)": filteredTotals.mealCost,
            "Fixed Overhead (Tk)": filteredTotals.fixedCost,
            "Total Cost (Tk)": filteredTotals.totalCost,
            "Net Balance (Tk)": filteredTotals.currentBalance
        } as any);

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");
        
        XLSX.writeFile(workbook, `Mess_Financial_Report_${monthName}_${selectedYear}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text(`Financial Report - ${monthName} ${selectedYear}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Live Meal Rate: Tk ${(stats.liveMealRate || 0).toFixed(2)} | Total Bazaar: Tk ${(stats.totalBazaarCost || 0).toLocaleString()}`, 14, 26);

        const tableColumn = ["#", "Member Name", "Bazaar (Tk)", "Deposit (Tk)", "Meals", "Balance (Tk)"];
        const tableRows: any[] = [];

        filteredMembers.forEach((m, index) => {
            tableRows.push([
                index + 1,
                m.name,
                m.bazaarAmount > 0 ? m.bazaarAmount.toLocaleString() : "-",
                m.depositAmount > 0 ? m.depositAmount.toLocaleString() : "-",
                m.mealsConsumed,
                (m.currentBalance < 0 ? "-" : "+") + " " + Math.abs(m.currentBalance || 0).toFixed(2)
            ]);
        });

        tableRows.push([
            "Total",
            "-",
            filteredTotals.bazaarAmount.toLocaleString(),
            filteredTotals.depositAmount.toLocaleString(),
            filteredTotals.mealsConsumed,
            (filteredTotals.currentBalance < 0 ? "-" : "+") + " " + Math.abs(filteredTotals.currentBalance).toFixed(2)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 32,
            theme: 'grid',
            headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold' },
            footStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
        });

        doc.save(`Mess_Financial_Report_${monthName}_${selectedYear}.pdf`);
    };

    return (
        <div className="w-full pb-12 md:pb-16 animate-in fade-in duration-200">
            
            {/* ═══════════════════════════════════════════════════════════════════
                MOBILE VIEW: Matching reports.png Pixel-for-Pixel
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="md:hidden flex flex-col gap-3.5 w-full max-w-md mx-auto">
                
                {/* 1. Header & Title Section */}
                <div className="flex items-center gap-3 pt-1 px-0.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-blue-500 shrink-0">
                        <IconFileReport size={26} stroke={2} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                            Financial Reports
                        </h1>
                        <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5 leading-snug truncate">
                            {monthName} {selectedYear} · Live Meal Rate ৳{(stats.liveMealRate || 0).toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* 2. Filter & Export Action Row (Mobile 2-Row Responsive Layout) */}
                <div className="space-y-2">
                    {/* Row 1: Month and Year Dropdowns */}
                    <div className="flex items-center gap-2">
                        {/* Month Dropdown */}
                        <div className="flex-1 relative bg-white rounded-2xl px-3.5 py-2.5 border border-gray-100 shadow-sm flex items-center justify-between gap-1.5 cursor-pointer">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <IconCalendar size={15} className="text-slate-600 shrink-0" stroke={2.2} />
                                <span className="text-xs font-bold text-slate-800 truncate">{monthName}</span>
                            </div>
                            <IconChevronDown size={14} className="text-slate-400 shrink-0" stroke={2.5} />
                            <select 
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            >
                                {generateMonthOptions().map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Year Dropdown */}
                        <div className="relative bg-white rounded-2xl px-3.5 py-2.5 border border-gray-100 shadow-sm flex items-center justify-between gap-1.5 cursor-pointer w-28 shrink-0">
                            <span className="text-xs font-bold text-slate-800">{selectedYear}</span>
                            <IconChevronDown size={14} className="text-slate-400 shrink-0" stroke={2.5} />
                            <select 
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            >
                                {generateYearOptions().map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Download Excel & Download PDF Side-by-Side */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Download Excel */}
                        <button 
                            onClick={handleExportExcel}
                            className="w-full bg-white border border-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2.5 rounded-2xl shadow-sm hover:bg-emerald-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                        >
                            <span className="w-4 h-4 rounded bg-[#107C41] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                X
                            </span>
                            <span className="truncate">Download Excel</span>
                        </button>

                        {/* Download PDF */}
                        <button 
                            onClick={handleExportPDF}
                            className="w-full bg-white border border-rose-100 text-rose-700 text-xs font-bold px-3 py-2.5 rounded-2xl shadow-sm hover:bg-rose-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                        >
                            <span className="w-4 h-4 rounded bg-[#E11D48] text-white font-black text-[7px] flex items-center justify-center shrink-0">
                                PDF
                            </span>
                            <span className="truncate">Download PDF</span>
                        </button>
                    </div>
                </div>

                {/* 3. 6 Financial Summary Metric Cards (2-Column Grid) */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    
                    {/* Card 1: Total Members */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 shadow-sm border border-gray-100/70 relative overflow-hidden flex items-center gap-2.5 min-h-[78px]">
                        <div className="w-9 h-9 rounded-2xl bg-[#FFF5ED] text-[#FF6B00] flex items-center justify-center shrink-0 shadow-2xs">
                            <IconUsers size={20} stroke={2.2} />
                        </div>
                        <div className="min-w-0 z-10">
                            <p className="text-[11px] font-bold text-slate-500 leading-tight">Total Members</p>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
                                {isLoading ? "..." : stats.totalMembers}
                            </h3>
                        </div>
                        {/* Faded users graphic on right */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-25 text-orange-400 pointer-events-none">
                            <IconUsers size={34} stroke={1.5} />
                        </div>
                    </div>

                    {/* Card 2: Total Bazaar */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 shadow-sm border border-gray-100/70 relative overflow-hidden flex items-center gap-2.5 min-h-[78px]">
                        <div className="w-9 h-9 rounded-2xl bg-[#F0FDF4] text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <IconShoppingBag size={20} stroke={2.2} />
                        </div>
                        <div className="min-w-0 z-10">
                            <p className="text-[11px] font-bold text-slate-500 leading-tight">Total Bazaar</p>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5 truncate">
                                ৳ {isLoading ? "..." : stats.totalBazaarCost.toLocaleString()}
                            </h3>
                        </div>
                        {/* Green trendline wave on right */}
                        <svg className="absolute right-0 bottom-0 w-20 h-10 pointer-events-none opacity-80" viewBox="0 0 100 50" fill="none">
                            <defs>
                                <linearGradient id="bazaarGreenWave" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,45 C25,45 35,35 50,30 C65,25 75,10 100,5 L100,50 L0,50 Z" fill="url(#bazaarGreenWave)" />
                            <path d="M0,45 C25,45 35,35 50,30 C65,25 75,10 100,5" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Card 3: Total Deposit */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 shadow-sm border border-gray-100/70 relative overflow-hidden flex items-center gap-2.5 min-h-[78px]">
                        <div className="w-9 h-9 rounded-2xl bg-[#FAF5FF] text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <IconWallet size={20} stroke={2.2} />
                        </div>
                        <div className="min-w-0 z-10">
                            <p className="text-[11px] font-bold text-slate-500 leading-tight">Total Deposit</p>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5 truncate">
                                ৳ {isLoading ? "..." : stats.totalDeposit.toLocaleString()}
                            </h3>
                        </div>
                        {/* Purple trendline wave on right */}
                        <svg className="absolute right-0 bottom-0 w-20 h-10 pointer-events-none opacity-80" viewBox="0 0 100 50" fill="none">
                            <defs>
                                <linearGradient id="depositPurpleWave" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#A855F7" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,45 C25,40 40,35 60,25 C75,18 85,12 100,8 L100,50 L0,50 Z" fill="url(#depositPurpleWave)" />
                            <path d="M0,45 C25,40 40,35 60,25 C75,18 85,12 100,8" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Card 4: Total Meals */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 shadow-sm border border-gray-100/70 relative overflow-hidden flex items-center gap-2.5 min-h-[78px]">
                        <div className="w-9 h-9 rounded-2xl bg-[#FFF7ED] text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <IconToolsKitchen2 size={20} stroke={2.2} />
                        </div>
                        <div className="min-w-0 z-10">
                            <p className="text-[11px] font-bold text-slate-500 leading-tight">Total Meals</p>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
                                {isLoading ? "..." : stats.totalMealsConsumed}
                            </h3>
                        </div>
                        {/* Orange trendline wave on right */}
                        <svg className="absolute right-0 bottom-0 w-20 h-10 pointer-events-none opacity-80" viewBox="0 0 100 50" fill="none">
                            <defs>
                                <linearGradient id="mealsOrangeWave" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F97316" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,42 C20,38 45,32 65,22 C80,15 90,12 100,6 L100,50 L0,50 Z" fill="url(#mealsOrangeWave)" />
                            <path d="M0,42 C20,38 45,32 65,22 C80,15 90,12 100,6" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Card 5: Balance */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 shadow-sm border border-gray-100/70 relative overflow-hidden flex items-center gap-2.5 min-h-[78px]">
                        <div className="w-9 h-9 rounded-2xl bg-[#EFF6FF] text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <IconChartPie size={20} stroke={2.2} />
                        </div>
                        <div className="min-w-0 z-10">
                            <p className="text-[11px] font-bold text-slate-500 leading-tight">Balance</p>
                            <h3 className={`text-base sm:text-lg font-black leading-tight mt-0.5 truncate ${stats.currentBalance >= 0 ? "text-[#16A34A]" : "text-rose-600"}`}>
                                {isLoading ? "..." : `${stats.currentBalance >= 0 ? "+ " : "- "}৳ ${Math.abs(stats.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </h3>
                        </div>
                        {/* Green trendline wave on right */}
                        <svg className="absolute right-0 bottom-0 w-20 h-10 pointer-events-none opacity-80" viewBox="0 0 100 50" fill="none">
                            <path d="M0,45 C25,45 35,35 50,30 C65,25 75,10 100,5 L100,50 L0,50 Z" fill="url(#bazaarGreenWave)" />
                            <path d="M0,45 C25,45 35,35 50,30 C65,25 75,10 100,5" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Card 6: Total Due */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 shadow-sm border border-gray-100/70 relative overflow-hidden flex items-center justify-between gap-2 min-h-[78px]">
                        <div className="flex items-center gap-2.5 min-w-0 z-10">
                            <div className="w-9 h-9 rounded-2xl bg-[#FFF1F2] text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                                <IconUserMinus size={20} stroke={2.2} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-500 leading-tight">Total Due</p>
                                <h3 className="text-base sm:text-lg font-black text-rose-600 leading-tight mt-0.5 truncate">
                                    - ৳ {isLoading ? "..." : Math.abs(totalNegativeAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            </div>
                        </div>
                        {/* 0 Members indicator on right */}
                        <div className="text-right shrink-0 pr-1 z-10">
                            <span className="block text-sm font-black text-slate-800 leading-tight">
                                {negativeMembersCount}
                            </span>
                            <span className="block text-[10px] font-bold text-slate-400 leading-tight">
                                Members
                            </span>
                        </div>
                    </div>

                </div>

                {/* 4. "Member Report" Section (Main Table Card) */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-gray-100/70 space-y-3.5 mt-1">
                    
                    {/* Card Header */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <IconUser size={16} stroke={2.2} />
                        </div>
                        <h2 className="text-base font-black text-slate-900 tracking-tight">
                            Member Report
                        </h2>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full">
                        <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" stroke={2.2} />
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search member..."
                            className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                    </div>

                    {/* Expandable Member List (Zero Horizontal Scroll on Mobile) */}
                    <div className="w-full overflow-hidden pt-1">
                        
                        {/* List Header */}
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider py-1.5 px-1 border-b border-slate-100">
                            <span>MEMBER</span>
                            <span>REMAINING / OUTCOME</span>
                        </div>

                        {/* List Items */}
                        <div className="divide-y divide-slate-100/70">
                            {isLoading ? (
                                <div className="py-8 text-center text-xs font-bold text-slate-400">
                                    Loading member reports...
                                </div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="py-8 text-center text-xs font-bold text-slate-400">
                                    No members found.
                                </div>
                            ) : (
                                filteredMembers.map((member, index) => {
                                    const isExpanded = expandedMemberId === member.id;
                                    const hasBalance = member.currentBalance !== undefined && member.currentBalance !== 0;
                                    const isPositive = (member.currentBalance || 0) >= 0;

                                    return (
                                        <div 
                                            key={member.id} 
                                            className="py-3 px-1 transition-colors"
                                        >
                                            {/* Compact Primary Row (Always Visible) */}
                                            <div 
                                                className="flex items-center justify-between gap-2 cursor-pointer select-none active:opacity-80"
                                                onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                                            >
                                                {/* Left: Index + Avatar + Name */}
                                                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                                                    <span className="text-xs font-bold text-slate-400 w-4 text-center shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <div className="w-8 h-8 rounded-full bg-[#FFEADB] text-[#EA580C] text-xs font-black flex items-center justify-center shrink-0 shadow-2xs">
                                                        {member.name ? member.name.charAt(0).toUpperCase() : "M"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 block truncate">
                                                            {member.name}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-slate-400 block truncate">
                                                            {isExpanded ? "Tap to close breakdown" : "Tap for full breakdown"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right: Remaining Balance + Chevron */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {hasBalance ? (
                                                        <span className={`text-xs sm:text-[13px] font-black ${
                                                            isPositive ? "text-[#16A34A]" : "text-rose-600"
                                                        }`}>
                                                            {isPositive ? "+ ৳ " : "- ৳ "}
                                                            {Math.abs(member.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-400">-</span>
                                                    )}
                                                    <div className={`w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center transition-transform duration-200 ${
                                                        isExpanded ? "rotate-180 bg-orange-100 text-orange-600" : ""
                                                    }`}>
                                                        <IconChevronDown size={14} stroke={2.5} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expandable Breakdown Card */}
                                            {isExpanded && (
                                                <div className="mt-3 pt-3 border-t border-dashed border-slate-200/80 animate-in fade-in duration-200">
                                                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                                                        {/* 1. Total Meals */}
                                                        <div className="bg-white p-2.5 rounded-xl border border-gray-100/80 shadow-2xs">
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                Total Meals
                                                            </span>
                                                            <span className="block text-xs font-black text-slate-800 mt-0.5">
                                                                {member.mealsConsumed ?? 0} meals
                                                            </span>
                                                        </div>

                                                        {/* 2. Meal Rate Cost */}
                                                        <div className="bg-white p-2.5 rounded-xl border border-gray-100/80 shadow-2xs">
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                Meal Rate Cost
                                                            </span>
                                                            <span className="block text-xs font-black text-rose-500 mt-0.5">
                                                                ৳ {Number(member.mealCost ?? ((member.mealsConsumed || 0) * (stats.liveMealRate || 0))).toFixed(2)}
                                                            </span>
                                                        </div>

                                                        {/* 3. Bazaar Expenses Paid */}
                                                        <div className="bg-white p-2.5 rounded-xl border border-gray-100/80 shadow-2xs">
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                Bazaar Paid
                                                            </span>
                                                            <span className="block text-xs font-black text-emerald-600 mt-0.5">
                                                                ৳ {Number(member.bazaarAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>

                                                        {/* 4. Fixed / Utility Shared Cost */}
                                                        <div className="bg-white p-2.5 rounded-xl border border-gray-100/80 shadow-2xs">
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                Fixed Overhead
                                                            </span>
                                                            <span className="block text-xs font-black text-rose-500 mt-0.5">
                                                                ৳ {Number(member.fixedCost ?? stats.fixedCostPerMember ?? 0).toFixed(2)}
                                                            </span>
                                                        </div>

                                                        {/* 5. Total Deposits Given */}
                                                        <div className="bg-white p-2.5 rounded-xl border border-gray-100/80 shadow-2xs">
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                Deposits Given
                                                            </span>
                                                            <span className="block text-xs font-black text-purple-600 mt-0.5">
                                                                ৳ {Number(member.depositAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>

                                                        {/* 6. Final Net Status */}
                                                        <div className={`p-2.5 rounded-xl border shadow-2xs ${
                                                            (member.currentBalance || 0) < 0 
                                                                ? "bg-rose-50/70 border-rose-100" 
                                                                : (member.currentBalance || 0) > 0 
                                                                    ? "bg-emerald-50/70 border-emerald-100" 
                                                                    : "bg-white border-gray-100/80"
                                                        }`}>
                                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                Net Balance Status
                                                            </span>
                                                            <span className={`block text-xs font-black mt-0.5 ${
                                                                (member.currentBalance || 0) < 0 
                                                                    ? "text-rose-600" 
                                                                    : (member.currentBalance || 0) > 0 
                                                                        ? "text-[#16A34A]" 
                                                                        : "text-slate-800"
                                                            }`}>
                                                                {(member.currentBalance || 0) < 0 ? "- ৳ " : "+ ৳ "}
                                                                {Math.abs(member.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                <span className="text-[10px] font-bold ml-1 opacity-80">
                                                                    {(member.currentBalance || 0) < 0 ? "(Due)" : (member.currentBalance || 0) > 0 ? "(Refundable)" : "(Balanced)"}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Total Footer Row */}
                        <div className="flex items-center justify-between pt-3.5 pb-1 px-1 border-t border-slate-100 font-black text-xs sm:text-[13px] text-slate-900">
                            <div className="flex items-center gap-2">
                                <span>Total Remaining</span>
                                <span className="text-[11px] font-bold text-slate-400">({filteredMembers.length} members)</span>
                            </div>
                            <div className="text-right">
                                {filteredTotals.currentBalance !== 0 ? (
                                    <span className={filteredTotals.currentBalance < 0 ? "text-rose-600 font-black" : "text-[#16A34A] font-black"}>
                                        {filteredTotals.currentBalance < 0 ? `- ৳ ` : `+ ৳ `}
                                        {Math.abs(filteredTotals.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                ) : "-"}
                            </div>
                        </div>

                    </div>

                </div>

            </div>


            {/* ═══════════════════════════════════════════════════════════════════
                DESKTOP VIEW: Comprehensive Dashboard Reports
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="hidden md:block max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                            <IconFileReport className="w-7 h-7" stroke={2} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B]">Financial Reports</h1>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                                Complete member-wise bazaar and expense report for {monthName} {selectedYear}
                                {!isLoading && stats.liveMealRate !== undefined && ` • Live Meal Rate: ৳${stats.liveMealRate.toFixed(2)}`}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <IconCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" stroke={2} />
                            <select 
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none shadow-sm cursor-pointer"
                            >
                                {generateMonthOptions().map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm cursor-pointer"
                        >
                            {generateYearOptions().map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <button onClick={handleExportExcel} className="flex items-center gap-2 bg-white border border-green-200 text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors cursor-pointer">
                            <IconFileSpreadsheet size={18} stroke={2.5} className="text-green-600" />
                            Download Excel
                        </button>

                        <button onClick={handleExportPDF} className="flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors cursor-pointer">
                            <IconFileTypePdf size={18} stroke={2.5} className="text-red-500" />
                            Download PDF
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* Card 1: Total Members */}
                    <div className="bg-white/95 backdrop-blur-sm p-4 lg:p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                        <div className="flex items-center justify-between z-10">
                            <div className="w-10 h-10 rounded-2xl bg-[#FFF5ED] text-[#FF6B00] flex items-center justify-center shrink-0 shadow-2xs">
                                <IconUsers size={20} stroke={2.2} />
                            </div>
                        </div>
                        <div className="z-10 mt-3">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Members</p>
                            <h3 className="text-xl font-black text-gray-900 mt-0.5">{isLoading ? "..." : stats.totalMembers}</h3>
                        </div>
                        <div className="absolute right-2 bottom-2 opacity-15 text-orange-400 pointer-events-none">
                            <IconUsers size={44} stroke={1.5} />
                        </div>
                    </div>

                    {/* Card 2: Total Bazaar */}
                    <div className="bg-white/95 backdrop-blur-sm p-4 lg:p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                        <div className="flex items-center justify-between z-10">
                            <div className="w-10 h-10 rounded-2xl bg-[#F0FDF4] text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                                <IconShoppingBag size={20} stroke={2.2} />
                            </div>
                        </div>
                        <div className="z-10 mt-3">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Bazaar</p>
                            <h3 className="text-xl font-black text-gray-900 mt-0.5 truncate">৳ {isLoading ? "..." : stats.totalBazaarCost.toLocaleString()}</h3>
                        </div>
                        <svg className="absolute right-0 bottom-0 w-24 h-12 pointer-events-none opacity-80" viewBox="0 0 100 50" fill="none">
                            <path d="M0,45 C25,45 35,35 50,30 C65,25 75,10 100,5 L100,50 L0,50 Z" fill="#DCFCE7" />
                            <path d="M0,45 C25,45 35,35 50,30 C65,25 75,10 100,5" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Card 3: Total Deposit */}
                    <div className="bg-white/95 backdrop-blur-sm p-4 lg:p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                        <div className="flex items-center justify-between z-10">
                            <div className="w-10 h-10 rounded-2xl bg-[#FAF5FF] text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                                <IconWallet size={20} stroke={2.2} />
                            </div>
                        </div>
                        <div className="z-10 mt-3">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Deposit</p>
                            <h3 className="text-xl font-black text-purple-600 mt-0.5 truncate">৳ {isLoading ? "..." : stats.totalDeposit.toLocaleString()}</h3>
                        </div>
                        <svg className="absolute right-0 bottom-0 w-24 h-12 pointer-events-none opacity-80" viewBox="0 0 100 50" fill="none">
                            <path d="M0,45 C25,40 40,35 60,25 C75,18 85,12 100,8 L100,50 L0,50 Z" fill="#F3E8FF" />
                            <path d="M0,45 C25,40 40,35 60,25 C75,18 85,12 100,8" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Card 4: Total Meals */}
                    <div className="bg-white/95 backdrop-blur-sm p-4 lg:p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                        <div className="flex items-center justify-between z-10">
                            <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                                <IconToolsKitchen2 size={20} stroke={2.2} />
                            </div>
                        </div>
                        <div className="z-10 mt-3">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Meals</p>
                            <h3 className="text-xl font-black text-gray-900 mt-0.5">{isLoading ? "..." : stats.totalMealsConsumed}</h3>
                        </div>
                        <svg className="absolute right-0 bottom-0 w-24 h-12 pointer-events-none opacity-80" viewBox="0 0 100 50" fill="none">
                            <path d="M0,42 C20,38 45,32 65,22 C80,15 90,12 100,6 L100,50 L0,50 Z" fill="#FFEDD5" />
                            <path d="M0,42 C20,38 45,32 65,22 C80,15 90,12 100,6" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Card 5: Balance */}
                    <div className="bg-white/95 backdrop-blur-sm p-4 lg:p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                        <div className="flex items-center justify-between z-10">
                            <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                                <IconChartPie size={20} stroke={2.2} />
                            </div>
                        </div>
                        <div className="z-10 mt-3">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Balance</p>
                            <h3 className={`text-xl font-black mt-0.5 truncate ${stats.currentBalance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                {isLoading ? "..." : `${stats.currentBalance >= 0 ? '+ ' : '- '}৳ ${Math.abs(stats.currentBalance).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                            </h3>
                        </div>
                        <svg className="absolute right-0 bottom-0 w-24 h-12 pointer-events-none opacity-80" viewBox="0 0 100 50" fill="none">
                            <path d="M0,45 C25,45 35,35 50,30 C65,25 75,10 100,5 L100,50 L0,50 Z" fill="#DCFCE7" />
                            <path d="M0,45 C25,45 35,35 50,30 C65,25 75,10 100,5" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Card 6: Total Due */}
                    <div className="bg-white/95 backdrop-blur-sm p-4 lg:p-5 rounded-3xl border border-red-100/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                        <div className="flex items-center justify-between z-10">
                            <div className="w-10 h-10 rounded-2xl bg-[#FFF1F2] text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                                <IconUserMinus size={20} stroke={2.2} />
                            </div>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                                {negativeMembersCount} {negativeMembersCount === 1 ? 'member' : 'members'}
                            </span>
                        </div>
                        <div className="z-10 mt-3">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Due</p>
                            <h3 className="text-xl font-black text-rose-600 mt-0.5 truncate">
                                {isLoading ? "..." : `- ৳ ${Math.abs(totalNegativeAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 border border-gray-200">
                                <IconUser className="w-5 h-5" stroke={2} />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-gray-900">Member Wise Report</h2>
                                <p className="text-xs font-medium text-gray-500 mt-0.5">Detailed bazaar, deposit, meal and balance information</p>
                            </div>
                        </div>
                        
                        <div className="relative w-full sm:w-64">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" stroke={2} />
                            <input 
                                type="text" 
                                placeholder="Search member name..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto relative">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">#</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Member Name</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Bazaar Amount (৳)</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Deposit Amount (৳)</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Meals Consumed</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Current Balance (৳)</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-20">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">Loading report data...</td>
                                    </tr>
                                ) : filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">No members found.</td>
                                    </tr>
                                ) : filteredMembers.map((member, idx) => (
                                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-6 text-sm text-gray-500 font-medium">{idx + 1}</td>
                                        <td className="py-3 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {member.name ? member.name.charAt(0).toUpperCase() : "M"}
                                                </div>
                                                <div>
                                                    <span className="font-extrabold text-gray-900 text-sm block">{member.name}</span>
                                                    {member.mealCost !== undefined && (
                                                        <span className="text-[11px] text-gray-400 font-medium block">
                                                            Food: ৳{member.mealCost} {member.fixedCost ? `• Fixed: ৳${member.fixedCost}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 text-sm font-semibold text-gray-600 text-right">
                                            {member.bazaarAmount > 0 ? member.bazaarAmount.toLocaleString() : "-"}
                                        </td>
                                        <td className="py-3 px-6 text-sm font-semibold text-gray-600 text-right">
                                            {member.depositAmount > 0 ? member.depositAmount.toLocaleString() : "-"}
                                        </td>
                                        <td className="py-3 px-6 text-sm font-semibold text-gray-600 text-center">
                                            {member.mealsConsumed}
                                        </td>
                                        <td className={`py-3 px-6 text-sm font-extrabold text-right ${member.currentBalance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                            {member.currentBalance < 0 ? "-" : "+"} ৳ {Math.abs(member.currentBalance || 0).toFixed(2)}
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
                                                <IconDotsVertical size={18} stroke={2} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            
                            {/* Sticky Total Footer */}
                            {!isLoading && filteredMembers.length > 0 && (
                                <tfoot className="bg-[#F8FAFC] border-t-2 border-gray-200 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                    <tr>
                                        <td className="py-4 px-6 text-sm font-black text-gray-900" colSpan={2}>
                                            Total
                                        </td>
                                        <td className="py-4 px-6 text-sm font-black text-gray-900 text-right whitespace-nowrap">
                                            ৳ {filteredTotals.bazaarAmount.toLocaleString(undefined, {minimumFractionDigits: 0})}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-black text-gray-900 text-right whitespace-nowrap">
                                            ৳ {filteredTotals.depositAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-black text-gray-900 text-center whitespace-nowrap">
                                            {filteredTotals.mealsConsumed.toLocaleString()}
                                        </td>
                                        <td className={`py-4 px-6 text-sm font-black text-right whitespace-nowrap ${filteredTotals.currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {filteredTotals.currentBalance >= 0 ? '+ ' : '- '}৳ {Math.abs(filteredTotals.currentBalance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-500 font-bold">-</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
}
