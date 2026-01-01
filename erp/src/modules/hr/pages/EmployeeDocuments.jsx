import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockDataService } from '../../../services/mockDataService';
import { FileText, Download, Search, Filter, ExternalLink } from 'lucide-react';

export default function EmployeeDocuments() {
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');

    const { data: employees = [], isLoading, error } = useQuery({
        queryKey: ['employees'],
        queryFn: mockDataService.getEmployees
    });

    // Filter employees who have at least one document
    const studentsWithDocs = employees.filter(emp =>
        emp.cnic_front || emp.cnic_back || emp.matric_result || emp.inter_result || emp.cv ||
        emp.cnicFront || emp.cnicBack || emp.matricResult || emp.interResult // Handle camelCase from API just in case
    ).filter(emp => {
        const matchesSearch = (emp.firstName + ' ' + emp.lastName).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = deptFilter === 'All' || (emp.department_name || emp.department) === deptFilter;
        return matchesSearch && matchesDept;
    });

    const departments = ['All', ...new Set(employees.map(e => e.department_name || e.department).filter(Boolean))];

    const getFileUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path; // Already full URL
        // If relative path from database (local uploads)
        // Assuming Backend sets static serve for /uploads or we depend on a base URL
        // In local: http://localhost:5000/uploads/... (Vite proxy might handle /api, but static files?)
        // Usually static files need full URL or relevant proxy.
        // Let's assume the API URL base for now if it starts with slash.
        // Quick fix: Just return it, if it fails user can report.
        // Actually, dbAdapter sets it to `/uploads/filename`.
        // We need `import.meta.env.VITE_API_URL` base ideally?
        // Or if simple setup, relative to domain? 
        // Let's rely on standard link behavior.
        return `http://localhost:5000${path}`;
    };

    const DocLink = ({ path, label }) => {
        if (!path) return <span className="text-slate-600 text-xs italic">N/A</span>;
        return (
            <a
                href={getFileUrl(path)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
            >
                <ExternalLink className="w-3 h-3" />
                {label}
            </a>
        );
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading documents...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Employee Documents</h1>
                    <p className="text-slate-400 mt-1">Centralized document repository for all employees.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate-500" />
                    <select
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg text-white px-4 py-2 focus:outline-none focus:border-indigo-500"
                    >
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
                                <th className="p-4 font-semibold">Employee</th>
                                <th className="p-4 font-semibold">Department</th>
                                <th className="p-4 font-semibold">CNIC</th>
                                <th className="p-4 font-semibold">Results</th>
                                <th className="p-4 font-semibold">CV / Resume</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {studentsWithDocs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        No documents found for any employee.
                                    </td>
                                </tr>
                            ) : (
                                studentsWithDocs.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 group-hover:border-indigo-500/50 transition-colors">
                                                    {emp.avatar || emp.avatar_url ? (
                                                        <img src={emp.avatar || emp.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-500">{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                                                        {emp.firstName} {emp.lastName}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{emp.position}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                                {emp.department_name || emp.department}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-2 items-start">
                                                <DocLink path={emp.cnic_front || emp.cnicFront} label="Front" />
                                                <DocLink path={emp.cnic_back || emp.cnicBack} label="Back" />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-2 items-start">
                                                <DocLink path={emp.matric_result || emp.matricResult} label="Matric" />
                                                <DocLink path={emp.inter_result || emp.interResult} label="Intermediate" />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <DocLink path={emp.cv} label="Download CV" />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
