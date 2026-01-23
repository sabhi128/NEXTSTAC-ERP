import React from 'react';
import { ArrowLeft, ArrowRight, TrendingUp, X } from 'lucide-react';

const TAccountView = ({ account, transactions, onClose }) => {
    // Filter transactions for this account
    const accountTransactions = transactions.filter(t => {
        // 1. Strict Match (New Data)
        if (t.account_id && String(t.account_id) === String(account.id)) return true;

        // 2. Name Match (Legacy/Fallback)
        if (!t.account_id && t.category === account.name) return true;

        // 3. Mock Data Structure Fallback
        if (t.debit_account_id && String(t.debit_account_id) === String(account.id)) return true;
        if (t.credit_account_id && String(t.credit_account_id) === String(account.id)) return true;

        return false;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    const transactionsWithBalance = accountTransactions.map(t => {
        // Determine Direction
        let isDebit = false;

        if (t.direction) {
            isDebit = t.direction === 'Debit';
        } else if (t.debit_account_id || t.credit_account_id) {
            // Mock data structure
            isDebit = String(t.debit_account_id) === String(account.id);
        } else {
            // Legacy/Name match fallback: Assume it's an increase (Normal Balance)
            isDebit = (account.normal_balance || account.normalBalance) === 'Debit';
        }

        const amount = parseFloat(t.amount);

        if (account.normal_balance === 'Debit' || account.normalBalance === 'Debit') {
            runningBalance += isDebit ? amount : -amount;
        } else {
            runningBalance += isDebit ? -amount : amount;
        }

        return { ...t, isDebit, runningBalance };
    });

    const totalDebits = transactionsWithBalance
        .filter(t => t.isDebit)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalCredits = transactionsWithBalance
        .filter(t => !t.isDebit)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const endingBalance = Math.abs(totalDebits - totalCredits);
    const balanceSide = totalDebits > totalCredits ? 'Debit' : 'Credit';

    return (
        <div className="bg-slate-900 h-full flex flex-col">
            {/* Header */}
            <div className="bg-slate-900/50 px-4 md:px-8 py-4 md:py-6 border-b border-slate-700/50 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">{account.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded border border-slate-700">
                            {account.type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded border border-slate-700">
                            {account.normal_balance || account.normalBalance} Balance
                        </span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 rounded-xl transition-all shadow-lg hover:shadow-rose-500/10 active:scale-95"
                >
                    <X className="w-5 h-5 stroke-[3]" />
                </button>
            </div>

            {/* T-Account Visual */}
            <div className="p-4 md:p-8 flex-1 overflow-auto bg-slate-950/30">
                <div className="max-w-6xl mx-auto bg-slate-800/50 backdrop-blur-sm p-4 md:p-8 rounded-3xl shadow-2xl border border-slate-700/50">

                    {/* T-Shape Header */}
                    <div className="flex border-b-4 border-slate-600 pb-4 mb-6 relative">
                        {/* Decorative center line accent */}
                        <div className="absolute left-1/2 top-full h-8 w-1 bg-gradient-to-b from-slate-600 to-transparent -translate-x-1/2"></div>

                        <div className="w-1/2 text-center font-black text-lg md:text-xl uppercase tracking-widest border-r-4 border-slate-600 text-slate-200">Debit</div>
                        <div className="w-1/2 text-center font-black text-lg md:text-xl uppercase tracking-widest text-slate-200">Credit</div>
                    </div>

                    {/* Transactions List */}
                    <div className="flex flex-col md:flex-row relative min-h-[400px]">
                        {/* Vertical Line (Desktop Only) */}
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-slate-600 transform -translate-x-1/2 opacity-50"></div>

                        {/* Debits Column */}
                        <div className="w-full md:w-1/2 pr-0 md:pr-6 space-y-3 mb-6 md:mb-0">
                            {transactionsWithBalance.filter(t => t.isDebit).map(t => (
                                <div key={t.id} className="flex justify-between items-center text-sm group hover:bg-emerald-500/10 p-3 rounded-lg border border-transparent hover:border-emerald-500/30 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{new Date(t.date).toLocaleDateString()}</span>
                                        <span className="text-slate-200 font-bold break-words" title={t.description}>{t.description}</span>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 shadow-[0_0_5px_rgba(52,211,153,0.3)] shrink-0 ml-2">
                                        ${parseFloat(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Mobile Divider */}
                        <div className="md:hidden h-1 bg-slate-700 my-4 relative">
                            <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 px-2 text-xs font-bold text-slate-500">CREDITS</span>
                        </div>

                        {/* Credits Column */}
                        <div className="w-full md:w-1/2 pl-0 md:pl-6 space-y-3">
                            {transactionsWithBalance.filter(t => !t.isDebit).map(t => (
                                <div key={t.id} className="flex justify-between items-center text-sm group hover:bg-rose-500/10 p-3 rounded-lg border border-transparent hover:border-rose-500/30 transition-all">
                                    <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 shadow-[0_0_5px_rgba(251,113,133,0.3)] shrink-0 mr-2">
                                        ${parseFloat(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{new Date(t.date).toLocaleDateString()}</span>
                                        <span className="text-slate-200 font-bold break-words text-right" title={t.description}>{t.description}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals Footer */}
                    <div className="flex flex-col md:flex-row border-t-4 border-slate-600 pt-6 mt-6 gap-6 md:gap-0">
                        <div className="w-full md:w-1/2 md:pr-6 flex justify-between md:block md:text-right">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Total Debits</span>
                            <span className="font-mono font-bold text-white text-xl md:text-2xl drop-shadow-sm">
                                ${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="w-full md:w-1/2 md:pl-6 text-left border-l-0 md:border-l-4 border-transparent flex justify-between md:block">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Total Credits</span>
                            <span className="font-mono font-bold text-white text-xl md:text-2xl drop-shadow-sm">
                                ${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Ending Balance */}
                    <div className="flex justify-center mt-8 md:mt-12">
                        <div className={`
                            w-full md:w-auto px-6 md:px-10 py-4 md:py-6 rounded-2xl font-black text-lg md:text-2xl border flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 shadow-xl backdrop-blur-md
                            ${balanceSide === (account.normal_balance || account.normalBalance)
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-emerald-500/10'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-rose-500/10'}
                        `}>
                            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 opacity-80" />
                            <div className="text-center md:text-left">
                                <span className="block text-[10px] opacity-70 font-bold uppercase tracking-widest mb-1">Ending Balance ({balanceSide})</span>
                                {endingBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TAccountView;
