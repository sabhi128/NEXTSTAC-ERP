-- Create Finance Accounts Table
CREATE TABLE IF NOT EXISTS finance_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    normal_balance TEXT NOT NULL, -- 'Debit' or 'Credit'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy to allow public access (or authenticated) - Adjust based on your security model
-- For now, enabling public read/write for MVP as RLS might be disabled or simple
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON finance_accounts
    FOR ALL USING (auth.role() = 'authenticated');
    
-- Optional: Seed with default data is handled by Backend, but we can do it here too if we want.
