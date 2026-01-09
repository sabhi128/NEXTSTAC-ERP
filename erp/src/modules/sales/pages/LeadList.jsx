import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { mockDataService } from '../../../services/mockDataService';
import { Target, Search, MoreHorizontal, User, Phone, CheckCircle, ArrowRight, Plus, Edit, Trash2, XCircle, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../../../components/ConfirmationModal';
import LeadFormModal from '../components/LeadFormModal';

import { api } from '../../../lib/api';

export default function LeadList() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmConvert, setConfirmConvert] = useState({ isOpen: false, leadId: null });

    // New State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '', isDeleteAll: false });
    const [activeDropdown, setActiveDropdown] = useState(null);

    const { data: leads = [], isLoading } = useQuery({
        queryKey: ['leads'],
        queryFn: () => api.get('/crm/leads'),
    });

    const addLeadMutation = useMutation({
        mutationFn: (data) => api.post('/crm/leads', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['leads']);
            setIsAddModalOpen(false);
            setEditingLead(null);
        }
    });

    const updateLeadMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/crm/leads/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['leads']);
            setIsAddModalOpen(false);
            setEditingLead(null);
        }
    });

    const deleteLeadMutation = useMutation({
        mutationFn: (id) => api.delete(`/crm/leads/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['leads']);
            setDeleteModal({ isOpen: false, id: null, name: '' });
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: () => api.delete('/crm/leads/all'),
        onSuccess: () => {
            queryClient.invalidateQueries(['leads']);
            setDeleteModal({ isOpen: false, id: null, name: '', isDeleteAll: false });
        }
    });

    const contactMutation = useMutation({
        mutationFn: (id) => api.put(`/crm/leads/${id}`, { status: 'Contacted' }),
        onSuccess: () => queryClient.invalidateQueries(['leads'])
    });

    const markLostMutation = useMutation({
        mutationFn: (id) => api.put(`/crm/leads/${id}`, { status: 'Lost' }),
        onSuccess: () => queryClient.invalidateQueries(['leads'])
    });

    const convertMutation = useMutation({
        // Conversion logic is complex (delete lead, create customer).
        // For now, let's keep it simple or implement a conversion endpoint?
        // Let's assume frontend logic: get lead, create customer, delete lead.
        // OR better: create a backend endpoint for conversion.
        // Given time constraint, I'll do it on frontend for now or create a smart mutation.
        // Actually, dbAdapter implies `createCustomer` sets orders to 0.
        // I will do: Post Customer -> Delete Lead.
        mutationFn: async (id) => {
            const lead = leads.find(l => l.id === id);
            if (!lead) return;
            await api.post('/crm/customers', {
                name: lead.name,
                company: lead.company,
                email: lead.email,
                phone: lead.phone,
                status: 'Active',
                notes: `Converted from lead. Source: ${lead.source}`
            });
            await api.delete(`/crm/leads/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['leads']);
            queryClient.invalidateQueries(['customers']);
            setConfirmConvert({ isOpen: false, leadId: null });
        }
    });

    const handleFormSubmit = (data) => {
        if (editingLead) {
            updateLeadMutation.mutate({ id: editingLead.id, data });
        } else {
            addLeadMutation.mutate(data);
        }
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const filteredLeads = leads?.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'Contacted': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'Qualified': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Lost': return 'bg-slate-700/50 text-slate-400 border-slate-600/50';
            default: return 'bg-slate-700/50 text-slate-400 border-slate-600/50';
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading leads...</div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
        >
            <ConfirmationModal
                isOpen={confirmConvert.isOpen}
                onClose={() => setConfirmConvert({ isOpen: false, leadId: null })}
                onConfirm={() => convertMutation.mutate(confirmConvert.leadId)}
                title="Convert Lead"
                message="Are you sure you want to convert this lead to a customer? This will remove the lead and create a new active customer record."
                confirmText="Convert to Customer"
                variant="primary"
            />

            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Leads</h2>
                        <p className="text-slate-400 text-sm mt-1">Track and convert potential customers</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setDeleteModal({ isOpen: true, id: null, name: 'All Leads', isDeleteAll: true })}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-xl flex items-center gap-2 font-bold transition-all border border-slate-700 hover:border-red-500/20"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete All
                        </button>
                        <button
                            onClick={() => {
                                setEditingLead(null);
                                setIsAddModalOpen(true);
                            }}
                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-400/20"
                        >
                            <Plus className="w-4 h-4" />
                            Add Lead
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 shadow-xl relative z-30">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-200 placeholder:text-slate-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeads?.map((lead, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            key={lead.id}
                            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-slate-700/50 shadow-lg hover:shadow-2xl hover:bg-slate-800/80 transition-all p-6 group"
                        >
                            <div className="flex justify-between items-start mb-4 relative">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/10">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg leading-tight">{lead.name}</h3>
                                        <p className="text-sm text-slate-400 font-medium">{lead.company}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${getStatusColor(lead.status)}`}>
                                        {lead.status}
                                    </span>
                                    <div className="relative" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === lead.id ? null : lead.id)}
                                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>

                                        {activeDropdown === lead.id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                                <button
                                                    onClick={() => {
                                                        setEditingLead(lead);
                                                        setIsAddModalOpen(true);
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-indigo-400 flex items-center gap-2 rounded-lg font-medium transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" /> Edit
                                                </button>
                                                {lead.status !== 'Lost' && (
                                                    <button
                                                        onClick={() => {
                                                            markLostMutation.mutate(lead.id);
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-orange-400 flex items-center gap-2 rounded-lg font-medium transition-colors"
                                                    >
                                                        <XCircle className="w-4 h-4" /> Mark Lost
                                                    </button>
                                                )}
                                                <div className="h-px bg-slate-700 my-1"></div>
                                                <button
                                                    onClick={() => {
                                                        setDeleteModal({ isOpen: true, id: lead.id, name: lead.name });
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-lg font-medium transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/30">
                                <div className="text-sm flex justify-between items-center">
                                    <span className="text-slate-500 font-medium text-xs uppercase tracking-wide">Source</span>
                                    <span className="font-bold text-slate-300">{lead.source}</span>
                                </div>
                                <div className="text-sm flex justify-between items-center">
                                    <span className="text-slate-500 font-medium text-xs uppercase tracking-wide">Est. Value</span>
                                    <span className="font-bold text-emerald-400 text-base font-mono">${lead.value.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={() => contactMutation.mutate(lead.id)}
                                    disabled={lead.status !== 'New'}
                                    className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border 
                                        ${lead.status === 'New'
                                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10'
                                            : 'bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed'}`}
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    {lead.status === 'New' ? 'Contact' : 'Contacted'}
                                </button>
                                <button
                                    onClick={() => setConfirmConvert({ isOpen: true, leadId: lead.id })}
                                    className="flex-1 py-2 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-400/20 flex items-center justify-center gap-2"
                                >
                                    <span>Convert</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {filteredLeads?.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-500">
                            <Target className="w-16 h-16 mx-auto mb-4 opacity-10" />
                            <p className="text-lg">No leads found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <LeadFormModal
                isOpen={isAddModalOpen}
                initialData={editingLead}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingLead(null);
                }}
                onSubmit={handleFormSubmit}
            />

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false, isDeleteAll: false })}
                onConfirm={() => {
                    if (deleteModal.isDeleteAll) {
                        deleteAllMutation.mutate();
                    } else {
                        deleteLeadMutation.mutate(deleteModal.id);
                    }
                }}
                title="Delete Lead?"
                message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
                confirmText="Delete Lead"
                variant="danger"
            />
        </motion.div>
    );
}
