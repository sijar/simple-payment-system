'use client'

import React, { useState } from 'react'
import { useAccounts, useTransactionHistory } from '@/hooks'
import { Loading } from '@/components/Common'
import { AccountList } from '@/components/Dashboard/AccountCard'
import { AccountDetails } from '@/components/Dashboard/AccountCard'
import { TransactionHistory } from '@/components/Dashboard/TransactionHistory'
import { AccountDTO } from '@/types'

export default function AccountsPage() {
    const { accounts, loading } = useAccounts()
    const [selectedAccount, setSelectedAccount] = useState<AccountDTO | null>(
        accounts.length > 0 ? accounts[0] : null
    )
    const { transactions, loading: txLoading } = useTransactionHistory(selectedAccount?.id || null)

    React.useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts[0])
        }
    }, [accounts, selectedAccount])

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <Loading message="Loading accounts..." />
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Accounts</h1>
                    <p className="text-gray-600">View and manage your accounts</p>
                </div>

                {/* Account Selection */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Select Account</h2>
                    <AccountList
                        accounts={accounts}
                        isSelectable
                        selectedId={selectedAccount?.id}
                        onSelect={setSelectedAccount}
                    />
                </div>

                {/* Account Details and Transaction History */}
                {selectedAccount && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Account Details Sidebar */}
                        <div className="lg:col-span-1">
                            <AccountDetails account={selectedAccount} />
                        </div>

                        {/* Transaction History */}
                        <div className="lg:col-span-2">
                            <TransactionHistory
                                accountId={selectedAccount.id}
                                transactions={transactions}
                                loading={txLoading}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
