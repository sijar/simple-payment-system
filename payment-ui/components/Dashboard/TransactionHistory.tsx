'use client'

import React from 'react'
import { LedgerEntryDTO } from '@/types'
import { Card, Loading } from '@/components/Common'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface RecentTransactionsProps {
    transactions: LedgerEntryDTO[]
    loading?: boolean
    limit?: number
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
    transactions,
    loading = false,
    limit = 10,
}) => {
    const displayTransactions = transactions.slice(0, limit)

    if (loading) {
        return <Loading message="Loading transactions..." />
    }

    if (displayTransactions.length === 0) {
        return (
            <Card title="Recent Transactions">
                <div className="text-center py-8">
                    <p className="text-gray-600">No transactions yet</p>
                </div>
            </Card>
        )
    }

    return (
        <Card title="Recent Transactions">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left text-sm font-semibold text-gray-900 py-3 px-4">Date</th>
                            <th className="text-left text-sm font-semibold text-gray-900 py-3 px-4">Type</th>
                            <th className="text-left text-sm font-semibold text-gray-900 py-3 px-4">Description</th>
                            <th className="text-right text-sm font-semibold text-gray-900 py-3 px-4">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayTransactions.map((transaction, index) => (
                            <tr
                                key={index}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                <td className="text-sm text-gray-600 py-3 px-4">
                                    {formatDate(transaction.createdAt)}
                                </td>
                                <td className="text-sm py-3 px-4">
                                    <span
                                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${transaction.type === 'CREDIT'
                                                ? 'bg-success-100 text-success-700'
                                                : 'bg-error-100 text-error-700'
                                            }`}
                                    >
                                        {transaction.type}
                                    </span>
                                </td>
                                <td className="text-sm text-gray-900 py-3 px-4">{transaction.description}</td>
                                <td className={`text-sm font-semibold py-3 px-4 text-right`}>
                                    <span
                                        className={
                                            transaction.type === 'CREDIT' ? 'text-success-600' : 'text-error-600'
                                        }
                                    >
                                        {transaction.type === 'CREDIT' ? '+' : '-'}
                                        {formatCurrency(transaction.amount)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

interface TransactionHistoryProps {
    accountId: number
    transactions: LedgerEntryDTO[]
    loading?: boolean
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
    accountId,
    transactions,
    loading = false,
}) => {
    return (
        <Card title={`Transaction History - Account #${accountId}`}>
            {loading ? (
                <Loading message="Loading transaction history..." />
            ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">No transactions found for this account</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {transactions.map((transaction, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span
                                        className={`text-lg ${transaction.type === 'CREDIT' ? 'text-success-600' : 'text-error-600'
                                            }`}
                                    >
                                        {transaction.type === 'CREDIT' ? '⬆️' : '⬇️'}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {transaction.description}
                                        </p>
                                        <p className="text-xs text-gray-600">{formatDate(transaction.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p
                                    className={`text-lg font-bold ${transaction.type === 'CREDIT' ? 'text-success-600' : 'text-error-600'
                                        }`}
                                >
                                    {transaction.type === 'CREDIT' ? '+' : '-'}
                                    {formatCurrency(transaction.amount)}
                                </p>
                                <p className="text-xs text-gray-600">{transaction.type}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
