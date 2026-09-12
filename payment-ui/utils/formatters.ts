// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

// Format date
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(date)
}

// Format transaction ID
export const formatTransactionId = (txnId: string): string => {
    return txnId.substring(0, 20) + '...'
}

// Generate idempotency key
export const generateIdempotencyKey = (): string => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return `idk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Get client ID from localStorage or generate
export const getClientId = (): string => {
    let clientId = localStorage.getItem('clientId')
    if (!clientId) {
        clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('clientId', clientId)
    }
    return clientId
}

// Validate email
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// Validate amount
export const isValidAmount = (amount: number): boolean => {
    return amount > 0 && amount <= 999999999.99
}

// Get error message from API error
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, any>
        if (err.response?.data?.error) {
            return err.response.data.error
        }
        if (err.message) {
            return err.message
        }
    }
    return 'An unexpected error occurred'
}

// Format account number
export const formatAccountNumber = (accountNumber: string): string => {
    return accountNumber.substring(0, 3) + '***' + accountNumber.substring(accountNumber.length - 2)
}

// Check if amount is safe to display
export const isSafeAmount = (amount: number): boolean => {
    return isFinite(amount) && !isNaN(amount)
}
