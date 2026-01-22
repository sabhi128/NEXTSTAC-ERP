import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, Calendar, DollarSign, User, Save } from 'lucide-react';
// import { mockDataService } from '../../../services/mockDataService';
import { api } from '../../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

export default function PurchaseOrderModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        vendor: '',
        vendorId: null,
        date: new Date().toISOString().split('T')[0],
        expectedDate: '',
        amount: '',
        status: 'Draft'
    });

    const { data: vendors, isError, error } = useQuery({
        queryKey: ['vendors'],
        queryFn: async () => {
            try {
                const res = await api.get('/purchasing/vendors');
                console.log("Debug Vendors:", res);
                return res;
            } catch (err) {
                console.error("Debug Vendors Error:", err);
                throw err;
            }
        },
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                vendor: '',
                vendorId: null,
                date: new Date().toISOString().split('T')[0],
                expectedDate: '',
                amount: '',
                status: 'Draft'
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
                                <ShoppingBag className="w-5 h-5 text-purple-400" />
                                Create Purchase Order
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Debug Info Box */}
                        <div className="bg-red-900/50 p-2 text-xs text-red-200 font-mono border-b border-red-500/20">
                            DEBUG: Vendors Count: {vendors?.length ?? 'undefined'} <br />
                            IsError: {isError ? 'YES' : 'NO'} <br />
                            Error: {error?.message || 'None'} <br />
                            Data Sample: {vendors?.[0] ? JSON.stringify(vendors[0]) : 'Empty'}
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
                                        value={formData.vendor}
                                        onChange={e => {
                                            const selectedVendor = vendors?.find(v => v.companyName === e.target.value);
                                            setFormData({
                                                ...formData,
                                                vendor: e.target.value,
                                                vendorId: selectedVendor ? selectedVendor.id : null
                                            });
                                        }}
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors?.map(v => (
                                            <option key={v.id} value={v.companyName}>{v.companyName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" /> Order Date
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
                                            <Calendar className="w-3.5 h-3.5" /> Expected Date
                                        </label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white placeholder:text-slate-500 transition-all font-medium"
                                            value={formData.expectedDate}
                                            onChange={e => setFormData({ ...formData, expectedDate: e.target.value })}
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
                                        <option value="Draft">Draft</option>
                                        <option value="Ordered">Ordered</option>
                                        <option value="Received">Received</option>
                                        <option value="Cancelled">Cancelled</option>
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
                                        Create Order
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
