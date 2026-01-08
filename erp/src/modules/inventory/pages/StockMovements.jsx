import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    History,
    Plus,
    Trash2,
    Pencil // Added for Edit
} from 'lucide-react';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { api } from '../../../lib/api'; // Corrected API import path


import StockAdjustmentModal from '../components/StockAdjustmentModal';

export default function StockMovements() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMovement, setSelectedMovement] = useState(null); // For Edit

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [movementToDelete, setMovementToDelete] = useState(null);

    // Filters
    const [typeFilter, setTypeFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const types = ['All', 'In', 'Out', 'Adjustment'];

    const { data: movements, isLoading } = useQuery({
        queryKey: ['stock_movements'],
        queryFn: () => api.get('/inventory/stock-movements'),
    });

    const deleteMovementMutation = useMutation({
        mutationFn: (id) => api.delete(`/inventory/stock-movements/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['stock_movements']);
            setIsDeleteModalOpen(false);
            setMovementToDelete(null);
        },
        onError: (error) => {
            alert("Failed to delete: " + error.message);
        }
    });

    const addMovementMutation = useMutation({
        mutationFn: (data) => api.post('/inventory/stock-movements', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['stock_movements']);
            setIsModalOpen(false);
            setSelectedMovement(null);
        },
        onError: (error) => {
            alert("Failed to add: " + error.message);
        }
    });

    const updateMovementMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/inventory/stock-movements/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['stock_movements']);
            setIsModalOpen(false);
            setSelectedMovement(null);
        },
        onError: (error) => {
            alert("Failed to update: " + error.message);
        }
    });

    const handleDeleteClick = (movement) => {
        setMovementToDelete(movement);
        setIsDeleteModalOpen(true);
    };

    const handleEditClick = (movement) => {
        setSelectedMovement(movement);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (movementToDelete) {
            deleteMovementMutation.mutate(movementToDelete.id);
        }
    };

    const handleModalSubmit = (data) => {
        if (selectedMovement) {
            updateMovementMutation.mutate({ id: selectedMovement.id, data });
        } else {
            addMovementMutation.mutate(data);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMovement(null);
    };

    const filteredMovements = movements?.filter(m => {
        const matchesSearch = m.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.reference?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || m.type === typeFilter;
        return matchesSearch && matchesType;
    });

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading stock history...</div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
        >
            <StockAdjustmentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleModalSubmit}
                movement={selectedMovement}
            />

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleConfirmDelete}
                title={deleteModal.id === 'ALL' ? "Delete All History?" : "Delete Record?"}
                message={deleteModal.id === 'ALL'
                    ? "Are you sure you want to delete ALL STOCK HISTORY? This action cannot be undone."
                    : `Are you sure you want to delete this stock movement log? This action cannot be undone.`}
                confirmText={deleteModal.id === 'ALL' ? (deleteAllMutation.isPending ? "Deleting All..." : "Delete Everything") : (deleteMovementMutation.isPending ? "Deleting..." : "Delete Record")}
                cancelText="Cancel"
                variant="danger"
            />

            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <History className="h-6 w-6 text-indigo-400" />
                            Stock Movements
                        </h1>
                        <p className="text-slate-400 mt-1">Track inventory history and adjustments</p>
                    </div>
                    <div className="flex gap-3">
                        {movements?.length > 0 && (
                            <button
                                onClick={() => setDeleteModal({ isOpen: true, id: 'ALL' })}
                                className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete All
                            </button>
                        )}
                        <button
                            onClick={() => { setSelectedMovement(null); setIsModalOpen(true); }}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            New Adjustment
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by product or reference..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className="px-3 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-600 transition-colors"
                                >
                                    <Filter className="h-4 w-4" />
                                    {typeFilter}
                                </button>
                                {isFilterOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1">
                                        {types.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    setTypeFilter(type);
                                                    setIsFilterOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm ${typeFilter === type ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-300 hover:bg-slate-700'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 text-sm">
                                    <th className="text-left py-3 px-4 font-medium">Date</th>
                                    <th className="text-left py-3 px-4 font-medium">Product</th>
                                    <th className="text-left py-3 px-4 font-medium">Type</th>
                                    <th className="text-left py-3 px-4 font-medium">Qty</th>
                                    <th className="text-left py-3 px-4 font-medium">Warehouse</th>
                                    <th className="text-left py-3 px-4 font-medium">Reference</th>
                                    <th className="text-left py-3 px-4 font-medium">Reason</th>
                                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredMovements?.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-8 text-center text-slate-500">
                                            No stock movements found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMovements?.map((movement) => (
                                        <tr key={movement.id} className="text-sm text-slate-300 hover:bg-slate-700/30 transition-colors">
                                            <td className="py-3 px-4">
                                                {new Date(movement.date).toLocaleDateString()}
                                                <div className="text-xs text-slate-500">
                                                    {new Date(movement.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-medium text-slate-200">
                                                {movement.productName}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${movement.type === 'In'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : movement.type === 'Out'
                                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                    {movement.type === 'In' ? <ArrowDownLeft className="h-3 w-3" /> :
                                                        movement.type === 'Out' ? <ArrowUpRight className="h-3 w-3" /> :
                                                            <History className="h-3 w-3" />}
                                                    {movement.type}
                                                </span>
                                            </td>
                                            <td className={`py-3 px-4 font-medium ${movement.type === 'In' ? 'text-emerald-400' :
                                                movement.type === 'Out' ? 'text-rose-400' : 'text-amber-400'
                                                }`}>
                                                {movement.type === 'Out' ? '-' : '+'}{movement.quantity}
                                            </td>
                                            <td className="py-3 px-4 text-slate-400">{movement.warehouse || '-'}</td>
                                            <td className="py-3 px-4 font-mono text-xs bg-slate-800/50 rounded px-1.5 py-0.5 inline-block mt-2">
                                                {movement.reference}
                                            </td>
                                            <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={movement.reason}>
                                                {movement.reason || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(movement)} // Changed to handleEditClick
                                                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(movement)}
                                                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
