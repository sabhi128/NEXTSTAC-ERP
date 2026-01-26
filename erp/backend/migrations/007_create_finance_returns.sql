CREATE TABLE IF NOT EXISTS finance_returns (
    id TEXT PRIMARY KEY,
    return_number TEXT UNIQUE NOT NULL,
    reference_invoice TEXT,
    entity_name TEXT,
    type TEXT CHECK(type IN ('Credit Note', 'Debit Note')),
    amount DECIMAL(15,2),
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
