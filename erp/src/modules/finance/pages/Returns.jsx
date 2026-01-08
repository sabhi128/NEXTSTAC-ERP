import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import {
    ArrowLeftRight,
    FileText,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    X,
    Check,
    ArrowDownLeft,
    ArrowUpRight,
    TrendingUp,
    Clock,
    CheckCircle,
    Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import ConfirmationModal from '../../../components/ConfirmationModal';

const Returns = () => {
    const [activeTab, setActiveTab] = useState('credit'); // credit (Sales) or debit (Purchase)
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        entityName: '',
        referenceInvoice: '',
        amount: '',
        reason: 'Damaged Goods'
    });

    const queryClient = useQueryClient();

    const { data: returns, isLoading } = useQuery({
        queryKey: ['returns'],
        queryFn: mockDataService.getReturns,
    });

    const addReturnMutation = useMutation({
        mutationFn: mockDataService.addReturn,
        onSuccess: () => {
            queryClient.invalidateQueries(['returns']);
            setIsModalOpen(false);
            setFormData({ entityName: '', referenceInvoice: '', amount: '', reason: 'Damaged Goods' });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => new Promise(resolve => setTimeout(() => resolve(mockDataService.updateReturnStatus(id, status)), 300)),
        onSuccess: () => queryClient.invalidateQueries(['returns'])
    });

    const deleteAllMutation = useMutation({
        mutationFn: mockDataService.deleteAllReturns,
        onSuccess: () => {
            queryClient.invalidateQueries(['returns']);
            setIsDeleteModalOpen(false);
        }
    });

    const getNextStatus = (currentStatus) => {
        if (currentStatus === 'Pending') return 'Processed';
        if (currentStatus === 'Processed') return 'Approved';
        return 'Pending';
    };

    // Filter by Tab and Search
    const filteredReturns = returns?.filter(ret => {
        const matchesTab = activeTab === 'credit'
            ? ret.type === 'Credit Note'
            : ret.type === 'Debit Note';
        const matchesSearch =
            ret.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ret.entityName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || ret.status === statusFilter;
        return matchesTab && matchesSearch && matchesStatus;
    });

    // Statistics
    const stats = {
        totalValue: filteredReturns?.reduce((acc, curr) => acc + curr.amount, 0) || 0,
        pendingCount: filteredReturns?.filter(r => r.status === 'Pending').length || 0,
        processedCount: filteredReturns?.filter(r => r.status === 'Processed' || r.status === 'Approved').length || 0
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        addReturnMutation.mutate({
            entityName: formData.entityName,
            referenceInvoice: formData.referenceInvoice,
            amount: parseFloat(formData.amount),
            reason: formData.reason,
            type: activeTab === 'credit' ? 'Credit Note' : 'Debit Note'
        });
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">Loading returns...</div>;

    return (
        <div className="min-h-screen relative">

            {/* Create Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900/95 backdrop-blur-2xl w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 bg-slate-900/50 border-b border-slate-700/50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">
                                Create {activeTab === 'credit' ? 'Credit Note' : 'Debit Note'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors group">
                                <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                    {activeTab === 'credit' ? 'Customer Name' : 'Vendor Name'}
                                </label>
                                <input
                                    type="text" required value={formData.entityName}
                                    onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-white placeholder:text-slate-600 transition-all shadow-inner"
                                    placeholder={activeTab === 'credit' ? 'e.g. John Doe' : 'e.g. Acme Supplier'}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Reference Invoice #</label>
                                <input
                                    type="text" required value={formData.referenceInvoice}
                                    onChange={(e) => setFormData({ ...formData, referenceInvoice: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-white placeholder:text-slate-600 transition-all shadow-inner"
                                    placeholder="e.g. INV-12345"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Refund Amount ($)</label>
                                <input
                                    type="number" required min="0.01" step="0.01" value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-white text-lg transition-all shadow-inner"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Reason</label>
                                <div className="relative">
                                    <select
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-white appearance-none cursor-pointer transition-all shadow-inner"
                                    >
                                        <option className="bg-slate-800">Damaged Goods</option>
                                        <option className="bg-slate-800">Incorrect Item</option>
                                        <option className="bg-slate-800">Overcharged</option>
                                        <option className="bg-slate-800">Other</option>
                                    </select>
                                    <ArrowUpRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none rotate-45" />
                                </div>
                            </div>
                            <button
                                type="submit" disabled={addReturnMutation.isPending}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {addReturnMutation.isPending ? 'Processing...' : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Create {activeTab === 'credit' ? 'Credit Note' : 'Debit Note'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white drop-shadow-sm">Returns Management</h2>
                        <p className="text-slate-400 text-sm mt-1">Manage Credit Notes (Sales) and Debit Notes (Purchases)</p>
                    </div>
                    <div className="flex gap-3">
                        {returns?.length > 0 && (
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete All
                            </button>
                        )}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl flex items-center gap-2 font-bold transition-all shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="w-5 h-5" />
                            New {activeTab === 'credit' ? 'Credit Note' : 'Debit Note'}
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl flex items-center justify-between group hover:bg-slate-800/70 transition-colors">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total {activeTab === 'credit' ? 'Credits' : 'Debits'}</p>
                            <h3 className="text-3xl font-black text-white">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl flex items-center justify-between group hover:bg-slate-800/70 transition-colors">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Requests</p>
                            <h3 className="text-3xl font-black text-white">{stats.pendingCount}</h3>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                            <Clock className="w-7 h-7" />
                        </div>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl flex items-center justify-between group hover:bg-slate-800/70 transition-colors">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Processed</p>
                            <h3 className="text-3xl font-black text-white">{stats.processedCount}</h3>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                            <CheckCircle className="w-7 h-7" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 w-fit backdrop-blur-xl">
                    {['credit', 'debit'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all relative ${activeTab === tab ? 'text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="returns-tab-pill"
                                    className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {tab === 'credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                {tab === 'credit' ? 'Credit Note (Sales)' : 'Debit Note (Purchase)'}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl flex flex-col sm:flex-row gap-4 relative z-20">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text" placeholder="Search returns..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-900/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={clsx(
                                "px-6 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all border",
                                statusFilter !== 'All'
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-700/50 hover:text-white'
                            )}
                        >
                            <Filter className="w-5 h-5" />
                            {statusFilter === 'All' ? 'Status' : statusFilter}
                        </button>

                        {isFilterOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-2 z-40 animate-in fade-in zoom-in-95 duration-200">
                                    {['All', 'Pending', 'Approved', 'Processed', 'Rejected'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setStatusFilter(status);
                                                setIsFilterOpen(false);
                                            }}
                                            className={clsx(
                                                "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-between",
                                                statusFilter === status
                                                    ? 'bg-indigo-600/20 text-indigo-300'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            )}
                                        >
                                            {status}
                                            {statusFilter === status && <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-5 font-bold text-slate-300 uppercase tracking-wider text-xs">Return #</th>
                                    <th className="px-6 py-5 font-bold text-slate-300 uppercase tracking-wider text-xs">Reference</th>
                                    <th className="px-6 py-5 font-bold text-slate-300 uppercase tracking-wider text-xs">Entity</th>
                                    <th className="px-6 py-5 font-bold text-slate-300 uppercase tracking-wider text-xs">Date</th>
                                    <th className="px-6 py-5 font-bold text-slate-300 uppercase tracking-wider text-xs">Reason</th>
                                    <th className="px-6 py-5 font-bold text-slate-300 uppercase tracking-wider text-xs text-right">Amount</th>
                                    <th className="px-6 py-5 font-bold text-slate-300 uppercase tracking-wider text-xs text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredReturns?.length === 0 ? (
                                    <tr><td colSpan="7" className="p-12 text-center text-slate-500">No records found.</td></tr>
                                ) : (
                                    filteredReturns?.map((ret) => (
                                        <tr key={ret.id} className="hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 py-4 font-mono font-bold text-indigo-400 border-r border-slate-700/50 group-hover:border-slate-700/80 transition-colors">{ret.returnNumber}</td>
                                            <td className="px-6 py-4 font-medium text-slate-300 bg-slate-800/30">{ret.referenceInvoice}</td>
                                            <td className="px-6 py-4 font-bold text-white">{ret.entityName}</td>
                                            <td className="px-6 py-4 text-slate-400 font-medium">{new Date(ret.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-slate-500 italic max-w-[150px] truncate">{ret.reason}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-white text-right text-lg tracking-tight">
                                                ${ret.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => updateStatusMutation.mutate({ id: ret.id, status: getNextStatus(ret.status) })}
                                                    className={clsx(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase border transition-all active:scale-95 cursor-pointer",
                                                        ret.status === 'Approved' || ret.status === 'Processed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' :
                                                            ret.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' :
                                                                'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700'
                                                    )}
                                                    title="Click to cycle status"
                                                >
                                                    {ret.status === 'Approved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                    {ret.status}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {filteredReturns?.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700/50">No records found.</div>
                    ) : (
                        filteredReturns?.map((ret) => (
                            <div key={ret.id} className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 font-mono">{ret.returnNumber}</div>
                                        <div className="font-extrabold text-white text-lg">{ret.entityName}</div>
                                    </div>
                                    <button
                                        onClick={() => updateStatusMutation.mutate({ id: ret.id, status: getNextStatus(ret.status) })}
                                        className={clsx(
                                            "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase border transition-all active:scale-95",
                                            ret.status === 'Approved' || ret.status === 'Processed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                ret.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-slate-700/50 text-slate-300 border-slate-600'
                                        )}
                                    >
                                        {ret.status}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm border-y border-slate-700/50 py-4">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ref Invoice</div>
                                        <div className="font-bold text-slate-300">{ret.referenceInvoice}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount</div>
                                        <div className="font-mono font-bold text-white text-xl">
                                            ${ret.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-slate-500 italic">
                                    Reason: {ret.reason}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => deleteAllMutation.mutate()}
                title="Delete All Returns?"
                message="Are you sure you want to delete ALL return records? This action cannot be undone."
                confirmText="Delete Everything"
                variant="destructive"
            />
        </div>
    );
};

export default Returns;
