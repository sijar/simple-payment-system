import api from '@/services/api'
import { AccountDTO, LedgerEntryDTO, PaymentRequest, PaymentResponse } from '@/types'

const paymentApi = {
    async getAllAccounts(): Promise<AccountDTO[]> {
        const { data } = await api.get('/accounts')
        return data
    },

    async getAccount(accountId: number): Promise<AccountDTO> {
        const { data } = await api.get(`/accounts/${accountId}`)
        return data
    },

    async getTransactionHistory(accountId: number, limit = 50): Promise<LedgerEntryDTO[]> {
        const { data } = await api.get(`/accounts/${accountId}/history`, { params: { limit } })
        return data
    },

    async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
        const requestHeaders = {
            'Idempotency-Key': paymentData.idempotencyKey,
            'X-Client-ID': paymentData.clientId,
        }

        const { data } = await api.post('/payments/transfer', paymentData, { headers: requestHeaders })
        return data
    },
}

export default paymentApi
export { paymentApi }
