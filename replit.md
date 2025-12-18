# Dietanic - Fresh Salad Delivery & Subscriptions

## Overview
Dietanic is a React-based e-commerce platform for healthy meal subscriptions and fresh salad delivery. Built with TypeScript, Vite, and Tailwind CSS (via CDN). Features a microservices architecture with event-driven communication.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (CDN)
- **Routing**: React Router DOM (HashRouter - URLs use /#/path format)
- **AI Integration**: Google Gemini AI (optional - requires API key)
- **Icons**: Lucide React
- **State Management**: LocalStorage persistence with in-memory TTL cache

## Architecture
The app uses a microservices-inspired architecture:
- **API Gateway** (`services/apiGateway.ts`) - Facade for all service calls
- **Event Bus** (`services/eventBus.ts`) - Decoupled event-driven communication
- **Saga Pattern** - Distributed transactions (e.g., order creation with inventory + wallet)

### Service Domains
- **Commerce**: Catalog, Sales, Pricing (discounts)
- **Finance**: Ledger (double-entry accounting), Receivables (invoices, quotes), Payables (bills, vendors), Expenses, Reporting
- **Identity & CRM**: Authentication, Users, Customer Profiles, Wallet
- **Operations**: Logistics, Chain Management
- **Intelligence**: Engagement (reviews), Marketing (UTM, analytics), Knowledge Base

## Project Structure
```
├── components/         # Reusable UI components
│   ├── admin/         # Admin dashboard components
│   └── ...            # Customer-facing components
├── pages/             # Route pages
├── services/          # Business logic and data services
│   ├── finance/       # Finance microservices (ledger, receivables, payables)
│   ├── apiGateway.ts  # Central API facade
│   ├── eventBus.ts    # Event-driven communication
│   └── storage.ts     # LocalStorage + caching layer
├── hooks/             # Custom React hooks
├── types.ts           # TypeScript type definitions
├── constants.ts       # App constants and seed data
└── App.tsx            # Main app component with routing
```

## Running the App
The app runs on port 5000 with the command:
```bash
npm run dev
```

## Configuration
- **Vite Config**: `vite.config.ts` - configured for port 5000 with allowedHosts enabled for Replit
- **TypeScript**: `tsconfig.json` - ES2022 target with React JSX support

## Optional API Keys
- `GEMINI_API_KEY` - For AI nutritionist chat and admin agent features (app works without it)

## Key Features
- Product catalog with categories and variations
- Shopping cart with promo code validation
- Wallet system with gift cards and balance management
- Order management with saga-based transactions
- Finance module with double-entry accounting
- Marketing automation (UTM tracking, abandoned cart, newsletter)
- Admin dashboard with POS, inventory, and CRM

## Deployment
Configured for static deployment:
- Build: `npm run build`
- Output: `dist/` directory

## Recent Changes
- Fixed missing script tag in index.html for Vite module loading
- Fixed JSX syntax error in About.tsx (unescaped `<` character)
- Fixed JSX syntax error in Customer.tsx (missing closing div tag)
- Added lazy initialization for Gemini AI to prevent errors when API key is not set
- Added error handling and timeout in useAppStore for robust initialization
