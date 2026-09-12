'use client'

import React from 'react'
import { AccountDTO } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { Card } from '@/components/Common'
import Link from 'next/link'

interface AccountCardProps {
    account: AccountDTO
    isSelectable?: boolean
    isSelected?: boolean
    onSelect?: (account: AccountDTO) => void
}

export const AccountCard: React.FC<AccountCardProps> = ({
    account,
    isSelectable = false,
    isSelected = false,
    onSelect,
}) => {
    return (
        <div
            onClick={() => isSelectable && onSelect?.(account)}
            className={`p-6 border-2 rounded-lg transition-all cursor-pointer ${isSelectable
                    ? isSelected
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    : 'border-gray-200'
                }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{account.accountHolder}</h3>
                    <p className="text-sm text-gray-600">Account: {account.accountNumber}</p>
                </div>
                <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${account.status === 'ACTIVE'
                            ? 'bg-success-100 text-success-700'
                            : 'bg-error-100 text-error-700'
                        }`}
                >
                    {account.status}
                </span>
            </div>

            <div className="mt-6">
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.balance)}</p>
            </div>
        </div>
    )
}

interface AccountListProps {
    accounts: AccountDTO[]
    isSelectable?: boolean
    selectedId?: number
    onSelect?: (account: AccountDTO) => void
}

export const AccountList: React.FC<AccountListProps> = ({
    accounts,
    isSelectable = false,
    selectedId,
    onSelect,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
                <AccountCard
                    key={account.id}
                    account={account}
                    isSelectable={isSelectable}
                    isSelected={selectedId === account.id}
                    onSelect={onSelect}
                />
            ))}
        </div>
    )
}

interface AccountDetailsProps {
    account: AccountDTO
}

export const AccountDetails: React.FC<AccountDetailsProps> = ({ account }) => {
    return (
        <Card title="Account Details">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Account Holder</p>
                        <p className="text-lg font-semibold text-gray-900">{account.accountHolder}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Account Number</p>
                        <p className="text-lg font-semibold text-gray-900 font-mono">{account.accountNumber}</p>
                    </div>
                </div>

                <div>
                    <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                    <p className="text-3xl font-bold text-primary-600">{formatCurrency(account.balance)}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-600 mb-1">Account Status</p>
                    <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${account.status === 'ACTIVE'
                                ? 'bg-success-100 text-success-700'
                                : 'bg-error-100 text-error-700'
                            }`}
                    >
                        {account.status}
                    </span>
                </div>

                <div className="pt-4 border-t">
                    <Link href={`/dashboard/accounts/${account.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                        View Transaction History →
                    </Link>
                </div>
            </div>
        </Card>
    )
}
