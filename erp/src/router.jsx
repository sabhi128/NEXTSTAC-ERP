import React from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
const DashboardLayout = React.lazy(() => import('./layouts/DashboardLayout'));
const CompanyLayout = React.lazy(() => import('./modules/company/layouts/CompanyLayout'));
const HRLayout = React.lazy(() => import('./modules/hr/layouts/HRLayout'));
const InventoryLayout = React.lazy(() => import('./modules/inventory/layouts/InventoryLayout'));
const FinanceLayout = React.lazy(() => import('./modules/finance/layouts/FinanceLayout'));
const SalesLayout = React.lazy(() => import('./modules/sales/layouts/SalesLayout'));
const PurchasingLayout = React.lazy(() => import('./modules/purchasing/layouts/PurchasingLayout'));
const DocumentsLayout = React.lazy(() => import('./modules/documents/layouts/DocumentsLayout'));
const AuditLayout = React.lazy(() => import('./modules/audit/layouts/AuditLayout'));

const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const DashboardHome = React.lazy(() => import('./modules/dashboard/pages/DashboardHome'));
const EcommerceDashboard = React.lazy(() => import('./modules/dashboard/pages/EcommerceDashboard'));
const DevDashboard = React.lazy(() => import('./modules/dashboard/pages/DevDashboard'));
const EmployeeDashboard = React.lazy(() => import('./modules/dashboard/pages/EmployeeDashboard'));

const CompanyProfile = React.lazy(() => import('./modules/company/pages/CompanyProfile'));
const DepartmentList = React.lazy(() => import('./modules/company/pages/DepartmentList'));
const BranchList = React.lazy(() => import('./modules/company/pages/BranchList'));

const EmployeeList = React.lazy(() => import('./modules/hr/pages/EmployeeList'));
const EmployeeDetails = React.lazy(() => import('./modules/hr/pages/EmployeeDetails'));
const AttendanceLog = React.lazy(() => import('./modules/hr/pages/AttendanceLog'));
const PayrollList = React.lazy(() => import('./modules/hr/pages/PayrollList'));
const LeaveManagement = React.lazy(() => import('./modules/hr/pages/LeaveManagement'));
const LeaveHistory = React.lazy(() => import('./modules/hr/pages/LeaveHistory'));
const EmployeeDocuments = React.lazy(() => import('./modules/hr/pages/EmployeeDocuments'));

const ProductList = React.lazy(() => import('./modules/inventory/pages/ProductList'));
const VendorList = React.lazy(() => import('./modules/inventory/pages/VendorList'));
const WarehouseList = React.lazy(() => import('./modules/inventory/pages/WarehouseList'));
const StockMovements = React.lazy(() => import('./modules/inventory/pages/StockMovements'));

const InvoiceList = React.lazy(() => import('./modules/finance/pages/InvoiceList'));
const Journal = React.lazy(() => import('./modules/finance/pages/Journal'));
const Ledger = React.lazy(() => import('./modules/finance/pages/Ledger'));
const PaymentList = React.lazy(() => import('./modules/finance/pages/PaymentList'));
const Reports = React.lazy(() => import('./modules/finance/pages/Reports'));
const GenerateReports = React.lazy(() => import('./modules/finance/pages/GenerateReports'));
const Returns = React.lazy(() => import('./modules/finance/pages/Returns'));

const OrderList = React.lazy(() => import('./modules/sales/pages/OrderList'));
const CustomerList = React.lazy(() => import('./modules/sales/pages/CustomerList'));
const LeadList = React.lazy(() => import('./modules/sales/pages/LeadList'));
const FollowUpList = React.lazy(() => import('./modules/sales/pages/FollowUpList'));

const SupplierList = React.lazy(() => import('./modules/purchasing/pages/SupplierList'));
const PurchaseOrderList = React.lazy(() => import('./modules/purchasing/pages/PurchaseOrderList'));
const BillList = React.lazy(() => import('./modules/purchasing/pages/BillList'));
const ContractList = React.lazy(() => import('./modules/purchasing/pages/ContractList'));

const FileManager = React.lazy(() => import('./modules/documents/pages/FileManager'));
const ActivityLogs = React.lazy(() => import('./modules/audit/pages/ActivityLogs'));
const UserManagement = React.lazy(() => import('./modules/admin/pages/UserManagement'));
import { useAuth } from './context/AuthContext';

// Protected Route Wrapper
const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

// Role Guard Component
const RoleRoute = ({ children, allowed }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (!allowed.includes(user.role)) return <Navigate to="/" replace />; // Fallback to safe zone
    return children;
};

// Root Dispatcher based on Role
const RootDispatcher = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;

    if (user.role === 'super_admin') return <DashboardHome />;
    if (user.role === 'ecommerce_admin') return <Navigate to="/ecommerce" replace />;
    if (user.role === 'dev_admin') return <Navigate to="/dev" replace />;
    if (user.role === 'user' || user.role === 'staff') return <EmployeeDashboard />;

    return <DashboardHome />;
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <ProtectedRoute />,
        children: [
            {
                path: '/',
                element: <DashboardLayout />,
                children: [
                    {
                        index: true,
                        element: <RootDispatcher />,
                    },
                    // Specific Dashboard Environments
                    {
                        path: 'ecommerce',
                        element: <RoleRoute allowed={['ecommerce_admin', 'super_admin']}><EcommerceDashboard /></RoleRoute>
                    },
                    {
                        path: 'dev',
                        element: <RoleRoute allowed={['dev_admin', 'super_admin']}><DevDashboard /></RoleRoute>
                    },

                    // Modules - Access Control Logic

                    // Sales & CRM (Super Admin + Ecommerce)
                    {
                        path: 'sales',
                        element: <RoleRoute allowed={['super_admin', 'ecommerce_admin']}><SalesLayout /></RoleRoute>,
                        children: [
                            { index: true, element: <Navigate to="orders" replace /> },
                            { path: 'orders', element: <OrderList /> },
                            { path: 'customers', element: <CustomerList /> },
                            { path: 'leads', element: <LeadList /> },
                            { path: 'follow-ups', element: <FollowUpList /> },
                        ]
                    },

                    // Inventory (Super Admin + Ecommerce)
                    {
                        path: 'inventory',
                        element: <RoleRoute allowed={['super_admin', 'ecommerce_admin']}><InventoryLayout /></RoleRoute>,
                        children: [
                            { index: true, element: <Navigate to="products" replace /> },
                            { path: 'products', element: <ProductList /> },
                            { path: 'vendors', element: <VendorList /> },
                            { path: 'warehouses', element: <WarehouseList /> },
                            { path: 'stock', element: <StockMovements /> },
                        ]
                    },

                    // Finance (Super Admin + Ecommerce)
                    {
                        path: 'finance',
                        element: <RoleRoute allowed={['super_admin', 'ecommerce_admin']}><FinanceLayout /></RoleRoute>,
                        children: [
                            { index: true, element: <Navigate to="invoices" replace /> },
                            { path: 'journal', element: <Journal /> },
                            { path: 'ledger', element: <Ledger /> },
                            { path: 'invoices', element: <InvoiceList /> },
                            { path: 'payments', element: <PaymentList /> },
                            { path: 'returns', element: <Returns /> },
                            { path: 'reports', element: <Reports /> },
                            { path: 'generate-reports', element: <GenerateReports /> },
                        ]
                    },

                    // Purchasing (Super Admin + Ecommerce)
                    {
                        path: 'purchasing',
                        element: <RoleRoute allowed={['super_admin', 'ecommerce_admin']}><PurchasingLayout /></RoleRoute>,
                        children: [
                            { index: true, element: <Navigate to="suppliers" replace /> },
                            { path: 'suppliers', element: <SupplierList /> },
                            { path: 'orders', element: <PurchaseOrderList /> },
                            { path: 'bills', element: <BillList /> },
                            { path: 'contracts', element: <ContractList /> },
                        ]
                    },

                    // HR (Super Admin)
                    {
                        path: 'hr',
                        element: <RoleRoute allowed={['super_admin', 'ecommerce_admin', 'dev_admin']}><HRLayout /></RoleRoute>,
                        children: [
                            { index: true, element: <Navigate to="employees" replace /> },
                            { path: 'employees', element: <EmployeeList /> },
                            { path: 'employees/:id', element: <EmployeeDetails /> },
                            { path: 'attendance', element: <AttendanceLog /> },
                            { path: 'payroll', element: <PayrollList /> },
                            { path: 'leave', element: <LeaveManagement /> },
                            { path: 'leave-history', element: <LeaveHistory /> },
                        ]
                    },

                    // Company (Super Admin)
                    {
                        path: 'company',
                        element: <RoleRoute allowed={['super_admin']}><CompanyLayout /></RoleRoute>,
                        children: [
                            { index: true, element: <Navigate to="profile" replace /> },
                            { path: 'profile', element: <CompanyProfile /> },
                            { path: 'departments', element: <DepartmentList /> },
                            { path: 'branches', element: <BranchList /> },
                        ]
                    },

                    // Documents (Super Admin + Dev)
                    {
                        path: 'documents',
                        element: <RoleRoute allowed={['super_admin', 'dev_admin', 'ecommerce_admin']}><DocumentsLayout /></RoleRoute>,
                        children: [
                            { index: true, element: <FileManager /> }
                        ]
                    },

                    // Audit / Logs (Super Admin + Dev)
                    {
                        path: 'audit',
                        element: <RoleRoute allowed={['super_admin', 'dev_admin']}><AuditLayout /></RoleRoute>,
                        children: [
                            { index: true, element: <ActivityLogs /> }
                        ]
                    },

                    // Admin Management (Super Admin)
                    {
                        path: 'admin/users',
                        element: <RoleRoute allowed={['super_admin']}><UserManagement /></RoleRoute>
                    },
                    {
                        path: 'employee-documents',
                        element: <RoleRoute allowed={['super_admin']}><EmployeeDocuments /></RoleRoute>
                    }
                ],
            }
        ]
    },
    {
        path: '/login',
        element: <LoginPage />
    },
    // Signup removed - Admin only
    // {
    //     path: '/signup',
    //     element: <SignupPage />
    // }
]);
