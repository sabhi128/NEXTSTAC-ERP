import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { mockDataService } from '../../../services/mockDataService';
import { api } from '../../../lib/api';
import { Phone, Mail, Calendar, CheckSquare, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../../../components/ConfirmationModal';

export default function FollowUpList() {
    const queryClient = useQueryClient();
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, isDeleteAll: false });

    const { data: followUps = [], isLoading } = useQuery({
        queryKey: ['followUps'],
        queryFn: () => api.get('/crm/followups'),
    });

    const deleteFollowUpMutation = useMutation({
        mutationFn: (id) => api.delete(`/crm/followups/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['followUps']);
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: () => api.delete('/crm/followups/all'),
        onSuccess: () => {
            queryClient.invalidateQueries(['followUps']);
            setDeleteModal({ isOpen: false, id: null, isDeleteAll: false });
        }
    });

    const completeFollowUpMutation = useMutation({
        mutationFn: (id) => api.put(`/crm/followups/${id}`, { status: 'Completed' }),
        onSuccess: () => queryClient.invalidateQueries(['followUps'])
    });

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading items...</div>;

    const getIcon = (type) => {
        switch (type) {
            case 'Call': return <Phone className="w-5 h-5" />;
            case 'Email': return <Mail className="w-5 h-5" />;
            default: return <Calendar className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Call': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'Email': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
        >
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Follow-ups</h2>
                        <p className="text-slate-400 text-sm mt-1">Scheduled actions and reminders</p>
                    </div>
                    <div>
                        <button
                            onClick={() => setDeleteModal({ isOpen: true, id: null, isDeleteAll: true })}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-xl flex items-center gap-2 font-bold transition-all border border-slate-700 hover:border-red-500/20"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete All
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative z-30">
                    <div className="divide-y divide-slate-700/50">
                        {followUps?.map((item, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                key={item.id}
                                className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-700/30 transition-all group"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${getTypeColor(item.type)}`}>
                                    {getIcon(item.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-200 text-lg">{item.type} with <span className="text-white">{item.contact}</span></h3>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${item.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 line-clamp-1 group-hover:text-slate-300 transition-colors">{item.notes}</p>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px] pt-4 md:pt-0 border-t md:border-t-0 border-slate-700/50">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-300 flex items-center gap-1.5 justify-end">
                                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                            {new Date(item.date).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-wide">Due Date</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => deleteFollowUpMutation.mutate(item.id)}
                                            className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all border border-slate-700"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => completeFollowUpMutation.mutate(item.id)}
                                            className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20"
                                        >
                                            <CheckSquare className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {followUps?.length === 0 && (
                            <div className="p-12 text-center text-slate-500">
                                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No pending follow-ups found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
