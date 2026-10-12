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
    IconFileTypePdf,
    IconDownload,
    IconLoader2,
    IconX,
    IconCheck,
    IconFileText
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

    // Full Report Export and Modal States
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isFullReportModalOpen, setIsFullReportModalOpen] = useState(false);
    const [fullReportData, setFullReportData] = useState<any>(null);
    const [isLoadingFullReport, setIsLoadingFullReport] = useState(false);

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

    const fetchFullReportData = async (m: number, y: number) => {
        setIsLoadingFullReport(true);
        try {
            const res = await fetch(`/api/admin/monthly-full-report?month=${m}&year=${y}`);
            if (res.ok) {
                const data = await res.json();
                setFullReportData(data);
                return data;
            }
        } catch (error) {
            console.error("Error fetching full report data:", error);
        } finally {
            setIsLoadingFullReport(false);
        }
        return null;
    };

    const openFullReportModal = async () => {
        setIsFullReportModalOpen(true);
        await fetchFullReportData(selectedMonth, selectedYear);
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

    // ─── Export All Members Full Details to Excel ───
    const handleExportExcel = async () => {
        setIsExportingExcel(true);
        try {
            let data = fullReportData;
            if (!data || data.month !== selectedMonth || data.year !== selectedYear) {
                data = await fetchFullReportData(selectedMonth, selectedYear);
            }
            if (!data) {
                alert("Failed to fetch full report details for Excel export.");
                return;
            }

            const workbook = XLSX.utils.book_new();

            // 1. Mess Summary Overview Tab
            const summaryRows = (data.memberReports || []).map((m: any, idx: number) => ({
                "#": idx + 1,
                "Member Name": m.name,
                "Phone": m.phone || "-",
                "Email": m.email || "-",
                "Role": m.role,
                "Total Meals": m.stats.totalMeals,
                "Meal Rate (Tk)": data.stats.liveMealRate.toFixed(2),
                "Meal Cost (Tk)": m.stats.mealCost,
                "Fixed Overhead (Tk)": m.stats.fixedCost,
                "Bazaar Spent (Tk)": m.stats.totalBazaar,
                "Total Cost (Tk)": m.stats.totalCost,
                "Total Deposit (Tk)": m.stats.totalDeposit,
                "Net Balance (Tk)": m.stats.currentBalance,
            }));

            // Totals Row
            const totalMealsAll = (data.memberReports || []).reduce((acc: number, m: any) => acc + m.stats.totalMeals, 0);
            const totalMealCostAll = (data.memberReports || []).reduce((acc: number, m: any) => acc + m.stats.mealCost, 0);
            const totalFixedCostAll = (data.memberReports || []).reduce((acc: number, m: any) => acc + m.stats.fixedCost, 0);
            const totalBazaarAll = (data.memberReports || []).reduce((acc: number, m: any) => acc + m.stats.totalBazaar, 0);
            const totalCostAll = (data.memberReports || []).reduce((acc: number, m: any) => acc + m.stats.totalCost, 0);
            const totalDepositAll = (data.memberReports || []).reduce((acc: number, m: any) => acc + m.stats.totalDeposit, 0);
            const totalBalanceAll = (data.memberReports || []).reduce((acc: number, m: any) => acc + m.stats.currentBalance, 0);

            summaryRows.push({
                "#": "TOTAL",
                "Member Name": `${data.memberReports.length} Members`,
                "Phone": "-",
                "Email": "-",
                "Role": "-",
                "Total Meals": totalMealsAll,
                "Meal Rate (Tk)": data.stats.liveMealRate.toFixed(2),
                "Meal Cost (Tk)": Math.round(totalMealCostAll * 100) / 100,
                "Fixed Overhead (Tk)": Math.round(totalFixedCostAll * 100) / 100,
                "Bazaar Spent (Tk)": Math.round(totalBazaarAll * 100) / 100,
                "Total Cost (Tk)": Math.round(totalCostAll * 100) / 100,
                "Total Deposit (Tk)": Math.round(totalDepositAll * 100) / 100,
                "Net Balance (Tk)": Math.round(totalBalanceAll * 100) / 100,
            });

            const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
            XLSX.utils.book_append_sheet(workbook, summarySheet, "Mess Summary");

            // 2. All Members Daily Log Master Tab
            const masterDailyRows: any[] = [];
            (data.memberReports || []).forEach((m: any) => {
                (m.dailyBreakdown || []).forEach((row: any) => {
                    const depositNotes = row.deposits.map((d: any) => `${d.method || "Deposit"}${d.note ? `: ${d.note}` : ""}`).join("; ") || "-";
                    const bazaarNotes = row.bazaars.map((b: any) => b.description || "Bazaar").join("; ") || "-";

                    masterDailyRows.push({
                        "Date": row.formattedDate,
                        "Day": row.dayName,
                        "Member Name": m.name,
                        "Phone": m.phone || "-",
                        "Breakfast": row.breakfast > 0 ? row.breakfast : 0,
                        "Lunch": row.lunch > 0 ? row.lunch : 0,
                        "Dinner": row.dinner > 0 ? row.dinner : 0,
                        "Guest": row.guest > 0 ? row.guest : 0,
                        "Total Meals": row.totalMeals,
                        "Deposit Amount (Tk)": row.depositAmount,
                        "Deposit Details": depositNotes,
                        "Bazaar Spent (Tk)": row.bazaarAmount,
                        "Bazaar Details": bazaarNotes,
                    });
                });
            });

            const dailyMasterSheet = XLSX.utils.json_to_sheet(masterDailyRows);
            XLSX.utils.book_append_sheet(workbook, dailyMasterSheet, "All Members Daily Log");

            // 3. Bazaar Purchases Tab
            if (data.allBazaars && data.allBazaars.length > 0) {
                const bazaarRows = data.allBazaars.map((b: any, idx: number) => ({
                    "#": idx + 1,
                    "Date": b.formattedDate,
                    "Purchaser Name": b.memberName,
                    "Phone": b.phone || "-",
                    "Items / Description": b.description,
                    "Amount (Tk)": b.amount,
                    "Status": b.status,
                }));
                bazaarRows.push({
                    "#": "TOTAL",
                    "Date": "-",
                    "Purchaser Name": "-",
                    "Phone": "-",
                    "Items / Description": "Total Bazaar Spent",
                    "Amount (Tk)": data.stats.totalBazaarCost,
                    "Status": "Approved",
                });
                const bazaarSheet = XLSX.utils.json_to_sheet(bazaarRows);
                XLSX.utils.book_append_sheet(workbook, bazaarSheet, "Bazaar Purchases");
            }

            // 4. Deposits Log Tab
            if (data.allDeposits && data.allDeposits.length > 0) {
                const depositRows = data.allDeposits.map((d: any, idx: number) => ({
                    "#": idx + 1,
                    "Date": d.formattedDate,
                    "Member Name": d.memberName,
                    "Phone": d.phone || "-",
                    "Amount (Tk)": d.amount,
                    "Payment Method": d.method,
                    "Status": d.status,
                    "Note": d.note || "-",
                }));
                depositRows.push({
                    "#": "TOTAL",
                    "Date": "-",
                    "Member Name": "-",
                    "Phone": "-",
                    "Amount (Tk)": data.stats.totalDeposit,
                    "Payment Method": "-",
                    "Status": "Approved",
                    "Note": "Total Deposits Collected",
                });
                const depositSheet = XLSX.utils.json_to_sheet(depositRows);
                XLSX.utils.book_append_sheet(workbook, depositSheet, "Deposits Log");
            }

            // 5. Individual Member Tabs (1-31 Day Statement for each member)
            (data.memberReports || []).forEach((m: any, mIdx: number) => {
                const memberDayRows = (m.dailyBreakdown || []).map((row: any) => {
                    const depositNotes = row.deposits.map((d: any) => `${d.method || "Deposit"}${d.note ? `: ${d.note}` : ""}`).join("; ") || "-";
                    const bazaarNotes = row.bazaars.map((b: any) => b.description || "Bazaar").join("; ") || "-";
                    return {
                        "Date": row.formattedDate,
                        "Day": row.dayName,
                        "Breakfast": row.breakfast > 0 ? row.breakfast : 0,
                        "Lunch": row.lunch > 0 ? row.lunch : 0,
                        "Dinner": row.dinner > 0 ? row.dinner : 0,
                        "Guest": row.guest > 0 ? row.guest : 0,
                        "Total Meals": row.totalMeals,
                        "Deposit (Tk)": row.depositAmount,
                        "Deposit Details": depositNotes,
                        "Bazaar (Tk)": row.bazaarAmount,
                        "Bazaar Details": bazaarNotes,
                    };
                });

                // Member Totals Row
                memberDayRows.push({
                    "Date": "TOTAL",
                    "Day": `${data.daysInMonth} Days`,
                    "Breakfast": m.stats.breakdownMeals?.breakfast || 0,
                    "Lunch": m.stats.breakdownMeals?.lunch || 0,
                    "Dinner": m.stats.breakdownMeals?.dinner || 0,
                    "Guest": m.stats.breakdownMeals?.guest || 0,
                    "Total Meals": m.stats.totalMeals,
                    "Deposit (Tk)": m.stats.totalDeposit,
                    "Deposit Details": `Balance: Tk ${m.stats.currentBalance}`,
                    "Bazaar (Tk)": m.stats.totalBazaar,
                    "Bazaar Details": `Meal Cost: Tk ${m.stats.mealCost}`,
                });

                const memSheet = XLSX.utils.json_to_sheet(memberDayRows);
                const safeTabName = (m.name || `Member_${mIdx + 1}`)
                    .replace(/[\\/?*[\]:]/g, "")
                    .trim()
                    .slice(0, 22);
                const finalTabName = `${mIdx + 1}.${safeTabName || `Mem${mIdx + 1}`}`;
                XLSX.utils.book_append_sheet(workbook, memSheet, finalTabName);
            });

            const safeMessName = (data.messName || "Mess").replace(/[^a-zA-Z0-9]/g, "_");
            XLSX.writeFile(workbook, `${safeMessName}_All_Members_Full_Report_${data.monthName}_${data.year}.xlsx`);
        } catch (error) {
            console.error("Excel Export Error:", error);
            alert("Failed to export complete Excel report.");
        } finally {
            setIsExportingExcel(false);
        }
    };

    // ─── Export All Members Full Details to PDF ───
    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            let data = fullReportData;
            if (!data || data.month !== selectedMonth || data.year !== selectedYear) {
                data = await fetchFullReportData(selectedMonth, selectedYear);
            }
            if (!data) {
                alert("Failed to fetch full report details for PDF export.");
                return;
            }

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // ═════════════════════════════════════════════════════════════════════
            // PAGE 1: MESS EXECUTIVE SUMMARY & ALL MEMBERS MASTER OVERVIEW
            // ═════════════════════════════════════════════════════════════════════
            
            // Header Banner
            doc.setFillColor(255, 107, 0); // Vibrant Mess Orange
            doc.rect(0, 0, pageWidth, 28, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(data.messName || "AMADER MESS", 14, 12);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text("All Members Monthly Full Financial & Activity Statement", 14, 20);

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${data.monthName} ${data.year}`, pageWidth - 14, 15, { align: "right" });

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated by: ${data.generatedBy.name} (${data.generatedBy.role})`, pageWidth - 14, 22, { align: "right" });

            // Executive Key Metrics Box
            autoTable(doc, {
                startY: 33,
                head: [["Total Members", "Total Mess Bazaar", "Total Meals", "Live Meal Rate", "Overhead / Member", "Total Deposits", "Mess Cash Balance"]],
                body: [[
                    `${data.stats.totalMembers}`,
                    `Tk ${data.stats.totalBazaarCost.toLocaleString()}`,
                    `${data.stats.totalMealsConsumed}`,
                    `Tk ${data.stats.liveMealRate.toFixed(2)}`,
                    `Tk ${data.stats.fixedCostPerMember.toFixed(2)}`,
                    `Tk ${data.stats.totalDeposit.toLocaleString()}`,
                    `${data.stats.currentBalance >= 0 ? "+" : "-"} Tk ${Math.abs(data.stats.currentBalance).toLocaleString()}`
                ]],
                theme: "grid",
                headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold", fontSize: 7.5, halign: "center" },
                bodyStyles: { textColor: [15, 23, 42], fontSize: 8.5, fontStyle: "bold", halign: "center" },
                margin: { left: 14, right: 14 },
            });

            // All Members Summary Overview Table
            const lastY1 = (doc as any).lastAutoTable?.finalY || 52;
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text("All Members Financial Summary Overview:", 14, lastY1 + 9);

            const summaryColumns = ["#", "Member Name", "Phone", "Meals", "Meal Cost", "Fixed Cost", "Bazaar", "Deposits", "Net Balance"];
            const summaryRows: any[] = [];
            
            let sumMeals = 0;
            let sumMealCost = 0;
            let sumFixedCost = 0;
            let sumBazaar = 0;
            let sumDeposits = 0;
            let sumBalance = 0;

            (data.memberReports || []).forEach((m: any, idx: number) => {
                sumMeals += m.stats.totalMeals;
                sumMealCost += m.stats.mealCost;
                sumFixedCost += m.stats.fixedCost;
                sumBazaar += m.stats.totalBazaar;
                sumDeposits += m.stats.totalDeposit;
                sumBalance += m.stats.currentBalance;

                summaryRows.push([
                    idx + 1,
                    m.name,
                    m.phone || "-",
                    m.stats.totalMeals,
                    `Tk ${m.stats.mealCost.toFixed(2)}`,
                    `Tk ${m.stats.fixedCost.toFixed(2)}`,
                    m.stats.totalBazaar > 0 ? `Tk ${m.stats.totalBazaar.toLocaleString()}` : "-",
                    `Tk ${m.stats.totalDeposit.toLocaleString()}`,
                    `${m.stats.isPositive ? "+" : "-"} Tk ${Math.abs(m.stats.currentBalance).toFixed(2)}`
                ]);
            });

            // Totals Row
            summaryRows.push([
                "TOTAL",
                `${data.memberReports.length} Members`,
                "-",
                sumMeals,
                `Tk ${sumMealCost.toFixed(2)}`,
                `Tk ${sumFixedCost.toFixed(2)}`,
                `Tk ${sumBazaar.toLocaleString()}`,
                `Tk ${sumDeposits.toLocaleString()}`,
                `${sumBalance >= 0 ? "+" : "-"} Tk ${Math.abs(sumBalance).toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: lastY1 + 13,
                head: [summaryColumns],
                body: summaryRows,
                theme: "striped",
                headStyles: { fillColor: [255, 107, 0], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
                bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
                footStyles: { fillColor: [241, 245, 249], fontStyle: "bold" },
                margin: { left: 14, right: 14 },
            });

            // ═════════════════════════════════════════════════════════════════════
            // SUBSEQUENT PAGES: COMPLETE DAY-BY-DAY STATEMENT FOR EVERY MEMBER
            // ═════════════════════════════════════════════════════════════════════
            (data.memberReports || []).forEach((m: any, mIdx: number) => {
                doc.addPage();

                // Member Header Band
                doc.setFillColor(30, 41, 59); // Slate 800
                doc.rect(0, 0, pageWidth, 24, "F");

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(13);
                doc.setFont("helvetica", "bold");
                doc.text(`${mIdx + 1}. Member: ${m.name} (${m.role})`, 14, 10);

                doc.setFontSize(8.5);
                doc.setFont("helvetica", "normal");
                doc.text(`Phone: ${m.phone || "N/A"}  |  Email: ${m.email || "N/A"}  |  Mess: ${data.messName}`, 14, 17);

                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.text(`${data.monthName} ${data.year}`, pageWidth - 14, 14, { align: "right" });

                // Member Financial Snapshot Box
                autoTable(doc, {
                    startY: 28,
                    head: [["Deposits Collected", "Total Meals", "Meal Rate", "Meal Cost", "Fixed Cost", "Bazaar Spent", "Final Net Balance"]],
                    body: [[
                        `Tk ${m.stats.totalDeposit.toLocaleString()}`,
                        `${m.stats.totalMeals}`,
                        `Tk ${data.stats.liveMealRate.toFixed(2)}`,
                        `Tk ${m.stats.mealCost.toFixed(2)}`,
                        `Tk ${m.stats.fixedCost.toFixed(2)}`,
                        `Tk ${m.stats.totalBazaar.toLocaleString()}`,
                        `${m.stats.isPositive ? "+" : "-"} Tk ${Math.abs(m.stats.currentBalance).toFixed(2)}`
                    ]],
                    theme: "grid",
                    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: "bold", fontSize: 7, halign: "center" },
                    bodyStyles: { textColor: [15, 23, 42], fontSize: 8, fontStyle: "bold", halign: "center" },
                    margin: { left: 14, right: 14 },
                });

                // Member Day-by-Day Statement Table
                const lastYMem = (doc as any).lastAutoTable?.finalY || 45;
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 41, 59);
                doc.text(`Full Month Daily Meals, Payments & Bazaar Activity Log (${data.monthName} ${data.year}):`, 14, lastYMem + 7);

                const dayColumns = ["Date", "Day", "B", "L", "D", "Guest", "Meals", "Deposit (Tk)", "Bazaar (Tk)", "Notes & Details"];
                const dayRows: any[] = [];

                (m.dailyBreakdown || []).forEach((row: any) => {
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

                    dayRows.push([
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
                    ]);
                });

                // Member Totals Row
                dayRows.push([
                    "TOTAL",
                    "-",
                    m.stats.breakdownMeals?.breakfast || "-",
                    m.stats.breakdownMeals?.lunch || "-",
                    m.stats.breakdownMeals?.dinner || "-",
                    m.stats.breakdownMeals?.guest || "-",
                    `${m.stats.totalMeals}`,
                    `Tk ${m.stats.totalDeposit.toLocaleString()}`,
                    `Tk ${m.stats.totalBazaar.toLocaleString()}`,
                    `Balance: ${m.stats.isPositive ? "+" : "-"} Tk ${Math.abs(m.stats.currentBalance).toFixed(2)}`
                ]);

                autoTable(doc, {
                    startY: lastYMem + 10,
                    head: [dayColumns],
                    body: dayRows,
                    theme: "striped",
                    headStyles: { fillColor: [255, 107, 0], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 6.8 },
                    bodyStyles: { fontSize: 6.8, textColor: [51, 65, 85] },
                    margin: { left: 14, right: 14 },
                });
            });

            // ═════════════════════════════════════════════════════════════════════
            // FINAL PAGE: MESS-WIDE BAZAAR PURCHASES & DEPOSITS AUDIT LOG
            // ═════════════════════════════════════════════════════════════════════
            if ((data.allBazaars && data.allBazaars.length > 0) || (data.allDeposits && data.allDeposits.length > 0)) {
                doc.addPage();

                // Header Banner
                doc.setFillColor(255, 107, 0);
                doc.rect(0, 0, pageWidth, 20, "F");

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(13);
                doc.setFont("helvetica", "bold");
                doc.text("Mess Bazaar Shopping & Deposit Transactions Audit Log", 14, 13);

                let currentAuditY = 27;

                // 1. All Bazaar Shopping Table
                if (data.allBazaars && data.allBazaars.length > 0) {
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(30, 41, 59);
                    doc.text(`All Bazaar Expenses for ${data.monthName} ${data.year} (Total: Tk ${data.stats.totalBazaarCost.toLocaleString()}):`, 14, currentAuditY);

                    const bazaarCols = ["Date", "Purchaser Name", "Phone", "Items / Description", "Amount (Tk)", "Status"];
                    const bazaarRows = data.allBazaars.map((b: any) => [
                        b.formattedDate,
                        b.memberName,
                        b.phone || "-",
                        b.description || "Bazaar shopping",
                        `Tk ${b.amount.toLocaleString()}`,
                        b.status
                    ]);

                    autoTable(doc, {
                        startY: currentAuditY + 4,
                        head: [bazaarCols],
                        body: bazaarRows,
                        theme: "striped",
                        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.2 },
                        bodyStyles: { fontSize: 7.2, textColor: [51, 65, 85] },
                        margin: { left: 14, right: 14 },
                    });

                    currentAuditY = (doc as any).lastAutoTable?.finalY + 10;
                }

                // 2. All Deposits Table
                if (data.allDeposits && data.allDeposits.length > 0) {
                    if (currentAuditY > pageHeight - 60) {
                        doc.addPage();
                        currentAuditY = 20;
                    }

                    doc.setFontSize(10);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(30, 41, 59);
                    doc.text(`All Member Deposits for ${data.monthName} ${data.year} (Total: Tk ${data.stats.totalDeposit.toLocaleString()}):`, 14, currentAuditY);

                    const depositCols = ["Date", "Member Name", "Phone", "Amount (Tk)", "Method", "Status", "Note"];
                    const depositRows = data.allDeposits.map((d: any) => [
                        d.formattedDate,
                        d.memberName,
                        d.phone || "-",
                        `Tk ${d.amount.toLocaleString()}`,
                        d.method || "Cash",
                        d.status,
                        d.note || "-"
                    ]);

                    autoTable(doc, {
                        startY: currentAuditY + 4,
                        head: [depositCols],
                        body: depositRows,
                        theme: "striped",
                        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.2 },
                        bodyStyles: { fontSize: 7.2, textColor: [51, 65, 85] },
                        margin: { left: 14, right: 14 },
                    });
                }
            }

            // Page numbers on all pages
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(7.5);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `Page ${i} of ${totalPages} · ${data.messName || "Amader Mess"} · All Members Full Monthly Report`,
                    pageWidth / 2,
                    pageHeight - 6,
                    { align: "center" }
                );
            }

            const safeMessName = (data.messName || "Mess").replace(/[^a-zA-Z0-9]/g, "_");
            doc.save(`${safeMessName}_All_Members_Full_Report_${data.monthName}_${data.year}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Failed to export complete PDF report.");
        } finally {
            setIsExportingPDF(false);
        }
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
                            disabled={isExportingExcel || isExportingPDF}
                            className="w-full bg-white border border-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2.5 rounded-2xl shadow-sm hover:bg-emerald-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-60"
                        >
                            {isExportingExcel ? (
                                <IconLoader2 size={16} className="animate-spin text-emerald-600" />
                            ) : (
                                <span className="w-4 h-4 rounded bg-[#107C41] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                    X
                                </span>
                            )}
                            <span className="truncate">{isExportingExcel ? "Generating..." : "Download Excel"}</span>
                        </button>

                        {/* Download PDF */}
                        <button 
                            onClick={handleExportPDF}
                            disabled={isExportingExcel || isExportingPDF}
                            className="w-full bg-white border border-rose-100 text-rose-700 text-xs font-bold px-3 py-2.5 rounded-2xl shadow-sm hover:bg-rose-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-60"
                        >
                            {isExportingPDF ? (
                                <IconLoader2 size={16} className="animate-spin text-rose-600" />
                            ) : (
                                <span className="w-4 h-4 rounded bg-[#E11D48] text-white font-black text-[7px] flex items-center justify-center shrink-0">
                                    PDF
                                </span>
                            )}
                            <span className="truncate">{isExportingPDF ? "Generating..." : "Download PDF"}</span>
                        </button>
                    </div>

                    {/* Row 3: All Members Full Report Statement Modal Trigger */}
                    <button
                        onClick={openFullReportModal}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold py-2 px-3 rounded-2xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                    >
                        <IconDownload size={15} stroke={2.2} />
                        <span>All Members Statement & Preview</span>
                    </button>
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

                        <button 
                            onClick={handleExportExcel} 
                            disabled={isExportingExcel || isExportingPDF}
                            className="flex items-center gap-2 bg-white border border-green-200 text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                        >
                            {isExportingExcel ? (
                                <IconLoader2 size={18} className="animate-spin text-green-600" />
                            ) : (
                                <IconFileSpreadsheet size={18} stroke={2.5} className="text-green-600" />
                            )}
                            {isExportingExcel ? "Generating Excel..." : "Download Excel"}
                        </button>

                        <button 
                            onClick={handleExportPDF} 
                            disabled={isExportingExcel || isExportingPDF}
                            className="flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                        >
                            {isExportingPDF ? (
                                <IconLoader2 size={18} className="animate-spin text-red-500" />
                            ) : (
                                <IconFileTypePdf size={18} stroke={2.5} className="text-red-500" />
                            )}
                            {isExportingPDF ? "Generating PDF..." : "Download PDF"}
                        </button>

                        <button
                            onClick={openFullReportModal}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm px-4 py-2 rounded-lg shadow-sm transition-transform active:scale-95 cursor-pointer"
                        >
                            <IconDownload size={17} stroke={2.2} />
                            Full Report Preview
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

            {/* ─── All Members Full Report Download & Preview Modal ─── */}
            {isFullReportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-orange-50 to-amber-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/25">
                                    <IconFileReport size={26} stroke={2.2} />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">
                                        All Members Monthly Full Report
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                                        {monthName} {selectedYear} · Complete audit statements for all members
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsFullReportModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
                            >
                                <IconX size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
                            {isLoadingFullReport ? (
                                <div className="py-16 flex flex-col items-center justify-center gap-3">
                                    <IconLoader2 size={36} className="animate-spin text-orange-500" />
                                    <p className="text-sm font-bold text-gray-500">Loading complete mess records & logs...</p>
                                </div>
                            ) : fullReportData ? (
                                <>
                                    {/* Highlights Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3">
                                            <p className="text-[10px] font-bold text-orange-600 uppercase">Total Members</p>
                                            <p className="text-lg font-black text-gray-900 mt-0.5">{fullReportData.stats.totalMembers}</p>
                                        </div>
                                        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3">
                                            <p className="text-[10px] font-bold text-blue-600 uppercase">Live Meal Rate</p>
                                            <p className="text-lg font-black text-gray-900 mt-0.5">Tk {fullReportData.stats.liveMealRate.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Total Deposits</p>
                                            <p className="text-lg font-black text-gray-900 mt-0.5">Tk {fullReportData.stats.totalDeposit.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3">
                                            <p className="text-[10px] font-bold text-purple-600 uppercase">Total Bazaar</p>
                                            <p className="text-lg font-black text-gray-900 mt-0.5">Tk {fullReportData.stats.totalBazaarCost.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Export Action Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        {/* PDF Card */}
                                        <div className="border border-rose-100 bg-rose-50/30 rounded-2xl p-4 flex flex-col justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                                                    <IconFileTypePdf size={22} stroke={2.2} />
                                                    <span>Full Report PDF</span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                                    Includes executive summary, master member overview, day-by-day (1-31) activity sheets for every member, and full bazaar/deposit audit logs.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleExportPDF}
                                                disabled={isExportingPDF}
                                                className="w-full bg-[#E11D48] hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-60"
                                            >
                                                {isExportingPDF ? (
                                                    <>
                                                        <IconLoader2 size={16} className="animate-spin" />
                                                        <span>Generating PDF...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconDownload size={16} stroke={2.4} />
                                                        <span>Download Complete PDF</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Excel Card */}
                                        <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-4 flex flex-col justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                                    <IconFileSpreadsheet size={22} stroke={2.2} />
                                                    <span>Full Report Excel (.xlsx)</span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                                    Includes multi-sheet workbook with Mess Summary, master 31-day activity logs, bazaar shopping receipts, deposits log, and separate member tabs.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleExportExcel}
                                                disabled={isExportingExcel}
                                                className="w-full bg-[#107C41] hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-60"
                                            >
                                                {isExportingExcel ? (
                                                    <>
                                                        <IconLoader2 size={16} className="animate-spin" />
                                                        <span>Generating Excel...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconDownload size={16} stroke={2.4} />
                                                        <span>Download Complete Excel</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Members Included List Preview */}
                                    <div className="space-y-2 pt-2">
                                        <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                                            Members Included in Report ({fullReportData.memberReports?.length || 0})
                                        </h4>
                                        <div className="border border-gray-100 rounded-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-gray-100 bg-white">
                                            {fullReportData.memberReports.map((m: any, idx: number) => (
                                                <div key={m.id} className="p-3 flex items-center justify-between text-xs hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-gray-400 font-bold w-4 text-center">{idx + 1}</span>
                                                        <div>
                                                            <p className="font-extrabold text-gray-900">{m.name}</p>
                                                            <p className="text-[10px] text-gray-500 font-medium">{m.phone || m.email || "Member"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-extrabold text-gray-900">{m.stats.totalMeals} Meals · Tk {m.stats.totalDeposit.toLocaleString()}</p>
                                                        <p className={`text-[10px] font-bold ${m.stats.currentBalance < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                                            Balance: {m.stats.isPositive ? "+" : "-"}Tk {Math.abs(m.stats.currentBalance).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-center text-gray-400 py-10 font-bold">Failed to load report data.</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-5 border-t border-gray-100 bg-[#F8FAFC] flex items-center justify-end">
                            <button
                                onClick={() => setIsFullReportModalOpen(false)}
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
