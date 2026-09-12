'use client'

import React from 'react'
import { useAccounts } from '@/hooks'
import { Loading, Card } from '@/components/Common'
import { AccountList } from '@/components/Dashboard/AccountCard'
import { RecentTransactions } from '@/components/Dashboard/TransactionHistory'
import { useState, useEffect } from 'react'
import paymentApi from '@/services/paymentApi'
import { LedgerEntryDTO } from '@/types'

export default function DashboardPage() {
    const { accounts, loading } = useAccounts()
    const [allTransactions, setAllTransactions] = useState<LedgerEntryDTO[]>([])
    const [txLoading, setTxLoading] = useState(false)

    useEffect(() => {
        const fetchTransactions = async () => {
            if (accounts.length === 0) return

            setTxLoading(true)
            try {
                let txs: LedgerEntryDTO[] = []

                for (const account of accounts) {
                    const accountTxs = await paymentApi.getTransactionHistory(account.id, 100)
                    txs = [...txs, ...accountTxs]
                }

                txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                setAllTransactions(txs)
            } catch (err) {
                console.error('Failed to fetch transactions:', err)
            } finally {
                setTxLoading(false)
            }
        }

        fetchTransactions()
    }, [accounts])

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <Loading message="Loading dashboard..." />
                </div>
            </main>
        )
    }

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
    const activeAccounts = accounts.filter((acc) => acc.status === 'ACTIVE').length

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Header Stats */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Total Accounts</p>
                                <p className="text-3xl font-bold text-primary-600">{accounts.length}</p>
                            </div>
                        </Card>
                        <Card>
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Active Accounts</p>
                                <p className="text-3xl font-bold text-success-600">{activeAccounts}</p>
                            </div>
                        </Card>
                        <Card>
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Total Balance</p>
                                <p className="text-3xl font-bold text-primary-600">
                                    ${totalBalance.toFixed(2)}
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Accounts Grid */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Accounts</h2>
                    <AccountList accounts={accounts} />
                </div>

                {/* Recent Transactions */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                    <RecentTransactions transactions={allTransactions} loading={txLoading} limit={10} />
                </div>
            </div>
        </main>
    )
}
