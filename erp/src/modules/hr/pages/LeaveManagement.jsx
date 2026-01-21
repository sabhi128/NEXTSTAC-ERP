

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { api } from '../../../lib/api';
import {
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Download,
    Search,
    Filter,
    Plus,
    X,
    Trash2,
    Eye
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function LeaveManagement() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [deleteAllModal, setDeleteAllModal] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewLeave, setViewLeave] = useState(null);
    const [newRequest, setNewRequest] = useState({
        type: 'Sick Leave',
        startDate: '',
        endDate: '',
        reason: ''
    });

    // Fetch Leaves
    const { data: leaves, isLoading } = useQuery({
        queryKey: ['leaves-all'],
        queryFn: async () => {
            return await api.get('/hr/leaves');
        },
    });

    // Update Request Status (Admin)
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await api.put(`/hr/leaves/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['leaves-all']);
        }
    });

    // Create New Request (Employee)
    const createRequestMutation = useMutation({
        mutationFn: async (requestData) => {
            return await api.post('/hr/leaves', {
                employeeId: user.id,
                employeeName: user.name,
                email: user.email, // Send Email for lookup
                department: user.department, // Send Department
                ...requestData
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['leaves-all']);
            setIsModalOpen(false);
            setNewRequest({ type: 'Sick Leave', startDate: '', endDate: '', reason: '' }); // Reset form
            // You might want to add a success toast here too
        },
        onError: (error) => {
            alert(error.message); // Simple alert for now, or use a toast if available context
        }
    });

    const deleteRequestMutation = useMutation({
        mutationFn: async (id) => {
            return await api.delete(`/hr/leaves/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['leaves-all']);
        },

    });

    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            return await api.delete('/hr/leaves/all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['leaves-all']);
            showToast('All leave requests deleted successfully', 'success');
            setDeleteAllModal(false);
        },
        onError: (error) => {
            showToast(error.message || 'Failed to delete all leaves', 'error');
        }
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');

    const handleAction = (id, status) => {
        updateStatusMutation.mutate({ id, status });
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this leave request?')) {
            deleteRequestMutation.mutate(id);
        }
    };

    const handleSubmitRequest = (e) => {
        e.preventDefault();
        createRequestMutation.mutate(newRequest);
    };

    const handleExport = () => {
        if (!leaves || leaves.length === 0) return;

        // ... (Export logic unchanged) ...
        const headers = ['Employee', 'Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Requested On'];
        const csvContent = [
            headers.join(','),
            ...filteredLeaves.map(leave => [
                `"${leave.employeeName}"`,
                leave.type,
                leave.startDate.split('T')[0],
                leave.endDate.split('T')[0],
                leave.days,
                `"${leave.reason}"`,
                leave.status,
                leave.requestedOn.split('T')[0]
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leave_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ... (Filter logic unchanged) ...
    const filteredLeaves = (leaves || []).filter(leave => {
        const matchesSearch = (leave.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || leave.status === statusFilter;
        const matchesType = typeFilter === 'All' || leave.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    if (isLoading) return <div className="p-8 text-center animate-pulse text-slate-500">Loading leave requests...</div>;
    if (!leaves && !isLoading) return <div className="p-8 text-center text-red-400">Failed to load leave requests.</div>;

    const getStatusBadge = (status) => {
        // ... (Badge logic unchanged) ...
        switch (status) {
            case 'Approved':
                return <Badge variant="success" className="gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Approved</Badge>;
            case 'Rejected':
                return <Badge variant="destructive" className="gap-1.5"><XCircle className="w-3.5 h-3.5" /> Rejected</Badge>;
            case 'Pending':
                return <Badge variant="warning" className="gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending</Badge>;
            default: return null;
        }
    };

    // ... (formatDate logic unchanged) ...
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
            {/* ... (Header and Filters unchanged) ... */}

            {/* ... (Start of table structure unchanged) ... */}

            <div className="flex justify-end pb-4">
                {user?.role !== 'user' && (
                    <Button
                        variant="destructive"
                        onClick={() => setDeleteAllModal(true)}
                        className="shadow-md bg-red-600 hover:bg-red-700 text-white border-0"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All
                    </Button>
                )}
            </div>

            <div className="hidden md:block bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
                <Table>
                    {/* ... (TableHeader unchanged) ... */}
                    <TableHeader className="bg-slate-800/80">
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                            <TableHead className="text-slate-300 font-bold">Employee</TableHead>
                            <TableHead className="text-slate-300 font-bold">Type</TableHead>
                            <TableHead className="text-slate-300 font-bold">Duration</TableHead>
                            <TableHead className="text-slate-300 font-bold">Days</TableHead>
                            <TableHead className="text-slate-300 font-bold">Status</TableHead>
                            <TableHead className="text-right text-slate-300 font-bold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading leave requests...</TableCell>
                            </TableRow>
                        ) : filteredLeaves.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-400">No leave requests found</TableCell>
                            </TableRow>
                        ) : (
                            filteredLeaves.map((request) => (
                                <TableRow key={request.id} className="border-slate-700/50 hover:bg-slate-700/30 transition-colors group">
                                    {/* ... (Cells unchanged until Actions) ... */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-slate-600/50 shadow-sm">
                                                <AvatarImage src={request.avatar} />
                                                <AvatarFallback className="bg-slate-700 text-slate-300">{(request.employeeName || '?')[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold text-white">{request.employeeName}</div>
                                                <div className="text-xs text-slate-400">{request.position || 'Employee'}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                                            {request.type}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-white font-medium">{request.days} Days</div>
                                        <div className="text-xs text-slate-400">
                                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p
                                            className="text-slate-400 max-w-[200px] truncate cursor-pointer hover:text-indigo-400 transition-colors"
                                            title="Click to view full reason"
                                            onClick={() => setViewLeave(request)}
                                        >
                                            {request.reason}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(request.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setViewLeave(request)}
                                                className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>

                                            {/* Admin Actions */}
                                            {user?.role !== 'user' && (
                                                <>
                                                    {(request.status === 'Pending' || request.status === 'Rejected') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAction(request.id, 'Approved')}
                                                            className="h-8 w-8 text-slate-400 hover:text-green-600 hover:bg-green-50"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </Button>
                                                    )}
                                                    {(request.status === 'Pending' || request.status === 'Approved') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAction(request.id, 'Rejected')}
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </Button>
                                                    )}
                                                </>
                                            )}

                                            {/* Delete Action (Available to everyone for their own pending requests, or admins generally) */}
                                            {/* Assuming logic: Anyone can delete their own pending request? Or Admin can delete any? */}
                                            {/* Let's follow general CRUD: If Admin, can delete. If User, can delete pending. */}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(request.id)}
                                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredLeaves?.length > 0 ? (
                    filteredLeaves.map((request) => (
                        <Card key={request.id} className="shadow-lg bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-bold text-white">{request.employeeName}</div>
                                            <div className="text-xs text-slate-400">Employee</div>
                                        </div>
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold mb-1">Type</p>
                                        <p className="text-slate-300 font-medium">{request.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold mb-1">Duration</p>
                                        <p className="text-slate-300 font-medium">{request.days} Days</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        No leave requests found.
                    </div>
                )}
            </div>

            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border border-slate-800">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                            <h3 className="text-lg font-bold text-white">New Leave Request</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Leave Type</label>
                                <Select
                                    value={newRequest.type}
                                    onValueChange={(val) => setNewRequest({ ...newRequest, type: val })}
                                >
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white focus:ring-indigo-500/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                                        <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                                        <SelectItem value="Vacation">Vacation</SelectItem>
                                        <SelectItem value="Personal">Personal</SelectItem>
                                        <SelectItem value="Emergency">Emergency</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Start Date</label>
                                    <Input
                                        type="date"
                                        required
                                        className="bg-slate-800 border-slate-700 text-white focus-visible:ring-indigo-500/50"
                                        value={newRequest.startDate}
                                        onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">End Date</label>
                                    <Input
                                        type="date"
                                        required
                                        className="bg-slate-800 border-slate-700 text-white focus-visible:ring-indigo-500/50"
                                        value={newRequest.endDate}
                                        onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Reason</label>
                                <textarea
                                    className="flex w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm ring-offset-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 min-h-[100px] text-white"
                                    placeholder="Please provide a reason for your leave request..."
                                    required
                                    value={newRequest.reason}
                                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">Cancel</Button>
                                <Button
                                    type="submit"
                                    disabled={createRequestMutation.isPending}
                                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg border-0 disabled:opacity-50"
                                >
                                    {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <ConfirmationModal
                isOpen={deleteAllModal}
                onClose={() => setDeleteAllModal(false)}
                onConfirm={() => deleteAllMutation.mutate()}
                title="Delete All Leave Requests?"
                message="Are you sure you want to delete ALL leave requests? This action cannot be undone."
                confirmText={deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
                variant="destructive"
            />
            {/* View Details Modal */}
            {viewLeave && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border border-slate-800">
                        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                            <h3 className="text-lg font-bold text-white">Leave Details</h3>
                            <Button variant="ghost" size="icon" onClick={() => setViewLeave(null)} className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-2 border-slate-700 shadow-md">
                                    <AvatarImage src={viewLeave.avatar} />
                                    <AvatarFallback className="bg-slate-800 text-slate-200 text-xl font-bold">{(viewLeave.employeeName || '?')[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="text-xl font-bold text-white">{viewLeave.employeeName}</h4>
                                    <p className="text-slate-400">{viewLeave.department || 'Employee'}</p>
                                    <div className="mt-2">{getStatusBadge(viewLeave.status)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Leave Type</p>
                                    <p className="text-white font-medium">{viewLeave.type}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Duration</p>
                                    <p className="text-white font-medium">{viewLeave.days} Days</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Start Date</p>
                                    <p className="text-slate-300 font-mono">{formatDate(viewLeave.startDate)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">End Date</p>
                                    <p className="text-slate-300 font-mono">{formatDate(viewLeave.endDate)}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Reason / Description</p>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {viewLeave.reason}
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Button onClick={() => setViewLeave(null)} className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
