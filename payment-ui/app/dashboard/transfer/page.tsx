'use client'

import React, { useState } from 'react'
import { PaymentForm } from '@/components/Dashboard/PaymentForm'
import { Card, Alert } from '@/components/Common'
import { PaymentResponse } from '@/types'

export default function TransferPage() {
    const [successMessage, setSuccessMessage] = useState<PaymentResponse | null>(null)

    const handlePaymentSuccess = (result: PaymentResponse) => {
        setSuccessMessage(result)
        // Auto-clear message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000)
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Transfer Funds</h1>
                    <p className="text-gray-600">Send money between your accounts securely</p>
                </div>

                {/* Payment Form */}
                <PaymentForm onSuccess={handlePaymentSuccess} />

                {/* Success Message */}
                {successMessage && (
                    <div className="mt-8">
                        <Alert
                            type="success"
                            message={`Successfully transferred ${successMessage.fromBalance ? `$${(successMessage.fromBalance + successMessage.toBalance).toFixed(2)}` : 'funds'}!`}
                            onClose={() => setSuccessMessage(null)}
                        />
                    </div>
                )}

                {/* Information Cards */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="💳 Transfer Details">
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li>✓ Instant transfers between accounts</li>
                            <li>✓ Real-time balance updates</li>
                            <li>✓ Complete transaction history</li>
                        </ul>
                    </Card>

                    <Card title="🔒 Security">
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li>✓ Idempotent transfers</li>
                            <li>✓ Duplicate protection</li>
                            <li>✓ ACID compliant transactions</li>
                        </ul>
                    </Card>

                    <Card title="📝 Transaction Tracking">
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li>✓ Unique transaction IDs</li>
                            <li>✓ Complete audit trail</li>
                            <li>✓ Timestamp records</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </main>
    )
}
