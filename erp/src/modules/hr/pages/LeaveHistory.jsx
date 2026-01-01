import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import { Search, Calendar, User, FileText, CheckCircle, XCircle } from 'lucide-react';
import { subDays, isAfter } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../context/AuthContext';

export default function LeaveHistory() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [periodFilter, setPeriodFilter] = useState('Yearly');

    // Mutation for updating status
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => mockDataService.updateLeaveStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries(['employee-leaves', selectedEmployeeId]);
        }
    });

    const handleAction = (id, status) => {
        updateStatusMutation.mutate({ id, status });
    };

    // 1. Fetch Employees for Dropdown
    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: mockDataService.getEmployees,
    });

    // 2. Fetch Leaves ONLY when employee is selected
    const { data: leaves, isLoading } = useQuery({
        queryKey: ['employee-leaves', selectedEmployeeId],
        queryFn: () => mockDataService.getEmployeeLeaves(selectedEmployeeId),
        enabled: !!selectedEmployeeId, // Dependent query
    });

    const selectedEmployee = employees?.find(e => e.id === selectedEmployeeId);

    // 3. Filter Logic
    const filteredLeaves = leaves?.filter(leave => {
        let matchesPeriod = true;
        const leaveDate = new Date(leave.startDate);
        const today = new Date();

        if (periodFilter === 'Weekly') {
            matchesPeriod = isAfter(leaveDate, subDays(today, 7));
        } else if (periodFilter === 'Monthly') {
            matchesPeriod = isAfter(leaveDate, subDays(today, 30));
        } else if (periodFilter === 'Yearly') {
            matchesPeriod = isAfter(leaveDate, subDays(today, 365));
        }
        return matchesPeriod;
    });

    const getStatusColor = (status) => {
        return status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30';
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">

            {/* Header */}
            <div>
                <h2 className="text-4xl font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-white">
                    Leave History
                </h2>
                <p className="text-slate-400 mt-2 text-lg">View individual employee leave records and status</p>
            </div>

            {/* Selection Bar */}
            <div className="bg-slate-800/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-xl flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 w-full group">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block ml-1">Select Employee to View</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <select
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 border border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-900/50 text-white placeholder-slate-500 shadow-inner transition-all appearance-none"
                        >
                            <option value="">-- Choose Employee --</option>
                            {employees?.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedEmployeeId && (
                    <div className="w-full md:w-56 group">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block ml-1">Filter Period</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
                            <select
                                value={periodFilter}
                                onChange={(e) => setPeriodFilter(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 border border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none bg-slate-900/50 text-white shadow-inner transition-all appearance-none"
                            >
                                <option value="Weekly">Last 7 Days</option>
                                <option value="Monthly">Last 30 Days</option>
                                <option value="Yearly">Last Year</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            {!selectedEmployeeId ? (
                // Empty State
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border-2 border-dashed border-slate-700/50 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white">No Employee Selected</h3>
                    <p className="text-slate-400 max-w-sm mt-2">Please select an employee from the dropdown above to view their complete leave history and records.</p>
                </div>
            ) : (
                // Data Table
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3">
                        {selectedEmployee?.avatar && (
                            <img src={selectedEmployee.avatar} alt="Avatar" className="w-10 h-10 rounded-full bg-slate-700 object-cover border border-slate-600" />
                        )}
                        <div>
                            <h3 className="font-bold text-white text-lg">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</h3>
                            <p className="text-slate-400 text-sm">{selectedEmployee?.position} • {selectedEmployee?.department}</p>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-400">Loading history...</div>
                        ) : filteredLeaves?.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                                    <FileText className="w-8 h-8 text-slate-500" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-1">No records found</h3>
                                <p className="text-slate-400 text-sm">No leave history found for this period.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-800/80 border-b border-slate-700/50">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-slate-300">Leave Type</th>
                                            <th className="px-6 py-4 font-bold text-slate-300">Duration</th>
                                            <th className="px-6 py-4 font-bold text-slate-300">Dates</th>
                                            <th className="px-6 py-4 font-bold text-slate-300">Reason</th>
                                            <th className="px-6 py-4 font-bold text-slate-300">Status</th>
                                            <th className="px-6 py-4 font-bold text-slate-300 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/30">
                                        {filteredLeaves.map((record) => (
                                            <tr key={record.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-white">
                                                    {record.type}
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">
                                                    {record.days} days
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">
                                                    {new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                                                    {record.reason}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${getStatusColor(record.status)}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {user?.role !== 'user' && (
                                                        <div className="flex justify-end gap-2">
                                                            {(record.status === 'Pending' || record.status === 'Rejected') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleAction(record.id, 'Approved')}
                                                                    className="h-8 w-8 text-slate-400 hover:text-green-600 hover:bg-green-50"
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircle className="w-5 h-5" />
                                                                </Button>
                                                            )}
                                                            {(record.status === 'Pending' || record.status === 'Approved') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleAction(record.id, 'Rejected')}
                                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                                    title="Reject"
                                                                >
                                                                    <XCircle className="w-5 h-5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
