import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { mockDataService } from '../../../services/mockDataService';
import {
    ShoppingBag,
    Search,
    Plus,
    MoreHorizontal,
    Calendar,
    Trash2,
    Package,
    ArrowRight,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PurchaseOrderModal from '../components/PurchaseOrderModal';
import ConfirmationModal from '../../../components/ConfirmationModal';

import { api } from '../../../lib/api';

export default function PurchaseOrderList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPO, setEditingPO] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, isDeleteAll: false });

    // Assuming backend returns vendors for the dropdown if needed, but here we just manage POs.
    // Ideally we fetch vendors too for the form, but let's stick to PO list logic first.

    const { data: purchaseOrders = [], isLoading } = useQuery({
        queryKey: ['purchaseOrders'],
        queryFn: () => api.get('/purchasing/purchase-orders'),
    });

    const addMutation = useMutation({
        mutationFn: (data) => api.post('/purchasing/purchase-orders', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['purchaseOrders']);
            setIsFormOpen(false);
            setEditingPO(null);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/purchasing/purchase-orders/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['purchaseOrders']);
            setIsFormOpen(false);
            setEditingPO(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/purchasing/purchase-orders/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['purchaseOrders']);
            setDeleteConfirm({ isOpen: false, id: null });
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: () => api.delete('/purchasing/purchase-orders/all'),
        onSuccess: () => {
            queryClient.invalidateQueries(['purchaseOrders']);
            setDeleteConfirm({ isOpen: false, id: null, isDeleteAll: false });
        }
    });

    const handleStatusClick = (po) => {
        const statusOrder = ['Draft', 'Ordered', 'Received'];
        const currentIndex = statusOrder.indexOf(po.status);

        if (currentIndex !== -1) {
            const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
            updateMutation.mutate({ id: po.id, data: { status: nextStatus } });
        } else if (po.status === 'Cancelled') {
            updateStatusMutation.mutate({ id: po.id, status: 'Draft' });
        }
    };

    const filteredOrders = orders?.filter(o =>
        o.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Draft': return 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20';
            case 'Ordered': return 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20';
            case 'Received': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20';
            case 'Cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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
            <p className="mt-4 font-medium">Loading orders...</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-[1920px] mx-auto p-4 md:p-8">
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null, isDeleteAll: false })}
                onConfirm={() => {
                    if (deleteConfirm.isDeleteAll) {
                        deleteAllMutation.mutate();
                    } else {
                        deleteMutation.mutate(deleteConfirm.id);
                    }
                }}
                title={deleteConfirm.isDeleteAll ? "Delete All Orders?" : "Delete Order"}
                message={deleteConfirm.isDeleteAll ? "Are you sure you want to delete ALL purchase orders?" : "Are you sure you want to delete this order? This action cannot be undone."}
                confirmText={deleteConfirm.isDeleteAll ? "Delete All" : "Delete Order"}
                variant="danger"
            />
            <PurchaseOrderModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={(data) => addMutation.mutate(data)}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Purchase Orders</h2>
                    <p className="text-slate-400">Track procurement and requisitions</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-2 font-bold transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Create PO
                </motion.button>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl sticky top-20 z-30 shadow-xl">
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by PO number or vendor..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder:text-slate-500 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredOrders?.map(po => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={po.id}
                        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-5 rounded-2xl shadow-sm"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-700/50 rounded-lg text-purple-400">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{po.poNumber}</h3>
                                    <p className="text-sm text-slate-400">{po.vendor}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleStatusClick(po)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${getStatusColor(po.status)}`}
                            >
                                {po.status}
                            </button>
                        </div>

                        <div className="space-y-3 mb-4 bg-slate-900/30 p-3 rounded-xl border border-slate-700/30">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Order Date:</span>
                                <span className="text-slate-300 font-medium">{new Date(po.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Expected:</span>
                                <span className="text-slate-300 font-medium">{new Date(po.expectedDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-slate-700/50">
                                <span className="font-medium text-slate-400">Total Amount:</span>
                                <span className="font-bold text-white">${po.amount.toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setOrderToDelete(po);
                                setIsDeleteModalOpen(true);
                            }}
                            className="w-full py-2 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-red-500/20"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Order
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/50 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">PO Number</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Vendor</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Date</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Expected</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs text-right">Amount</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Status</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            <AnimatePresence>
                                {filteredOrders?.map(po => (
                                    <motion.tr
                                        key={po.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-slate-700/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4 text-purple-400 font-mono font-bold group-hover:text-purple-300 transition-colors">
                                            {po.poNumber}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">{po.vendor}</td>
                                        <td className="px-6 py-4 text-slate-400">{new Date(po.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-slate-400">{new Date(po.expectedDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right font-bold text-white tracking-wide">${po.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleStatusClick(po)}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border ${getStatusColor(po.status)}`}
                                                title="Click to update status"
                                            >
                                                {po.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setOrderToDelete(po);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete PO"
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
                {filteredOrders?.length === 0 && (
                    <div className="py-20 text-center text-slate-500">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No purchase orders found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
