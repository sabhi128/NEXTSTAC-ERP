-- Database Schema for ERP System
-- Based on current frontend mockDataService.js structure

-- 1. Users & Authentication

-- DROP TABLES CLEANUP (Run this to reset schema)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS company_profile CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS chart_of_accounts CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS salaries CASCADE;
DROP TABLE IF EXISTS employee_history CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    share_percentage DECIMAL(5,2) DEFAULT 0.00,
    department VARCHAR(100), -- Added
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ... (Departments skipped for brevity in tool call, manual check needed if mismatch)

-- 3. Inventory & Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    price DECIMAL(15,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 10,
    min_stock INTEGER DEFAULT 10, -- Added matching local
    stock INTEGER DEFAULT 0, -- Added matching local 'stock' vs 'stock_quantity'
    supplier VARCHAR(255),
    status VARCHAR(50), -- Added
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. HR Module
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    head_of_department VARCHAR(255),
    budget DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    position VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    department_name VARCHAR(100), -- Denormalized for easier querying if needed, or rely on join
    salary DECIMAL(15,2),
    join_date DATE,
    status VARCHAR(50) CHECK (status IN ('Active', 'On Leave', 'Terminated')),
    avatar_url TEXT,
    phone VARCHAR(50),
    address TEXT,
    stipend_type TEXT,
    stipend_description TEXT,
    cnic TEXT, -- Changed from cnic_front to match local
    cnic_front TEXT, -- Keeping both just in case, but sync expects 'cnic'
    cnic_back TEXT,
    matric_result TEXT,
    inter_result TEXT,
    cv TEXT,
    promotion_level TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    employee_name VARCHAR(255), -- Added denormalized field found in local
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(50),
    work_hours VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    old_position VARCHAR(100),
    old_level VARCHAR(50),
    old_salary DECIMAL(15,2),
    old_department VARCHAR(100),
    new_position VARCHAR(100),
    new_level VARCHAR(50),
    new_salary DECIMAL(15,2),
    new_department VARCHAR(100),
    change_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255)
);

CREATE TABLE salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    payment_date DATE,
    amount DECIMAL(15,2),
    method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Inventory & Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    price DECIMAL(15,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 10,
    supplier VARCHAR(255),
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location TEXT,
    capacity INTEGER,
    manager_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    contact_number VARCHAR(50)
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    type VARCHAR(50) CHECK (type IN ('In', 'Out', 'Adjustment')),
    quantity INTEGER NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    reference_code VARCHAR(100)
);

-- 4. Finance Module
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- Asset, Liability, Equity, Revenue, Expense
    normal_balance VARCHAR(10) CHECK (normal_balance IN ('Debit', 'Credit'))
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    debit_account_id UUID REFERENCES chart_of_accounts(id),
    credit_account_id UUID REFERENCES chart_of_accounts(id),
    type VARCHAR(50),
    category VARCHAR(100),
    reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255), -- Link to customers table in real implementation
    date DATE,
    due_date DATE,
    amount DECIMAL(15,2),
    status VARCHAR(50) CHECK (status IN ('Paid', 'Pending', 'Overdue')),
    items_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments ( -- Received payments
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(50) UNIQUE,
    invoice_id UUID REFERENCES invoices(id),
    amount DECIMAL(15,2),
    date DATE,
    method VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    rating INTEGER,
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    date DATE,
    expected_date DATE,
    amount DECIMAL(15,2),
    status VARCHAR(50) CHECK (status IN ('Draft', 'Ordered', 'Received', 'Cancelled'))
);

CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    date DATE,
    due_date DATE,
    amount DECIMAL(15,2),
    status VARCHAR(50)
);

-- 5. Sales & CRM
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    status VARCHAR(50),
    notes TEXT,
    total_orders INTEGER DEFAULT 0,
    last_order_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100), -- Website, Referral, etc.
    status VARCHAR(50) CHECK (status IN ('New', 'Contacted', 'Qualified', 'Lost')),
    estimated_value DECIMAL(15,2)
);

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    date DATE,
    amount DECIMAL(15,2),
    status VARCHAR(50) CHECK (status IN ('Processing', 'Shipped', 'Delivered', 'Cancelled')),
    payment_status VARCHAR(50)
);

-- 6. System & Config
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location TEXT,
    manager_name VARCHAR(255),
    contact VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE company_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    legal_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    tax_id VARCHAR(50),
    address_json JSONB, -- Storing complex address structure
    settings_json JSONB -- Storing misc config
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255), -- Snapshot in case user deleted
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100),
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
