# Dietanic - Fresh Salad Delivery & Subscriptions

## Overview
Dietanic is a React-based e-commerce platform for healthy meal subscriptions and fresh salad delivery. Built with TypeScript, Vite, and Tailwind CSS (via CDN).

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (CDN)
- **Routing**: React Router DOM
- **AI Integration**: Google Gemini AI (optional - requires API key)
- **Icons**: Lucide React

## Project Structure
```
├── components/         # Reusable UI components
│   ├── admin/         # Admin dashboard components
│   └── ...            # Customer-facing components
├── pages/             # Route pages
├── services/          # Business logic and data services
├── hooks/             # Custom React hooks
├── types.ts           # TypeScript type definitions
├── constants.ts       # App constants and mock data
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
- `GEMINI_API_KEY` - For AI nutritionist chat and admin agent features

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
