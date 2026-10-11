"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
    IconSearch, 
    IconPlus, 
    IconWallet, 
    IconChartBar, 
    IconPhone, 
    IconEdit, 
    IconTrash, 
    IconCheck, 
    IconX, 
    IconUserCircle, 
    IconAlertTriangle, 
    IconLoader2 
} from "@tabler/icons-react";

export default function MembersListPage() {
    const { data: session } = useSession();
    const currentUserRole = (session?.user as { role?: string })?.role || "member";

    const [members, setMembers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: "", phone: "", role: "member" });
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingMember, setDeletingMember] = useState<any>(null);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setMembers(data.users || []);
            }
        } catch (error) {
            console.error("Error fetching members:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const openEditModal = (member: any) => {
        setEditingMember(member);
        setEditForm({
            name: member.name || "",
            phone: member.phone !== "N/A" ? member.phone : "",
            role: member.role || "member",
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingMember) return;
        setIsSubmittingEdit(true);
        try {
            const res = await fetch(`/api/members/${editingMember.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                setIsEditModalOpen(false);
                setEditingMember(null);
                await fetchMembers();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update member.");
            }
        } catch (error) {
            console.error("Update error:", error);
            alert("Failed to update member.");
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    const openDeleteDialog = (member: any) => {
        setDeletingMember(member);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingMember) return;
        setIsSubmittingDelete(true);
        try {
            const res = await fetch(`/api/members/${deletingMember.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                setDeletingMember(null);
                await fetchMembers();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to remove member.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to remove member.");
        } finally {
            setIsSubmittingDelete(false);
        }
    };

    const filteredMembers = members.filter((member) => {
        const query = searchTerm.toLowerCase();
        return (
            (member.name && member.name.toLowerCase().includes(query)) ||
            (member.phone && member.phone.toLowerCase().includes(query)) ||
            (member.email && member.email.toLowerCase().includes(query)) ||
            (member.role && member.role.toLowerCase().includes(query))
        );
    });

    return (
        <div className="w-full pb-12 md:pb-16 animate-in fade-in duration-200">
            
            {/* ═══════════════════════════════════════════════════════════════════
                MOBILE VIEW: Matching members.png Pixel-for-Pixel
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="md:hidden flex flex-col gap-3.5 w-full max-w-md mx-auto">
                
                {/* 1. Screen Title & Subtitle */}
                <div className="space-y-0.5 pt-1 px-0.5">
                    <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                        Mess Members
                    </h1>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-snug">
                        Manage mess members and their account details.
                    </p>
                </div>

                {/* 2. Search & "+ Add" Action Row */}
                <div className="flex items-center gap-2.5">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" stroke={2.2} />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search members by name, role or phone..." 
                            className="w-full bg-white/95 rounded-2xl pl-10 pr-4 py-3 border border-gray-100 shadow-sm text-xs sm:text-sm font-medium text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                    </div>

                    {/* "+ Add" Button */}
                    <Link 
                        href="/admin/add-member"
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md shadow-orange-500/30 flex items-center gap-1.5 shrink-0 transition-transform active:scale-95"
                    >
                        <IconPlus size={18} stroke={3} />
                        <span>Add</span>
                    </Link>
                </div>

                {/* 3. Member Cards List */}
                <div className="space-y-3 mt-1">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100/70 animate-pulse flex items-start gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-100/70 shadow-sm">
                            <p className="text-gray-500 font-bold text-sm">No members found.</p>
                        </div>
                    ) : (
                        filteredMembers.map((member) => {
                            const isPositive = (member.balance ?? 0) >= 0;
                            const balanceValue = Math.abs(Number(member.balance || 0));
                            const balanceFormatted = balanceValue.toLocaleString(undefined, {
                                minimumFractionDigits: balanceValue % 1 !== 0 ? 2 : 0,
                                maximumFractionDigits: 2,
                            });

                            return (
                                <div 
                                    key={member.id}
                                    className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100/70 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-start gap-3.5">
                                        
                                        {/* Avatar Squircle (Left) */}
                                        <div className="w-12 h-12 rounded-2xl bg-[#FFEADB] text-[#EA580C] font-black text-xl flex items-center justify-center shrink-0 shadow-2xs">
                                            {member.name ? member.name.charAt(0).toUpperCase() : "M"}
                                        </div>

                                        {/* Main Content (Center & Right) */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5">
                                            
                                            {/* Top Row: Name, Badges & Phone */}
                                            <div className="flex items-center justify-between gap-2">
                                                {/* Identity & Badges */}
                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                                                    <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                                                        {member.name}
                                                    </span>
                                                    <span className="bg-[#EEF2F6] text-[#475569] text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize shrink-0">
                                                        {member.role}
                                                    </span>
                                                    <span className="bg-[#DCFCE7]/90 text-[#16A34A] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                                                        Active
                                                    </span>
                                                </div>

                                                {/* Phone Number */}
                                                <div className="flex items-center gap-1 text-slate-600 shrink-0 ml-auto">
                                                    <IconPhone size={13} className="text-slate-600 shrink-0" stroke={2.5} />
                                                    <span className="text-xs font-bold text-slate-700 tracking-tight truncate max-w-[125px]">
                                                        {member.phone || "N/A"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bottom Row: Live Financials & Actions */}
                                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/70">
                                                {/* Live Financials */}
                                                <div className="flex items-center">
                                                    {/* Deposit */}
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1 text-slate-400">
                                                            <IconWallet size={15} stroke={2} className="shrink-0" />
                                                            <span className="text-[10px] font-bold leading-tight">Deposit</span>
                                                        </div>
                                                        <span className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight mt-0.5">
                                                            ৳ {Number(member.deposit || 0).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {/* Vertical Separator */}
                                                    <div className="w-px h-6 bg-slate-200/80 mx-3 sm:mx-4 shrink-0" />

                                                    {/* Balance */}
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1 text-slate-400">
                                                            <IconChartBar size={15} stroke={2} className="shrink-0" />
                                                            <span className="text-[10px] font-bold leading-tight">Balance</span>
                                                        </div>
                                                        <span className={`text-xs sm:text-[13px] font-black leading-tight mt-0.5 ${
                                                            isPositive ? "text-[#16A34A]" : "text-rose-500"
                                                        }`}>
                                                            {isPositive ? "+ ৳ " : "- ৳ "}
                                                            {balanceFormatted}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => openEditModal(member)}
                                                        className="w-8 h-8 rounded-xl bg-[#E8F1FF] text-[#2563EB] hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                                                        title="Edit Member"
                                                        aria-label="Edit Member"
                                                    >
                                                        <IconEdit size={16} stroke={2.2} />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteDialog(member)}
                                                        className="w-8 h-8 rounded-xl bg-[#FFE4E6] text-[#E11D48] hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                                                        title="Delete Member"
                                                        aria-label="Delete Member"
                                                    >
                                                        <IconTrash size={16} stroke={2.2} />
                                                    </button>
                                                </div>
                                            </div>

                                        </div>

                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>


            {/* ═══════════════════════════════════════════════════════════════════
                DESKTOP VIEW: Clean Table Layout
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="hidden md:block max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between gap-6 bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-black text-[#0B132B]">Mess Members</h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">Manage all members and their account details.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-72">
                            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search members by name, role or phone..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium transition-all"
                            />
                        </div>

                        {currentUserRole === "admin" && (
                            <Link 
                                href="/admin/add-member"
                                className="flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer whitespace-nowrap"
                            >
                                <IconPlus size={18} stroke={2.5} />
                                <span>Add Member</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Member Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Deposit</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Balance</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center font-bold text-gray-400">
                                        Loading members...
                                    </td>
                                </tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center font-bold text-gray-400">
                                        No members found.
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map((member) => {
                                    const isPositive = (member.balance ?? 0) >= 0;
                                    const balanceValue = Math.abs(Number(member.balance || 0));
                                    const balanceFormatted = balanceValue.toLocaleString(undefined, {
                                        minimumFractionDigits: balanceValue % 1 !== 0 ? 2 : 0,
                                        maximumFractionDigits: 2,
                                    });

                                    return (
                                        <tr key={member.id} className="hover:bg-gray-50/80 transition-colors">
                                            {/* Member Info */}
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-base shrink-0">
                                                        {member.name ? member.name.charAt(0).toUpperCase() : <IconUserCircle size={22} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold text-[#0B132B] text-sm leading-tight">{member.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                                                                {member.role}
                                                            </span>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                Active
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Phone */}
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-semibold text-gray-700">{member.phone || "N/A"}</p>
                                            </td>

                                            {/* Deposit */}
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-black text-[#0B132B]">
                                                    ৳ {Number(member.deposit || 0).toLocaleString()}
                                                </p>
                                            </td>

                                            {/* Balance */}
                                            <td className="px-6 py-5">
                                                <p className={`text-sm font-black ${isPositive ? "text-[#16A34A]" : "text-rose-500"}`}>
                                                    {isPositive ? "+ ৳ " : "- ৳ "}
                                                    {balanceFormatted}
                                                </p>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(member)}
                                                        className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer"
                                                        title="Edit Member"
                                                    >
                                                        <IconEdit size={16} stroke={2.2} />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteDialog(member)}
                                                        className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                                                        title="Delete Member"
                                                    >
                                                        <IconTrash size={16} stroke={2.2} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

            </div>


            {/* ═══════════════════════════════════════════════════════════════════
                EDIT MEMBER MODAL
               ═══════════════════════════════════════════════════════════════════ */}
            {isEditModalOpen && editingMember && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsEditModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden p-6 animate-in zoom-in-95 duration-200 space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#FFEADB] text-[#EA580C] flex items-center justify-center font-black text-lg">
                                    {editingMember.name ? editingMember.name.charAt(0).toUpperCase() : "M"}
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Edit Member</h3>
                                    <p className="text-xs text-gray-500 font-medium">Update account role and contact details</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <IconX size={20} stroke={2.5} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Full Name
                                </label>
                                <input 
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Phone Number
                                </label>
                                <input 
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                    placeholder="Enter phone number"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Role
                                </label>
                                <select 
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all bg-white"
                                >
                                    <option value="member">Member</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2.5">
                                <button 
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmittingEdit}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                                >
                                    {isSubmittingEdit ? (
                                        <>
                                            <IconLoader2 size={16} className="animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <IconCheck size={16} stroke={2.5} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* ═══════════════════════════════════════════════════════════════════
                DELETE CONFIRMATION MODAL
               ═══════════════════════════════════════════════════════════════════ */}
            {isDeleteModalOpen && deletingMember && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsDeleteModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden p-6 animate-in zoom-in-95 duration-200 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3.5 text-rose-600">
                            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                                <IconAlertTriangle size={24} stroke={2.5} />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">Remove Member</h3>
                                <p className="text-xs text-gray-500 font-medium">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 font-medium leading-relaxed">
                            Are you sure you want to remove <span className="font-extrabold text-slate-900">"{deletingMember.name}"</span> from the mess? All their meal logs and deposit records will be permanently removed.
                        </p>

                        <div className="pt-2 flex items-center justify-end gap-2.5">
                            <button 
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isSubmittingDelete}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                            >
                                {isSubmittingDelete ? (
                                    <>
                                        <IconLoader2 size={16} className="animate-spin" />
                                        <span>Removing...</span>
                                    </>
                                ) : (
                                    <>
                                        <IconTrash size={16} stroke={2.2} />
                                        <span>Yes, Remove</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}