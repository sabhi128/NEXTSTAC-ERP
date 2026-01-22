import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../context/ToastContext';
// import { mockDataService } from '../../../services/mockDataService';
import {
    Building2,
    Search,
    Filter,
    MoreHorizontal,
    Star,
    Phone,
    Mail,
    Plus,
    Trash2,
    Edit2,
    MapPin,
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SupplierFormModal from '../components/SupplierFormModal';
import ConfirmationModal from '../../../components/ConfirmationModal';

import { api } from '../../../lib/api';

export default function SupplierList() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, isDeleteAll: false });

    const { data: suppliers = [], isLoading } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => api.get('/purchasing/vendors'),
    });

    const addMutation = useMutation({
        mutationFn: (data) => api.post('/purchasing/vendors', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['vendors']);
            setIsFormOpen(false);
            setEditingSupplier(null);
            showToast('Vendor added successfully', 'success');
        },
        onError: (error) => {
            console.error("Failed to add vendor:", error);
            showToast(error.message || 'Failed to add vendor', 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/purchasing/vendors/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['vendors']);
            setIsFormOpen(false);
            setEditingSupplier(null);
            showToast('Vendor updated successfully', 'success');
        },
        onError: (error) => {
            console.error("Failed to update vendor:", error);
            showToast(error.message || 'Failed to update vendor', 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/purchasing/vendors/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['vendors']);
            setDeleteConfirm({ isOpen: false, id: null });
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: () => api.delete('/purchasing/vendors/all'),
        onSuccess: () => {
            queryClient.invalidateQueries(['vendors']);
            setDeleteConfirm({ isOpen: false, id: null, isDeleteAll: false });
        }
    });

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        setDeleteConfirm({ isOpen: true, id });
    };

    const handleFormSubmit = (data) => {
        if (editingSupplier) {
            updateMutation.mutate({ id: editingSupplier.id, data });
        } else {
            addMutation.mutate(data);
        }
    };

    const toggleStatus = (supplier) => {
        const newStatus = supplier.status === 'Active' ? 'Inactive' : 'Active';
        updateMutation.mutate({
            id: supplier.id,
            data: { status: newStatus }
        });
    };

    const filteredSuppliers = suppliers?.filter(s =>
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (isLoading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </motion.div>
            <p className="mt-4 font-medium">Loading suppliers...</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-[1920px] mx-auto p-4 md:p-8">
            <SupplierFormModal
                isOpen={isFormOpen}
                initialData={editingSupplier}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingSupplier(null);
                }}
                onSubmit={handleFormSubmit}
            />

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
                title={deleteConfirm.isDeleteAll ? "Delete All Suppliers?" : "Delete Supplier"}
                message={deleteConfirm.isDeleteAll ? "Are you sure you want to delete ALL suppliers? This cannot be undone." : "Are you sure you want to delete this supplier? This action cannot be undone."}
                confirmText={deleteConfirm.isDeleteAll ? "Delete All" : "Delete Supplier"}
                variant="danger"
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Suppliers</h2>
                    <p className="text-slate-400">Manage vendor relationships and procurement</p>
                </div>
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
                            setEditingSupplier(null);
                            setIsFormOpen(true);
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-2 font-bold transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Add Supplier
                    </motion.button>
                </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl sticky top-20 z-30 shadow-xl">
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by company or contact person..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder:text-slate-500 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
                <AnimatePresence mode="popLayout">
                    {filteredSuppliers?.map(supplier => (
                        <motion.div
                            key={supplier.id}
                            variants={itemVariants}
                            layout
                            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 group relative hover:bg-slate-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10"
                        >
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                <button
                                    onClick={() => handleEdit(supplier)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-all"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(supplier.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center text-purple-400 border border-slate-600 shadow-inner">
                                        <Building2 className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg leading-tight">{supplier.companyName}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3.5 h-3.5 ${i < supplier.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs font-medium text-slate-500 ml-1">Reliability</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm group/item">
                                    <div className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 group-hover/item:text-purple-400 transition-colors">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-slate-300">{supplier.contactPerson}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm group/item">
                                    <div className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 group-hover/item:text-purple-400 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-400 truncate">{supplier.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm group/item">
                                    <div className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 group-hover/item:text-purple-400 transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-400">{supplier.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm group/item">
                                    <div className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 group-hover/item:text-purple-400 transition-colors">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-400 truncate">{supplier.address}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center">
                                <button
                                    onClick={() => toggleStatus(supplier)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border ${supplier.status === 'Active'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                        : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700'
                                        }`}
                                >
                                    {supplier.status}
                                </button>
                                <button
                                    onClick={() => handleEdit(supplier)}
                                    className="text-xs font-medium text-purple-400 cursor-pointer hover:underline bg-transparent border-0 p-0"
                                >
                                    View Details
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredSuppliers?.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                            <Building2 className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-lg font-medium text-slate-400">No suppliers found</p>
                        <p className="text-sm mt-1">Try adjusting your search terms</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
