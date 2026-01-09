import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Users,
    Plus,
    Search,
    Phone,
    Mail,
    MoreHorizontal,
    Trash2,
    Building2,
    ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import CustomerFormModal from '../components/CustomerFormModal';
import CustomerProfileModal from '../components/CustomerProfileModal';
import ConfirmationModal from '../../../components/ConfirmationModal';

import { api } from '../../../lib/api';

export default function CustomerList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [profileCustomer, setProfileCustomer] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: () => api.get('/crm/customers'),
    });

    const addCustomerMutation = useMutation({
        mutationFn: (data) => api.post('/crm/customers', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            setIsAddModalOpen(false);
            setEditingCustomer(null);
        }
    });

    const updateCustomerMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/crm/customers/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            setIsAddModalOpen(false);
            setEditingCustomer(null);
            setProfileCustomer(null); // Close profile as data changed
        }
    });

    const deleteCustomerMutation = useMutation({
        mutationFn: (id) => api.delete(`/crm/customers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            setDeleteModal({ isOpen: false, id: null, name: '' });
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: () => api.delete('/crm/customers/all'),
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            setDeleteModal({ isOpen: false, id: null, name: '', isDeleteAll: false });
        }
    });

    const handleEditCustomer = (customer) => {
        setEditingCustomer(customer);
        setProfileCustomer(null); // Close profile modal
        setIsAddModalOpen(true);  // Open form modal
    };

    const handleFormSubmit = (data) => {
        if (editingCustomer) {
            updateCustomerMutation.mutate({ id: editingCustomer.id, data });
        } else {
            addCustomerMutation.mutate(data);
        }
    };

    const filteredCustomers = customers?.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading customers...</div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
        >
            <CustomerFormModal
                isOpen={isAddModalOpen}
                initialData={editingCustomer}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                }}
                onSubmit={handleFormSubmit}
            />

            <CustomerProfileModal
                isOpen={!!profileCustomer}
                customer={profileCustomer}
                onClose={() => setProfileCustomer(null)}
                onEdit={handleEditCustomer}
            />

            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Customers</h2>
                        <p className="text-slate-400 text-sm mt-1">Manage client relationships</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setDeleteModal({ isOpen: true, id: null, name: 'All Customers', isDeleteAll: true })}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-xl flex items-center gap-2 font-bold transition-all border border-slate-700 hover:border-red-500/20"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete All
                        </button>
                        <button
                            onClick={() => {
                                setEditingCustomer(null);
                                setIsAddModalOpen(true);
                            }}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 border border-blue-400/20">
                            <Plus className="w-4 h-4" />
                            Add Customer
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 shadow-xl relative z-30">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search customers..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-200 placeholder:text-slate-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers?.map((customer, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            key={customer.id}
                            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700/50 shadow-lg hover:shadow-2xl hover:bg-slate-800/80 transition-all p-6 group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 font-bold text-lg border border-blue-500/20 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300">
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg leading-tight">{customer.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Building2 className="w-3 h-3 text-slate-500" />
                                            <p className="text-xs text-slate-400 font-medium">{customer.company}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: true, id: customer.id, name: customer.name })}
                                        className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Customer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/30">
                                <div className="flex items-center gap-3 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                                    <Mail className="w-4 h-4 text-slate-500" />
                                    <span className="truncate">{customer.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                                    <Phone className="w-4 h-4 text-slate-500" />
                                    <span>{customer.phone}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Orders</span>
                                        <span className="font-bold text-white leading-none">{customer.totalOrders}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setProfileCustomer(customer)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-indigo-500 hover:text-white text-xs font-bold transition-all border border-slate-600/50 hover:border-indigo-400/50">
                                    View Profile
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false, isDeleteAll: false })}
                onConfirm={() => {
                    if (deleteModal.isDeleteAll) {
                        deleteAllMutation.mutate();
                    } else {
                        deleteCustomerMutation.mutate(deleteModal.id);
                    }
                }}
                title="Delete Customer?"
                message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
                confirmText="Delete Customer"
                cancelText="Cancel"
                variant="danger"
            />
        </motion.div>
    );
}
