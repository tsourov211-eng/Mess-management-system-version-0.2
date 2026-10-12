"use client";

import React, { useEffect } from "react";
import { IconCheck, IconX, IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";

export interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    type?: "approve" | "reject" | "danger" | "warning";
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    type = "approve",
    title,
    message,
    confirmText,
    cancelText = "Cancel",
    isLoading = false,
}: ConfirmModalProps) {
    // ESC key closes modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isLoading) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isLoading, onClose]);

    if (!isOpen) return null;

    const defaultConfirmText = 
        type === "approve" ? "Approve" : 
        type === "reject" ? "Reject" : 
        type === "danger" ? "Delete" : "Confirm";

    const renderIcon = () => {
        if (type === "approve") {
            return (
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl w-fit text-xl mb-3">
                    <IconCheck size={24} stroke={2.5} />
                </div>
            );
        }
        if (type === "reject" || type === "danger") {
            return (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl w-fit text-xl mb-3">
                    <IconX size={24} stroke={2.5} />
                </div>
            );
        }
        return (
            <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl w-fit text-xl mb-3">
                <IconAlertTriangle size={24} stroke={2.5} />
            </div>
        );
    };

    const getConfirmBtnClasses = () => {
        if (type === "approve") {
            return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30";
        }
        if (type === "reject" || type === "danger") {
            return "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30";
        }
        return "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/30";
    };

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isLoading) {
                    onClose();
                }
            }}
        >
            <div 
                className="bg-white/98 rounded-3xl max-w-sm sm:max-w-md w-full p-6 shadow-2xl border border-gray-100/80 transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                {renderIcon()}

                <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {title}
                </h3>

                <div className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1">
                    {message}
                </div>

                <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 ${getConfirmBtnClasses()}`}
                    >
                        {isLoading && <IconLoader2 size={16} className="animate-spin" />}
                        <span>{confirmText || defaultConfirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
