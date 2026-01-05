import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Clock, Calendar } from 'lucide-react';

export default function AttendanceModal({ isOpen, onClose, record, employees, onSave }) {
    const isEditing = !!record;

    // Default state for new entry
    const [formData, setFormData] = useState({
        employeeId: '',
        employeeName: '',
        status: 'Present',
        checkIn: '',
        checkOut: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Helper to convert 12h "05:00 PM" -> 24h "17:00" for input[type="time"]
    const to24Hour = (timeStr) => {
        if (!timeStr) return '';
        if (!timeStr.includes('M')) return timeStr; // Already 24h or invalid
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    // Helper to convert 24h "17:00" -> 12h "05:00 PM" for display/storage
    const to12Hour = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'
        return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    useEffect(() => {
        if (record) {
            setFormData({
                employeeId: record.employeeId || '',
                employeeName: record.employeeName,
                status: record.status,
                checkIn: to24Hour(record.checkIn),
                checkOut: to24Hour(record.checkOut),
                date: record.date
            });
        } else {
            setFormData({
                employeeId: '',
                employeeName: '',
                status: 'Present',
                checkIn: '',
                checkOut: '',
                date: new Date().toISOString().split('T')[0]
            });
        }
    }, [record, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        let dataToSave = { ...formData };

        // Convert back to 12h format for storage
        if (dataToSave.checkIn) dataToSave.checkIn = to12Hour(dataToSave.checkIn);
        if (dataToSave.checkOut) dataToSave.checkOut = to12Hour(dataToSave.checkOut);

        if (!isEditing && employees) {
            const selectedEmp = employees.find(e => e.id.toString() === formData.employeeId);
            if (selectedEmp) {
                dataToSave.employeeName = `${selectedEmp.firstName} ${selectedEmp.lastName}`;
            }
        }

        onSave(isEditing ? record.id : null, dataToSave);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="font-semibold text-slate-900">{isEditing ? 'Edit Attendance' : 'Manual Entry'}</h3>
                        <p className="text-xs text-slate-500">
                            {isEditing ? `Update record for ${record?.employeeName}` : 'Add a new attendance record'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">

                    {!isEditing && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Employee</label>
                            <select
                                required
                                value={formData.employeeId}
                                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="">Select Employee</option>
                                {employees?.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
                            <div className="relative">
                                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Late">Late</option>
                                <option value="Half Day">Half Day</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Check In</label>
                            <div className="relative">
                                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="time"
                                    value={formData.checkIn}
                                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Check Out</label>
                            <div className="relative">
                                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="time"
                                    value={formData.checkOut}
                                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isEditing ? 'Save Changes' : 'Create Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
