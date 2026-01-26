import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Calendar, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function PayrollModal({ isOpen, onClose, onRunPayroll, totalEmployees, employees = [] }) {
    const [step, setStep] = useState('summary'); // summary, processing, success
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    if (!isOpen) return null;

    // Calculate estimated total based on actual salaries
    const estimatedTotal = employees.reduce((sum, emp) => {
        // Use employee salary or default to 5000 (matching backend logic)
        const salary = Number(emp.salary) || 5000;
        return sum + salary;
    }, 0);

    const handleRun = async () => {
        setStep('processing');
        try {
            await onRunPayroll(selectedMonth);
            setStep('success');
        } catch (error) {
            console.error(error);
            setStep('summary');
        }
    };

    const handleClose = () => {
        setStep('summary');
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="font-semibold text-slate-900">Run Payroll</h3>
                        <p className="text-xs text-slate-500">Process salaries for all employees</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'summary' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Select Period</label>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-100">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Employees
                                    </span>
                                    <span className="font-semibold text-slate-900">{totalEmployees}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Pay Date
                                    </span>
                                    <span className="font-semibold text-slate-900">{new Date().toLocaleDateString()}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                                    <span className="font-medium text-slate-700">Estimated Total</span>
                                    <span className="font-bold text-indigo-600 text-lg">
                                        ${estimatedTotal.toLocaleString()} <span className="text-xs text-slate-400 font-normal">(approx)</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRun}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <DollarSign className="w-4 h-4" />
                                    Confirm & Run
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-8 text-center space-y-4">
                            <div className="monitor-loader relative mx-auto w-16 h-16">
                                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900">Processing Payroll...</h4>
                                <p className="text-sm text-slate-500">Calculating deductions and net pay</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900">Payroll Run Successful!</h4>
                                <p className="text-sm text-slate-500 mt-1">
                                    Salaries for <span className="font-semibold text-slate-700">{selectedMonth}</span> have been processed.
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors mt-4"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
