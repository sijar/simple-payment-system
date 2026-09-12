Bespoke Preparation Tracker

Payment / API

✅ Payment API fundamentals
✅ Duplicate requests and why they are dangerous
✅ Idempotency
✅ Idempotency keys
✅ Client generates the idempotency key
✅ Server persists and enforces the key
✅ Unique database constraint for idempotency
✅ Legitimate multiple transactions vs retries

UUID vs SHA

✅ UUID as a unique identifier
✅ Java UUID.randomUUID()
⚠️ UUID versions — v4, v1, v7
✅ UUID vs SHA
✅ SHA as a content fingerprint / digital fingerprint
✅ Identity vs content integrity

Database Transactions

🔄 ⚠️ What exactly is a database transaction?
🔄 ⚠️ Commit
🔄 ⚠️ Rollback
🔄 ⚠️ What actually happens inside the database during rollback
🔄 ⚠️ Transaction logs / undo information / MVCC
⚠️ Can rollback itself fail?
⚠️ Deadlocks and how the database handles them

ACID

⚠️ Atomicity
⚠️ Consistency
⚠️ Isolation
⚠️ Durability

Concurrency

⚠️ Isolation levels
⚠️ Dirty reads
⚠️ Non-repeatable reads
⚠️ Phantom reads
⚠️ Row-level locking
⚠️ Concurrent transactions
⚠️ Optimistic vs pessimistic concurrency
⚠️ MVCC
⚠️ Deadlocks

Payment / Ledger Design

⚠️ Atomic debit + credit
⚠️ Balance column vs ledger as source of truth
⚠️ Ledger design
⚠️ Transaction history / auditability

Spring Transactions

🔄 @Transactional
🔄 What Spring actually does vs what the database does
⚠️ Transaction propagation
⚠️ REQUIRED
⚠️ REQUIRES_NEW
⚠️ Rollback rules
⚠️ rollbackFor
⚠️ Checked vs unchecked exceptions
⚠️ Spring isolation configuration
⚠️ readOnly = true
⚠️ Transaction timeout
⚠️ Programmatic transactions
⚠️ TransactionTemplate
⚠️ PlatformTransactionManager
🧪 Hands-on topics
⚠️ Basic transaction + intentional failure + rollback
⚠️ Successful transaction + commit
⚠️ Idempotency-key experiment
⚠️ Two concurrent database sessions
⚠️ Row-locking experiment
⚠️ Deadlock experiment
⚠️ Isolation-level experiments
⚠️ REQUIRED vs REQUIRES_NEW experiment
🎯 Current priority

1. Transactions → commit/rollback
2. ACID
3. Isolation levels
4. Concurrency + locking
5. Deadlocks
6. Spring @Transactional internals
7. Propagation (REQUIRED / REQUIRES_NEW)
8. Ledger design


