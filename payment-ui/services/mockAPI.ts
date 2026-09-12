import {
    Account,
    AccountDTO,
    PaymentRequest,
    PaymentResponse,
    LedgerEntryDTO,
    LedgerEntry,
    Transaction,
} from '@/types'

// In-memory store for demo (resets on page refresh)
let mockAccounts: Account[] = [
    {
        id: 1,
        accountNumber: 'ACC001',
        accountHolder: 'John Doe',
        currency: 'USD',
        status: 'ACTIVE',
        version: 1,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 2,
        accountNumber: 'ACC002',
        accountHolder: 'Jane Smith',
        currency: 'USD',
        status: 'ACTIVE',
        version: 1,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 3,
        accountNumber: 'ACC003',
        accountHolder: 'Bob Johnson',
        currency: 'USD',
        status: 'ACTIVE',
        version: 1,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
]

let mockLedger: LedgerEntry[] = [
    // Account 1 initial balance: $5,000
    {
        id: 1,
        accountId: 1,
        transactionId: 'TXN-INIT-001',
        amount: 5000,
        type: 'CREDIT',
        description: 'Initial Balance',
        referenceId: 'INIT-001',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    // Account 2 initial balance: $3,000
    {
        id: 2,
        accountId: 2,
        transactionId: 'TXN-INIT-002',
        amount: 3000,
        type: 'CREDIT',
        description: 'Initial Balance',
        referenceId: 'INIT-002',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    // Account 3 initial balance: $10,000
    {
        id: 3,
        accountId: 3,
        transactionId: 'TXN-INIT-003',
        amount: 10000,
        type: 'CREDIT',
        description: 'Initial Balance',
        referenceId: 'INIT-003',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
]

let mockTransactions: Transaction[] = []
let mockIdempotencyCache: Map<string, PaymentResponse> = new Map()

// Helper function to calculate account balance
function calculateBalance(accountId: number): number {
    return mockLedger
        .filter((entry) => entry.accountId === accountId)
        .reduce((balance, entry) => {
            if (entry.type === 'CREDIT') {
                return balance + entry.amount
            } else {
                return balance - entry.amount
            }
        }, 0)
}

// Helper function to validate idempotency key
export function generateIdempotencyKey(): string {
    return `IDK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const mockPaymentAPI = {
    // Process payment with idempotency
    async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Check idempotency cache
        const cacheKey = `${request.idempotencyKey}-${request.clientId}`
        if (mockIdempotencyCache.has(cacheKey)) {
            console.log('Returning cached response for idempotency key:', cacheKey)
            return mockIdempotencyCache.get(cacheKey)!
        }

        try {
            // Validation
            if (request.fromAccountId === request.toAccountId) {
                throw new Error('Cannot transfer to the same account')
            }

            if (request.amount <= 0) {
                throw new Error('Amount must be greater than zero')
            }

            const fromAccount = mockAccounts.find((a) => a.id === request.fromAccountId)
            const toAccount = mockAccounts.find((a) => a.id === request.toAccountId)

            if (!fromAccount || !toAccount) {
                throw new Error('One or both accounts do not exist')
            }

            if (fromAccount.status !== 'ACTIVE') {
                throw new Error('Source account is inactive')
            }

            // Check balance
            const fromBalance = calculateBalance(request.fromAccountId)
            if (fromBalance < request.amount) {
                throw new Error('Insufficient funds')
            }

            // Create transaction record
            const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

            const transaction: Transaction = {
                id: mockTransactions.length + 1,
                transactionId,
                fromAccountId: request.fromAccountId,
                toAccountId: request.toAccountId,
                amount: request.amount,
                status: 'PENDING',
                idempotencyKey: request.idempotencyKey,
                createdAt: new Date().toISOString(),
            }

            mockTransactions.push(transaction)

            // Record ledger entries (debit from source, credit to destination)
            const debitEntry: LedgerEntry = {
                id: mockLedger.length + 1,
                accountId: request.fromAccountId,
                transactionId,
                amount: request.amount,
                type: 'DEBIT',
                description: request.description || `Transfer to ${toAccount.accountNumber}`,
                referenceId: transactionId,
                createdAt: new Date().toISOString(),
            }

            const creditEntry: LedgerEntry = {
                id: mockLedger.length + 2,
                accountId: request.toAccountId,
                transactionId,
                amount: request.amount,
                type: 'CREDIT',
                description: request.description || `Transfer from ${fromAccount.accountNumber}`,
                referenceId: transactionId,
                createdAt: new Date().toISOString(),
            }

            mockLedger.push(debitEntry, creditEntry)

            // Update transaction status
            transaction.status = 'COMPLETED'
            transaction.completedAt = new Date().toISOString()

            const newFromBalance = calculateBalance(request.fromAccountId)
            const newToBalance = calculateBalance(request.toAccountId)

            const response: PaymentResponse = {
                transactionId,
                status: 'SUCCESS',
                fromBalance: newFromBalance,
                toBalance: newToBalance,
                processedAt: new Date().toISOString(),
                message: 'Payment processed successfully',
            }

            // Cache response
            mockIdempotencyCache.set(cacheKey, response)

            return response
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(errorMessage)
        }
    },

    // Get account details with balance
    async getAccount(accountId: number): Promise<AccountDTO> {
        await new Promise((resolve) => setTimeout(resolve, 300))

        const account = mockAccounts.find((a) => a.id === accountId)
        if (!account) {
            throw new Error('Account not found')
        }

        const balance = calculateBalance(accountId)

        return {
            id: account.id,
            accountNumber: account.accountNumber,
            accountHolder: account.accountHolder,
            balance,
            status: account.status,
        }
    },

    // Get all accounts with balances
    async getAllAccounts(): Promise<AccountDTO[]> {
        await new Promise((resolve) => setTimeout(resolve, 300))

        return mockAccounts.map((account) => ({
            id: account.id,
            accountNumber: account.accountNumber,
            accountHolder: account.accountHolder,
            balance: calculateBalance(account.id),
            status: account.status,
        }))
    },

    // Get transaction history for account
    async getTransactionHistory(accountId: number, limit: number = 50): Promise<LedgerEntryDTO[]> {
        await new Promise((resolve) => setTimeout(resolve, 300))

        const account = mockAccounts.find((a) => a.id === accountId)
        if (!account) {
            throw new Error('Account not found')
        }

        return mockLedger
            .filter((entry) => entry.accountId === accountId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit)
            .map((entry) => ({
                transactionId: entry.transactionId,
                amount: entry.amount,
                type: entry.type,
                description: entry.description,
                createdAt: entry.createdAt,
            }))
    },

    // Get all transactions
    async getTransactions(): Promise<Transaction[]> {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return mockTransactions.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    },

    // Reset mock data (for testing)
    resetMockData() {
        mockLedger = [
            {
                id: 1,
                accountId: 1,
                transactionId: 'TXN-INIT-001',
                amount: 5000,
                type: 'CREDIT',
                description: 'Initial Balance',
                referenceId: 'INIT-001',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
                id: 2,
                accountId: 2,
                transactionId: 'TXN-INIT-002',
                amount: 3000,
                type: 'CREDIT',
                description: 'Initial Balance',
                referenceId: 'INIT-002',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
                id: 3,
                accountId: 3,
                transactionId: 'TXN-INIT-003',
                amount: 10000,
                type: 'CREDIT',
                description: 'Initial Balance',
                referenceId: 'INIT-003',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
        ]
        mockTransactions = []
        mockIdempotencyCache.clear()
    },
}

export default mockPaymentAPI
