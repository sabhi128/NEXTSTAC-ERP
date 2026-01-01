import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import { Badge } from '../../../components/ui/badge';

// import { ScrollArea } from '../../../components/ui/scroll-area';

export default function EmployeeHistoryModal({ isOpen, onClose, employee }) {
    if (!isOpen || !employee) return null;

    const { data: history, isLoading } = useQuery({
        queryKey: ['employeeHistory', employee.id],
        queryFn: () => mockDataService.getEmployeeHistory(employee.id),
        enabled: isOpen,
    });

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 border border-slate-700/50">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-900/50 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Promotion History</h2>
                            <p className="text-sm text-slate-400">Record for {employee.firstName} {employee.lastName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-hidden flex-1 flex flex-col">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : history && history.length > 0 ? (
                        <div className="flex-1 pr-4 overflow-y-auto custom-scrollbar">
                            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-700/50">
                                {history.map((record, index) => (
                                    <div key={record.id} className="relative pl-10">
                                        {/* Timeline Dot */}
                                        <div className="absolute left-3 w-4 h-4 rounded-full bg-slate-800 border-2 border-indigo-500 top-1"></div>

                                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Promoted On</span>
                                                    <p className="text-slate-200 font-medium">{formatDate(record.change_date)}</p>
                                                </div>
                                                <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                                                    By {record.changed_by || 'System'}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="space-y-1">
                                                    <p className="text-slate-500 text-xs uppercase font-bold">Previous Role</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-300">{record.old_position}</span>
                                                        {record.old_level && <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">{record.old_level}</Badge>}
                                                    </div>
                                                    <p className="text-slate-500 text-xs mt-1">Salary: ${Number(record.old_salary).toLocaleString()}</p>
                                                </div>

                                                <div className="space-y-1 pl-4 border-l border-slate-700/50">
                                                    <p className="text-emerald-500 text-xs uppercase font-bold flex items-center gap-1">
                                                        New Role <ArrowUpRight className="w-3 h-3" />
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-semibold">{record.new_position}</span>
                                                        {record.new_level && <Badge className="bg-emerald-500/20 text-emerald-300 border-0">{record.new_level}</Badge>}
                                                    </div>
                                                    <p className="text-emerald-400/80 text-xs mt-1">Salary: ${Number(record.new_salary).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No promotion history found for this employee.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-700/50 bg-slate-900/50 rounded-b-3xl">
                    <button onClick={onClose} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors">
                        Close History
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
