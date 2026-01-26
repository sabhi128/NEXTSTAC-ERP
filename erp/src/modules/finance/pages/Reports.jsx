import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import { FileText, PieChart, TrendingUp, DollarSign, Download, Calendar } from 'lucide-react';
import TrialBalance from '../components/reports/TrialBalance';
import IncomeStatement from '../components/reports/IncomeStatement';
import BalanceSheet from '../components/reports/BalanceSheet';
import { motion } from 'framer-motion';


export default function Reports() {
    const [activeTab, setActiveTab] = useState('summary');
    const [dateRange, setDateRange] = useState('all'); // all, month

    const { data: accounts = [], isLoading: accountsLoading, isError: accError } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => await api.get('/finance/accounts'),
    });

    const { data: transactions = [], isLoading: transactionsLoading, isError: txError } = useQuery({
        queryKey: ['transactions'],
        queryFn: async () => await api.get('/finance/transactions'),
    });

    if (accountsLoading || transactionsLoading) {
        return <div className="p-12 text-center text-slate-400 animate-pulse font-medium">Loading Financial Reports...</div>;
    }

    if (accError || txError) {
        return <div className="p-12 text-center text-red-400 font-medium">Failed to load report data. Please refresh.</div>;
    }

    // Filter transactions based on dateRange
    const filteredTransactions = transactions?.filter(t => {
        if (dateRange === 'all') return true;
        if (dateRange === 'month') {
            const date = new Date(t.date);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        return true;
    }) || [];

    const handleExport = () => {
        window.print();
    };

    const tabs = [
        { id: 'summary', label: 'Report Settings', icon: FileText },
        { id: 'income', label: 'Income Statement', icon: TrendingUp },
        { id: 'balance', label: 'Balance Sheet', icon: PieChart },
        { id: 'trial', label: 'Trial Balance', icon: DollarSign },
    ];

    return (
        <div className="min-h-screen relative print:bg-white print:text-black">

            <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white drop-shadow-sm">Financial Reports</h2>
                        <p className="text-sm text-slate-400 mt-1">Generate and view your financial statements</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDateRange(dateRange === 'month' ? 'all' : 'month')}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all ${dateRange === 'month'
                                ? 'bg-slate-800 text-white border-slate-700 shadow-lg shadow-indigo-500/10'
                                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{dateRange === 'month' ? 'Showing: This Month' : 'Filter: This Month'}</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-500 hover:to-violet-500 text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/25 hover:scale-105"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export PDF</span>
                        </button>
                    </div>
                </div>

                {/* Centered Tabs */}
                <div className="flex justify-center mb-8 print:hidden">
                    <div className="bg-slate-900/40 p-1.5 rounded-full border border-slate-700/50 flex backdrop-blur-md">
                        {tabs.filter(t => t.id !== 'summary').map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                px-6 py-2.5 rounded-full text-xs font-bold transition-all relative
                                ${activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-white'}
                            `}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="report-tab-pill"
                                        className="absolute inset-0 bg-slate-700/80 rounded-full shadow-inner"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="animate-in slide-in-from-bottom-4 duration-500 ease-out print:animate-none min-h-[500px]">
                    {activeTab === 'summary' && (
                        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]">
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-indigo-500/20">
                                <FileText className="w-10 h-10 text-indigo-400" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white">Financial Reports Hub</h2>
                                <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                                    Select a tab above to view the detailed financial statement.
                                    You can filter by date range and export reports using the controls at the top right.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'trial' && (
                        <TrialBalance
                            accounts={accounts || []}
                            transactions={filteredTransactions}
                        />
                    )}

                    {activeTab === 'income' && (
                        <IncomeStatement
                            accounts={accounts || []}
                            transactions={filteredTransactions}
                        />
                    )}

                    {activeTab === 'balance' && (
                        <BalanceSheet
                            accounts={accounts || []}
                            transactions={filteredTransactions}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
