import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import {
    Warehouse,
    Plus,
    Search,
    MapPin,
    Package,
    MoreVertical,
    Trash2,
    Pencil
} from 'lucide-react';
import ConfirmationModal from '../../../components/ConfirmationModal';


export default function WarehouseList() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: ''
    });

    const { data: warehouses, isLoading } = useQuery({
        queryKey: ['warehouses'],
        queryFn: mockDataService.getWarehouses,
    });

    const addWarehouseMutation = useMutation({
        mutationFn: (newWarehouse) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockDataService.addWarehouse(newWarehouse));
                }, 500);
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouses']);
            handleCloseModal();
        }
    });

    const updateWarehouseMutation = useMutation({
        mutationFn: ({ id, data }) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockDataService.updateWarehouse(id, data));
                }, 500);
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouses']);
            handleCloseModal();
        }
    });

    const deleteWarehouseMutation = useMutation({
        mutationFn: (id) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockDataService.deleteWarehouse(id));
                }, 300);
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouses']);
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockDataService.deleteAllWarehouses());
                }, 500);
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['warehouses']);
            setDeleteModal({ isOpen: false, id: null, name: '' });
        }
    });

    const handleStatusToggle = (wh) => {
        const newStatus = wh.status === 'Active' ? 'Inactive' : 'Active';
        updateStatusMutation.mutate({ id: wh.id, status: newStatus });
    };

    const handleEditClick = (wh) => {
        setSelectedWarehouse(wh);
        setFormData({
            name: wh.name,
            location: wh.location,
            capacity: wh.capacity ? String(wh.capacity).replace(' units', '') : ''
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedWarehouse(null);
        setFormData({ name: '', location: '', capacity: '' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            capacity: formData.capacity + ' units'
        };

        if (selectedWarehouse) {
            updateWarehouseMutation.mutate({ id: selectedWarehouse.id, data });
        } else {
            addWarehouseMutation.mutate(data);
        }
    };

    const filteredWarehouses = warehouses?.filter(wh =>
        wh.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading warehouses...</div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
        >

            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Warehouses</h1>
                        <p className="text-slate-400 text-sm mt-1">Manage inventory storage locations</p>
                    </div>
                    <div className="flex gap-3">
                        {warehouses?.length > 0 && (
                            <button
                                onClick={() => setDeleteModal({ isOpen: true, id: 'ALL', name: 'ALL WAREHOUSES' })}
                                className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete All
                            </button>
                        )}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-violet-500/20 active:scale-95 border border-violet-400/20"
                        >
                            <Plus className="w-4 h-4" />
                            New Warehouse
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 shadow-xl">
                    <div className="relative">
                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Search warehouses..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-slate-200 placeholder:text-slate-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredWarehouses?.map((wh, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            key={wh.id}
                            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700/50 shadow-lg hover:shadow-2xl hover:bg-slate-800/80 transition-all group overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-violet-500/10 text-violet-400 rounded-2xl border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors shadow-inner">
                                        <Warehouse className="w-8 h-8" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(wh)}
                                            className="text-slate-500 hover:text-violet-400 p-2 rounded-xl hover:bg-violet-500/10 transition-colors active:scale-90"
                                            title="Edit Warehouse"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, id: wh.id, name: wh.name })}
                                            className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-colors active:scale-90"
                                            title="Delete Warehouse"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2 leading-tight">{wh.name}</h3>
                                <div className="flex items-center gap-2 text-slate-400 text-sm mb-6 bg-slate-900/50 p-3 rounded-xl border border-slate-700/30">
                                    <MapPin className="w-4 h-4 text-violet-400" />
                                    {wh.location}
                                </div>

                                <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                                        <Package className="w-4 h-4 text-slate-500" />
                                        <span>Capacity: <b className="text-white">{wh.capacity}</b></span>
                                    </div>
                                    <button
                                        onClick={() => handleStatusToggle(wh)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 border ${wh.status === 'Active'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                            : 'bg-slate-700/50 text-slate-400 border-slate-600/50 hover:bg-slate-700'
                                            }`}
                                    >
                                        {wh.status}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Modal */}
                {isModalOpen && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-slate-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-800">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <h2 className="text-lg font-bold text-white">
                                    {selectedWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors">
                                    <span className="sr-only">Close</span>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase">Warehouse Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all text-white placeholder:text-slate-500"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Central Hub"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase">Location</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all text-white placeholder:text-slate-500"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g. 500 Industrial Ave"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase">Capacity</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all text-white placeholder:text-slate-500"
                                        value={formData.capacity}
                                        onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                        placeholder="e.g. 10000"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addWarehouseMutation.isPending || updateWarehouseMutation.isPending}
                                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-violet-500/20 disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {addWarehouseMutation.isPending || updateWarehouseMutation.isPending ? 'Saving...' : (selectedWarehouse ? 'Update Warehouse' : 'Create Warehouse')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={() => {
                    if (deleteModal.id === 'ALL') {
                        deleteAllMutation.mutate();
                    } else {
                        deleteWarehouseMutation.mutate(deleteModal.id);
                    }
                }}
                title={deleteModal.id === 'ALL' ? "Delete All Warehouses?" : "Delete Warehouse?"}
                message={deleteModal.id === 'ALL'
                    ? "Are you sure you want to delete ALL WAREHOUSES? This action cannot be undone."
                    : `Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
                confirmText={deleteModal.id === 'ALL' ? "Delete Everything" : "Delete Warehouse"}
                cancelText="Cancel"
                variant="danger"
            />
        </motion.div>
    );
}
