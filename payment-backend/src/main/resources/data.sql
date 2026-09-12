INSERT INTO accounts (account_number, account_holder, currency, status, created_at, updated_at) VALUES
('ACC001', 'John Doe', 'USD', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ACC002', 'Jane Smith', 'USD', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ACC003', 'Bob Johnson', 'USD', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO ledger_entries (account_id, transaction_id, amount, type, description, reference_id, created_at) VALUES
(1, 'TXN-INIT-001', 5000.00, 'CREDIT', 'Initial Balance', 'INIT-001', CURRENT_TIMESTAMP),
(2, 'TXN-INIT-002', 3000.00, 'CREDIT', 'Initial Balance', 'INIT-002', CURRENT_TIMESTAMP),
(3, 'TXN-INIT-003', 10000.00, 'CREDIT', 'Initial Balance', 'INIT-003', CURRENT_TIMESTAMP);
