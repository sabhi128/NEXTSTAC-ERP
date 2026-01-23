import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import {
    Calendar,
    Clock,
    Search,
    Filter,
    Download,
    Trash2
} from 'lucide-react';



// ... (imports remain)

// ... (imports remain)
import AttendanceModal from '../components/AttendanceModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export default function AttendanceLog() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { showToast } = useToast();
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

    const [deleteAllModal, setDeleteAllModal] = useState(false);

    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            return await api.delete('/hr/attendance/all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['attendance']);
            showToast('All attendance records deleted successfully', 'success');
            setDeleteAllModal(false);
        },
        onError: (error) => {
            showToast(error.message || 'Failed to delete all attendance records', 'error');
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

    const formatTime = (timeStr) => {
        if (!timeStr) return '-';
        // If already has AM/PM, it's already formatted
        if (timeStr.includes('M')) return timeStr;

        // Handle 24h format (HH:mm:ss or HH:mm)
        const [hours, minutes] = timeStr.split(':');
        if (!hours || !minutes) return timeStr;

        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // 0 should be 12
        return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Attendance Log</h2>
                    <p className="text-slate-400">Monitor and manage employee attendance.</p>
                </div>
                {(user?.role === 'super_admin' || user?.role?.includes('admin')) && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleManualEntry}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Clock className="w-4 h-4" />
                            Manual Entry
                        </button>
                        <button
                            onClick={() => setDeleteAllModal(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete All
                        </button>
                    </div>
                )}
            </div>
            {/* ... (rest of the component structure is unchanged, just updating table rows below) ... */}
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
                                    <td className="px-6 py-4 text-emerald-400 font-mono font-bold whitespace-nowrap">
                                        {formatTime(record.checkIn)}
                                    </td>
                                    <td className="px-6 py-4 text-indigo-400 font-mono font-bold whitespace-nowrap">
                                        {formatTime(record.checkOut)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => {
                                                const nextStatus = {
                                                    'Present': 'Late',
                                                    'Late': 'Half Day',
                                                    'Half Day': 'Absent',
                                                    'Absent': 'Present'
                                                }[record.status] || 'Present';

                                                handleSave(record.id, { status: nextStatus });
                                            }}
                                            className={`px-2.5 py-1 rounded-xl text-xs font-bold border cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(record.status)}`}
                                            title="Click to change status"
                                        >
                                            {record.status}
                                        </button>
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

            <ConfirmationModal
                isOpen={deleteAllModal}
                onClose={() => setDeleteAllModal(false)}
                onConfirm={() => deleteAllMutation.mutate()}
                title="Delete All Attendance Records?"
                message="Are you sure you want to delete ALL attendance records? This action cannot be undone."
                confirmText={deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
                variant="destructive"
            />
        </div >
    );
}
