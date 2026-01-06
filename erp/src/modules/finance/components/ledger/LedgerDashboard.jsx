import React from 'react';
import { CreditCard, Wallet, Building2, Coins, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

const LedgerDashboard = ({ onAccountClick, accounts }) => {

    // Group accounts
    const accountGroups = {
        Asset: accounts.filter(a => a.type === 'Asset'),
        Liability: accounts.filter(a => a.type === 'Liability'),
        Equity: accounts.filter(a => a.type === 'Equity'),
        Revenue: accounts.filter(a => a.type === 'Revenue'),
        Expense: accounts.filter(a => a.type === 'Expense'),
    };

    // Design Tokens based on Account Type
    const getGroupConfig = (type) => {
        switch (type) {
            case 'Asset': return {
                color: 'bg-indigo-500',
                text: 'text-indigo-400',
                border: 'border-indigo-500/30',
                badgeText: 'DEBIT',
                badgeBg: 'bg-indigo-500/10',
                badgeColor: 'text-indigo-400',
                iconBg: 'bg-indigo-500/20',
                icon: Wallet
            };
            case 'Liability': return {
                color: 'bg-rose-500',
                text: 'text-rose-400',
                border: 'border-rose-500/30',
                badgeText: 'CREDIT',
                badgeBg: 'bg-rose-500/10',
                badgeColor: 'text-rose-400',
                iconBg: 'bg-rose-500/20',
                icon: CreditCard
            };
            case 'Equity': return {
                color: 'bg-violet-500',
                text: 'text-violet-400',
                border: 'border-violet-500/30',
                badgeText: 'CREDIT',
                badgeBg: 'bg-violet-500/10',
                badgeColor: 'text-violet-400',
                iconBg: 'bg-violet-500/20',
                icon: Building2
            };
            case 'Revenue': return {
                color: 'bg-emerald-500',
                text: 'text-emerald-400',
                border: 'border-emerald-500/30',
                badgeText: 'CREDIT',
                badgeBg: 'bg-emerald-500/10',
                badgeColor: 'text-emerald-400',
                iconBg: 'bg-emerald-500/20',
                icon: TrendingUp
            };
            case 'Expense': return {
                color: 'bg-amber-500',
                text: 'text-amber-400',
                border: 'border-amber-500/30',
                badgeText: 'DEBIT',
                badgeBg: 'bg-amber-500/10',
                badgeColor: 'text-amber-400',
                iconBg: 'bg-amber-500/20',
                icon: TrendingDown
            };
            default: return {
                color: 'bg-slate-500',
                text: 'text-slate-400',
                border: 'border-slate-500/30',
                badgeText: '---',
                badgeBg: 'bg-slate-500/10',
                badgeColor: 'text-slate-400',
                iconBg: 'bg-slate-500/20',
                icon: Coins
            };
        }
    };

    return (
        <div className="space-y-12 pb-12">
            {Object.entries(accountGroups).map(([type, groupAccounts]) => {
                if (groupAccounts.length === 0) return null;
                const config = getGroupConfig(type);
                const Icon = config.icon;

                return (
                    <div key={type} className="space-y-4">
                        {/* Section Header */}
                        <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-6 rounded-full ${config.color} shadow-[0_0_10px_rgba(255,255,255,0.3)]`}></div>
                            <h3 className="text-lg font-bold text-white tracking-tight">{type} Accounts</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-400 shadow-sm">
                                {groupAccounts.length}
                            </span>
                        </div>

                        {/* Card Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {groupAccounts.map(account => (
                                <div
                                    key={account.id}
                                    className={`bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-lg hover:shadow-xl hover:bg-slate-800/60 transition-all relative group cursor-pointer hover:border-slate-600`}
                                    onClick={() => onAccountClick(account)}
                                >
                                    {/* Debit/Credit Indicator */}
                                    <div className={`absolute top-6 right-6 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-lg ${config.badgeBg} ${config.badgeColor} border border-transparent group-hover:border-current/10 transition-colors`}>
                                        {config.badgeText}
                                    </div>

                                    {/* Icon */}
                                    <div className={`mb-4 w-12 h-12 rounded-xl flex items-center justify-center ${config.iconBg} ${config.text} group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="w-6 h-6 stroke-2" />
                                    </div>

                                    {/* Content */}
                                    <div className="mb-6">
                                        <h4 className="font-bold text-white text-lg mb-1 line-clamp-2 h-[3.5rem] leading-7" title={account.name}>{account.name}</h4>
                                        <p className="text-xs text-slate-500 font-mono">ID: #{account.id.substring(0, 8)}</p>
                                    </div>

                                    {/* Footer Link */}
                                    <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">View Ledger</span>
                                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default LedgerDashboard;
