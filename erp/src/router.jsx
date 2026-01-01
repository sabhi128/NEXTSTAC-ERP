import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import CompanyLayout from './modules/company/layouts/CompanyLayout';
import HRLayout from './modules/hr/layouts/HRLayout';
import InventoryLayout from './modules/inventory/layouts/InventoryLayout';
import FinanceLayout from './modules/finance/layouts/FinanceLayout';
import SalesLayout from './modules/sales/layouts/SalesLayout';
import PurchasingLayout from './modules/purchasing/layouts/PurchasingLayout';
import DocumentsLayout from './modules/documents/layouts/DocumentsLayout';
import AuditLayout from './modules/audit/layouts/AuditLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardHome from './modules/dashboard/pages/DashboardHome';
import EcommerceDashboard from './modules/dashboard/pages/EcommerceDashboard';
import DevDashboard from './modules/dashboard/pages/DevDashboard';
import EmployeeDashboard from './modules/dashboard/pages/EmployeeDashboard';
import CompanyProfile from './modules/company/pages/CompanyProfile';
import DepartmentList from './modules/company/pages/DepartmentList';
import BranchList from './modules/company/pages/BranchList';
import EmployeeList from './modules/hr/pages/EmployeeList';
import EmployeeDetails from './modules/hr/pages/EmployeeDetails';
import AttendanceLog from './modules/hr/pages/AttendanceLog';
import PayrollList from './modules/hr/pages/PayrollList';
import LeaveManagement from './modules/hr/pages/LeaveManagement';
import LeaveHistory from './modules/hr/pages/LeaveHistory';
import EmployeeDocuments from './modules/hr/pages/EmployeeDocuments';
import ProductList from './modules/inventory/pages/ProductList';
import VendorList from './modules/inventory/pages/VendorList';
import WarehouseList from './modules/inventory/pages/WarehouseList';
import StockMovements from './modules/inventory/pages/StockMovements';
import InvoiceList from './modules/finance/pages/InvoiceList';
import Journal from './modules/finance/pages/Journal';
import Ledger from './modules/finance/pages/Ledger';
import PaymentList from './modules/finance/pages/PaymentList';
import Reports from './modules/finance/pages/Reports';
import GenerateReports from './modules/finance/pages/GenerateReports';
import Returns from './modules/finance/pages/Returns';
import OrderList from './modules/sales/pages/OrderList';
import CustomerList from './modules/sales/pages/CustomerList';
import LeadList from './modules/sales/pages/LeadList';
import FollowUpList from './modules/sales/pages/FollowUpList';
import SupplierList from './modules/purchasing/pages/SupplierList';
import PurchaseOrderList from './modules/purchasing/pages/PurchaseOrderList';
import BillList from './modules/purchasing/pages/BillList';
import ContractList from './modules/purchasing/pages/ContractList';
import FileManager from './modules/documents/pages/FileManager';
import ActivityLogs from './modules/audit/pages/ActivityLogs';
import UserManagement from './modules/admin/pages/UserManagement';
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
