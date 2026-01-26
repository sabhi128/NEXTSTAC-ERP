import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, X, Calculator, Save } from 'lucide-react';

const InvoiceForm = ({ onSave, onCancel, products = [], initialData = null }) => {
    const [customer, setCustomer] = useState(initialData?.customer || '');
    const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '');
    const [items, setItems] = useState(initialData?.items && initialData.items.length > 0 ? initialData.items : [
        { id: 1, productId: '', quantity: 1, price: 0, tradeDiscount: 0 }
    ]);
    const [cashDiscount, setCashDiscount] = useState(initialData?.cashDiscount || 0); // Percentage
    const [paymentTerms, setPaymentTerms] = useState(initialData?.paymentTerms || 'Net 30');

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
        const itemTotal = (item.quantity * item.price) * (1 - (item.tradeDiscount / 100));
        return sum + itemTotal;
    }, 0);

    const cashDiscountAmount = subtotal * (cashDiscount / 100);
    const totalAmount = subtotal - cashDiscountAmount;

    useEffect(() => {
        // Set default due date based on payment terms
        const d = new Date(date);
        if (paymentTerms === 'Net 30') d.setDate(d.getDate() + 30);
        else if (paymentTerms === 'Net 15') d.setDate(d.getDate() + 15);
        else if (paymentTerms === 'Due on Receipt') d.setDate(d.getDate());
        setDueDate(d.toISOString().split('T')[0]);
    }, [date, paymentTerms]);

    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), productId: '', quantity: 1, price: 0, tradeDiscount: 0 }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updates = { [field]: value };
                if (field === 'productId') {
                    const product = products.find(p => p.id === value);
                    if (product) {
                        updates.price = product.price;
                    }
                }
                return { ...item, ...updates };
            }
            return item;
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            customer,
            date,
            dueDate,
            items,
            subtotal,
            cashDiscount,
            cashDiscountAmount,
            totalAmount,
            paymentTerms,
            status: 'Pending'
        });
    };

    return createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-4xl my-auto animate-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">{initialData ? 'Edit Invoice' : 'New Invoice'}</h2>
                            <p className="text-slate-400 text-sm mt-1">{initialData ? 'Update invoice details' : 'Create a new invoice with discounts'}</p>
                        </div>
                        <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-700/50 rounded-full transition-colors group">
                            <X className="w-6 h-6 text-slate-500 group-hover:text-white" />
                        </button>
                    </div>

                    {/* Customer & Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Customer Name</label>
                            <input
                                type="text"
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium"
                                placeholder="Enter customer..."
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Date Issued</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium [color-scheme:dark]"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Payment Terms</label>
                            <select
                                value={paymentTerms}
                                onChange={(e) => setPaymentTerms(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium cursor-pointer"
                            >
                                <option>Net 30</option>
                                <option>Net 15</option>
                                <option>Due on Receipt</option>
                            </select>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="border border-slate-700/50 rounded-2xl overflow-hidden bg-slate-900/30">
                        <div className="bg-slate-900/50 border-b border-slate-700/50 px-6 py-4 grid grid-cols-12 gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <div className="col-span-4">Product</div>
                            <div className="col-span-2 text-right">Qty</div>
                            <div className="col-span-2 text-right">Price</div>
                            <div className="col-span-2 text-right">Trade Disc %</div>
                            <div className="col-span-2 text-right">Total</div>
                        </div>
                        <div className="divide-y divide-slate-700/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {items.map((item) => (
                                <div key={item.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center group hover:bg-slate-800/50 transition-colors">
                                    <div className="col-span-4">
                                        {products.length > 0 ? (
                                            <select
                                                value={item.productId}
                                                onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                                                className="w-full p-2 bg-transparent text-white border-b border-transparent focus:border-indigo-500 outline-none transition-colors"
                                            >
                                                <option value="" className="bg-slate-800">Select Product...</option>
                                                {products.map(p => <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="Item name..."
                                                value={item.productId}
                                                onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                                                className="w-full p-2 bg-transparent text-white placeholder:text-slate-600 border-b border-transparent focus:border-indigo-500 outline-none transition-colors"
                                            />
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value))}
                                            className="w-full text-right p-2 bg-transparent text-white border-b border-transparent focus:border-indigo-500 outline-none transition-colors font-mono"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value))}
                                            className="w-full text-right p-2 bg-transparent text-white border-b border-transparent focus:border-indigo-500 outline-none transition-colors font-mono"
                                        />
                                    </div>
                                    <div className="col-span-2 relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={item.tradeDiscount}
                                            onChange={(e) => handleItemChange(item.id, 'tradeDiscount', parseFloat(e.target.value))}
                                            className="w-full text-right p-2 bg-transparent text-white border-b border-transparent focus:border-indigo-500 outline-none pr-6 font-mono" // Space for % sign
                                        />
                                        <span className="absolute right-2 top-2 text-slate-500 text-sm">%</span>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-end gap-3">
                                        <span className="font-mono font-bold text-indigo-400">
                                            ${((item.quantity * item.price) * (1 - (item.tradeDiscount / 100))).toFixed(2)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 hover:bg-red-500/10 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-900/30 border-t border-slate-700/50">
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 px-4 py-2 rounded-xl hover:bg-indigo-500/10 transition-colors border border-dashed border-indigo-500/30 hover:border-indigo-500/50 w-full justify-center"
                            >
                                <Plus className="w-4 h-4" />
                                Add Line Item
                            </button>
                        </div>
                    </div>

                    {/* Footer / Totals */}
                    <div className="flex flex-col md:flex-row justify-end items-end gap-6">
                        <div className="w-full md:w-80 space-y-4">
                            <div className="flex justify-between text-slate-400 font-medium">
                                <span>Subtotal</span>
                                <span className="text-white font-mono">${subtotal.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center text-slate-400 font-medium">
                                <span className="flex items-center gap-2">
                                    Cash Discount
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={cashDiscount}
                                        onChange={(e) => setCashDiscount(parseFloat(e.target.value))}
                                        className="w-16 p-1 text-center bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
                                        placeholder="0"
                                    />
                                    %
                                </span>
                                <span className="text-emerald-400 font-mono">-${cashDiscountAmount.toFixed(2)}</span>
                            </div>

                            <div className="pt-4 border-t border-slate-700/50 flex justify-between items-end">
                                <div>
                                    <span className="text-sm font-bold text-white block uppercase tracking-wide">Total Due</span>
                                    <span className="text-xs text-slate-500 font-mono mt-0.5">Due: {dueDate}</span>
                                </div>
                                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 tracking-tight font-mono">${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-700/50">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 rounded-xl border border-slate-700/50 font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-bold text-white hover:from-indigo-500 hover:to-violet-500 shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Save className="w-5 h-5" />
                            Save Invoice
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default InvoiceForm;
