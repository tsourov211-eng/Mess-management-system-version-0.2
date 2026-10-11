"use client";

import { useState, useEffect } from "react";
import { 
    IconToolsKitchen2, 
    IconCalendarEvent, 
    IconChevronLeft, 
    IconChevronRight, 
    IconDeviceFloppy, 
    IconChartPie, 
    IconReceipt2 
} from "@tabler/icons-react";

export default function FoodManagementPage() {
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split("T")[0];
    });

    const [members, setMembers] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalMealsToday: 0,
        currentMealRate: 0,
        todayBazaar: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchMeals();
    }, [currentDate]);

    const fetchMeals = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/meals?date=${currentDate}`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
                if (data.stats) {
                    setStats(data.stats);
                }
            }
        } catch (error) {
            console.error("Error fetching meals:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMealChange = (index: number, field: string, val: string) => {
        const updated = [...members];
        updated[index] = {
            ...updated[index],
            [field]: Math.max(0, Number(val) || 0),
        };
        setMembers(updated);
    };

    const handlePrevDay = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 1);
        setCurrentDate(d.toISOString().split("T")[0]);
    };

    const handleNextDay = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 1);
        setCurrentDate(d.toISOString().split("T")[0]);
    };

    const handleSaveMeals = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/meals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: currentDate,
                    meals: members,
                }),
            });

            if (res.ok) {
                alert("✅ Meal data saved successfully!");
                fetchMeals();
            } else {
                alert("❌ Failed to save meals!");
            }
        } catch (error) {
            console.error("Save meals error:", error);
            alert("❌ Server error occurred!");
        } finally {
            setIsSaving(false);
        }
    };

    // Formatted date text
    const targetDateObj = new Date(currentDate);
    const todayObj = new Date();
    const isToday = targetDateObj.toDateString() === todayObj.toDateString();
    const formattedDateText = isToday 
        ? `Today, ${targetDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : targetDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    // Page total meal calculation (Regular + Approved Guests)
    const totalMealsAdded = members.reduce((acc, m) => {
        return acc + (Number(m.breakfast) || 0) + (Number(m.lunch) || 0) + (Number(m.dinner) || 0) + (Number(m.guest) || 0);
    }, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            
            {/* ─── Header Section ─── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#450705] tracking-tight">Food Management</h1>
                    <p className="text-gray-500 text-sm mt-1.5 font-medium">Manage daily meals, track consumption and calculate meal rates.</p>
                </div>
            </div>

            {/* ─── Quick Stats Grid ─── */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6">
                
                {/* Stat 1 */}
                <div className="bg-white p-2 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 mx-auto sm:mx-0">
                        <IconToolsKitchen2 className="w-4 h-4 sm:w-6 sm:h-6" stroke={2} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-[10px] sm:text-xs font-bold mb-0.5 truncate max-w-[80px] sm:max-w-none">Total Meals</p>
                        <h3 className="text-sm sm:text-2xl font-extrabold text-gray-900">{stats.totalMealsToday}</h3>
                    </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white p-2 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mx-auto sm:mx-0">
                        <IconChartPie className="w-4 h-4 sm:w-6 sm:h-6" stroke={2} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-[10px] sm:text-xs font-bold mb-0.5 truncate max-w-[80px] sm:max-w-none">Meal Rate</p>
                        <h3 className="text-sm sm:text-2xl font-extrabold text-gray-900">Tk {stats.currentMealRate.toFixed(2)}</h3>
                    </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white p-2 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0 mx-auto sm:mx-0">
                        <IconReceipt2 className="w-4 h-4 sm:w-6 sm:h-6" stroke={2} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-[10px] sm:text-xs font-bold mb-0.5 truncate max-w-[80px] sm:max-w-none">Bazaar</p>
                        <h3 className="text-sm sm:text-2xl font-extrabold text-gray-900">Tk {stats.todayBazaar}</h3>
                    </div>
                </div>
            </div>

            {/* ─── Main Meal Entry Section ─── */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                
                {/* Date Controller */}
                <div className="bg-[#F8FAFC] p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm shrink-0">
                            <IconCalendarEvent className="w-5 h-5" stroke={1.5} />
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-[#450705]">Daily Meal Entry</h2>
                            <p className="text-xs font-bold text-gray-500 mt-0.5">Enter meal counts for members</p>
                        </div>
                    </div>

                    {/* Date Navigation */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-full sm:w-auto justify-between sm:justify-center">
                        <button 
                            onClick={handlePrevDay}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                        >
                            <IconChevronLeft className="w-5 h-5" stroke={2} />
                        </button>
                        <span className="px-4 py-1 text-sm font-extrabold text-gray-800 w-36 text-center">
                            {formattedDateText}
                        </span>
                        <button 
                            onClick={handleNextDay}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                        >
                            <IconChevronRight className="w-5 h-5" stroke={2} />
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="py-3 px-2 sm:py-4 sm:px-6 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wider">Member</th>
                                <th className="py-3 px-1 sm:py-4 sm:px-6 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wider text-center">Break.</th>
                                <th className="py-3 px-1 sm:py-4 sm:px-6 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wider text-center">Lunch</th>
                                <th className="py-3 px-1 sm:py-4 sm:px-6 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-wider text-center">Dinner</th>
                                <th className="py-3 px-2 sm:py-4 sm:px-6 text-[10px] sm:text-xs font-extrabold text-[#FF6B00] uppercase tracking-wider text-center bg-orange-50/50">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400 font-bold text-sm">
                                        Loading meals...
                                    </td>
                                </tr>
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400 font-bold text-sm">
                                        No members registered yet.
                                    </td>
                                </tr>
                            ) : members.map((member, idx) => {
                                const guestPortion = Number(member.guest) || 0;
                                const rowTotal = (Number(member.breakfast) || 0) + (Number(member.lunch) || 0) + (Number(member.dinner) || 0) + guestPortion;
                                const initial = member.name ? member.name.charAt(0).toUpperCase() : "M";

                                return (
                                    <tr key={member.userId} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-2 px-2 sm:py-4 sm:px-6">
                                            <div className="flex items-center gap-1.5 sm:gap-3">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0">
                                                    {initial}
                                                </div>
                                                <span className="font-extrabold text-gray-900 text-[10px] sm:text-sm truncate max-w-[50px] sm:max-w-none">{member.name.split(' ')[0]}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-1 sm:py-4 sm:px-6 text-center">
                                            <input 
                                                type="number" 
                                                value={member.breakfast} 
                                                onChange={(e) => handleMealChange(idx, "breakfast", e.target.value)}
                                                step="0.5" 
                                                min="0" 
                                                className="w-10 sm:w-16 text-center py-1 sm:py-1.5 bg-gray-50 border border-gray-200 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all mx-auto" 
                                            />
                                        </td>
                                        <td className="py-2 px-1 sm:py-4 sm:px-6 text-center">
                                            <input 
                                                type="number" 
                                                value={member.lunch} 
                                                onChange={(e) => handleMealChange(idx, "lunch", e.target.value)}
                                                step="0.5" 
                                                min="0" 
                                                className="w-10 sm:w-16 text-center py-1 sm:py-1.5 bg-gray-50 border border-gray-200 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all mx-auto" 
                                            />
                                        </td>
                                        <td className="py-2 px-1 sm:py-4 sm:px-6 text-center">
                                            <input 
                                                type="number" 
                                                value={member.dinner} 
                                                onChange={(e) => handleMealChange(idx, "dinner", e.target.value)}
                                                step="0.5" 
                                                min="0" 
                                                className="w-10 sm:w-16 text-center py-1 sm:py-1.5 bg-gray-50 border border-gray-200 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all mx-auto" 
                                            />
                                        </td>
                                        <td className="py-2 px-2 sm:py-4 sm:px-6 text-center bg-orange-50/50 border-l border-orange-100/50">
                                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                <span className="font-extrabold text-gray-900 text-xs sm:text-base">{rowTotal.toFixed(1)}</span>
                                                {guestPortion > 0 && (
                                                    <span 
                                                        className="text-[10px] font-extrabold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full border border-orange-200"
                                                        title={`${guestPortion} approved guest meal(s)`}
                                                    >
                                                        +{guestPortion}G
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Total Row for the Table */}
                <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end px-6">
                    <p className="text-sm font-bold text-gray-600">
                        Total Meals Added: <span className="text-lg font-extrabold text-[#FF6B00] ml-2">{totalMealsAdded.toFixed(1)}</span>
                    </p>
                </div>
            </div>

            {/* Save Button (Moved to Bottom) */}
            <div className="pt-2 pb-6">
                <button 
                    onClick={handleSaveMeals}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/30 transition-all w-full cursor-pointer disabled:opacity-50"
                >
                    <IconDeviceFloppy className="w-5 h-5" stroke={2.5} />
                    {isSaving ? "Saving..." : "Save Today's Meals"}
                </button>
            </div>

        </div>
    );
}