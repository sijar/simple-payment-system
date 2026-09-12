// Payment and Transaction Types

export interface PaymentRequest {
    idempotencyKey: string
    clientId: string
    fromAccountId: number
    toAccountId: number
    amount: number
    description?: string
}

export interface PaymentResponse {
    transactionId: string
    status: 'SUCCESS' | 'FAILED' | 'DUPLICATE'
    fromBalance: number
    toBalance: number
    processedAt: string
    message: string
}

export interface Account {
    id: number
    accountNumber: string
    accountHolder: string
    currency: string
    status: 'ACTIVE' | 'INACTIVE'
    version: number
    createdAt: string
    updatedAt: string
}

export interface AccountDTO {
    id: number
    accountNumber: string
    accountHolder: string
    balance: number
    status: string
}

export interface LedgerEntry {
    id: number
    accountId: number
    transactionId: string
    amount: number
    type: 'DEBIT' | 'CREDIT'
    description: string
    referenceId: string
    createdAt: string
}

export interface LedgerEntryDTO {
    transactionId: string
    amount: number
    type: 'DEBIT' | 'CREDIT'
    description: string
    createdAt: string
}

export interface Transaction {
    id: number
    transactionId: string
    fromAccountId: number
    toAccountId: number
    amount: number
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK'
    idempotencyKey: string
    failureReason?: string
    createdAt: string
    completedAt?: string
}

export interface APIError {
    error: string
    code?: string
    details?: Record<string, any>
}
