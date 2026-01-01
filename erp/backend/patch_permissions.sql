-- PATCH: Disable RLS on All Tables to Fix "Missing Data" on Frontend
-- If RLS is ON but no policies exist, Supabase hides the data. 
-- We will disable it to make sure the Vercel app can read everything.

ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaves DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;

-- Note: 'users' table needs RLS enabled usually for security, but we previously set a policy (Allow All).
-- If you want to be 100% sure, you can disable it too for testing (SECURITY RISK IN PRODUCTION, OK FOR DEMO)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
