import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, AlertCircle } from 'lucide-react';

export default function StockAdjustmentModal({ isOpen, onClose, onSubmit, warehouses = [] }) {
    const defaultWarehouse = warehouses.length > 0 ? warehouses[0].name : 'Main Warehouse';

    const [formData, setFormData] = useState({
        productName: '',
        type: 'In',
        quantity: '',
        warehouse: defaultWarehouse,
        reference: 'MANUAL-ADJ',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            quantity: parseInt(formData.quantity) || 0
        });
        setFormData({
            productName: '',
            type: 'In',
            quantity: '',
            warehouse: defaultWarehouse,
            reference: 'MANUAL-ADJ',
            notes: ''
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-800">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <h3 className="font-bold text-white">New Stock Adjustment</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Product Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Office Chair"
                            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white placeholder:text-slate-500 transition-all"
                            value={formData.productName}
                            onChange={e => setFormData({ ...formData, productName: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Type</label>
                            <select
                                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white transition-all"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="In">Stock In (+)</option>
                                <option value="Out">Stock Out (-)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Quantity</label>
                            <input
                                required
                                type="number"
                                min="1"
                                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white transition-all"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Warehouse</label>
                        <select
                            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white transition-all"
                            value={formData.warehouse}
                            onChange={e => setFormData({ ...formData, warehouse: e.target.value })}
                        >
                            {warehouses.length > 0 ? (
                                warehouses.map(wh => (
                                    <option key={wh.id} value={wh.name}>{wh.name}</option>
                                ))
                            ) : (
                                <option value="Main Warehouse">Main Warehouse</option>
                            )}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Reference / Notes</label>
                        <textarea
                            rows="2"
                            placeholder="Reason for adjustment..."
                            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white placeholder:text-slate-500 resize-none transition-all"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                        <textarea
                            rows="2"
                            placeholder="Reason for adjustment..."
                            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white placeholder:text-slate-500 resize-none transition-all"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-bold text-slate-400 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-500 shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save Adjustment
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
