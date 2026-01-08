import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import { api } from '../../../lib/api';
import InvoiceForm from '../components/invoices/InvoiceForm';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Clock,
    CheckCircle,
    AlertCircle,
    Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import ConfirmationModal from '../../../components/ConfirmationModal';
import InvoiceStatusSelect from '../components/invoices/InvoiceStatusSelect';


export default function InvoiceList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    const queryClient = useQueryClient();

    const { data: invoices, isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: mockDataService.getInvoices,
    });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: mockDataService.getProducts,
    });

    const deleteInvoiceMutation = useMutation({
        mutationFn: async (id) => await api.delete(`/finance/invoices/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['invoices']);
            setDeleteModal({ isOpen: false, id: null });
        },
        onError: (error) => {
            alert(`Failed to delete invoice: ${error.message}`);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await api.patch(`/finance/invoices/${id}/status`, { status });
        },
        onSuccess: () => queryClient.invalidateQueries(['invoices']),
        onError: (error) => {
            alert(`Failed to update status: ${error.message}`);
            // console.error(error);
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: async () => await api.delete('/finance/invoices/all'),
        onSuccess: () => {
            queryClient.invalidateQueries(['invoices']);
            setDeleteModal({ isOpen: false, id: null });
        },
        onError: (error) => {
            alert(`Failed to delete all invoices: ${error.message}`);
        }
    });

    const addInvoiceMutation = useMutation({
        mutationFn: (data) => new Promise(resolve => setTimeout(() => resolve(mockDataService.addInvoice(data)), 300)),
        onSuccess: () => {
            queryClient.invalidateQueries(['invoices']);
            setShowForm(false);
        }
    });

    const filteredInvoices = invoices?.filter(inv => {
        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.customer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });



    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading invoices...</div>;

    return (
        <div className="min-h-screen">
            {showForm && (
                <InvoiceForm
                    onSave={(data) => addInvoiceMutation.mutate(data)}
                    onCancel={() => setShowForm(false)}
                    products={products || []}
                />
            )}

            <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white drop-shadow-sm">Invoices</h2>
                        <p className="text-slate-400 text-sm mt-1">Manage customer invoices and billing</p>
                    </div>
                    <div className="flex gap-3">
                        {invoices?.length > 0 && (
                            <button
                                onClick={() => setDeleteModal({ isOpen: true, id: 'ALL' })}
                                className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete All
                            </button>
                        )}
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl flex items-center gap-2 font-bold transition-all shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="w-5 h-5" />
                            New Invoice
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl flex flex-col sm:flex-row gap-4 relative z-20">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-900/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={clsx(
                                "px-6 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all border",
                                statusFilter !== 'All'
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-700/50 hover:text-white'
                            )}
                        >
                            <Filter className="w-5 h-5" />
                            {statusFilter === 'All' ? 'Status' : statusFilter}
                        </button>

                        {isFilterOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setIsFilterOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-2 z-40 animate-in fade-in zoom-in-95 duration-200">
                                    {['All', 'Paid', 'Pending', 'Overdue'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setStatusFilter(status);
                                                setIsFilterOpen(false);
                                            }}
                                            className={clsx(
                                                "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-between",
                                                statusFilter === status
                                                    ? 'bg-indigo-600/20 text-indigo-300'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            )}
                                        >
                                            {status}
                                            {statusFilter === status && (
                                                <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Invoice #</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Customer</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Date Issued</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs text-right">Amount</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Status</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredInvoices?.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-700/30 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-bold text-indigo-400 border-r border-slate-700/50 group-hover:border-slate-700/80 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                                </div>
                                                {invoice.invoiceNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate">{invoice.customer}</td>
                                        <td className="px-6 py-4 text-slate-400 font-medium">
                                            {new Date(invoice.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-white text-right text-lg tracking-tight">
                                            ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <InvoiceStatusSelect
                                                currentStatus={invoice.status}
                                                onUpdate={(newStatus) => updateStatusMutation.mutate({
                                                    id: invoice.id,
                                                    status: newStatus
                                                })}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, id: invoice.id })}
                                                    className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete Invoice"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredInvoices?.map((invoice) => (
                        <div key={invoice.id} className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 font-mono">
                                        {invoice.invoiceNumber}
                                    </div>
                                    <div className="font-extrabold text-white text-lg line-clamp-1">{invoice.customer}</div>
                                </div>
                                <InvoiceStatusSelect
                                    currentStatus={invoice.status}
                                    onUpdate={(newStatus) => updateStatusMutation.mutate({
                                        id: invoice.id,
                                        status: newStatus
                                    })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm border-y border-slate-700/50 py-4">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date Issued</div>
                                    <div className="font-bold text-slate-300">
                                        {new Date(invoice.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount</div>
                                    <div className="font-mono font-bold text-white text-xl">
                                        ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-1">
                                <button
                                    onClick={() => setDeleteModal({ isOpen: true, id: invoice.id })}
                                    className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <span className="text-sm font-bold">Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={() => {
                    if (deleteModal.id === 'ALL') {
                        deleteAllMutation.mutate();
                    } else {
                        deleteInvoiceMutation.mutate(deleteModal.id);
                    }
                }}
                title={deleteModal.id === 'ALL' ? "Delete All Invoices?" : "Delete Invoice?"}
                message={deleteModal.id === 'ALL'
                    ? "Are you sure you want to delete ALL invoices? This action cannot be undone."
                    : "Are you sure you want to delete this invoice? This action cannot be undone."}
                confirmText={deleteModal.id === 'ALL' ? "Delete Everything" : "Delete"}
                variant="destructive"
            />
        </div >
    );
}
