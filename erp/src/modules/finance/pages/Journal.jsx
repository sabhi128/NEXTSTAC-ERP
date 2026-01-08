import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import JournalEntryForm from '../components/journal/JournalEntryForm';
import GeneralJournal from '../components/journal/GeneralJournal';
import { FileText, DollarSign, Calendar, Trash2 } from 'lucide-react';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { api } from '../../../lib/api';

export default function Journal() {
    const queryClient = useQueryClient();
    const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);

    const { data: accounts, isLoading: accountsLoading } = useQuery({
        queryKey: ['accounts'],
        queryFn: mockDataService.getAccounts,
    });

    const { data: transactions, isLoading: transactionsLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: mockDataService.getTransactions,
    });

    const addTransactionMutation = useMutation({
        mutationFn: mockDataService.addTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries(['transactions']);
        },
    });

    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            // Delete both mock data and real backend data
            mockDataService.deleteAllTransactions();
            try {
                await api.delete('/finance/transactions/all');
            } catch (e) {
                console.warn('Failed to delete backend transactions', e);
            }
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['transactions']);
            // Invalidate dashboard queries too if possible, or just transactions which Dashboard uses
            setDeleteModalOpen(false);
        }
    });

    const handlePostEntry = async (entry) => {
        try {
            await addTransactionMutation.mutateAsync(entry);
            return true;
        } catch (error) {
            console.error('Failed to post entry', error);
            return false;
        }
    };

    if (accountsLoading || transactionsLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

    // Stats Calculation
    const sortedTransactions = [...(transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalEntries = sortedTransactions.length;
    const totalValue = sortedTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const latestEntryDate = sortedTransactions.length > 0
        ? new Date(sortedTransactions[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '-';

    return (
        <div className="min-h-screen pb-20">
            <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white drop-shadow-sm">Journal Entries</h2>
                        <p className="text-slate-400 text-sm mt-1">Record and view all financial transactions in general ledger</p>
                    </div>
                    <button
                        onClick={() => setDeleteModalOpen(true)}
                        className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete All Entries
                    </button>
                </div>

                {/* Entry Form */}
                <JournalEntryForm
                    accounts={accounts || []}
                    onPostEntry={handlePostEntry}
                />

                {/* Stats Section */}
                <div className="space-y-4">
                    <h3 className="font-bold text-white text-sm uppercase tracking-widest pl-1">Recent Activity</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Entries */}
                        <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl flex items-center justify-between group hover:bg-slate-800/70 transition-colors">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Entries</p>
                                <p className="text-3xl font-black text-white">{totalEntries}</p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                        </div>

                        {/* Total Value */}
                        <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl flex items-center justify-between group hover:bg-slate-800/70 transition-colors">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Value</p>
                                <p className="text-3xl font-black text-white">
                                    ${(totalValue / 1000).toFixed(1)}k
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>

                        {/* Latest Entry */}
                        <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl flex items-center justify-between group hover:bg-slate-800/70 transition-colors">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Latest Entry</p>
                                <p className="text-3xl font-black text-white">{latestEntryDate}</p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                                <Calendar className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Journal Table */}
                <GeneralJournal transactions={transactions || []} />
            </div>
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={() => deleteAllMutation.mutate()}
                title="Delete All Journal Entries?"
                message="Are you sure you want to delete ALL journal entries and transactions? This will also clear the General Ledger. This action cannot be undone."
                confirmText="Delete Everything"
                variant="destructive"
            />
        </div>
    );
}
