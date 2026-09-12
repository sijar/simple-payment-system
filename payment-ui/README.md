# Payment System UI - Next.js Frontend

A modern, responsive payment system UI built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **React Hook Form**.

## Features

✅ **Modern UI Components**
- Built with latest React 18 + TypeScript
- Tailwind CSS for responsive design
- React Hook Form for validation
- Zod schema validation

✅ **Payment Management**
- Transfer funds between accounts
- Real-time balance updates
- Complete transaction history
- Idempotency key support

✅ **Account Management**
- View all accounts with balances
- Account details and status
- Transaction history per account
- Balance tracking

✅ **Mock API Integration**
- In-memory mock API (no backend required)
- Simulated database with seed data
- Idempotency cache
- Automatic balance calculations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **State Management**: React Context + Hooks
- **Runtime**: Node.js 18+

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Setup

1. **Navigate to project**
```bash
cd payment-ui
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Configure environment**
```bash
cp .env.local.example .env.local
# Edit .env.local if needed
```

4. **Start development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open browser**
Navigate to `http://localhost:3000`

## Usage

### Default Mock Accounts

| Account | Holder | Number | Balance |
|---------|--------|--------|---------|
| 1 | John Doe | ACC001 | $5,000 |
| 2 | Jane Smith | ACC002 | $3,000 |
| 3 | Bob Johnson | ACC003 | $10,000 |

### Dashboard
- View overview of all accounts
- See total balance and active accounts
- Browse recent transactions from all accounts

### Transfer Funds
- Select source and destination accounts
- Enter transfer amount
- Add optional description
- Automatic validation and balance checking
- Transaction receipt with details

### Account Management
- Select individual account
- View detailed account information
- See complete transaction history
- Track debits and credits

## Project Structure

```
payment-ui/
├── app/                       # Next.js app directory
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page (redirects to dashboard)
│   ├── dashboard/
│   │   ├── page.tsx          # Dashboard view
│   │   ├── transfer/page.tsx  # Payment transfer page
│   │   └── accounts/page.tsx  # Account management page
│   └── api/                  # API routes (optional)
├── components/               # React components
│   ├── Layout/              # Header, Footer, Layout components
│   ├── Dashboard/           # Dashboard-specific components
│   ├── Common/              # Reusable UI components
│   └── ...
├── hooks/                   # Custom React hooks
│   └── index.ts            # useAccounts, usePayment, useTransactionHistory
├── services/                # API and business logic
│   ├── api.ts              # Axios instance configuration
│   ├── mockAPI.ts          # Mock API implementation
│   └── ...
├── types/                   # TypeScript type definitions
│   └── index.ts            # All shared types
├── utils/                   # Utility functions
│   ├── formatters.ts       # Currency, date formatting
│   ├── validators.ts       # Input validation
│   └── ...
├── styles/                  # Global styles
│   └── globals.css         # Tailwind + custom CSS
├── public/                  # Static assets
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind CSS config
└── .env.local              # Environment variables
```

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run type-check   # TypeScript type checking
```

### Production
```bash
npm run build        # Build for production
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

## API Endpoints (Mock)

### Payments
```
POST /api/mock/payments/transfer
  Request: { idempotencyKey, clientId, fromAccountId, toAccountId, amount }
  Response: { transactionId, status, fromBalance, toBalance, processedAt }
```

### Accounts
```
GET /api/mock/accounts/:id
  Response: { id, accountNumber, accountHolder, balance, status }

GET /api/mock/accounts
  Response: [{ id, accountNumber, accountHolder, balance, status }, ...]
```

### Transactions
```
GET /api/mock/accounts/:id/history?limit=50
  Response: [{ transactionId, amount, type, description, createdAt }, ...]
```

## Validation Rules

### Payment Transfer
- **Source Account**: Required, must exist, must be ACTIVE
- **Destination Account**: Required, must exist, must be different from source
- **Amount**: Required, must be > 0, must be ≤ $999,999,999.99
- **Balance Check**: Account balance must be ≥ transfer amount
- **Description**: Optional, max 255 characters

### Idempotency
- Each payment requires a unique `Idempotency-Key` (UUID)
- Client ID is automatically generated and stored in localStorage
- Same payment with same key within 24 hours returns cached result
- Prevents duplicate processing on retries

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Insufficient Funds | 402 | `Insufficient funds` |
| Account Not Found | 404 | `Account not found` |
| Invalid Amount | 400 | `Amount must be greater than zero` |
| Same Account Transfer | 400 | `Cannot transfer to the same account` |
| Inactive Account | 400 | `Source account is inactive` |
| Server Error | 500 | `Internal server error` |

## Performance Optimization

- ✅ Server-side rendering with Next.js
- ✅ Code splitting by route
- ✅ Optimized images and assets
- ✅ Caching with localStorage
- ✅ Debounced form validation
- ✅ Lazy loading components

## Security Features

- ✅ CSRF protection (Next.js built-in)
- ✅ XSS prevention with React escaping
- ✅ Secure headers
- ✅ Client ID generation and persistence
- ✅ Idempotency key validation
- ✅ Input sanitization

## Testing

### Manual Testing
```bash
# 1. Start development server
npm run dev

# 2. Open http://localhost:3000
# 3. Test payment transfer with different scenarios
# 4. Check transaction history updates
```

### Test Cases
- ✅ Successful payment transfer
- ✅ Idempotent retry (same key returns same result)
- ✅ Insufficient funds error
- ✅ Invalid amount validation
- ✅ Account balance updates
- ✅ Transaction history display

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Then restart
npm run dev
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

### Mock API Not Working
- Clear localStorage: `localStorage.clear()`
- Refresh page: `F5`
- Check browser console for errors

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- 🔄 Real backend API integration
- 💾 Database persistence
- 🔐 User authentication
- 👥 Admin dashboard
- 📊 Analytics and reporting
- 🔔 Real-time notifications
- 📱 Mobile app (React Native)
- 🌐 i18n/localization

## Development Tips

### Add New Component
```bash
# Create component file
touch components/Dashboard/NewComponent.tsx

# Import and use in page
```

### Add New Hook
```bash
# Create hook
touch hooks/useNewHook.ts

# Export from hooks/index.ts
```

### Styling
- Use Tailwind CSS classes
- Extend theme in `tailwind.config.ts`
- Custom CSS in `styles/globals.css`

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review component documentation
3. Check browser console for errors
4. Create an issue on GitHub

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ using Next.js**
