import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { pageVariants } from '../components/ui/animations';
import {
    LayoutDashboard,
    Building2,
    Users,
    Calculator,
    Package,
    ShoppingCart,
    Truck,
    FolderOpen,
    Menu,
    X,
    LogOut,
    Bell,
    Shield,
    Terminal,
    FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },

    // Super Admin Specific Dashboard Links
    {
        label: 'Ecommerce Board',
        path: '/ecommerce',
        icon: ShoppingCart,
        roles: ['super_admin']
    },
    {
        label: 'Dev Console',
        path: '/dev',
        icon: Terminal, // Using calculator as placeholder, or code icon if imported
        roles: ['super_admin']
    },

    {
        label: 'Admin Management',
        path: '/admin/users',
        icon: Shield,
        roles: ['super_admin']
    },
    {
        label: 'Company',
        path: '/company',
        icon: Building2,
        roles: ['super_admin'],
        children: [
            { label: 'Profile', path: '/company/profile' },
            { label: 'Departments', path: '/company/departments' },
            { label: 'Branches', path: '/company/branches' },
        ]
    },
    {
        label: 'HR & Employees',
        path: '/hr',
        icon: Users,
        roles: ['super_admin', 'ecommerce_admin', 'dev_admin'],
        children: [
            { label: 'Employees', path: '/hr/employees' },
            { label: 'Attendance', path: '/hr/attendance' },
            { label: 'Payroll', path: '/hr/payroll' },
            { label: 'Leave Requests', path: '/hr/leave' },
        ]
    },
    {
        label: 'Employee Documents',
        path: '/employee-documents',
        icon: FileText,
        roles: ['super_admin']
    },
    {
        label: 'Finance',
        path: '/finance',
        icon: Calculator,
        roles: ['super_admin', 'ecommerce_admin'],
        children: [
            { label: 'Overview', path: '/finance' },
            { label: 'Journal', path: '/finance/journal' },
            { label: 'Ledger', path: '/finance/ledger' },
            { label: 'Invoices', path: '/finance/invoices' },
            { label: 'Payments', path: '/finance/payments' },
            { label: 'Reports', path: '/finance/reports' },
            { label: 'Generate Reports', path: '/finance/generate-reports' },
        ]
    },
    {
        label: 'Inventory',
        path: '/inventory',
        icon: Package,
        roles: ['super_admin', 'ecommerce_admin'],
        children: [
            { label: 'Overview', path: '/inventory' },
            { label: 'Products', path: '/inventory/products' },
            { label: 'Stock Movements', path: '/inventory/stock' },
            { label: 'Warehouses', path: '/inventory/warehouses' },
            { label: 'Vendors', path: '/inventory/vendors' },
        ]
    },
    {
        label: 'Sales & CRM',
        path: '/sales',
        icon: ShoppingCart,
        roles: ['super_admin', 'ecommerce_admin'],
        children: [
            { label: 'Overview', path: '/sales' },
            { label: 'Customers', path: '/sales/customers' },
            { label: 'Orders', path: '/sales/orders' },
            { label: 'Leads', path: '/sales/leads' },
        ]
    },
    {
        label: 'Purchasing',
        path: '/purchasing',
        icon: Truck,
        roles: ['super_admin', 'ecommerce_admin'],
        children: [
            { label: 'Overview', path: '/purchasing' },
            { label: 'Suppliers', path: '/purchasing/suppliers' },
            { label: 'Orders', path: '/purchasing/orders' },
            { label: 'Bills', path: '/purchasing/bills' },
            { label: 'Contracts', path: '/purchasing/contracts' },
        ]
    },
    { label: 'Documents', path: '/documents', icon: FolderOpen, roles: ['super_admin', 'dev_admin', 'ecommerce_admin'] },
    { label: 'Audit Logs', path: '/audit', icon: Menu, roles: ['super_admin', 'dev_admin'] },
];

export default function DashboardLayout() {
    const { logout, user } = useAuth();
    console.log('Current User in DashboardLayout:', user);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const currentOutlet = useOutlet();

    const getDashboardPath = () => {
        switch (user?.role) {
            case 'ecommerce_admin': return '/ecommerce';
            case 'dev_admin': return '/dev';
            default: return '/';
        }
    };

    // Filter and Transform items based on role
    const filteredNavItems = NAV_ITEMS.map(item => {
        if (item.label === 'Dashboard') {
            return { ...item, path: getDashboardPath() };
        }
        return item;
    }).filter(item => {
        if (!item.roles) return true; // Accessible by all
        return item.roles.includes(user?.role);
    });

    const getDashboardTitle = () => {
        switch (user?.role) {
            case 'super_admin': return 'Super Admin Console';
            case 'ecommerce_admin': return 'E-commerce Admin';
            case 'dev_admin': return 'Developer Console';
            default: return 'Office Ledger';
        }
    };



    return (
        <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-72 bg-slate-900 border-r border-slate-800/50 fixed h-full z-30 transition-all shadow-2xl shadow-black/50">
                {/* Sidebar Header / Logo */}
                <div className="h-20 px-6 flex items-center border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300 overflow-hidden">
                            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-white tracking-tight leading-none group-hover:text-indigo-400 transition-colors">
                                {getDashboardTitle()}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">
                                Enterprise ERP
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                    {filteredNavItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={!item.children}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                                    isActive
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebar-active-pill"
                                                className="absolute inset-0 bg-white/10 mix-blend-overlay"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        {Icon && <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400")} />}
                                        <span className="relative z-10">{item.label}</span>
                                        {isActive && (
                                            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white shadow-glow" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Sidebar Footer / User Profile */}
                <div className="p-4 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-indigo-500/30 transition-colors group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20 overflow-hidden">
                                <img src={logo} alt="User" className="w-full h-full rounded-full object-cover" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{user?.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium truncate">{user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded-lg transition-all"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 md:ml-72 flex flex-col min-h-screen transition-all duration-300 relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none fixed" />

                {/* Header */}
                <header className="h-20 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        {/* Breadcrumbs or Title could go here */}
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <button className="relative p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all hover:scale-105 active:scale-95 group">
                            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                        </button>

                        <div className="h-8 w-[1px] bg-slate-800 mx-2" />

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white leading-tight">{user?.name}</p>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{user?.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/20 cursor-pointer hover:shadow-indigo-500/40 transition-shadow overflow-hidden">
                                <img src={logo} alt="User" className="w-full h-full rounded-[10px] object-cover" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <div className="fixed inset-0 z-50 md:hidden">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                            <motion.nav
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="absolute left-0 top-0 bottom-0 w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-2xl"
                            >
                                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30 overflow-hidden">
                                            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-xl font-bold text-white tracking-tight">Office Ledger</span>
                                    </div>
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                                    {filteredNavItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <React.Fragment key={item.path}>
                                                <NavLink
                                                    to={item.path}
                                                    end={!item.children}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className={({ isActive }) => cn(
                                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                                                        isActive
                                                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                                                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                                    )}
                                                >
                                                    {Icon && <Icon className="w-5 h-5" />}
                                                    {item.label}
                                                </NavLink>
                                                {/* Mobile Submenu could go here if needed */}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                                <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-xl font-medium transition-all border border-slate-700 hover:border-red-500/30"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Sign Out
                                    </button>
                                </div>
                            </motion.nav>
                        </div>
                    )}
                </AnimatePresence>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto z-10 relative">
                    <div className="w-full max-w-7xl mx-auto">
                        {currentOutlet}
                    </div>
                </main>
            </div>
        </div>
    );
}
