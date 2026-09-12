import type { Metadata } from 'next'
import { Header } from '@/components/Layout/Header'
import '@/styles/globals.css'

export const metadata: Metadata = {
    title: 'PaymentHub - Payment System',
    description: 'A modern payment system with secure transfers and transaction tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="bg-gray-50">
                <Header />
                {children}
            </body>
        </html>
    )
}
