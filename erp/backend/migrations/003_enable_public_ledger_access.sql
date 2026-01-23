-- Enable Public (Anon) Access for Ledger tables
-- IDEMPOTENT VERSION: Drops policies first to avoid "already exists" errors.

-- 1. Finance Accounts
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;

-- Drop potential existing policies to ensure clean slate
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON finance_accounts;
DROP POLICY IF EXISTS "Enable public access" ON finance_accounts;

-- Create the public access policy
CREATE POLICY "Enable public access" ON finance_accounts FOR ALL USING (true) WITH CHECK (true);


-- 2. Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop potential existing policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON transactions;
DROP POLICY IF EXISTS "Enable public access" ON transactions;

-- Create the public access policy
CREATE POLICY "Enable public access" ON transactions FOR ALL USING (true) WITH CHECK (true);
