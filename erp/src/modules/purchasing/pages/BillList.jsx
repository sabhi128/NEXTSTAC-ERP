import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { mockDataService } from '../../../services/mockDataService';
import {
    Receipt,
    Search,
    MoreHorizontal,
    AlertCircle,
    CheckCircle,
    Clock,
    Plus,
    Trash2,
    Briefcase,
    Filter,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BillModal from '../components/BillModal';
import ConfirmationModal from '../../../components/ConfirmationModal';

import { api } from '../../../lib/api';

export default function BillList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, isDeleteAll: false });

    const { data: bills = [], isLoading } = useQuery({
        queryKey: ['bills'],
        queryFn: () => api.get('/purchasing/bills').then(res => res.data),
    });

    const addMutation = useMutation({
        mutationFn: (data) => api.post('/purchasing/bills', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['bills']);
            setIsFormOpen(false);
            setEditingBill(null);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/purchasing/bills/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['bills']);
            setIsFormOpen(false);
            setEditingBill(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/purchasing/bills/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['bills']);
            setDeleteConfirm({ isOpen: false, id: null, isDeleteAll: false });
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: () => api.delete('/purchasing/bills/all'),
        onSuccess: () => {
            queryClient.invalidateQueries(['bills']);
            setDeleteConfirm({ isOpen: false, id: null, isDeleteAll: false });
        }
    });

    const handleStatusClick = (bill) => {
        const statusOrder = ['Pending', 'Paid', 'Overdue'];
        const currentIndex = statusOrder.indexOf(bill.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        const filteredBills = bills?.filter(b =>
            b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.vendor.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const getStatusIcon = (status) => {
            switch (status) {
                case 'Paid': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
                case 'Overdue': return <AlertCircle className="w-4 h-4 text-red-400" />;
                default: return <Clock className="w-4 h-4 text-amber-400" />;
            }
        };

        const getStatusColor = (status) => {
            switch (status) {
                case 'Paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20';
                case 'Overdue': return 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20';
                default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20';
            }
        };

        if (isLoading) return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                </motion.div>
                <p className="mt-4 font-medium">Loading bills...</p>
                    <div className="flex gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setDeleteConfirm({ isOpen: true, id: null, isDeleteAll: true })}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-xl border border-slate-700 hover:border-red-500/20 flex items-center gap-2 font-bold transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                            Delete All
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setEditingBill(null);
                                setIsFormOpen(true);
                            }}
                            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl shadow-lg shadow-teal-500/25 flex items-center gap-2 font-bold transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            New Bill
                        </motion.button>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl sticky top-20 z-30 shadow-xl">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search bills by vendor or number..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder:text-slate-500 transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mobile Card View */ }
        <div className="md:hidden space-y-4">
            {filteredBills?.map(bill => (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={bill.id}
                    className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-5 rounded-2xl shadow-sm"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-700/50 rounded-lg text-purple-400">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{bill.billNumber}</h3>
                                <p className="text-sm text-slate-400">{bill.vendor}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleStatusClick(bill)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all border ${getStatusColor(bill.status)}`}
                        >
                            {getStatusIcon(bill.status)}
                            <span className="text-xs font-bold">{bill.status}</span>
                        </button>
                    </div>

                    <div className="space-y-3 mb-4 bg-slate-900/30 p-3 rounded-xl border border-slate-700/30">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Bill Date:</span>
                            <span className="text-slate-300 font-medium">{new Date(bill.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Due Date:</span>
                            <span className={`font-medium ${new Date(bill.dueDate) < new Date() && bill.status !== 'Paid' ? 'text-red-400' : 'text-slate-300'}`}>
                                {new Date(bill.dueDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-slate-700/50">
                            <span className="font-medium text-slate-400">Amount Due:</span>
                            <span className="font-bold text-white">${bill.amount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={() => {
                                setBillToDelete(bill);
                                setIsDeleteModalOpen(true);
                            }}
                            className="w-full py-2 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* Desktop Table View */ }
        <div className="hidden md:block bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Bill #</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Vendor</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Date</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Due Date</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs text-right">Amount</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Status</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        <AnimatePresence>
                            {filteredBills?.map(bill => (
                                <motion.tr
                                    key={bill.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="hover:bg-slate-700/30 transition-colors group"
                                >
                                    <td className="px-6 py-4 font-mono font-medium text-purple-400">{bill.billNumber}</td>
                                    <td className="px-6 py-4 font-medium text-white">{bill.vendor}</td>
                                    <td className="px-6 py-4 text-slate-400">{new Date(bill.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`${new Date(bill.dueDate) < new Date() && bill.status !== 'Paid' ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                                            {new Date(bill.dueDate).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-white tracking-wide">${bill.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleStatusClick(bill)}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all active:scale-95 border ${getStatusColor(bill.status)}`}
                                            title="Click to cycle status"
                                        >
                                            {getStatusIcon(bill.status)}
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                {bill.status}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                setBillToDelete(bill);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
            {filteredBills?.length === 0 && (
                <div className="py-20 text-center text-slate-500">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No bills found</p>
                </div>
            )}
        </div>
            </div >
        );
}
