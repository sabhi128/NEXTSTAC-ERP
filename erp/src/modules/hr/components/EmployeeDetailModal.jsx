import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Calendar,
    User,
    HeartPulse,
    Clock,
    ShieldAlert,
    Activity,
    DollarSign
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { modalVariants, backdropVariants } from '../../../components/ui/animations';
import { useQuery } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';

import nextstacBanner from '../../../assets/nextstac.png';

export default function EmployeeDetailModal({ isOpen, onClose, employee }) {
    const [activeTab, setActiveTab] = useState('overview');

    const { data: history, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['employeeHistory', employee?.id],
        queryFn: () => mockDataService.getEmployeeHistory(employee.id),
        enabled: !!employee && isOpen
    });

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'On Leave': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'Terminated': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const simpleModalVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.2 }
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && employee && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        key="backdrop"
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />
                    <motion.div
                        key="modal-content"
                        className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
                        variants={simpleModalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Header Banner */}
                        <div className="relative h-48 bg-slate-950 shrink-0 overflow-hidden">
                            {/* Animated Background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-50" />
                            <div className="absolute -inset-4 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

                            <img
                                src={nextstacBanner}
                                alt="Banner"
                                className="w-full h-full object-cover object-top opacity-100 relative z-0"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-20 backdrop-blur-md border border-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Profile Info Section */}
                        <div className="px-8 -mt-20 relative z-20 flex flex-col sm:flex-row items-end sm:items-end gap-6 mb-8 text-white">
                            {/* Avatar */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="relative"
                            >
                                <Avatar className="h-32 w-32 border-4 border-slate-900 shadow-2xl ring-4 ring-indigo-500/20 shrink-0 bg-slate-800">
                                    <AvatarImage src={employee.avatar} alt={employee.firstName} className="object-cover" />
                                    <AvatarFallback className="text-3xl bg-slate-800 font-bold text-indigo-400">{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
                                </Avatar>
                                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-slate-900 ${employee.status === 'Active' ? 'bg-emerald-500' :
                                    employee.status === 'On Leave' ? 'bg-amber-500' : 'bg-red-500'
                                    }`} />
                            </motion.div>

                            {/* Name & Role */}
                            <div className="flex-1 pb-1 text-center sm:text-left mt-2 sm:mt-0 sm:translate-y-0">
                                <h2 className="text-3xl font-black text-white mb-2 tracking-tight drop-shadow-md">{employee.firstName} <span className="text-slate-400">{employee.lastName}</span></h2>
                                <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                                    <p className="text-lg text-indigo-300 font-bold">{employee.position}</p>
                                    <Badge className={`px-2.5 py-0.5 text-xs font-bold border ${getStatusVariant(employee.status)}`}>
                                        {employee.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Body Content */}
                        <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar">

                            {/* Tabs Navigation */}
                            <div className="flex gap-2 border-b border-white/10 mb-6 w-full">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('leave')}
                                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'leave' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                >
                                    Leave Status
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'history' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                >
                                    History
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === 'overview' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Professional Details Card */}
                                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:bg-white/10 transition-colors">
                                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-indigo-400" /> Professional Details
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="group">
                                                        <p className="text-xs text-slate-500 mb-1">Department</p>
                                                        <p className="font-bold text-white tracking-wide">{employee.department}</p>
                                                    </div>
                                                    <div className="group">
                                                        <p className="text-xs text-slate-500 mb-1">Date of Joining</p>
                                                        <p className="font-bold text-white tracking-wide">{new Date(employee.joinDate).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="group">
                                                        <p className="text-xs text-slate-500 mb-1">Annual Salary</p>
                                                        <p className="font-bold text-white tracking-wide">${Number(employee.salary).toLocaleString()}</p>
                                                    </div>
                                                    {employee.cnic && (
                                                        <div className="group">
                                                            <p className="text-xs text-slate-500 mb-1">CNIC</p>
                                                            <p className="font-mono text-indigo-300 tracking-wider bg-indigo-500/10 inline-block px-2 py-1 rounded">{employee.cnic}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contact Info Card */}
                                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:bg-white/10 transition-colors">
                                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-indigo-400" /> Contact Information
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="group">
                                                        <p className="text-xs text-slate-500 mb-1">Email Address</p>
                                                        <a href={`mailto:${employee.email}`} className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline break-all">{employee.email}</a>
                                                    </div>
                                                    <div className="group">
                                                        <p className="text-xs text-slate-500 mb-1">Phone Number</p>
                                                        <p className="font-bold text-white tracking-wide">{employee.phone}</p>
                                                    </div>
                                                    <div className="group">
                                                        <p className="text-xs text-slate-500 mb-1">Address</p>
                                                        <p className="font-bold text-white tracking-wide">{employee.address}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Emergency Contact */}
                                            <div className="md:col-span-2 bg-red-500/5 rounded-2xl p-6 border border-red-500/10 hover:bg-red-500/10 transition-colors">
                                                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <ShieldAlert className="w-4 h-4 text-red-500" /> Emergency Contact
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Contact Name</p>
                                                        <p className="font-bold text-white">{employee.emergencyContact?.name || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Relation</p>
                                                        <p className="font-bold text-white">{employee.emergencyContact?.relation || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Phone</p>
                                                        <p className="font-bold text-white">{employee.emergencyContact?.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'leave' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="bg-blue-500/5 p-6 rounded-2xl border border-blue-500/10 flex flex-col items-center justify-center text-center group hover:bg-blue-500/10 transition-colors">
                                                    <div className="mb-3 p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                                                        <Clock className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                    <p className="text-sm font-bold text-blue-300 mb-1">Casual Leave</p>
                                                    <p className="text-3xl font-black text-white">{employee.leaveBalance?.casual || 0}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Days Available</p>
                                                </div>
                                                <div className="bg-purple-500/5 p-6 rounded-2xl border border-purple-500/10 flex flex-col items-center justify-center text-center group hover:bg-purple-500/10 transition-colors">
                                                    <div className="mb-3 p-3 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-colors">
                                                        <HeartPulse className="w-6 h-6 text-purple-400" />
                                                    </div>
                                                    <p className="text-sm font-bold text-purple-300 mb-1">Sick Leave</p>
                                                    <p className="text-3xl font-black text-white">{employee.leaveBalance?.sick || 0}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Days Available</p>
                                                </div>
                                                <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10 flex flex-col items-center justify-center text-center group hover:bg-amber-500/10 transition-colors">
                                                    <div className="mb-3 p-3 bg-amber-500/10 rounded-full group-hover:bg-amber-500/20 transition-colors">
                                                        <Calendar className="w-6 h-6 text-amber-400" />
                                                    </div>
                                                    <p className="text-sm font-bold text-amber-300 mb-1">Annual Leave</p>
                                                    <p className="text-3xl font-black text-white">{employee.leaveBalance?.annual || 0}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Days Available</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-800/50 border border-dashed border-slate-700/50 rounded-2xl p-8 text-center text-slate-400">
                                                <p className="text-sm">Manage full history in <span className="font-bold text-indigo-400">Leave Management</span>.</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'history' && (
                                        <div className="space-y-6">
                                            {isHistoryLoading ? (
                                                <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-indigo-500 rounded-full animate-spin border-t-transparent" /></div>
                                            ) : history && history.length > 0 ? (
                                                <div className="relative pl-6 border-l border-white/10 space-y-8">
                                                    {history.map((record) => (
                                                        <div key={record.id} className="relative">
                                                            <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                                                            <div className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Promoted</span>
                                                                        <p className="text-sm text-slate-400 ml-2 inline">{new Date(record.change_date).toLocaleDateString()}</p>
                                                                    </div>
                                                                    <Badge variant="outline" className="border-white/10 text-slate-400 text-[10px]">{record.changed_by || 'System'}</Badge>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <p className="text-xs text-slate-500 mb-1">Previous Role</p>
                                                                        <p className="font-medium text-slate-300">{record.old_position}</p>
                                                                        <p className="text-xs text-slate-500">${Number(record.old_salary).toLocaleString()}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-emerald-400 mb-1">New Role</p>
                                                                        <p className="font-bold text-white">{record.new_position}</p>
                                                                        <p className="text-xs text-emerald-400">${Number(record.new_salary).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center p-8 text-slate-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p>No promotion history found.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
