'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PaymentResponse } from '@/types'
import { Button, Input, Alert, Card } from '@/components/Common'
import { usePayment, useAccounts } from '@/hooks'
import { generateIdempotencyKey, getClientId, formatCurrency } from '@/utils/formatters'

// Validation schema
const paymentSchema = z.object({
    fromAccountId: z.coerce.number().min(1, 'Source account is required'),
    toAccountId: z.coerce.number().min(1, 'Destination account is required'),
    amount: z.coerce.number().positive('Amount must be greater than zero').max(999999999.99),
    description: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentFormProps {
    onSuccess?: (result: PaymentResponse) => void
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSuccess }) => {
    const { accounts } = useAccounts()
    const { loading, error, success, result, processPayment, resetState } = usePayment()
    const [fromBalance, setFromBalance] = useState<number>(0)
    const [showSummary, setShowSummary] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            fromAccountId: 0,
            toAccountId: 0,
            amount: 0,
            description: '',
        },
    })

    const fromAccountId = watch('fromAccountId')
    const amount = watch('amount')

    // Update balance when source account changes
    useEffect(() => {
        if (fromAccountId && accounts.length > 0) {
            const account = accounts.find((a) => a.id === Number(fromAccountId))
            if (account) {
                setFromBalance(account.balance)
            }
        }
    }, [fromAccountId, accounts])

    const onSubmit = async (data: PaymentFormData) => {
        try {
            const idempotencyKey = generateIdempotencyKey()
            const clientId = getClientId()

            const response = await processPayment({
                idempotencyKey,
                clientId,
                fromAccountId: data.fromAccountId,
                toAccountId: data.toAccountId,
                amount: data.amount,
                description: data.description,
            })

            onSuccess?.(response)
            reset()
            setShowSummary(false)
        } catch (err) {
            // Error is handled by usePayment hook
        }
    }

    const insufficientFunds = amount && amount > fromBalance
    const selectedFromAccount = accounts.find((a) => a.id === Number(fromAccountId))
    const selectedToAccount = accounts.find((a) => a.id === Number(watch('toAccountId')))

    return (
        <Card title="Transfer Funds">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && <Alert type="error" message={error} onClose={resetState} />}
                {success && result && (
                    <Alert
                        type="success"
                        message={`Payment successful! Transaction ID: ${result.transactionId.substring(0, 20)}...`}
                        onClose={() => {
                            resetState()
                            setShowSummary(false)
                        }}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Source Account */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Account *</label>
                        <select
                            {...register('fromAccountId')}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Select account</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.accountHolder} ({account.accountNumber}) - {formatCurrency(account.balance)}
                                </option>
                            ))}
                        </select>
                        {errors.fromAccountId && (
                            <p className="text-sm text-error-500 mt-1">{errors.fromAccountId.message}</p>
                        )}
                        {fromBalance > 0 && (
                            <p className="text-sm text-gray-600 mt-1">Balance: {formatCurrency(fromBalance)}</p>
                        )}
                    </div>

                    {/* Destination Account */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Account *</label>
                        <select
                            {...register('toAccountId')}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Select account</option>
                            {accounts
                                .filter((account) => account.id !== Number(fromAccountId))
                                .map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.accountHolder} ({account.accountNumber}) - {formatCurrency(account.balance)}
                                    </option>
                                ))}
                        </select>
                        {errors.toAccountId && (
                            <p className="text-sm text-error-500 mt-1">{errors.toAccountId.message}</p>
                        )}
                    </div>
                </div>

                {/* Amount */}
                <div>
                    <Input
                        label="Amount (USD) *"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...register('amount', { valueAsNumber: true })}
                        error={errors.amount?.message}
                    />
                    {insufficientFunds && (
                        <p className="text-sm text-error-500 mt-2">
                            Insufficient funds. Available: {formatCurrency(fromBalance)}
                        </p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <Input
                        label="Description (Optional)"
                        type="text"
                        placeholder="Payment description"
                        {...register('description')}
                        error={errors.description?.message}
                    />
                </div>

                {/* Summary */}
                {selectedFromAccount && selectedToAccount && amount > 0 && !showSummary && (
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">{selectedFromAccount.accountHolder}</span> will send{' '}
                            <span className="font-semibold text-primary-600">{formatCurrency(amount)}</span> to{' '}
                            <span className="font-semibold">{selectedToAccount.accountHolder}</span>
                        </p>
                    </div>
                )}

                {/* Submit */}
                <div className="flex gap-4 pt-6 border-t">
                    <Button
                        type="submit"
                        disabled={insufficientFunds || loading}
                        isLoading={loading}
                        className="flex-1"
                    >
                        {loading ? 'Processing...' : 'Transfer Funds'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => reset()}>
                        Clear
                    </Button>
                </div>
            </form>

            {/* Transaction Success Details */}
            {success && result && (
                <div className="mt-8 pt-8 border-t">
                    <h4 className="font-semibold text-gray-900 mb-4">Transaction Details</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Transaction ID:</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{result.transactionId}</code>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-medium text-success-600">{result.status}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-medium">{formatCurrency(amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">From Account New Balance:</span>
                            <span className="font-medium">{formatCurrency(result.fromBalance)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">To Account New Balance:</span>
                            <span className="font-medium">{formatCurrency(result.toBalance)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Processed At:</span>
                            <span className="font-medium">{new Date(result.processedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}
