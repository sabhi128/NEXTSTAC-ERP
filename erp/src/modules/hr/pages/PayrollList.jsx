import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import PayrollModal from '../components/PayrollModal';
import {
    DollarSign,
    Search,
    Download,
    FileText,
    TrendingUp,
    MoreHorizontal
} from 'lucide-react';
import { subDays, isAfter } from 'date-fns';
import { useToast } from '../../../context/ToastContext';
import { Trash2 } from 'lucide-react';
import ConfirmationModal from '../../../components/ConfirmationModal';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Apply the plugin to jsPDF
applyPlugin(jsPDF);

export default function PayrollList() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { data: salaries, isLoading } = useQuery({
        queryKey: ['salaries'],
        queryFn: () => api.get('/hr/salaries'),
    });

    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: () => api.get('/hr/employees'),
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [periodFilter, setPeriodFilter] = useState('Monthly'); // Weekly, Monthly, Yearly
    const [isModalOpen, setIsModalOpen] = useState(false);

    const processPayrollMutation = useMutation({
        mutationFn: async (period) => {
            return await api.post('/hr/salaries/process', { period });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['salaries']);
            showToast('Payroll processed successfully', 'success');
        },
        onError: (error) => {
            showToast(error.message || 'Failed to process payroll', 'error');
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await api.put(`/hr/salaries/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['salaries']);
            showToast('Payment status updated', 'success');
        }
    });

    const handleStatusClick = (record) => {
        const newStatus = record.status === 'Paid' ? 'Pending' : 'Paid';
        updateStatusMutation.mutate({ id: record.id, status: newStatus });
    };

    const filteredSalaries = salaries?.filter(record => {
        const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesPeriod = true;
        const recordDate = new Date(record.paymentDate);
        const today = new Date();

        if (periodFilter === 'Weekly') {
            matchesPeriod = isAfter(recordDate, subDays(today, 7));
        } else if (periodFilter === 'Monthly') {
            matchesPeriod = isAfter(recordDate, subDays(today, 30));
        } else if (periodFilter === 'Yearly') {
            matchesPeriod = isAfter(recordDate, subDays(today, 365));
        }

        return matchesSearch && matchesPeriod;

    });

    const [deleteAllModal, setDeleteAllModal] = useState(false);

    const handleRunPayroll = () => {
        setIsModalOpen(true);
    };

    const handleConfirmRun = async (period) => {
        await processPayrollMutation.mutateAsync(period);
    };

    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            return await api.delete('/hr/salaries/all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['salaries']);
            showToast('All payroll records deleted', 'success');
            setDeleteAllModal(false);
        },
        onError: (error) => {
            showToast(error.message || 'Failed to delete payroll records', 'error');
        }
    });

    const handleDeleteAll = () => {
        deleteAllMutation.mutate();
    };

    const handleDownload = (record) => {
        try {
            const doc = new jsPDF();

            // Company Header
            doc.setFontSize(22);
            doc.setTextColor(44, 62, 80);
            doc.text('NEXTSTAC ERP', 105, 20, { align: 'center' });

            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text('Payslip for ' + new Date(record.paymentDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), 105, 30, { align: 'center' });

            // Employee Details
            doc.setFontSize(10);
            doc.setTextColor(0);
            const startY = 45;
            doc.text(`Employee Name: ${record.employeeName}`, 14, startY);
            doc.text(`Employee ID: ${record.employeeId.slice(0, 8)}...`, 14, startY + 7);
            doc.text(`Payment Date: ${new Date(record.paymentDate).toLocaleDateString()}`, 14, startY + 14);
            doc.text(`Payment Method: ${record.method}`, 14, startY + 21);
            doc.text(`Status: ${record.status}`, 14, startY + 28);

            // Deduced Amount (Mock breakdown)
            const baseSalary = record.amount;
            const tax = 0; // No Tax
            const netPay = baseSalary;

            doc.autoTable({
                startY: startY + 40,
                head: [['Description', 'Amount']],
                body: [
                    ['Basic Salary', `$${baseSalary.toLocaleString()}`],
                    ['Tax (0%)', `$0.00`],
                    ['Other Deductions', '$0.00'],
                    [{ content: 'Net Pay', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: `$${netPay.toLocaleString()}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
                ],
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] }, // Indigo
                didDrawPage: (data) => {
                    // Footer can go here if needed per page
                }
            });

            // Footer
            // Get finalY from the doc object or the hook data if needed, but lastAutoTable should be attached to doc by the plugin even if called functionally
            const finalY = doc.lastAutoTable?.finalY || 150;
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('This is a system generated payslip.', 105, finalY + 20, { align: 'center' });

            doc.save(`Payslip_${record.employeeName.replace(/\s+/g, '_')}_${record.paymentDate}.pdf`);
            showToast('Payslip downloaded successfully', 'success');
        } catch (error) {
            console.error('Payslip generation error:', error);
            showToast('Failed to generate payslip', 'error');
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading payroll data...</div>;

    const totalStats = filteredSalaries?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-white">
                        Payroll Service
                    </h2>
                    <p className="text-slate-400 mt-2 text-lg">Manage employee salaries and payments</p>
                </div>
                <button
                    onClick={handleRunPayroll}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:scale-105 text-white rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-xl hover:shadow-emerald-500/20"
                >
                    <DollarSign className="w-5 h-5" />
                    Run Payroll

                </button>
                <button
                    onClick={() => setDeleteAllModal(true)}
                    className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-xl hover:shadow-red-500/20"
                >
                    <Trash2 className="w-5 h-5" />
                    Delete All
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-bl-full -mr-2 -mt-2" />
                    <div className="flex items-center gap-4 relative">
                        <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-semibold">Total Disbursed</p>
                            <h3 className="text-2xl font-black text-white">${totalStats.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-bl-full -mr-2 -mt-2" />
                    <div className="flex items-center gap-4 relative">
                        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-semibold">Avg Salary</p>
                            <h3 className="text-2xl font-black text-white">
                                ${(totalStats / (filteredSalaries?.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 rounded-bl-full -mr-2 -mt-2" />
                    <div className="flex items-center gap-4 relative">
                        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-semibold">Pending Slips</p>
                            <h3 className="text-2xl font-black text-white">
                                {filteredSalaries?.filter(s => s.status === 'Pending').length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-6 flex-wrap shadow-xl">
                <div className="relative max-w-full md:max-w-md w-full group">
                    <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        className="w-full pl-12 pr-6 py-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none shadow-inner transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <span className="text-sm font-bold text-slate-400 whitespace-nowrap uppercase tracking-wider">View by</span>
                    <select
                        value={periodFilter}
                        onChange={(e) => setPeriodFilter(e.target.value)}
                        className="px-6 py-3 border border-slate-700/50 bg-slate-900/50 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-white w-full md:w-48 appearance-none shadow-sm cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                    </select>
                </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-700/30">
                                <th className="px-6 py-4 text-sm font-bold text-slate-300">Employee</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-300">Date</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-300">Amount</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-300">Method</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-300">Status</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {filteredSalaries?.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold text-white whitespace-nowrap">
                                        {record.employeeName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                                        {new Date(record.paymentDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-emerald-400 font-bold whitespace-nowrap">
                                        ${record.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                                        {record.method}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleStatusClick(record)}
                                            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all hover:scale-105 cursor-pointer ${record.status === 'Paid'
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                                                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30'
                                                }`}
                                            title="Click to toggle status"
                                        >
                                            {record.status}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button
                                            onClick={() => handleDownload(record)}
                                            className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 p-2 rounded-lg transition-colors"
                                            title="Download Payslip"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PayrollModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRunPayroll={handleConfirmRun}
                totalEmployees={employees?.length || 0}
                employees={employees || []}
            />

            <ConfirmationModal
                isOpen={deleteAllModal}
                onClose={() => setDeleteAllModal(false)}
                onConfirm={handleDeleteAll}
                title="Delete All Payroll Records?"
                message="Are you sure you want to delete ALL payroll records? This action cannot be undone."
                confirmText={deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
                variant="destructive"
            />
        </div >
    );
}
