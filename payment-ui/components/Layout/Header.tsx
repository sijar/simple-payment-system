'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Transfer', href: '/dashboard/transfer' },
    { name: 'Accounts', href: '/dashboard/accounts' },
]

export const Header: React.FC = () => {
    const pathname = usePathname()

    return (
        <header className="bg-white shadow">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-primary-600">💳</div>
                        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                            PaymentHub
                        </Link>
                    </div>

                    <div className="hidden sm:flex gap-8">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === item.href
                                        ? 'text-primary-600 bg-primary-50'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                            Profile
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    )
}

export default Header
