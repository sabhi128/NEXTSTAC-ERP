-- Safe migration for Invoices Table
-- Run this in your Supabase SQL Editor

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    date DATE,
    due_date DATE,
    amount DECIMAL(15,2),
    status VARCHAR(50) CHECK (status IN ('Paid', 'Pending', 'Overdue')),
    items_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add status column if it's missing (for existing table)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='status') THEN
        ALTER TABLE invoices ADD COLUMN status VARCHAR(50) CHECK (status IN ('Paid', 'Pending', 'Overdue'));
    END IF;
END $$;
