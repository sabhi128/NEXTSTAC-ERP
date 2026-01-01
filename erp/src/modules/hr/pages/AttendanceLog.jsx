import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import {
    Calendar,
    Clock,
    Search,
    Filter,
    Download
} from 'lucide-react';



// ... (imports remain)

// ... (imports remain)
import AttendanceModal from '../components/AttendanceModal';

export default function AttendanceLog() {
    const queryClient = useQueryClient();
    const { data: attendance, isLoading } = useQuery({
        queryKey: ['attendance'],
        queryFn: () => api.get('/hr/attendance'),
    });

    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: () => api.get('/hr/employees'),
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const updateAttendanceMutation = useMutation({
        mutationFn: async ({ id, updates }) => {
            if (id) {
                return api.put(`/hr/attendance/${id}`, updates);
            } else {
                return api.post('/hr/attendance', updates);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['attendance']);
            setIsModalOpen(false);
        }
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleEditClick = (record) => {
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    const handleManualEntry = () => {
        setSelectedRecord(null); // Create mode
        setIsModalOpen(true);
    };

    const handleSave = (id, updates) => {
        updateAttendanceMutation.mutate({ id, updates });
    };

    const filteredAttendance = attendance?.filter(record => {
        const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || record.status === statusFilter;

        let matchesDate = true;
        if (startDate && endDate) {
            matchesDate = record.date >= startDate && record.date <= endDate;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const handleExport = () => {
        if (!filteredAttendance || filteredAttendance.length === 0) return;

        const headers = ['Employee Name', 'Date', 'Check In', 'Check Out', 'Status', 'Work Hours'];
        const csvContent = [
            headers.join(','),
            ...filteredAttendance.map(record => [
                `"${record.employeeName}"`,
                record.date,
                `"${record.checkIn}"`,
                `"${record.checkOut}"`,
                record.status,
                `"${record.workHours || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading attendance records...</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'Absent': return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'Late': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            case 'Half Day': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            default: return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-white">
                        Attendance
                    </h2>
                    <p className="text-slate-400 mt-2 text-lg">Track employee check-ins and working hours</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleExport}
                        className="flex-1 sm:flex-none px-5 py-3 bg-slate-800/50 text-slate-300 border border-slate-700/50 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-700 hover:text-white font-bold transition-all shadow-lg"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={handleManualEntry}
                        className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl flex items-center justify-center gap-2 hover:scale-105 font-bold shadow-lg transition-all border border-emerald-500/20"
                    >
                        <Clock className="w-5 h-5" />
                        Manual Entry
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 flex flex-col md:flex-row gap-6 flex-wrap shadow-xl">
                <div className="relative flex-1 group">
                    <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        className="w-full pl-12 pr-6 py-4 border border-slate-700/50 bg-slate-900/50 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-white placeholder-slate-500 shadow-inner transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-2 shadow-inner">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">From</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-sm border-none outline-none text-slate-300 bg-transparent w-full"
                            />
                        </div>
                        <div className="w-px h-6 bg-slate-700/50"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">To</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-sm border-none outline-none text-slate-300 bg-transparent w-full"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 border border-slate-700/50 rounded-2xl px-4 py-2 bg-slate-900/50 shadow-inner">
                        <Filter className="w-5 h-5 text-emerald-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent outline-none text-slate-300 text-sm font-medium w-28"
                        >
                            <option value="All">All Status</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                            <option value="Half Day">Half Day</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/80 border-b border-slate-700/50">
                            <tr>
                                <th className="px-6 py-5 font-bold text-slate-300 whitespace-nowrap">Employee</th>
                                <th className="px-6 py-5 font-bold text-slate-300 whitespace-nowrap">Date</th>
                                <th className="px-6 py-5 font-bold text-slate-300 whitespace-nowrap">Check In</th>
                                <th className="px-6 py-5 font-bold text-slate-300 whitespace-nowrap">Check Out</th>
                                <th className="px-6 py-5 font-bold text-slate-300 whitespace-nowrap">Status</th>
                                <th className="px-6 py-5 font-bold text-slate-300 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {filteredAttendance?.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                                        {record.employeeName}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                                        {record.date}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-mono whitespace-nowrap">
                                        {record.checkIn}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-mono whitespace-nowrap">
                                        {record.checkOut}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${getStatusColor(record.status)}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button
                                            onClick={() => handleEditClick(record)}
                                            className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AttendanceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                record={selectedRecord}
                employees={employees}
                onSave={handleSave}
            />
        </div >
    );
}
