
# Dietanic 🥗

**Dietanic** is a comprehensive e-commerce and store operations platform designed for a premium salad and healthy meal subscription brand. It features a modern, responsive frontend that simulates a microservices architecture, complete with an Event Bus, API Gateway, and Saga Pattern for transaction management.

## 🌟 Key Features

### 🛒 Customer Experience
*   **Omnichannel Ordering:** Buy single items or subscribe to weekly plans.
*   **Smart Cart & Checkout:** 
    *   Modern slide-over checkout experience.
    *   **One-Tap Wallet Pay** for instant transaction completion.
    *   Live order tracking with Google Maps integration.
*   **Digital Wallet:** Gift card redemption, transaction history, and store credit management.
*   **AI Nutritionist:** Integrated **Gemini AI** chatbot for dietary advice and product queries.

### 🏪 Store Operations (POS & KDS)
*   **Point of Sale (POS):** 
    *   Touch-optimized interface for staff.
    *   Visual Table Management (Floor Plan editor).
    *   **Smart Payment Terminal** with Cash Denomination Calculator and Customer Wallet lookup.
*   **Kitchen Display System (KDS):** 
    *   Real-time ticket syncing from POS.
    *   Course management (Starters, Mains) and cooking status updates.

### 💼 Admin & Enterprise
*   **Dashboard:** Real-time analytics, sales velocity, and abandoned cart monitoring.
*   **Inventory Control:** 
    *   **Live Audit Mode:** Barcode-style scanning simulation for physical stock counting.
    *   **One-Click Reconciliation:** Instantly update system stock based on physical counts.
*   **Finance Module:** Automated Profit & Loss (P&L) statements, Tax Reports (GST/VAT), and Expense Ledger.
*   **CRM:** 360-degree customer view with interaction timelines and lifetime value analysis.

## 🏗 Architecture

The application uses a simulated Microservices architecture within a React frontend:

1.  **API Gateway:** (`services/apiGateway.ts`) Central entry point routing requests to specific internal services.
2.  **Event Bus:** (`services/eventBus.ts`) Pub/Sub system for decoupling services (e.g., Order Created -> triggers Email & Finance).
3.  **Saga Pattern:** (`services/sales.ts`) Orchestrates distributed transactions (Order -> Reserve Stock -> Charge Wallet -> Commit) with rollback compensation capabilities.
4.  **Services:** Distinct modules for `Catalog`, `Identity`, `Sales`, `Finance`, `Marketing`, etc.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16+)
*   Google Gemini API Key (for AI features)

### Installation

1.  **Clone the repository**
2.  **Install dependencies**
    ```bash
    npm install
    ```
3.  **Run the application**
    ```bash
    npm start
    ```

### Environment Variables
To enable AI features (Nutritionist Chat, Smart Descriptions, Maps), set your API key in the environment or the code:
`process.env.API_KEY`

## 🔐 User Roles (Demo)

You can switch roles instantly via the Navbar dropdown or login as:

*   **Admin:** `admin@dietanic.com` (Full Access to Admin Panel, POS, KDS)
*   **Customer:** `alex@example.com` (Shop, Wallet, Subscription Management)
*   **Store Manager/Editor:** `editor@dietanic.com` (Limited Admin access)

## 🛠 Tech Stack

*   **Frontend:** React 18, TypeScript, Tailwind CSS
*   **State/Storage:** React Context + LocalStorage Persistence
*   **AI:** @google/genai SDK
*   **Icons:** Lucide React
*   **Routing:** React Router DOM v6

## 📱 Mobile Experience
The application is fully responsive. 
*   **Customers:** Have a mobile-app-like experience for ordering.
*   **Store Staff:** POS is optimized for tablet sizes.

---
*Built as a demonstration of modern frontend capabilities and simulated complex backend logic.*
