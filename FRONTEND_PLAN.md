# Payment System Frontend - UI Implementation Plan

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios + custom mock API layer
- **Form Handling**: React Hook Form + Zod validation
- **Notifications**: React Hot Toast
- **Charts**: Recharts (for transaction analytics)
- **Runtime**: Node.js 18+

## Project Structure
```
payment-ui/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (Dashboard)
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── transfer/page.tsx
│   │   └── accounts/page.tsx
│   ├── api/
│   │   ├── mock/
│   │   │   ├── payments/route.ts
│   │   │   ├── accounts/route.ts
│   │   │   └── transactions/route.ts
│   │   └── middleware.ts
│   └── layout.tsx
├── components/
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── Dashboard/
│   │   ├── AccountCard.tsx
│   │   ├── RecentTransactions.tsx
│   │   └── BalanceChart.tsx
│   ├── Payments/
│   │   ├── PaymentForm.tsx
│   │   ├── PaymentStatus.tsx
│   │   └── PaymentHistory.tsx
│   ├── Accounts/
│   │   ├── AccountList.tsx
│   │   ├── AccountDetails.tsx
│   │   └── CreateAccount.tsx
│   └── Common/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── Loading.tsx
├── hooks/
│   ├── usePaymentAPI.ts
│   ├── useAccounts.ts
│   └── useTransactions.ts
├── services/
│   ├── api.ts (Axios instance)
│   ├── mockAPI.ts (Mock implementations)
│   └── idempotency.ts (Key generation)
├── context/
│   ├── PaymentContext.tsx
│   └── AccountContext.tsx
├── types/
│   ├── payment.ts
│   ├── account.ts
│   └── api.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
├── styles/
│   └── globals.css
├── public/
│   └── icons/
├── .env.local
└── package.json
```

## Database/Mock Seed Data
- Account 1: John Doe (ACC001), Balance: $5,000
- Account 2: Jane Smith (ACC002), Balance: $3,000
- Account 3: Bob Johnson (ACC003), Balance: $10,000

## Features to Implement
1. ✅ Dashboard with account overview
2. ✅ Payment transfer form with validation
3. ✅ Real-time balance updates
4. ✅ Transaction history
5. ✅ Idempotency key handling
6. ✅ Error handling & retry logic
7. ✅ Account management
8. ✅ Balance chart analytics
