"use client";

import { useState, useEffect } from "react";
import { 
    IconReportAnalytics, 
    IconWallet, 
    IconReceipt2, 
    IconChartPie,
    IconCalendarStats,
    IconDownload,
    IconCalendar,
    IconX,
    IconLoader2,
    IconCheck,
    IconFileSpreadsheet,
    IconFileTypePdf,
    IconChevronDown,
    IconToolsKitchen2,
    IconTrendingUp,
    IconCash,
    IconFileText,
    IconCoins
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsView() {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    const [stats, setStats] = useState({
        totalDeposit: 0,
        totalMeals: 0,
        liveMealRate: 0,
        currentBalance: 0,
        mealCost: 0,
        fixedCost: 0,
        totalCost: 0,
        isPositive: true,
        balanceFormatted: "",
    });
    const [isLoading, setIsLoading] = useState(true);

    // Modal & Download states
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [reportDetails, setReportDetails] = useState<any>(null);
    const [isLoadingReportDetails, setIsLoadingReportDetails] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);

    const monthOptions = [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
    ];

    const currentY = today.getFullYear();
    const yearOptions = [currentY - 2, currentY - 1, currentY, currentY + 1];

    const selectedMonthName = monthOptions.find((m) => m.value === selectedMonth)?.label || "Month";

    useEffect(() => {
        fetchReportData(selectedMonth, selectedYear);
    }, [selectedMonth, selectedYear]);

    const fetchReportData = async (m: number, y: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/members/dashboard-data?month=${m}&year=${y}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDetailedReport = async (m: number, y: number) => {
        setIsLoadingReportDetails(true);
        try {
            const res = await fetch(`/api/members/monthly-report?month=${m}&year=${y}`);
            if (res.ok) {
                const data = await res.json();
                setReportDetails(data);
                return data;
            }
        } catch (error) {
            console.error("Error fetching full report details:", error);
        } finally {
            setIsLoadingReportDetails(false);
        }
        return null;
    };

    const openDownloadModal = async () => {
        setIsDownloadModalOpen(true);
        await fetchDetailedReport(selectedMonth, selectedYear);
    };

    const handleMonthChangeInModal = async (newMonth: number, newYear: number) => {
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
        await fetchDetailedReport(newMonth, newYear);
    };

    // ─── Export to PDF Handler ───
    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            let data = reportDetails;
            if (!data || data.month !== selectedMonth || data.year !== selectedYear) {
                data = await fetchDetailedReport(selectedMonth, selectedYear);
            }
            if (!data) {
                alert("Failed to load report data for PDF export.");
                return;
            }

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // 1. Header Banner
            doc.setFillColor(255, 107, 0); // Primary Orange
            doc.rect(0, 0, pageWidth, 28, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(data.member.messName || "AMADER MESS", 14, 12);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text("Member Monthly Financial Statement", 14, 20);

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`${data.monthName} ${data.year}`, pageWidth - 14, 18, { align: "right" });

            // 2. Member & Summary Details
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`Member: ${data.member.name}`, 14, 37);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`Phone: ${data.member.phone || "N/A"}  |  Email: ${data.member.email}`, 14, 43);

            // Summary Box Table
            autoTable(doc, {
                startY: 48,
                head: [["Total Deposit", "Total Meals", "Meal Rate", "Meal Cost", "Fixed Overhead", "Total Cost", "Final Balance"]],
                body: [[
                    `Tk ${data.stats.totalDeposit.toLocaleString()}`,
                    `${data.stats.totalMeals}`,
                    `Tk ${data.stats.liveMealRate.toFixed(2)}`,
                    `Tk ${data.stats.mealCost.toFixed(2)}`,
                    `Tk ${data.stats.fixedCost.toFixed(2)}`,
                    `Tk ${data.stats.totalCost.toFixed(2)}`,
                    `${data.stats.isPositive ? "+" : "-"} Tk ${Math.abs(data.stats.currentBalance).toFixed(2)}`
                ]],
                theme: "grid",
                headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 8 },
                bodyStyles: { textColor: [15, 23, 42], fontSize: 8.5, fontStyle: "bold" },
                margin: { left: 14, right: 14 },
            });

            // 3. Day-wise Full Month Details Table
            const lastY = (doc as any).lastAutoTable?.finalY || 68;
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text("Day-Wise Meals, Payments & Bazaar Activity Log:", 14, lastY + 9);

            const tableColumns = [
                "Date",
                "Day",
                "B",
                "L",
                "D",
                "Guest",
                "Meals",
                "Payment / Deposit (Tk)",
                "Bazaar Spent (Tk)",
                "Notes & Remarks"
            ];

            const tableRows = (data.dailyBreakdown || []).map((row: any) => {
                const depositText = row.depositAmount > 0 
                    ? `Tk ${row.depositAmount.toLocaleString()}` 
                    : (row.deposits?.length > 0 ? `Tk ${row.deposits[0].amount} (${row.deposits[0].status})` : "-");
                
                const bazaarText = row.bazaarAmount > 0 
                    ? `Tk ${row.bazaarAmount.toLocaleString()}` 
                    : "-";

                const notes = [
                    ...row.deposits.map((d: any) => `${d.method || "Deposit"}${d.note ? `: ${d.note}` : ""}`),
                    ...row.bazaars.map((b: any) => b.description || "Bazaar shopping"),
                ].filter(Boolean).join(" | ") || "-";

                return [
                    row.formattedDate.slice(0, 6),
                    row.dayName,
                    row.breakfast > 0 ? row.breakfast : "-",
                    row.lunch > 0 ? row.lunch : "-",
                    row.dinner > 0 ? row.dinner : "-",
                    row.guest > 0 ? row.guest : "-",
                    row.totalMeals > 0 ? row.totalMeals : "-",
                    depositText,
                    bazaarText,
                    notes
                ];
            });

            // Totals Row
            tableRows.push([
                "TOTAL",
                "-",
                data.stats.breakdownMeals?.breakfast || "-",
                data.stats.breakdownMeals?.lunch || "-",
                data.stats.breakdownMeals?.dinner || "-",
                data.stats.breakdownMeals?.guest || "-",
                `${data.stats.totalMeals}`,
                `Tk ${data.stats.totalDeposit.toLocaleString()}`,
                `Tk ${data.stats.totalBazaar.toLocaleString()}`,
                `Balance: ${data.stats.isPositive ? "+" : "-"} Tk ${Math.abs(data.stats.currentBalance).toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: lastY + 13,
                head: [tableColumns],
                body: tableRows,
                theme: "striped",
                headStyles: { fillColor: [255, 107, 0], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
                bodyStyles: { fontSize: 7.2, textColor: [51, 65, 85] },
                columnStyles: {
                    0: { cellWidth: 18 },
                    1: { cellWidth: 12 },
                    2: { cellWidth: 9, halign: "center" },
                    3: { cellWidth: 9, halign: "center" },
                    4: { cellWidth: 9, halign: "center" },
                    5: { cellWidth: 12, halign: "center" },
                    6: { cellWidth: 14, halign: "center", fontStyle: "bold" },
                    7: { cellWidth: 32, fontStyle: "bold" },
                    8: { cellWidth: 26, fontStyle: "bold" },
                    9: { cellWidth: "auto" },
                },
                didParseCell: function(cellData) {
                    if (cellData.row.index === tableRows.length - 1) {
                        cellData.cell.styles.fontStyle = "bold";
                        cellData.cell.styles.fillColor = [255, 237, 213];
                        cellData.cell.styles.textColor = [194, 65, 12];
                    }
                },
                margin: { left: 14, right: 14 },
            });

            // Footer
            const finalPage = doc.internal.pages.length - 1;
            doc.setPage(finalPage);
            const finalY = doc.internal.pageSize.getHeight() - 8;
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Generated by Amader Mess System on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, finalY);

            const safeName = (data.member.name || "Member").replace(/[^a-zA-Z0-9]/g, "_");
            doc.save(`${safeName}_Report_${data.monthName}_${data.year}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Error generating PDF statement.");
        } finally {
            setIsExportingPDF(false);
        }
    };

    // ─── Export to Excel Handler ───
    const handleExportExcel = async () => {
        setIsExportingExcel(true);
        try {
            let data = reportDetails;
            if (!data || data.month !== selectedMonth || data.year !== selectedYear) {
                data = await fetchDetailedReport(selectedMonth, selectedYear);
            }
            if (!data) {
                alert("Failed to load report data for Excel export.");
                return;
            }

            const excelRows: any[] = [];

            // 1. Header Information
            excelRows.push({ "Date": "MEMBER MONTHLY STATEMENT", "Day": "", "Breakfast": "", "Lunch": "", "Dinner": "", "Guest": "", "Total Meals": "", "Deposit (Tk)": "", "Bazaar (Tk)": "", "Details": "" });
            excelRows.push({ "Date": "Member Name:", "Day": data.member.name, "Breakfast": "", "Lunch": "", "Dinner": "", "Guest": "", "Total Meals": "", "Deposit (Tk)": "", "Bazaar (Tk)": "", "Details": "" });
            excelRows.push({ "Date": "Month & Year:", "Day": `${data.monthName} ${data.year}`, "Breakfast": "", "Lunch": "", "Dinner": "", "Guest": "", "Total Meals": "", "Deposit (Tk)": "", "Bazaar (Tk)": "", "Details": "" });
            excelRows.push({ "Date": "Total Deposit (Tk):", "Day": data.stats.totalDeposit, "Breakfast": "", "Lunch": "", "Dinner": "", "Guest": "", "Total Meals": "", "Deposit (Tk)": "", "Bazaar (Tk)": "", "Details": "" });
            excelRows.push({ "Date": "Total Meals:", "Day": data.stats.totalMeals, "Breakfast": "", "Lunch": "", "Dinner": "", "Guest": "", "Total Meals": "", "Deposit (Tk)": "", "Bazaar (Tk)": "", "Details": "" });
            excelRows.push({ "Date": "Live Meal Rate (Tk):", "Day": data.stats.liveMealRate, "Breakfast": "", "Lunch": "", "Dinner": "", "Guest": "", "Total Meals": "", "Deposit (Tk)": "", "Bazaar (Tk)": "", "Details": "" });
            excelRows.push({ "Date": "Total Month Cost (Tk):", "Day": data.stats.totalCost, "Breakfast": "", "Lunch": "", "Dinner": "", "Guest": "", "Total Meals": "", "Deposit (Tk)": "", "Bazaar (Tk)": "", "Details": "" });
            excelRows.push({ "Date": "Net Final Balance (Tk):", "Day": data.stats.currentBalance, "Breakfast": "", "Lunch": "", "Dinner": "", "Guest": "", "Total Meals": "", "Deposit (Tk)": "", "Bazaar (Tk)": "", "Details": "" });
            excelRows.push({});

            // 2. Day-by-Day Rows
            (data.dailyBreakdown || []).forEach((row: any) => {
                const notes = [
                    ...row.deposits.map((d: any) => `${d.method || "Deposit"}${d.note ? `: ${d.note}` : ""}`),
                    ...row.bazaars.map((b: any) => b.description || "Bazaar shopping"),
                ].filter(Boolean).join("; ");

                excelRows.push({
                    "Date": row.date,
                    "Day": row.dayName,
                    "Breakfast": row.breakfast,
                    "Lunch": row.lunch,
                    "Dinner": row.dinner,
                    "Guest": row.guest,
                    "Total Meals": row.totalMeals,
                    "Deposit (Tk)": row.depositAmount,
                    "Bazaar (Tk)": row.bazaarAmount,
                    "Details": notes,
                });
            });

            // 3. Totals Row
            excelRows.push({
                "Date": "TOTAL",
                "Day": `${data.daysInMonth} Days`,
                "Breakfast": data.stats.breakdownMeals?.breakfast || 0,
                "Lunch": data.stats.breakdownMeals?.lunch || 0,
                "Dinner": data.stats.breakdownMeals?.dinner || 0,
                "Guest": data.stats.breakdownMeals?.guest || 0,
                "Total Meals": data.stats.totalMeals,
                "Deposit (Tk)": data.stats.totalDeposit,
                "Bazaar (Tk)": data.stats.totalBazaar,
                "Details": `Final Balance: ${data.stats.currentBalance}`,
            });

            const worksheet = XLSX.utils.json_to_sheet(excelRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, `${data.monthName} ${data.year}`);

            const safeName = (data.member.name || "Member").replace(/[^a-zA-Z0-9]/g, "_");
            XLSX.writeFile(workbook, `${safeName}_Report_${data.monthName}_${data.year}.xlsx`);
        } catch (error) {
            console.error("Excel Export Error:", error);
            alert("Error exporting Excel sheet.");
        } finally {
            setIsExportingExcel(false);
        }
    };

    const computedMealCost = stats.mealCost || (stats.totalMeals * stats.liveMealRate);
    const computedTotalCost = stats.totalCost || (computedMealCost + (stats.fixedCost || 0));

    return (
        <div className="w-full pb-12 md:pb-16 animate-in fade-in duration-200">
            
            {/* ═══════════════════════════════════════════════════════════════════
                MOBILE VIEW: Matching Provided Image Pixel-for-Pixel
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="md:hidden flex flex-col gap-3.5 w-full max-w-md mx-auto">
                
                {/* 1. Header Card (Financial Reports Hero) */}
                <div className="bg-white/95 backdrop-blur-sm rounded-[26px] p-4 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
                    {/* Top Row: Icon Squircle + Title/Subtitle + 3D Bar Chart Illustration */}
                    <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Blue squircle icon */}
                            <div className="w-12 h-12 rounded-2xl bg-[#E8F1FF] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
                                <IconReportAnalytics size={26} stroke={2.2} />
                            </div>
                            <div className="min-w-0 pt-0.5">
                                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                                    Financial Reports
                                </h1>
                                <p className="text-xs font-semibold text-slate-400 mt-1 leading-snug">
                                    Your detailed financial summary and meal expenses for {selectedMonthName} {selectedYear}.
                                </p>
                            </div>
                        </div>

                        {/* 3D Bar Chart Board Graphic (Right) */}
                        <div className="shrink-0 pointer-events-none -mr-1 -mt-1">
                            <svg className="w-16 h-16 sm:w-18 sm:h-18" viewBox="0 0 75 75" fill="none">
                                <defs>
                                    <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FED7AA" />
                                        <stop offset="100%" stopColor="#FDBA74" />
                                    </linearGradient>
                                    <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FB923C" />
                                        <stop offset="100%" stopColor="#F97316" />
                                    </linearGradient>
                                    <linearGradient id="barGrad3" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#F97316" />
                                        <stop offset="100%" stopColor="#EA580C" />
                                    </linearGradient>
                                </defs>
                                {/* Board drop shadow */}
                                <rect x="12" y="11" width="52" height="55" rx="14" fill="#FDE68A" opacity="0.3" />
                                {/* Main ivory card */}
                                <rect x="10" y="8" width="52" height="55" rx="14" fill="#FFFBF0" stroke="#FDE68A" strokeWidth="1.2" />
                                {/* Header lines */}
                                <rect x="16" y="18" width="16" height="3" rx="1.5" fill="#FCD34D" opacity="0.85" />
                                <rect x="16" y="24" width="10" height="3" rx="1.5" fill="#FCD34D" opacity="0.65" />
                                {/* 3 Rising 3D Orange Bars */}
                                <rect x="22" y="44" width="8" height="12" rx="3.5" fill="url(#barGrad1)" />
                                <rect x="33" y="34" width="8" height="22" rx="3.5" fill="url(#barGrad2)" />
                                <rect x="44" y="22" width="8" height="34" rx="3.5" fill="url(#barGrad3)" />
                            </svg>
                        </div>
                    </div>

                    {/* Bottom Row: Download Report Button + Month Dropdown + Year Dropdown */}
                    <div className="flex items-center gap-2 mt-4 pt-1">
                        {/* Download Report Button */}
                        <button
                            onClick={openDownloadModal}
                            className="flex-1 bg-gradient-to-r from-[#FF5E00] to-[#FF7700] hover:from-[#FF5500] hover:to-[#FF6B00] text-white font-extrabold text-xs sm:text-sm py-2.5 px-3 rounded-2xl shadow-md shadow-orange-500/25 flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shrink-0"
                        >
                            <IconDownload size={16} stroke={2.5} />
                            <span>Download Report</span>
                        </button>

                        {/* Month Dropdown */}
                        <div className="relative bg-white border border-gray-200/90 rounded-2xl px-2.5 py-2.5 shadow-2xs flex items-center shrink-0">
                            <IconCalendar size={15} className="text-gray-500 shrink-0 pointer-events-none" stroke={2} />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer appearance-none pl-1.5 pr-4.5"
                                aria-label="Month"
                            >
                                {monthOptions.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <IconChevronDown size={13} className="text-gray-500 absolute right-2 pointer-events-none" stroke={2.5} />
                        </div>

                        {/* Year Dropdown */}
                        <div className="relative bg-white border border-gray-200/90 rounded-2xl px-2.5 py-2.5 shadow-2xs flex items-center shrink-0">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer appearance-none pl-1.5 pr-4.5"
                                aria-label="Year"
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <IconChevronDown size={13} className="text-gray-500 absolute right-2 pointer-events-none" stroke={2.5} />
                        </div>
                    </div>
                </div>

                {/* 2. Four Metric Cards (2x2 Grid Exact Match) */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    
                    {/* Card 1: TOTAL DEPOSIT */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[96px]">
                        <div className="flex items-center gap-2 relative z-10">
                            <div className="w-8 h-8 rounded-xl bg-[#E8F1FF] text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
                                <IconWallet size={17} stroke={2.4} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                TOTAL DEPOSIT
                            </span>
                        </div>
                        <div className="mt-2 relative z-10">
                            <h3 className="text-lg font-black text-slate-900 leading-tight">
                                Tk {isLoading ? "..." : stats.totalDeposit.toLocaleString()}
                            </h3>
                        </div>
                        {/* Soft blue wallet watermark */}
                        <div className="absolute right-0.5 -bottom-1 pointer-events-none">
                            <svg className="w-13 h-11" viewBox="0 0 60 50" fill="none">
                                <rect x="6" y="10" width="50" height="34" rx="8" fill="#EBF3FE" stroke="#D3E5FD" strokeWidth="2" />
                                <path d="M6 18h50" stroke="#D3E5FD" strokeWidth="2" />
                                <path d="M38 23h18v12h-18a6 6 0 0 1-6-6v0a6 6 0 0 1 6-6z" fill="#DCEBFE" stroke="#D3E5FD" strokeWidth="1.8" />
                                <circle cx="44" cy="29" r="2.5" fill="#93C5FD" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 2: TOTAL MEALS */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[96px]">
                        <div className="flex items-center gap-2 relative z-10">
                            <div className="w-8 h-8 rounded-xl bg-[#FFF5ED] text-[#EA580C] flex items-center justify-center shrink-0 shadow-2xs">
                                <IconToolsKitchen2 size={17} stroke={2.4} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                TOTAL MEALS
                            </span>
                        </div>
                        <div className="mt-2 relative z-10">
                            <h3 className="text-xl font-black text-slate-900 leading-tight">
                                {isLoading ? "..." : stats.totalMeals}
                            </h3>
                        </div>
                        {/* Soft peach fork & spoon watermark */}
                        <div className="absolute right-1 -bottom-1 pointer-events-none">
                            <svg className="w-12 h-13" viewBox="0 0 50 55" fill="#FFE8D6">
                                <path d="M12 4c0 5.5 1.8 10 4.5 10v24h3.5V14c2.8 0 4.5-4.5 4.5-10h-2.2c0 3.5-.8 7-2.3 7s-2.3-3.5-2.3-7h-1.8c0 3.5-.8 7-2.3 7s-2.3-3.5-2.3-7H12z" />
                                <path d="M34 4c-3.2 0-5.5 3.5-5.5 8.5s2.3 8.5 5.5 8.5v22h3.5V21c3.2 0 5.5-3.5 5.5-8.5S40.7 4 37.5 4h-3.5z" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 3: LIVE MEAL RATE */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[96px]">
                        <div className="flex items-center gap-2 relative z-10">
                            <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center shrink-0 shadow-2xs">
                                <IconTrendingUp size={17} stroke={2.4} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                LIVE MEAL RATE
                            </span>
                        </div>
                        <div className="mt-2 relative z-10">
                            <h3 className="text-lg font-black text-slate-900 leading-tight">
                                Tk {isLoading ? "..." : stats.liveMealRate.toFixed(2)}
                            </h3>
                        </div>
                        {/* Soft lavender 3-bar chart watermark */}
                        <div className="absolute right-1.5 bottom-0 pointer-events-none">
                            <svg className="w-11 h-11" viewBox="0 0 45 45" fill="#EDE9FE">
                                <rect x="6" y="25" width="7" height="17" rx="2.5" />
                                <rect x="18" y="15" width="7" height="27" rx="2.5" />
                                <rect x="30" y="5" width="7" height="37" rx="2.5" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 4: CURRENT BALANCE */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[96px]">
                        <div className="flex items-center gap-2 relative z-10">
                            <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 shadow-2xs">
                                <IconCash size={17} stroke={2.4} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                CURRENT BALANCE
                            </span>
                        </div>
                        <div className="mt-2 relative z-10">
                            <h3 className={`text-lg font-black leading-tight ${stats.currentBalance < 0 ? "text-rose-600" : "text-[#059669]"}`}>
                                {isLoading ? "..." : `${stats.currentBalance >= 0 ? "+ " : "- "}Tk ${Math.abs(stats.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </h3>
                        </div>
                        {/* Soft mint growth arrow watermark */}
                        <div className="absolute right-1 bottom-0.5 pointer-events-none">
                            <svg className="w-12 h-12" viewBox="0 0 50 50" fill="none" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 42 L40 10" />
                                <path d="M24 10 L40 10 L40 26" />
                                <path d="M16 42 L42 16" strokeWidth="1.8" opacity="0.6" />
                            </svg>
                        </div>
                    </div>

                </div>

                {/* 3. Detailed Calculation Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-[26px] p-4 sm:p-5 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2.5 pb-2">
                        <div className="w-8 h-8 rounded-xl bg-[#FFF5ED] text-[#EA580C] flex items-center justify-center shrink-0 shadow-2xs">
                            <IconFileText size={18} stroke={2.4} />
                        </div>
                        <h2 className="text-base font-black text-slate-900 tracking-tight">
                            Detailed Calculation
                        </h2>
                    </div>

                    {/* Line Items */}
                    <div className="space-y-0.5 pt-0.5">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100/80 text-xs sm:text-[13px]">
                            <span className="font-semibold text-slate-500">Total Approved Deposit</span>
                            <span className="font-black text-slate-900">Tk {stats.totalDeposit.toFixed(2)}</span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-gray-100/80 text-xs sm:text-[13px]">
                            <span className="font-semibold text-slate-500">Total Meals Consumed</span>
                            <span className="font-black text-slate-900">{stats.totalMeals}</span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-gray-100/80 text-xs sm:text-[13px]">
                            <span className="font-semibold text-slate-500">Current Meal Rate</span>
                            <span className="font-black text-slate-900">× Tk {stats.liveMealRate.toFixed(2)}</span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-gray-100/80 text-xs sm:text-[13px]">
                            <span className="font-semibold text-slate-500">Total Meal Cost</span>
                            <span className="font-black text-[#EF4444]">- Tk {computedMealCost.toFixed(2)}</span>
                        </div>

                        {stats.fixedCost > 0 && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-100/80 text-xs sm:text-[13px]">
                                <span className="font-semibold text-slate-500">Fixed Overhead (Room / Utilities / Maid)</span>
                                <span className="font-black text-[#EF4444]">- Tk {stats.fixedCost.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between py-2 border-b border-gray-100/80 text-xs sm:text-[13px]">
                            <span className="font-semibold text-slate-500">Total Month Cost</span>
                            <span className="font-black text-[#EF4444]">- Tk {computedTotalCost.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Final Balance Box */}
                    <div className={`rounded-2xl p-3.5 flex items-center justify-between relative overflow-hidden mt-3 ${
                        stats.currentBalance >= 0 
                            ? "bg-[#ECFDF5] border border-emerald-100/90" 
                            : "bg-rose-50/80 border border-rose-100"
                    }`}>
                        {/* Soft wave graphic on bottom right */}
                        <svg className={`absolute right-0 bottom-0 pointer-events-none w-36 h-15 ${
                            stats.currentBalance >= 0 ? "text-[#A7F3D0]/50" : "text-rose-200/50"
                        }`} viewBox="0 0 140 55" fill="currentColor" preserveAspectRatio="none">
                            <path d="M0,42 C35,22 65,48 98,28 C116,16 128,18 140,10 L140,55 L0,55 Z" />
                        </svg>

                        <div className="flex items-center gap-3 relative z-10">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                                stats.currentBalance >= 0 
                                    ? "bg-[#A7F3D0]/80 text-[#047857]" 
                                    : "bg-rose-200/80 text-rose-700"
                            }`}>
                                <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
                                    <path d="M4.5 5.5v3.5c0 1.5 3.3 2.8 7.5 2.8s7.5-1.3 7.5-2.8V5.5" />
                                    <path d="M4.5 9v3.5c0 1.5 3.3 2.8 7.5 2.8s7.5-1.3 7.5-2.8V9" />
                                    <path d="M4.5 12.5v3.5c0 1.5 3.3 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-3.5" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-wider ${
                                    stats.currentBalance >= 0 ? "text-[#047857]" : "text-rose-700"
                                }`}>
                                    FINAL BALANCE
                                </span>
                                <span className={`text-xl font-black leading-tight mt-0.5 ${
                                    stats.currentBalance >= 0 ? "text-[#047857]" : "text-rose-700"
                                }`}>
                                    {stats.currentBalance >= 0 ? "+ " : "- "}Tk {Math.abs(stats.currentBalance).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>


            {/* ═══════════════════════════════════════════════════════════════════
                DESKTOP VIEW: Responsive Financial Reports
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="hidden md:block max-w-7xl mx-auto space-y-6">
                
                {/* ─── Header Section ─── */}
                <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] flex items-center gap-3">
                            <IconReportAnalytics className="text-blue-500 w-8 h-8" stroke={2.5} />
                            Financial Reports
                        </h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                            Your detailed financial summary and meal expenses for {selectedMonthName} {selectedYear}.
                        </p>
                    </div>

                    {/* Right: Download Report Button + Month Selector */}
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {/* Download Report Button */}
                        <button
                            onClick={openDownloadModal}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm px-5 py-2.5 rounded-2xl shadow-md shadow-orange-500/25 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shrink-0"
                            title="Download Monthly Report"
                        >
                            <IconDownload size={18} stroke={2.5} />
                            <span>Download Report</span>
                        </button>

                        {/* Interactive Month & Year Selectors */}
                        <div className="flex items-center gap-2 bg-blue-50/90 border border-blue-100 px-3.5 py-2 rounded-2xl text-blue-700 font-bold text-sm shadow-sm shrink-0">
                            <IconCalendar size={17} className="text-blue-600 shrink-0" stroke={2.2} />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="bg-transparent font-bold text-blue-800 outline-none cursor-pointer"
                                aria-label="Select Month"
                            >
                                {monthOptions.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <span className="text-blue-300 font-black">•</span>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-transparent font-bold text-blue-800 outline-none cursor-pointer"
                                aria-label="Select Year"
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ─── Summary Cards ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    
                    {/* 1. Total Deposit */}
                    <div className="bg-white/95 backdrop-blur-sm p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center shrink-0 shadow-sm">
                                <IconWallet size={20} stroke={2.5} />
                            </div>
                            <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Total Deposit</p>
                        </div>
                        <div className="mt-2 relative z-10">
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                                Tk {isLoading ? "..." : stats.totalDeposit.toLocaleString()}
                            </h3>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-24 h-14 opacity-20 pointer-events-none text-emerald-500 group-hover:scale-105 transition-transform">
                            <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full fill-current">
                                <path d="M0,35 C20,10 40,45 60,20 C80,0 90,25 100,15 L100,50 L0,50 Z" />
                            </svg>
                        </div>
                    </div>

                    {/* 2. Total Meals */}
                    <div className="bg-white/95 backdrop-blur-sm p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100/60 flex items-center justify-center shrink-0 shadow-sm">
                                <IconChartPie size={20} stroke={2.5} />
                            </div>
                            <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Total Meals</p>
                        </div>
                        <div className="mt-2 relative z-10">
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                                {isLoading ? "..." : stats.totalMeals}
                            </h3>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-24 h-14 opacity-20 pointer-events-none text-amber-500 group-hover:scale-105 transition-transform">
                            <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full fill-current">
                                <path d="M0,30 C30,45 50,15 75,35 C90,20 95,10 100,25 L100,50 L0,50 Z" />
                            </svg>
                        </div>
                    </div>

                    {/* 3. Meal Rate */}
                    <div className="bg-white/95 backdrop-blur-sm p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100/60 flex items-center justify-center shrink-0 shadow-sm">
                                <IconReceipt2 size={20} stroke={2.5} />
                            </div>
                            <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Meal Rate</p>
                        </div>
                        <div className="mt-2 relative z-10">
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                                Tk {isLoading ? "..." : stats.liveMealRate.toFixed(2)}
                            </h3>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-24 h-14 opacity-20 pointer-events-none text-purple-500 group-hover:scale-105 transition-transform">
                            <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full fill-current">
                                <path d="M0,35 C20,10 40,45 60,20 C80,0 90,25 100,15 L100,50 L0,50 Z" />
                            </svg>
                        </div>
                    </div>

                    {/* 4. Current Balance */}
                    <div className={`p-5 md:p-6 rounded-3xl border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between ${
                        stats.currentBalance < 0 
                            ? 'bg-rose-50/70 border-rose-100 text-rose-600' 
                            : 'bg-white/95 backdrop-blur-sm border-gray-100 text-emerald-600'
                    }`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                stats.currentBalance < 0 
                                    ? 'bg-rose-100 text-rose-600' 
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100/60'
                            }`}>
                                <IconWallet size={20} stroke={2.5} />
                            </div>
                            <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Current Balance</p>
                        </div>
                        <div className="mt-2 relative z-10">
                            <h3 className={`text-2xl sm:text-3xl font-extrabold ${stats.currentBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isLoading ? "..." : `${stats.currentBalance >= 0 ? "+" : "-"} Tk ${Math.abs(stats.currentBalance).toLocaleString()}`}
                            </h3>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-24 h-14 opacity-20 pointer-events-none group-hover:scale-105 transition-transform ${stats.currentBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full fill-current">
                                <path d="M0,25 C25,45 55,10 80,30 C90,15 95,5 100,20 L100,50 L0,50 Z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* ─── Detailed Calculation Section ─── */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-gray-100 bg-slate-50/60 flex items-center gap-3">
                        <IconCalendarStats className="text-gray-500" size={20} stroke={2} />
                        <h3 className="font-extrabold text-gray-900 text-lg">Detailed Calculation</h3>
                    </div>
                    
                    <div className="p-6 sm:p-8">
                        {isLoading ? (
                            <p className="text-center text-gray-400 font-bold py-10">Calculating your data...</p>
                        ) : (
                            <div className="max-w-2xl mx-auto space-y-4">
                                
                                <div className="flex justify-between items-center py-3 border-b border-dashed border-gray-200">
                                    <span className="font-bold text-gray-600">Total Approved Deposit</span>
                                    <span className="font-extrabold text-gray-900 text-lg">Tk {stats.totalDeposit.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between items-center py-3 border-b border-dashed border-gray-200">
                                    <span className="font-bold text-gray-600">Total Meals Consumed</span>
                                    <span className="font-extrabold text-gray-900 text-lg">{stats.totalMeals}</span>
                                </div>

                                <div className="flex justify-between items-center py-3 border-b border-dashed border-gray-200">
                                    <span className="font-bold text-gray-600">Current Meal Rate</span>
                                    <span className="font-extrabold text-gray-900 text-lg">× Tk {stats.liveMealRate.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center py-3 border-b border-dashed border-gray-200">
                                    <span className="font-bold text-gray-600">Total Meal Cost</span>
                                    <span className="font-extrabold text-red-500 text-lg">- Tk {computedMealCost.toFixed(2)}</span>
                                </div>

                                {stats.fixedCost > 0 && (
                                    <div className="flex justify-between items-center py-3 border-b border-dashed border-gray-200">
                                        <span className="font-bold text-gray-600">Fixed Overhead (Room / Utilities / Maid)</span>
                                        <span className="font-extrabold text-red-500 text-lg">- Tk {stats.fixedCost.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center py-3 border-b-2 border-gray-800">
                                    <span className="font-bold text-gray-800">Total Month Cost</span>
                                    <span className="font-extrabold text-red-500 text-xl">- Tk {computedTotalCost.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center pt-4">
                                    <span className="font-extrabold text-gray-900 text-lg uppercase tracking-wide">Final Balance</span>
                                    <span className={`font-black text-3xl ${stats.currentBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {stats.currentBalance >= 0 ? "+" : "-"} Tk {Math.abs(stats.currentBalance).toFixed(2)}
                                    </span>
                                </div>
                                
                                {stats.currentBalance < 0 && (
                                    <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                                        <p className="text-sm font-bold text-red-600">
                                            ⚠️ You have a due of Tk {Math.abs(stats.currentBalance).toFixed(2)}. Please clear your payment to avoid interruption.
                                        </p>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>

            </div>


            {/* ═══════════════════════════════════════════════════════════════════
                DOWNLOAD REPORT MODAL: With Day-wise Breakdown & Export Actions
               ═══════════════════════════════════════════════════════════════════ */}
            {isDownloadModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsDownloadModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm shrink-0">
                                    <IconDownload size={22} stroke={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900">Download Monthly Report</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                        {reportDetails?.member?.name || "Member"} • Full Day-wise Breakdown for {selectedMonthName} {selectedYear}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                                {/* Month/Year Selector in Modal */}
                                <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs">
                                    <IconCalendar size={15} className="text-gray-400" />
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => handleMonthChangeInModal(Number(e.target.value), selectedYear)}
                                        className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
                                    >
                                        {monthOptions.map((m) => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                    <span className="text-gray-300">•</span>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => handleMonthChangeInModal(selectedMonth, Number(e.target.value))}
                                        className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
                                    >
                                        {yearOptions.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>

                                <button 
                                    onClick={() => setIsDownloadModalOpen(false)}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-200/50 transition-colors cursor-pointer"
                                    aria-label="Close"
                                >
                                    <IconX size={20} stroke={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
                            {isLoadingReportDetails ? (
                                <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-gray-400">
                                    <IconLoader2 size={32} className="animate-spin text-orange-500" />
                                    <p className="text-sm font-bold">Compiling full day-wise report...</p>
                                </div>
                            ) : reportDetails ? (
                                <>
                                    {/* Monthly Summary Strip */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3">
                                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Deposit</span>
                                            <p className="text-base font-black text-emerald-900 mt-0.5">
                                                Tk {reportDetails.stats.totalDeposit.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3">
                                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Total Meals</span>
                                            <p className="text-base font-black text-amber-900 mt-0.5">
                                                {reportDetails.stats.totalMeals} Meals
                                            </p>
                                        </div>
                                        <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3">
                                            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Live Meal Rate</span>
                                            <p className="text-base font-black text-purple-900 mt-0.5">
                                                Tk {reportDetails.stats.liveMealRate.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className={`rounded-2xl p-3 border ${
                                            reportDetails.stats.isPositive ? "bg-emerald-50/70 border-emerald-100" : "bg-rose-50/70 border-rose-100"
                                        }`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                reportDetails.stats.isPositive ? "text-emerald-700" : "text-rose-700"
                                            }`}>Final Balance</span>
                                            <p className={`text-base font-black mt-0.5 ${
                                                reportDetails.stats.isPositive ? "text-emerald-900" : "text-rose-900"
                                            }`}>
                                                {reportDetails.stats.isPositive ? "+" : "-"} Tk {Math.abs(reportDetails.stats.currentBalance).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Export Buttons */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                                                Export Full Month Statement
                                            </h4>
                                            <p className="text-xs text-gray-500 font-medium">
                                                Includes day-by-day meals, payments made, and bazaar expenses.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                            {/* Download PDF Button */}
                                            <button
                                                onClick={handleExportPDF}
                                                disabled={isExportingPDF}
                                                className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                            >
                                                {isExportingPDF ? (
                                                    <IconLoader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <IconFileTypePdf size={16} stroke={2.2} />
                                                )}
                                                <span>Download PDF</span>
                                            </button>

                                            {/* Download Excel Button */}
                                            <button
                                                onClick={handleExportExcel}
                                                disabled={isExportingExcel}
                                                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                            >
                                                {isExportingExcel ? (
                                                    <IconLoader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <IconFileSpreadsheet size={16} stroke={2.2} />
                                                )}
                                                <span>Download Excel</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Day-Wise Details Table Preview */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                                                Full Month Day-by-Day Activity
                                            </h4>
                                            <span className="text-xs text-gray-400 font-bold">
                                                {reportDetails.daysInMonth} Days
                                            </span>
                                        </div>

                                        <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead className="bg-slate-100/80 sticky top-0 z-10 text-slate-700 font-bold">
                                                    <tr>
                                                        <th className="py-2.5 px-3">Date</th>
                                                        <th className="py-2.5 px-2 text-center">B</th>
                                                        <th className="py-2.5 px-2 text-center">L</th>
                                                        <th className="py-2.5 px-2 text-center">D</th>
                                                        <th className="py-2.5 px-2 text-center">Guest</th>
                                                        <th className="py-2.5 px-2 text-center">Meals</th>
                                                        <th className="py-2.5 px-3">Payment / Deposit</th>
                                                        <th className="py-2.5 px-3">Bazaar Expense</th>
                                                        <th className="py-2.5 px-3">Details</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {reportDetails.dailyBreakdown.map((row: any) => {
                                                        const hasPayment = row.depositAmount > 0;
                                                        const hasBazaar = row.bazaarAmount > 0;
                                                        const hasActivity = row.totalMeals > 0 || hasPayment || hasBazaar;

                                                        return (
                                                            <tr 
                                                                key={row.day} 
                                                                className={`hover:bg-orange-50/40 transition-colors ${
                                                                    hasPayment ? "bg-emerald-50/30" : hasBazaar ? "bg-amber-50/20" : ""
                                                                }`}
                                                            >
                                                                <td className="py-2 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                                                                    {row.formattedDate}
                                                                </td>
                                                                <td className="py-2 px-2 text-center text-gray-600">
                                                                    {row.breakfast > 0 ? row.breakfast : "-"}
                                                                </td>
                                                                <td className="py-2 px-2 text-center text-gray-600">
                                                                    {row.lunch > 0 ? row.lunch : "-"}
                                                                </td>
                                                                <td className="py-2 px-2 text-center text-gray-600">
                                                                    {row.dinner > 0 ? row.dinner : "-"}
                                                                </td>
                                                                <td className="py-2 px-2 text-center text-orange-600 font-bold">
                                                                    {row.guest > 0 ? `+${row.guest}` : "-"}
                                                                </td>
                                                                <td className="py-2 px-2 text-center font-black text-slate-900">
                                                                    {row.totalMeals > 0 ? row.totalMeals : "-"}
                                                                </td>
                                                                <td className="py-2 px-3 whitespace-nowrap">
                                                                    {hasPayment ? (
                                                                        <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                                            Tk {row.depositAmount.toLocaleString()}
                                                                        </span>
                                                                    ) : row.deposits?.length > 0 ? (
                                                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                                                            Tk {row.deposits[0].amount} ({row.deposits[0].status})
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-3 whitespace-nowrap">
                                                                    {hasBazaar ? (
                                                                        <span className="font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                                                                            Tk {row.bazaarAmount.toLocaleString()}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-3 text-gray-500 max-w-[160px] truncate" title={[
                                                                    ...row.deposits.map((d: any) => `${d.method || "Deposit"}${d.note ? `: ${d.note}` : ""}`),
                                                                    ...row.bazaars.map((b: any) => b.description || "Bazaar shopping"),
                                                                ].filter(Boolean).join(" | ")}>
                                                                    {[
                                                                        ...row.deposits.map((d: any) => `${d.method || "Deposit"}${d.note ? `: ${d.note}` : ""}`),
                                                                        ...row.bazaars.map((b: any) => b.description || "Bazaar shopping"),
                                                                    ].filter(Boolean).join(" | ") || (hasActivity ? "" : "-")}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="bg-orange-50 font-black text-orange-900 border-t-2 border-orange-200">
                                                    <tr>
                                                        <td className="py-2.5 px-3">TOTAL</td>
                                                        <td className="py-2.5 px-2 text-center">{reportDetails.stats.breakdownMeals?.breakfast || 0}</td>
                                                        <td className="py-2.5 px-2 text-center">{reportDetails.stats.breakdownMeals?.lunch || 0}</td>
                                                        <td className="py-2.5 px-2 text-center">{reportDetails.stats.breakdownMeals?.dinner || 0}</td>
                                                        <td className="py-2.5 px-2 text-center">+{reportDetails.stats.breakdownMeals?.guest || 0}</td>
                                                        <td className="py-2.5 px-2 text-center">{reportDetails.stats.totalMeals}</td>
                                                        <td className="py-2.5 px-3 text-emerald-700">Tk {reportDetails.stats.totalDeposit.toLocaleString()}</td>
                                                        <td className="py-2.5 px-3 text-orange-700">Tk {reportDetails.stats.totalBazaar.toLocaleString()}</td>
                                                        <td className="py-2.5 px-3">Balance: Tk {reportDetails.stats.currentBalance}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-center text-gray-400 py-10 font-bold">Failed to load report data.</p>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-5 border-t border-gray-100 bg-[#F8FAFC] flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsDownloadModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
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