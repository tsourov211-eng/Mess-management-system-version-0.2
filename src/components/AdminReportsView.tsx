"use client";

import { useState, useEffect } from "react";
import { 
    IconFileReport, 
    IconWallet, 
    IconShoppingBag,
    IconUsersGroup,
    IconCoins,
    IconToolsKitchen2,
    IconCalendar,
    IconFileSpreadsheet,
    IconFileTypePdf,
    IconSearch,
    IconReport,
    IconDotsVertical,
    IconAlertTriangle
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
                setMembers(data.memberReports);
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter members for the table
    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate dynamic totals based on currently filtered members
    const filteredTotals = filteredMembers.reduce(
        (acc, curr) => ({
            bazaarAmount: acc.bazaarAmount + curr.bazaarAmount,
            depositAmount: acc.depositAmount + curr.depositAmount,
            mealsConsumed: acc.mealsConsumed + curr.mealsConsumed,
            mealCost: acc.mealCost + (curr.mealCost || 0),
            fixedCost: acc.fixedCost + (curr.fixedCost || 0),
            totalCost: acc.totalCost + (curr.totalCost || 0),
            currentBalance: acc.currentBalance + curr.currentBalance,
        }),
        { bazaarAmount: 0, depositAmount: 0, mealsConsumed: 0, mealCost: 0, fixedCost: 0, totalCost: 0, currentBalance: 0 }
    );

    const negativeMembers = filteredMembers.filter(m => m.currentBalance < 0);
    const negativeMembersCount = negativeMembers.length;
    const totalNegativeAmount = negativeMembers.reduce((acc, curr) => acc + curr.currentBalance, 0);

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

    const handleExportExcel = () => {
        // Format data for excel with complete Bangladeshi Mess calculations
        const excelData = filteredMembers.map((m, index) => ({
            "#": index + 1,
            "Member Name": m.name,
            "Deposit Amount (Tk)": m.depositAmount,
            "Meals Consumed": m.mealsConsumed,
            "Meal Cost (Tk)": m.mealCost ?? Math.round(m.mealsConsumed * (stats.liveMealRate || 0) * 100) / 100,
            "Fixed Overhead (Tk)": m.fixedCost ?? stats.fixedCostPerMember ?? 0,
            "Total Cost (Tk)": m.totalCost ?? ((m.mealCost ?? 0) + (m.fixedCost ?? 0)),
            "Net Balance (Tk)": m.currentBalance
        }));
        
        // Add Total row
        excelData.push({
            "#": "Total",
            "Member Name": "-",
            "Deposit Amount (Tk)": filteredTotals.depositAmount,
            "Meals Consumed": filteredTotals.mealsConsumed,
            "Meal Cost (Tk)": filteredTotals.mealCost,
            "Fixed Overhead (Tk)": filteredTotals.fixedCost,
            "Total Cost (Tk)": filteredTotals.totalCost,
            "Net Balance (Tk)": filteredTotals.currentBalance
        } as any);

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
        XLSX.writeFile(workbook, `Mess_Report_${monthName}_${selectedYear}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
        
        doc.setFontSize(16);
        doc.text(`Financial Report - ${monthName} ${selectedYear}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Live Meal Rate: Tk ${(stats.liveMealRate || 0).toFixed(2)} | Fixed Overhead: Tk ${(stats.fixedCostPerMember || 0).toFixed(2)}`, 14, 26);

        const tableColumn = ["#", "Member Name", "Deposit", "Meals", "Meal Cost", "Fixed Cost", "Net Balance"];
        const tableRows = [];

        filteredMembers.forEach((m, index) => {
            tableRows.push([
                index + 1,
                m.name,
                m.depositAmount.toFixed(2),
                m.mealsConsumed,
                (m.mealCost || 0).toFixed(2),
                (m.fixedCost || 0).toFixed(2),
                (m.currentBalance < 0 ? "-" : "+") + " " + Math.abs(m.currentBalance).toFixed(2)
            ]);
        });

        // Add total row
        tableRows.push([
            "Total",
            "-",
            filteredTotals.depositAmount.toFixed(2),
            filteredTotals.mealsConsumed,
            filteredTotals.mealCost.toFixed(2),
            filteredTotals.fixedCost.toFixed(2),
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

        doc.save(`Mess_Report_${monthName}_${selectedYear}.pdf`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
            
            {/* ─── Header Section ─── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                        <IconFileReport className="w-7 h-7" stroke={2} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B]">Financial Reports</h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                            Complete member-wise bazaar and expense report for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
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

                    <button onClick={handleExportExcel} className="flex items-center gap-2 bg-white border border-green-200 text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                        <IconFileSpreadsheet size={18} stroke={2.5} className="text-green-600" />
                        Download Excel
                    </button>

                    <button onClick={handleExportPDF} className="flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                        <IconFileTypePdf size={18} stroke={2.5} className="text-red-500" />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* ─── Summary Cards ─── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                        <IconUsersGroup className="w-5 h-5 md:w-6 md:h-6" stroke={2} />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Members</p>
                        <h3 className="text-sm md:text-base font-bold text-gray-900 mt-0.5">{isLoading ? "..." : stats.totalMembers}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <IconShoppingBag className="w-5 h-5 md:w-6 md:h-6" stroke={2} />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Bazaar</p>
                        <h3 className="text-sm md:text-base font-bold text-gray-900 mt-0.5">Tk {isLoading ? "..." : stats.totalBazaarCost.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <IconCoins className="w-5 h-5 md:w-6 md:h-6" stroke={2} />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Deposit</p>
                        <h3 className="text-sm md:text-base font-bold text-green-600 mt-0.5">Tk {isLoading ? "..." : stats.totalDeposit.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <IconToolsKitchen2 className="w-5 h-5 md:w-6 md:h-6" stroke={2} />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Meals</p>
                        <h3 className="text-sm md:text-base font-bold text-gray-900 mt-0.5">{isLoading ? "..." : stats.totalMealsConsumed}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                        <IconWallet className="w-5 h-5 md:w-6 md:h-6" stroke={2} />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</p>
                        <h3 className={`text-sm md:text-base font-bold mt-0.5 ${stats.currentBalance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {isLoading ? "..." : `${stats.currentBalance < 0 ? '- ' : ''}Tk ${Math.abs(stats.currentBalance).toLocaleString()}`}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                        <IconAlertTriangle className="w-5 h-5 md:w-6 md:h-6" stroke={2} />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Due</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <h3 className="text-sm md:text-base font-bold text-red-500">
                                {isLoading ? "..." : `- Tk ${Math.abs(totalNegativeAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                            </h3>
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                {isLoading ? "..." : `${negativeMembersCount} ${negativeMembersCount === 1 ? 'member' : 'members'}`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Table Section ─── */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 border border-gray-200">
                            <IconReport className="w-5 h-5" stroke={2} />
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
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Bazaar Amount (Tk)</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Deposit Amount (Tk)</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Meals Consumed</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Current Balance (Tk)</th>
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
                                                {member.name.charAt(0).toUpperCase()}
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
                                        {member.currentBalance < 0 ? "-" : "+"} Tk {Math.abs(member.currentBalance).toFixed(2)}
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                                            <IconDotsVertical size={18} stroke={2} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        
                        {/* ─── Sticky Total Footer ─── */}
                        {!isLoading && filteredMembers.length > 0 && (
                            <tfoot className="bg-[#F8FAFC] border-t-2 border-gray-200 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                <tr>
                                    <td className="py-4 px-6 text-sm font-black text-gray-900" colSpan={2}>
                                        Total
                                    </td>
                                    <td className="py-4 px-6 text-sm font-black text-gray-900 text-right whitespace-nowrap">
                                        Tk {filteredTotals.bazaarAmount.toLocaleString(undefined, {minimumFractionDigits: 0})}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-black text-gray-900 text-right whitespace-nowrap">
                                        Tk {filteredTotals.depositAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-black text-gray-900 text-center whitespace-nowrap">
                                        {filteredTotals.mealsConsumed.toLocaleString()}
                                    </td>
                                    <td className={`py-4 px-6 text-sm font-black text-right whitespace-nowrap ${filteredTotals.currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {filteredTotals.currentBalance < 0 ? '- ' : ''}Tk {Math.abs(filteredTotals.currentBalance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </td>
                                    <td className="py-4 px-6 text-center text-gray-500 font-bold">-</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
