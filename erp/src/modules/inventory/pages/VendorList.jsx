import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import {
    Store,
    Plus,
    Search,
    MoreVertical,
    Phone,
    MapPin,
    Star,
    Trash2
} from 'lucide-react';
import VendorModal from '../components/VendorModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import StatusToggle from '../components/StatusToggle';

export default function VendorList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [vendorToDelete, setVendorToDelete] = useState(null);

    const { data: vendors, isLoading } = useQuery({
        queryKey: ['vendors'],
        queryFn: mockDataService.getVendors,
    });

    const addVendorMutation = useMutation({
        mutationFn: (data) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockDataService.addVendor(data));
                }, 300);
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['vendors']);
            setIsModalOpen(false);
        }
    });

    const updateVendorMutation = useMutation({
        mutationFn: ({ id, data }) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockDataService.updateVendor(id, data));
                }, 300);
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['vendors']);
            setIsModalOpen(false);
        }
    });

    // Special mutation for status to avoid closing modal if we were editing (though toggle is inline)
    // Actually reusing updateVendorMutation is fine, but it closes modal?
    // updateVendorMutation has `setIsModalOpen(false)` on success.
    // If I toggle status, I don't want to close any modal (but none is open).
    // However, if I toggle, it invalidates queries.
    // But `setIsModalOpen(false)` might be annoying if I reused it for inline updates?
    // Let's create `updateStatusMutation` specifically for inline updates without side effects like closing modals.

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockDataService.updateVendor(id, { status }));
                }, 300);
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['vendors']);
        }
    });


    const deleteAllMutation = useMutation({
        mutationFn: () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockDataService.deleteAllVendors());
                }, 500);
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['vendors']);
            setIsDeleteModalOpen(false);
            setVendorToDelete(null);
        }
    });

    const handleAddClick = () => {
        setSelectedVendor(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (vendor) => {
        setSelectedVendor(vendor);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (vendor) => {
        setVendorToDelete(vendor);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (vendorToDelete === 'ALL') {
            deleteAllMutation.mutate();
        } else if (vendorToDelete) {
            deleteVendorMutation.mutate(vendorToDelete.id);
        }
    };

    const handleModalSubmit = (data) => {
        if (selectedVendor) {
            updateVendorMutation.mutate({ id: selectedVendor.id, data });
        } else {
            addVendorMutation.mutate(data);
        }
    };

    const filteredVendors = vendors?.filter(vendor =>
        vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading vendors...</div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
        >
            <VendorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                vendor={selectedVendor}
                onSubmit={handleModalSubmit}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={vendorToDelete === 'ALL' ? "Delete All Vendors?" : "Delete Vendor?"}
                message={vendorToDelete === 'ALL'
                    ? "Are you sure you want to delete ALL VENDORS? This action cannot be undone."
                    : `Are you sure you want to delete "${vendorToDelete?.companyName}"?`}
                confirmText={vendorToDelete === 'ALL' ? "Delete Everything" : (deleteVendorMutation.isPending ? "Deleting..." : "Delete Vendor")}
                variant="danger"
            />

            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Vendors</h2>
                        <p className="text-slate-400 text-sm mt-1">Manage suppliers and partners</p>
                    </div>
                    <div className="flex gap-3">
                        {vendors?.length > 0 && (
                            <button
                                onClick={() => {
                                    setVendorToDelete('ALL');
                                    setIsDeleteModalOpen(true);
                                }}
                                className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete All
                            </button>
                        )}
                        <button
                            onClick={handleAddClick}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 border border-blue-400/20"
                        >
                            <Plus className="w-4 h-4" />
                            Add Vendor
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 shadow-xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-200 placeholder:text-slate-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVendors?.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No vendors found.
                        </div>
                    ) : filteredVendors?.map((vendor, index) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            key={vendor.id}
                            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700/50 shadow-lg hover:shadow-2xl hover:bg-slate-800/80 transition-all p-6 group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/10">
                                        <Store className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white truncate max-w-[150px] text-lg leading-tight">{vendor.companyName}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                            <span className="text-xs font-bold text-slate-400">{vendor.rating || 5}.0</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteClick(vendor)}
                                    className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-colors active:scale-95"
                                    title="Delete Vendor"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/30">
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="w-20 text-slate-500 font-medium text-xs uppercase tracking-wide">Contact</span>
                                    <span className="font-semibold text-slate-200">{vendor.contactPerson}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="w-20 text-slate-500 font-medium text-xs uppercase tracking-wide">Phone</span>
                                    <span className="text-slate-300 font-mono">{vendor.phone}</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm">
                                    <span className="w-20 text-slate-500 font-medium text-xs uppercase tracking-wide shrink-0">Address</span>
                                    <span className="truncate text-slate-300">{vendor.address}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
                                <StatusToggle
                                    currentStatus={vendor.status || 'Active'}
                                    onUpdate={(newStatus) => updateStatusMutation.mutate({ id: vendor.id, status: newStatus })}
                                    activeValue="Active"
                                    inactiveValue="Inactive"
                                />
                                <button
                                    onClick={() => handleEditClick(vendor)}
                                    className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/20"
                                >
                                    View Details
                                </button>
                            </div>
                        </motion.div>
                    ))
                    }
                </div>
            </div>
        </motion.div>
    );
}
