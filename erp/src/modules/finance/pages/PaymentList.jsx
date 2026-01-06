import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import { api } from '../../../lib/api';
import {
    CreditCard,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    ArrowUpRight,
    X,
    Check,
    Trash2,
    Edit2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import ConfirmationModal from '../../../components/ConfirmationModal';
import PaymentStatusToggle from '../components/payment/PaymentStatusToggle';


export default function PaymentList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [formData, setFormData] = useState({
        vendor: '',
        amount: '',
        method: 'Bank Transfer'
    });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    const queryClient = useQueryClient();

    const { data: payments, isLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: mockDataService.getPayments,
    });

    const addPaymentMutation = useMutation({
        mutationFn: async (data) => {
            return await api.post('/finance/payments', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['payments']);
            closeModal();
        },
        onError: (err) => alert(`Failed to add payment: ${err.message}`)
    });

    const updatePaymentMutation = useMutation({
        mutationFn: async ({ id, ...data }) => {
            return await api.patch(`/finance/payments/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['payments']);
            closeModal();
        },
        onError: (err) => alert(`Failed to update payment: ${err.message}`)
    });

    const deletePaymentMutation = useMutation({
        mutationFn: async (id) => await api.delete(`/finance/payments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['payments']);
            setDeleteModal({ isOpen: false, id: null });
        },
        onError: (err) => alert(`Failed to delete payment: ${err.message}`)
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await api.patch(`/finance/payments/${id}/status`, { status });
        },
        onSuccess: () => queryClient.invalidateQueries(['payments'])
    });

    const filteredPayments = payments?.filter(pay => {
        const matchesSearch = pay.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pay.vendor.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || pay.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const openModal = (payment = null) => {
        if (payment) {
            setEditingPayment(payment);
            setFormData({
                vendor: payment.vendor,
                amount: payment.amount,
                method: payment.method
            });
        } else {
            setEditingPayment(null);
            setFormData({ vendor: '', amount: '', method: 'Bank Transfer' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPayment(null);
        setFormData({ vendor: '', amount: '', method: 'Bank Transfer' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            vendor: formData.vendor,
            amount: parseFloat(formData.amount),
            method: formData.method
        };

        if (editingPayment) {
            updatePaymentMutation.mutate({ id: editingPayment.id, ...payload });
        } else {
            addPaymentMutation.mutate(payload);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">Loading payments...</div>;

    return (
        <div className="min-h-screen relative">

            {/* Modal Overlay */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900/95 backdrop-blur-2xl w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 bg-slate-900/50 border-b border-slate-700/50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">
                                {editingPayment ? 'Edit Payment' : 'Record New Payment'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-slate-800 rounded-full transition-colors group"
                            >
                                <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Vendor Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.vendor}
                                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-white placeholder:text-slate-600 transition-all shadow-inner"
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Amount ($)</label>
                                <input
                                    type="number"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-white text-lg transition-all shadow-inner"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Payment Method</label>
                                <div className="relative">
                                    <select
                                        value={formData.method}
                                        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-white appearance-none cursor-pointer transition-all shadow-inner"
                                    >
                                        <option className="bg-slate-800">Bank Transfer</option>
                                        <option className="bg-slate-800">Credit Card</option>
                                        <option className="bg-slate-800">Cash</option>
                                        <option className="bg-slate-800">Check</option>
                                    </select>
                                    <ArrowUpRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none rotate-45" />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={addPaymentMutation.isPending || updatePaymentMutation.isPending}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {addPaymentMutation.isPending || updatePaymentMutation.isPending ? 'Processing...' : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            {editingPayment ? 'Save Changes' : 'Confirm Payment'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white drop-shadow-sm">Payments</h2>
                        <p className="text-slate-400 text-sm mt-1">Track outgoing payments to vendors</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl flex items-center gap-2 font-bold transition-all shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" />
                        Record Payment
                    </button>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl flex flex-col sm:flex-row gap-4 relative z-20">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search payments..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-900/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={clsx(
                                "px-6 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all border",
                                statusFilter !== 'All'
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
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
                                    {['All', 'Paid', 'Pending', 'Failed'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setStatusFilter(status);
                                                setIsFilterOpen(false);
                                            }}
                                            className={clsx(
                                                "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-between",
                                                statusFilter === status
                                                    ? 'bg-emerald-600/20 text-emerald-300'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            )}
                                        >
                                            {status}
                                            {statusFilter === status && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Payment #</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Vendor</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Date</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Method</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs text-right">Amount</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Status</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredPayments?.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-700/30 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-bold text-emerald-400 border-r border-slate-700/50 group-hover:border-slate-700/80 transition-colors">
                                            {payment.paymentNumber}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate">{payment.vendor}</td>
                                        <td className="px-6 py-4 text-slate-400 font-medium">
                                            {new Date(payment.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <span className="flex items-center gap-2 font-bold bg-slate-800/80 px-3 py-1.5 rounded-lg w-fit text-xs border border-slate-700/50 text-slate-300 shadow-sm">
                                                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                                                {payment.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white font-bold text-right font-mono text-lg tracking-tight">
                                            ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <PaymentStatusToggle
                                                currentStatus={payment.status}
                                                onUpdate={(newStatus) => updateStatusMutation.mutate({
                                                    id: payment.id,
                                                    status: newStatus
                                                })}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openModal(payment)}
                                                    className="p-2 hover:bg-indigo-500/10 rounded-xl text-slate-500 hover:text-indigo-400 transition-colors"
                                                    title="Edit Details"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, id: payment.id })}
                                                    className="p-2 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-400 transition-colors"
                                                    title="Delete Payment"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredPayments?.map((payment) => (
                        <div key={payment.id} className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1 font-mono">
                                        {payment.paymentNumber}
                                    </div>
                                    <div className="font-extrabold text-white text-lg line-clamp-1">{payment.vendor}</div>
                                </div>
                                <PaymentStatusToggle
                                    currentStatus={payment.status}
                                    onUpdate={(newStatus) => updateStatusMutation.mutate({
                                        id: payment.id,
                                        status: newStatus
                                    })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm border-y border-slate-700/50 py-4">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date</div>
                                    <div className="font-bold text-slate-300">
                                        {new Date(payment.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount</div>
                                    <div className="font-mono font-bold text-white text-xl">
                                        ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-400 bg-slate-700/30 px-3 py-1.5 rounded-lg">
                                    <CreditCard className="w-4 h-4" />
                                    {payment.method}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(payment)}
                                        className="p-2 hover:bg-indigo-500/10 rounded-xl text-slate-500 hover:text-indigo-400 transition-colors"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: true, id: payment.id })}
                                        className="p-2 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={() => deletePaymentMutation.mutate(deleteModal.id)}
                title="Delete Payment?"
                message="Are you sure you want to delete this payment record? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div >
    );
}
