import React, { useState } from 'react';
import {
    File,
    FileText,
    Image as ImageIcon,
    Search,
    Upload,
    MoreVertical,
    Download,
    Trash2,
    Loader2,
    FileSpreadsheet,
    FileDown,
    FolderOpen,
    CheckCircle,
    XCircle,
    Clock,
    ShieldAlert
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import FileUploadModal from '../components/FileUploadModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FileManager() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [activeTab, setActiveTab] = useState("all");

    const { data: files, isLoading } = useQuery({
        queryKey: ['files'],
        queryFn: mockDataService.getFiles,
    });

    const addFileMutation = useMutation({
        mutationFn: (data) => new Promise(resolve => setTimeout(() => resolve(mockDataService.addFile(data)), 500)),
        onSuccess: () => {
            queryClient.invalidateQueries(['files']);
            setIsUploadOpen(false);
            showToast('File uploaded successfully. It may need approval.', 'success');
        }
    });

    const deleteFileMutation = useMutation({
        mutationFn: (id) => new Promise(resolve => setTimeout(() => resolve(mockDataService.deleteFile(id)), 300)),
        onSuccess: () => {
            queryClient.invalidateQueries(['files']);
            setDeleteModal({ isOpen: false, id: null, name: '' });
            showToast('File deleted successfully', 'success');
        }
    });

    const approveMutation = useMutation({
        mutationFn: mockDataService.approveFile,
        onSuccess: () => {
            queryClient.invalidateQueries(['files']);
            showToast('File approved successfully', 'success');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: mockDataService.rejectFile,
        onSuccess: () => {
            queryClient.invalidateQueries(['files']);
            showToast('File rejected successfully', 'success');
        }
    });

    const handleDownload = async (file) => {
        setDownloadingId(file.id);
        try {
            await mockDataService.downloadFile(file);
            showToast(`Downloaded ${file.name}`, 'success');
        } catch (error) {
            console.error("Download error:", error);
            showToast('Failed to download file', 'error');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleExport = () => {
        if (!visibleFiles || visibleFiles.length === 0) return;

        const headers = ['Name', 'Size', 'Type', 'Uploaded By', 'Date', 'Status'];
        const csvContent = [
            headers.join(','),
            ...visibleFiles.map(f => [
                `"${f.name}"`,
                `"${f.size}"`,
                `"${f.type}"`,
                `"${f.uploadedBy}"`,
                `"${new Date(f.date).toLocaleDateString()}"`,
                `"${f.status}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `documents_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        showToast('Exported list to CSV', 'success');
    };

    // Close dropdowns on click outside
    React.useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const allFilteredFiles = files?.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const approvedFiles = allFilteredFiles.filter(f => f.status === 'Approved');
    const pendingFiles = allFilteredFiles.filter(f => f.status === 'Pending');

    // For Admin: "Pending" tab shows pending requests. "All" shows everything? Or just Approved?
    // Let's split: "Documents" (Approved) and "Requests" (Pending)
    const visibleFiles = activeTab === 'requests' ? pendingFiles : approvedFiles;

    // Logic: If user is admin, they might want to see Pending.
    // If regular user, they only see Approved in main list, but maybe 'My Pending' somewhere?
    // The backend `getFiles` already filters visibility.
    // - Admin gets ALL.
    // - User gets Approved + Their Own Pending.

    // So for Admin: 
    // Tab "requests" -> show pendingFiles.
    // Tab "all" -> show approvedFiles.

    // For User:
    // They don't have approval power, so maybe just one list, sorted by status?
    // Or just show "Pending" badge on their files in the main list.

    const isSuperAdmin = user?.role === 'super_admin';

    const getFileIcon = (type) => {
        if (type.includes('image')) return <ImageIcon className="w-8 h-8 text-purple-400" />;
        if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-400" />;
        if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
        return <File className="w-8 h-8 text-blue-400" />;
    };

    if (isLoading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
                <Loader2 className="w-8 h-8 text-purple-500" />
            </motion.div>
            <p className="mt-4 font-medium">Loading documents...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <FileUploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSubmit={(data) => addFileMutation.mutate({ ...data, uploadedBy: user?.email || user?.name || 'User' })}
            />

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={() => deleteFileMutation.mutate(deleteModal.id)}
                title="Delete File?"
                message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
                confirmText="Delete File"
                variant="danger"
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Documents</h1>
                    <p className="text-slate-400 mt-1">Manage and organize company files</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExport}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-sm"
                    >
                        <FileDown className="w-5 h-5" />
                        Export
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsUploadOpen(true)}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-purple-500/25"
                    >
                        <Upload className="w-5 h-5" />
                        Upload File
                    </motion.button>
                </div>
            </div>

            {/* Admin Tabs */}
            {isSuperAdmin && (
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl">
                        <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2">
                            All Documents
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2 gap-2 flex items-center">
                            Pending Requests
                            {pendingFiles.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                                    {pendingFiles.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            )}

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl sticky top-20 z-30 shadow-xl">
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder:text-slate-500 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {(isSuperAdmin && activeTab === 'requests' ? pendingFiles : approvedFiles.concat(!isSuperAdmin ? pendingFiles : [])).map((file, index) => (
                    <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className={`bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl border ${file.status === 'Pending' ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-700/50'} hover:bg-slate-800 shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden`}
                    >
                        {file.status === 'Pending' && (
                            <div className="absolute top-0 right-0 z-20 p-2">
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] uppercase font-bold tracking-wider">
                                    <Clock className="w-3 h-3 mr-1" /> Review
                                </Badge>
                            </div>
                        )}

                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                            <div className="relative">
                                {/* Only show actions if NOT checking pending requests as admin (actions shown below for them) OR if user needs to delete own file */}
                                {!(isSuperAdmin && file.status === 'Pending') && (
                                    <>
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === file.id ? null : file.id)}
                                            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all ${activeDropdown === file.id ? 'opacity-100 bg-slate-700 text-white' : ''}`}
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                        <AnimatePresence>
                                            {activeDropdown === file.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    className="absolute right-0 top-full mt-1 w-32 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setDeleteModal({ isOpen: true, id: file.id, name: file.name });
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 font-medium transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-start mb-4 relative z-0">
                            <div className="w-14 h-14 bg-slate-900/50 rounded-2xl flex items-center justify-center border border-slate-700/50 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                {getFileIcon(file.type)}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold text-white truncate mb-1 pr-8" title={file.name}>{file.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-400">{file.size}</span>
                                <span>•</span>
                                <span>{new Date(file.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {isSuperAdmin && file.status === 'Pending' ? (
                            <div className="flex items-center justify-between gap-2 pt-4 border-t border-amber-500/20">
                                <Button
                                    size="sm"
                                    onClick={() => rejectMutation.mutate(file.id)}
                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                    title="Reject"
                                >
                                    <XCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleDownload(file)}
                                    className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
                                    title="View"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => approveMutation.mutate(file.id)}
                                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                    title="Approve"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                        {(file.uploadedBy || 'U').charAt(0)}
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium truncate max-w-[80px] group-hover:text-slate-300 transition-colors">
                                        {(file.uploadedBy || 'Unknown').split(' ')[0]}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDownload(file)}
                                    disabled={downloadingId === file.id || file.status === 'Pending'}
                                    className="text-slate-500 hover:text-purple-400 disabled:opacity-50 p-1.5 hover:bg-purple-500/10 rounded-lg transition-colors"
                                >
                                    {downloadingId === file.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>
                ))}

                {(isSuperAdmin && activeTab === 'requests' ? pendingFiles : approvedFiles).length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center">
                        <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No {activeTab === 'requests' ? 'pending requests' : 'files'} found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
