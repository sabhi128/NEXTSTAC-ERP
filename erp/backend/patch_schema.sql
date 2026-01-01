-- PATCH SCRIPT: Fix Schema Mismatches
-- Run this in Supabase SQL Editor to add missing columns

-- 1. Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- 2. Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50);

-- 3. Employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnic TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnic_front TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnic_back TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS stipend_type TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS stipend_description TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS promotion_level TEXT;

-- 4. Leaves
ALTER TABLE leaves ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- 5. Attendance
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);

-- 6. Transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- 7. Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 8. Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 9. Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 10. Enable Role-Based Checks (Fix for Login issue)
-- Allow anyone to read the users table (essential for Login checks)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON users;
CREATE POLICY "Public users are viewable by everyone" ON users FOR SELECT USING (true);
