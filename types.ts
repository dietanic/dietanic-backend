
export interface SubscriptionPlan {
  duration: 'weekly' | 'monthly' | 'bi-weekly';
  price: number;
}

export interface ProductVariation {
  id: string;
  name: string; // e.g., "Small", "Large", "Red"
  price: number;
  stock: number;
  sku?: string;
  lowStockThreshold?: number;
  cost?: number; // Cost of Goods Sold per unit
}

export interface NutritionalInfo {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost?: number; // Cost of Goods Sold
  category: string;
  image: string;
  isSubscription: boolean;
  isGiftCard?: boolean; // New flag
  ingredients: string[];
  stock: number;
  sku?: string;
  lowStockThreshold?: number;
  subscriptionDuration?: 'weekly' | 'monthly' | 'bi-weekly'; // Kept for legacy support
  subscriptionFeatures?: string[];
  subscriptionPlans?: SubscriptionPlan[];
  variations?: ProductVariation[];
  nutritionalInfo?: NutritionalInfo; // Added for comparison
}

export interface CartItem extends Product {
  quantity: number;
  cartItemId: string; // Unique ID for the line item in cart
  selectedPlan?: SubscriptionPlan;
  selectedVariation?: ProductVariation;
  course?: 'Starter' | 'Main' | 'Dessert' | 'Beverage'; // Added for POS
}

export interface MarketingData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_page?: string;
  referrer?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  subtotal?: number; // Before tax/shipping
  taxAmount?: number; // Exact tax amount
  taxType?: 'INTRA' | 'INTER' | 'UR'; // Tax jurisdiction
  paidWithWallet?: number; // New field
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  date: string;
  shippingAddress: Address;
  cancellationReason?: string;
  marketingData?: MarketingData;
  shippingMethod?: string;
  shippingCost?: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer' | 'editor';
  status: 'active' | 'suspended';
  addresses: Address[];
  wishlist: string[];
  priceTier?: 'standard' | 'wholesale'; // For pricelists
}

export interface Category {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  minPurchaseAmount?: number;
  applicableCategory?: string; // 'All' or specific Category Name
}

// Gift Card & Wallet Types
export interface GiftCard {
  id: string;
  code: string;
  initialValue: number;
  currentValue: number;
  status: 'active' | 'redeemed' | 'cancelled';
  expiryDate?: string;
  purchasedByUserId?: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'deposit' | 'payment' | 'refund';
  description: string; // e.g., "Redeemed GC-1234", "Order #456 Payment"
}

// Customer Specific Models
export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

export interface PausePeriod {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface CustomerSubscription {
  planName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'cancelled';
  deliverySlot: 'Morning (6-8 AM)' | 'Evening (7-9 PM)';
  pauseHistory: PausePeriod[];
}

export interface CustomerProfile {
  id: string;
  userId: string; // Foreign Key to User
  phone: string;
  shippingAddress: Address; 
  subscription?: CustomerSubscription;
  walletBalance: number; // New Field
  walletHistory: WalletTransaction[]; // New Field
  billing: {
    currentMonthAmount: number;
    invoices: Invoice[];
  };
}

// TrackComm Types
export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatSession {
  id: string;
  userId: string; // 'guest' or user.id
  userName: string;
  status: 'active' | 'closed';
  lastMessage: string;
  lastActive: string;
  unreadCount: number; // For admin
}

export interface Visitor {
  id: string;
  name: string; // "Guest 123" or User Name
  currentPage: string;
  timeOnSite: string;
  device: 'Desktop' | 'Mobile';
  status: 'browsing' | 'idle' | 'chatting';
}

// POS & Kitchen Types
export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'billed';
  x: number; // For floor plan grid (col)
  y: number; // For floor plan grid (row)
  type: 'square' | 'round' | 'booth';
  currentTicketId?: string;
}

export interface Reservation {
  id: string;
  tableId: string;
  tableName: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  partySize: number;
  status: 'confirmed' | 'cancelled' | 'seated';
  createdAt: string;
}

export interface KitchenTicket {
  id: string;
  tableId: string;
  tableName: string;
  items: CartItem[];
  status: 'pending' | 'cooking' | 'ready' | 'served';
  timestamp: string;
  notes?: string;
}

// Accounting Types
export interface TaxSettings {
    isRegistered: boolean;
    gstin: string;
    state: string; // Store's home state for Intra/Inter logic
}

export interface Expense {
    id: string;
    category: 'Rent' | 'Salaries' | 'Marketing' | 'Utilities' | 'Software' | 'Inventory';
    amount: number;
    date: string;
    description: string;
    paymentMethod: 'Bank Transfer' | 'Cash' | 'Credit Card';
}
