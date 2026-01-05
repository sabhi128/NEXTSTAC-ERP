import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import EmployeeForm from '../components/EmployeeForm';
import SalaryHistoryChart from '../components/SalaryHistoryChart';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Calendar,
    DollarSign,
    User,
    Edit,
    Shield,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import EmployeeHistoryModal from '../components/EmployeeHistoryModal';

export default function EmployeeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const { data: employees, isLoading } = useQuery({
        queryKey: ['employees'],
        queryFn: mockDataService.getEmployees,
    });

    const updateEmployeeMutation = useMutation({
        mutationFn: (data) => {
            return new Promise((resolve) => {
                setTimeout(() => resolve(mockDataService.updateEmployee(id, data)), 300);
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['employees']);
            setIsEditOpen(false);
        }
    });

    const employee = employees?.find(e => e.id === id);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500 animate-pulse">Loading profile...</div>;
    if (!employee) return <div className="min-h-screen flex items-center justify-center text-slate-500">Employee not found</div>;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="pb-12 min-h-screen bg-slate-950 relative overflow-hidden"
        >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 via-slate-900/10 to-slate-950 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-48 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Navigation Bar */}
            <div className="bg-slate-900/30 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/hr/employees')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium text-sm group"
                    >
                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back to List
                    </button>
                    <button
                        onClick={() => setIsEditOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8 relative z-10">

                {/* Hero Section */}
                <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />

                    {/* Banner Gradient */}
                    <div className="h-48 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-3xl opacity-50 animate-pulse" />
                    </div>

                    <div className="px-8 pb-8 flex flex-col md:flex-row items-end gap-8 -mt-20 relative z-20">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="relative"
                        >
                            <img
                                src={employee.avatar}
                                alt={employee.firstName}
                                className="w-40 h-40 rounded-3xl border-4 border-slate-950 shadow-2xl object-cover bg-slate-800"
                            />
                            <div className={`absolute bottom-3 right-3 w-6 h-6 rounded-full border-4 border-slate-950 ${employee.status === 'Active' ? 'bg-emerald-500' :
                                employee.status === 'On Leave' ? 'bg-amber-500' : 'bg-red-500'
                                }`} />
                        </motion.div>

                        <div className="flex-1 pb-4">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2"
                            >
                                {employee.firstName} <span className="text-slate-400">{employee.lastName}</span>
                            </motion.h1>
                            <div className="flex flex-wrap items-center gap-4 text-lg">
                                <span className="text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                                    {employee.position}
                                </span>
                                <span className="text-slate-400 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    {employee.department}
                                </span>
                                <span className="text-slate-400 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {employee.address || 'Remote'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Stats & Quick Info */}
                    <div className="space-y-6">
                        {/* Stats Bento Grid */}
                        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl hover:bg-white/5 transition-colors group cursor-default">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div className="text-2xl font-black text-white">98%</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</div>
                            </div>
                            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl hover:bg-white/5 transition-colors group cursor-default">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="text-2xl font-black text-white">12</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Days</div>
                            </div>
                            <div className="col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl hover:bg-white/5 transition-colors group cursor-default">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Annual Salary</div>
                                        <div className="text-3xl font-black text-white tracking-tight">
                                            ${parseInt(employee.salary).toLocaleString()}
                                            <span className="text-lg text-slate-600 font-medium">/yr</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Card */}
                        <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <User className="w-4 h-4" /> Contact Details
                            </h3>
                            <div className="space-y-4">
                                <a href={`mailto:${employee.email}`} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-xs text-slate-500">Email</div>
                                        <div className="text-sm font-medium text-white truncate">{employee.email}</div>
                                    </div>
                                </a>
                                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-all">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Phone</div>
                                        <div className="text-sm font-medium text-white">{employee.phone || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg group-hover:bg-pink-500 group-hover:text-white transition-all">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Emergency</div>
                                        <div className="text-sm font-medium text-white">{employee.emergencyContact?.phone || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Timeline/Salary */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                        {/* Salary History Chart Container */}
                        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 h-full min-h-[400px]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                                    Salary Progression
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsHistoryOpen(true)}
                                        className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-indigo-400 border border-white/5 transition-colors"
                                    >
                                        View Timeline
                                    </button>
                                    <select className="bg-slate-950 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500">
                                        <option>Last 12 Months</option>
                                        <option>All Time</option>
                                    </select>
                                </div>
                            </div>
                            <SalaryHistoryChart employeeId={id} />
                        </div>
                    </motion.div>
                </div>

            </div>

            <EmployeeForm
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                initialData={employee}
                onSubmit={(data) => updateEmployeeMutation.mutate(data)}
            />

            <EmployeeHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                employee={employee}
            />
        </motion.div>
    );
}
