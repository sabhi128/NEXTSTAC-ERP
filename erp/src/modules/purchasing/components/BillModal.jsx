import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Receipt, Calendar, DollarSign, User, AlertCircle, Save } from 'lucide-react';
import { mockDataService } from '../../../services/mockDataService';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

export default function BillModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        vendor: '',
        billNumber: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        amount: '',
        status: 'Pending'
    });

    const { data: vendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: mockDataService.getVendors,
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                vendor: '',
                billNumber: '',
                date: new Date().toISOString().split('T')[0],
                dueDate: '',
                amount: '',
                status: 'Pending'
            });
        }
    }, [isOpen]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
                    >
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 sticky top-0 z-10 backdrop-blur-xl">
                            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-purple-400" />
                                Record New Bill
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                onSubmit({
                                    ...formData,
                                    amount: parseFloat(formData.amount)
                                });
                            }} className="p-6 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" /> Vendor
                                    </label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white transition-all font-medium appearance-none"
                                        value={formData.vendorId || ''}
                                        onChange={e => {
                                            const selectedVendor = vendors.find(v => v.id === e.target.value);
                                            setFormData({
                                                ...formData,
                                                vendorId: e.target.value,
                                                vendor: selectedVendor?.companyName || ''
                                            });
                                        }}
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors?.map(v => (
                                            <option key={v.id} value={v.id}>{v.companyName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5" /> Bill Number
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white placeholder:text-slate-500 transition-all font-medium"
                                        placeholder="BILL-00000"
                                        value={formData.billNumber}
                                        onChange={e => setFormData({ ...formData, billNumber: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" /> Bill Date
                                        </label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white placeholder:text-slate-500 transition-all font-medium"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" /> Due Date
                                        </label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white placeholder:text-slate-500 transition-all font-medium"
                                            value={formData.dueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5" /> Total Amount
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white placeholder:text-slate-500 transition-all font-medium"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                        Status
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white transition-all font-medium appearance-none"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                </div>

                                <div className="pt-2 flex justify-end gap-3 sticky bottom-0 bg-slate-900/95 backdrop-blur pb-2 border-t border-slate-800 mt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Save className="w-4 h-4" />
                                        Record Bill
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
