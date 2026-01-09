
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Building, Mail, Phone, MapPin, Calendar, ShoppingBag, FileText, CheckCircle, XCircle, User, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerProfileModal({ isOpen, onClose, customer, onEdit }) {
    const [activeTab, setActiveTab] = useState('history');

    if (!isOpen || !customer) return null;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Active': return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase flex items-center gap-1.5 border border-emerald-500/20"><CheckCircle className="w-3.5 h-3.5" /> Active</span>;
            case 'Inactive': return <span className="px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-400 text-xs font-bold uppercase flex items-center gap-1.5 border border-slate-600/50"><XCircle className="w-3.5 h-3.5" /> Inactive</span>;
            case 'Lead': return <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase flex items-center gap-1.5 border border-blue-500/20"><User className="w-3.5 h-3.5" /> Lead</span>;
            default: return <span className="px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-400 text-xs font-bold uppercase border border-slate-600/50">{status}</span>;
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                                    {customer.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">{customer.name}</h2>
                                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                        <Mail className="w-3.5 h-3.5" /> {customer.email}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Left Column: Stats & Info */}
                                <div className="space-y-6">
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                                            <div className="text-xs text-slate-400 font-medium mb-1">Lifetime Value</div>
                                            <div className="text-lg font-bold text-emerald-400">${customer.totalSpent?.toLocaleString() || '0'}</div>
                                        </div>
                                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                                            <div className="text-xs text-slate-400 font-medium mb-1">Total Orders</div>
                                            <div className="text-lg font-bold text-white">{customer.orders?.length || 0}</div>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-5 space-y-4">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                            <User className="w-4 h-4 text-indigo-400" /> Contact Details
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm">
                                                <Phone className="w-4 h-4 text-slate-500" />
                                                <span className="text-slate-300">{customer.phone}</span>
                                            </div>
                                            <div className="flex items-start gap-3 text-sm">
                                                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                                <span className="text-slate-300">{customer.address}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <Globe className="w-4 h-4 text-slate-500" />
                                                <span className="text-slate-300">{customer.website || 'No website'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                                                {customer.segment || 'General'}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                                Active Customer
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: History & Autos */}
                                <div className="md:col-span-2 space-y-6">
                                    <div className="flex items-center gap-4 border-b border-slate-800 pb-2 mb-4">
                                        <button
                                            onClick={() => setActiveTab('history')}
                                            className={`pb - 2 text - sm font - bold transition - all relative ${activeTab === 'history' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'} `}
                                        >
                                            Order History
                                            {activeTab === 'history' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('notes')}
                                            className={`pb - 2 text - sm font - bold transition - all relative ${activeTab === 'notes' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'} `}
                                        >
                                            Notes
                                            {activeTab === 'notes' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />}
                                        </button>
                                    </div>

                                    {activeTab === 'history' ? (
                                        <div className="space-y-3">
                                            {customer.orders && customer.orders.length > 0 ? (
                                                customer.orders.map((order, index) => (
                                                    <div key={index} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                                                                <ShoppingBag className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="text-white font-medium">Order #{order.id}</div>
                                                                <div className="text-xs text-slate-500">{order.date}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-white">${order.amount}</div>
                                                            <span className={`text - xs px - 2 py - 0.5 rounded - full ${order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                order.status === 'Processing' ? 'bg-blue-500/10 text-blue-400' :
                                                                    'bg-slate-700 text-slate-400'
                                                                } `}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12 text-slate-500">
                                                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                    No orders found for this customer.
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <textarea
                                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                placeholder="Add a note about this customer..."
                                                rows="4"
                                            />
                                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors">
                                                Add Note
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-300 font-bold hover:bg-slate-800 rounded-xl transition-colors text-sm"
                            >
                                Close
                            </button>
                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-indigo-500/20">
                                Edit Profile
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

