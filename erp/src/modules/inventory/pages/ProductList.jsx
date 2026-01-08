import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../lib/api'; // Changed import
import ProductModal from '../components/ProductModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import ProductStatusToggle from '../components/ProductStatusToggle';
import {
    Package,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    ArrowUpDown,
    AlertTriangle,
    Trash2,
    CheckCircle2,
    LayoutList,
    Building2,
    Pencil // Changed from Edit
} from 'lucide-react';


export default function ProductList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);

    const queryClient = useQueryClient();

    const { data: products, isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => api.get('/inventory/products'), // API call
    });

    const addProductMutation = useMutation({
        mutationFn: (data) => api.post('/inventory/products', { ...data, status: 'Active' }), // API call
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            setIsModalOpen(false);
        },
        onError: (error) => {
            alert(`Failed to add product: ${error.message}`);
        }
    });

    const updateProductMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/inventory/products/${id}`, data), // API call
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            setIsModalOpen(false);
        },
        onError: (error) => {
            alert(`Failed to update product: ${error.message}`);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => api.put(`/inventory/products/${id}`, { status }), // API call
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
        }
    });

    const deleteProductMutation = useMutation({
        mutationFn: (id) => api.delete(`/inventory/products/${id}`), // API call
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        },
        onError: (error) => {
            alert(`Failed to delete product: ${error.message || 'Unknown error'}`);
        }
    });

    // ... (handlers remain same)

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleAddProduct = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            await api.delete('/inventory/products');
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products']);
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        },
        onError: (err) => {
            alert("Failed to delete all products: " + (err.message || "Unknown error"));
        }
    });

    const handleConfirmDelete = () => {
        if (productToDelete === 'ALL') {
            deleteAllMutation.mutate();
        } else if (productToDelete) {
            deleteProductMutation.mutate(productToDelete.id);
        }
    };

    const handleModalSubmit = (data) => {
        if (selectedProduct) {
            updateProductMutation.mutate({ id: selectedProduct.id, data });
        } else {
            addProductMutation.mutate(data);
        }
    };

    // Derive unique categories from products
    const categories = ['All', ...new Set(products?.map(p => p.category) || [])];
    const statuses = ['All', 'Active', 'Draft', 'Archived', 'Low Stock'];

    const filteredProducts = products?.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;

        let matchesStatus = true;
        const currentStatus = product.status || 'Active';

        if (statusFilter !== 'All') {
            if (statusFilter === 'Low Stock') {
                matchesStatus = product.stock < product.minStock;
            } else {
                matchesStatus = currentStatus === statusFilter;
            }
        }

        return matchesSearch && matchesCategory && matchesStatus;
    });

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading products...</div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
        >
            {/* Edit/Add Modal */}
            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
                onSubmit={handleModalSubmit}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={productToDelete === 'ALL' ? "Delete All Products?" : "Delete Product"}
                message={productToDelete === 'ALL'
                    ? "Are you sure you want to delete ALL PRODUCTS? This will likely clear all stock movements as well. This action cannot be undone."
                    : `Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
                confirmText={productToDelete === 'ALL' ? (deleteAllMutation.isPending ? "Deleting All..." : "Delete Everything") : (deleteProductMutation.isPending ? "Deleting..." : "Delete Product")}
                variant="danger"
            />

            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">


                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Products</h2>
                        <p className="text-slate-400 text-sm mt-1">Manage inventory items and stock levels</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setProductToDelete('ALL');
                                setIsDeleteModalOpen(true);
                            }}
                            className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete All
                        </button>
                        <button
                            onClick={handleAddProduct}
                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-400/20">
                            <Plus className="w-4 h-4" />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-slate-800/50 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col md:flex-row gap-4 relative z-30">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-200 placeholder:text-slate-500 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        {/* Category Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 font-medium transition-all ${categoryFilter !== 'All'
                                    ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10'
                                    : 'border-slate-700/50 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                {categoryFilter === 'All' ? 'Category' : categoryFilter}
                            </button>

                            {isFilterOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                            {categories.map((category) => (
                                                <button
                                                    key={category}
                                                    onClick={() => {
                                                        setCategoryFilter(category);
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${categoryFilter === category
                                                        ? 'bg-indigo-500/20 text-indigo-300'
                                                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                                        }`}
                                                >
                                                    {category}
                                                    {categoryFilter === category && (
                                                        <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                                className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 font-medium transition-all ${statusFilter !== 'All'
                                    ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10'
                                    : 'border-slate-700/50 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                    }`}
                            >
                                <LayoutList className="w-4 h-4" />
                                {statusFilter === 'All' ? 'Status' : statusFilter}
                            </button>

                            {isStatusFilterOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusFilterOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                        {statuses.map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => {
                                                    setStatusFilter(status);
                                                    setIsStatusFilterOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${statusFilter === status
                                                    ? 'bg-indigo-500/20 text-indigo-300'
                                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                                    }`}
                                            >
                                                {status}
                                                {statusFilter === status && (
                                                    <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Product Name</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">SKU</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Category</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Warehouse</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs text-right">Price</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs text-center">Stock</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs">Status</th>
                                    <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-700/50">
                                {filteredProducts?.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                            No products found passing the current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts?.map((product, index) => (
                                        <motion.tr
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.05 }}
                                            key={product.id}
                                            className="hover:bg-slate-700/30 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-bold text-slate-200">{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 font-mono text-xs tracking-wider">{product.sku}</td>
                                            <td className="px-6 py-4 text-slate-400">
                                                <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                                    <span className="text-xs font-medium">{product.warehouse || 'Main Warehouse'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-emerald-400 font-bold text-right font-mono">${product.price.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-bold ${product.stock < product.minStock ? 'text-red-400' : 'text-slate-300'}`}>
                                                        {product.stock}
                                                    </span>
                                                    {product.stock < product.minStock && (
                                                        <span className="text-[10px] font-bold text-red-300 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded-full mt-1 animate-pulse">
                                                            Low Stock
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <ProductStatusToggle
                                                    currentStatus={product.status || 'Active'}
                                                    onUpdate={(newStatus) => updateStatusMutation.mutate({ id: product.id, status: newStatus })}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => handleDeleteClick(product)}
                                                        className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all active:scale-90"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditProduct(product)}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-all active:scale-95 text-xs font-bold border border-indigo-500/20"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </motion.div >
    );
}
