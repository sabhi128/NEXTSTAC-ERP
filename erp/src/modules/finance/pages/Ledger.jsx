import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
// import { mockDataService } from '../../../services/mockDataService';
import { api } from '../../../lib/api';
import LedgerDashboard from '../components/ledger/LedgerDashboard';
import TAccountView from '../components/ledger/TAccountView';
import { X } from 'lucide-react';


export default function Ledger() {
    const [selectedAccount, setSelectedAccount] = useState(null);

    const { data: accounts, isLoading: accountsLoading } = useQuery({
        queryKey: ['accounts'],
        queryFn: () => api.get('/finance/accounts').then(res => res.data),
    });

    const { data: transactions, isLoading: transactionsLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => api.get('/finance/transactions').then(res => res.data),
    });

    if (accountsLoading || transactionsLoading) return <div className="p-8 text-center text-slate-500">Loading Ledger...</div>;

    return (
        <div className="min-h-screen pb-20">
            <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white drop-shadow-sm">General Ledger</h2>
                    <p className="text-slate-400 text-sm mt-1">View and analyze individual account histories</p>
                </div>

                <LedgerDashboard
                    accounts={accounts || []}
                    transactions={transactions || []}
                    onAccountClick={setSelectedAccount}
                />
            </div>

            {/* T-Account Overlay/Modal */}
            {selectedAccount && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden relative flex flex-col pt-0">
                        <TAccountView
                            account={selectedAccount}
                            transactions={transactions || []}
                            onClose={() => setSelectedAccount(null)}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
