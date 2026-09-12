'use client'

import { useState, useCallback, useEffect } from 'react'
import { paymentApi } from '@/services/paymentApi'
import { AccountDTO, LedgerEntryDTO, PaymentResponse } from '@/types'
import { getErrorMessage } from '@/utils/formatters'

export const useAccounts = () => {
    const [accounts, setAccounts] = useState<AccountDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAccounts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await paymentApi.getAllAccounts()
            setAccounts(data)
        } catch (err) {
            const errorMsg = getErrorMessage(err)
            setError(errorMsg)
        } finally {
            setLoading(false)
        }
    }, [])

    const getAccount = useCallback(async (accountId: number) => {
        setLoading(true)
        setError(null)
        try {
            const data = await paymentApi.getAccount(accountId)
            return data
        } catch (err) {
            const errorMsg = getErrorMessage(err)
            setError(errorMsg)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAccounts()
    }, [fetchAccounts])

    return { accounts, loading, error, fetchAccounts, getAccount }
}

export const usePayment = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [result, setResult] = useState<PaymentResponse | null>(null)

    const processPayment = useCallback(async (paymentData: any) => {
        setLoading(true)
        setError(null)
        setSuccess(false)
        setResult(null)

        try {
            const response = await paymentApi.processPayment(paymentData)
            setResult(response)
            setSuccess(true)
            return response
        } catch (err) {
            const errorMsg = getErrorMessage(err)
            setError(errorMsg)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const resetState = useCallback(() => {
        setError(null)
        setSuccess(false)
        setResult(null)
    }, [])

    return { loading, error, success, result, processPayment, resetState }
}

export const useTransactionHistory = (accountId: number | null) => {
    const [transactions, setTransactions] = useState<LedgerEntryDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchTransactions = useCallback(async () => {
        if (!accountId) return

        setLoading(true)
        setError(null)
        try {
            const data = await paymentApi.getTransactionHistory(accountId, 50)
            setTransactions(data)
        } catch (err) {
            const errorMsg = getErrorMessage(err)
            setError(errorMsg)
        } finally {
            setLoading(false)
        }
    }, [accountId])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    return { transactions, loading, error, refetch: fetchTransactions }
}
