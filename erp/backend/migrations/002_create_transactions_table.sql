-- Create Transactions Table (General Ledger)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ,
    description TEXT,
    amount DECIMAL(15,2),
    type TEXT,       -- 'Income', 'Expense'
    category TEXT,   -- 'Sales', 'Rent', etc.
    reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Optional links (not strictly enforced if loose ledger)
    account_id TEXT -- Future: Link to finance_accounts
);

-- Enable access
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON transactions
    FOR ALL USING (auth.role() = 'authenticated');
