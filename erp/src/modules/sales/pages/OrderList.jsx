import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../context/ToastContext';
// import { mockDataService } from '../../../services/mockDataService';
import {
    ShoppingCart,
    Search,
    Filter,
    Package,
    Plus,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    Truck,
    ChevronDown,
    X,
    FilterX
} from 'lucide-react';

import ConfirmationModal from '../../../components/ConfirmationModal';
import OrderModal from '../components/OrderModal';
import { motion, AnimatePresence } from 'framer-motion';

import { api } from '../../../lib/api';

export default function OrderList() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, id: null, isDeleteAll: false });
    const [statusFilter, setStatusFilter] = useState('All'); // All, Processing, Shipped, Delivered, Cancelled
    const [paymentFilter, setPaymentFilter] = useState('All'); // All, Paid, Pending, Overdue

    const { data: orders = [], isLoading, isError, error } = useQuery({
        queryKey: ['orders'],
        queryFn: () => api.get('/sales/orders'),
    });



    const deleteOrderMutation = useMutation({
        // Currently no single delete endpoint for orders in salesRoutes, 
        // but backend might support it via finance or generic route.
        // Assuming we rely on delete functionality from financeController passed through or similar?
        // Actually salesRoutes.js didn't have delete order by ID, only delete all.
        // I should check if I added DELETE /orders/:id. I didn't.
        // But financeRoutes has DELETE /invoices/:id.
        // I should probably add DELETE /orders/:id to salesRoutes aliasing finance.
        // For now, I will use finance endpoint directly or add it?
        // Let's use /finance/invoices/:id if possible or add `router.delete('/orders/:id', ...)`
        // I'll update salesRoutes.js later or use finance endpoint. 
        // Wait, I am in "Implementing Delete All", I should probably fix single delete too if I want full migration.
        // I will add the route in next step for robustness.
        mutationFn: (id) => api.delete(`/sales/orders/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
            setConfirmationModal({ isOpen: false, id: null });
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: () => api.delete('/sales/orders/all'),
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
            setConfirmationModal({ isOpen: false, id: null, isDeleteAll: false });
        }
    });

    const updateStatusMutation = useMutation({
        // Assuming backend supports this. If not, I might need to implement it.
        // salesController only had get and create. I need update logic.
        // dbAdapter.finance.updateInvoice works.
        // I'll need to update salesRoutes/Controller to handle updates or use finance endpoint.
        mutationFn: ({ id, status }) => api.put(`/sales/orders/${id}`, { status }),
        onSuccess: () => queryClient.invalidateQueries(['orders'])
    });

    const updatePaymentStatusMutation = useMutation({
        mutationFn: ({ id, status }) => api.put(`/sales/orders/${id}`, { paymentStatus: status }),
        onSuccess: () => queryClient.invalidateQueries(['orders'])
    });

    const addOrderMutation = useMutation({
        mutationFn: (data) => api.post('/sales/orders', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['orders']);
            setIsModalOpen(false);
        },
        onError: (error) => {
            console.error("Order creation failed:", error);
            showToast(`Failed to create order: ${error.message}`, 'error');
        }
    });

    const handleStatusClick = (order) => {
        const statusOrder = ['Processing', 'Shipped', 'Delivered'];
        const currentIndex = statusOrder.indexOf(order.status);

        if (currentIndex !== -1) {
            const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
            updateStatusMutation.mutate({ id: order.id, status: nextStatus });
        } else if (order.status === 'Cancelled') {
            updateStatusMutation.mutate({ id: order.id, status: 'Processing' });
        }
    };

    const filteredOrders = orders?.filter(o => {
        const orderNumber = o.orderNumber || '';
        const customer = o.customer || '';

        const matchesSearch = orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
        const matchesPayment = paymentFilter === 'All' || o.paymentStatus === paymentFilter;
        return matchesSearch && matchesStatus && matchesPayment;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'Shipped': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        }
    };

    const getPaymentColor = (status) => {
        switch (status) {
            case 'Paid': return 'text-emerald-400';
            case 'Overdue': return 'text-rose-400';
            default: return 'text-amber-400';
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading orders...</div>;
    if (isError) return <div className="p-8 text-center text-red-400">Error loading orders: {error.message}</div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
        >
            <OrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={(data) => addOrderMutation.mutate(data)}
            />

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ isOpen: false, id: null, isDeleteAll: false })}
                onConfirm={() => {
                    if (confirmationModal.isDeleteAll) {
                        deleteAllMutation.mutate();
                    } else {
                        deleteOrderMutation.mutate(confirmationModal.id);
                    }
                }}
                title="Delete Order"
                message="Are you sure you want to delete this order? This action works properly and cannot be undone."
                confirmText="Delete Order"
                variant="danger"
            />

            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Orders</h2>
                        <p className="text-slate-400 text-sm mt-1">Manage sales orders and fulfillment</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setConfirmationModal({ isOpen: true, id: null, isDeleteAll: true })}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-xl flex items-center gap-2 font-bold transition-all border border-slate-700 hover:border-red-500/20"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete All
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-95 border border-teal-400/20"
                        >
                            <Plus className="w-4 h-4" />
                            New Order
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col md:flex-row gap-4 relative z-30">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-200 placeholder:text-slate-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-900/50 border border-slate-700/50 text-slate-300 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none font-medium"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="bg-slate-900/50 border border-slate-700/50 text-slate-300 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none font-medium"
                        >
                            <option value="All">All Payments</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Order #</th>
                                    <th className="px-6 py-4 font-bold">Customer</th>
                                    <th className="px-6 py-4 font-bold">Date</th>
                                    <th className="px-6 py-4 font-bold text-right">Amount</th>
                                    <th className="px-6 py-4 font-bold text-center">Payment</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                <AnimatePresence mode='popLayout'>
                                    {filteredOrders?.length > 0 ? (
                                        filteredOrders.map((order, index) => (
                                            <motion.tr
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: index * 0.05 }}
                                                key={order.id}
                                                className="hover:bg-slate-700/30 transition-colors group"
                                            >
                                                <td className="px-6 py-4 font-mono font-medium text-indigo-400">
                                                    {order.orderNumber}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-200">{order.customer}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">
                                                    {new Date(order.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-200">
                                                    ${order.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => updatePaymentStatusMutation.mutate({
                                                            id: order.id,
                                                            status: order.paymentStatus === 'Paid' ? 'Pending' : 'Paid'
                                                        })}
                                                        className={`font-bold text-xs uppercase tracking-wide hover:underline decoration-dashed underline-offset-4 ${getPaymentColor(order.paymentStatus)}`}
                                                    >
                                                        {order.paymentStatus}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleStatusClick(order)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-all hover:scale-105 active:scale-95 ${getStatusColor(order.status)}`}
                                                    >
                                                        {order.status}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setConfirmationModal({ isOpen: true, id: order.id })}
                                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                                                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No orders found matching your filters.</p>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
// Icon helper since DollarSign is used for payment filter
const DollarSignIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="12" x2="12" y1="2" y2="22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
)
