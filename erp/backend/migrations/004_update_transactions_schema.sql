-- Add direction column to transactions table to explicitly track Debit/Credit
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS direction TEXT; -- 'Debit' or 'Credit'

-- Ensure account_id exists (redundant if 002 is correct, but safe)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS account_id TEXT;
