
export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export type Permission = string;

export interface SalaryStructure {
    baseSalary: number;
    hra: number;
    transportAllowance: number;
    pfDeduction: number;
    taxDeduction: number;
    customAllowances: { name: string; amount: number }[];
    customDeductions: { name: string; amount: number }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'editor' | 'customer' | 'driver' | 'vendor';
  status: 'active' | 'suspended';
  addresses: Address[];
  wishlist: string[];
  priceTier?: 'standard' | 'wholesale';
  salaryStructure?: SalaryStructure;
  customPermissions?: Permission[];
  createdAt?: string; // Added for Cohort Analysis
}

export interface Category {
  id: string;
  name: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SubscriptionPlan {
  duration: 'weekly' | 'bi-weekly' | 'monthly';
  price: number;
}

export interface ProductVariation {
  id: string;
  name: string;
  price: number;
  stock: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  lowStockThreshold?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost?: number;
  category: string;
  image: string;
  isSubscription: boolean;
  isGiftCard?: boolean;
  ingredients?: string[];
  stock: number;
  sku?: string;
  barcode?: string;
  lowStockThreshold?: number;
  nutritionalInfo?: NutritionalInfo;
  subscriptionFeatures?: string[];
  subscriptionPlans?: SubscriptionPlan[];
  variations?: ProductVariation[];
  itemType?: 'good' | 'service';
  hsnSacCode?: string;
}

export interface CartItem extends Product {
  quantity: number;
  cartItemId: string;
  selectedPlan?: SubscriptionPlan;
  selectedVariation?: ProductVariation;
  course?: 'Starter' | 'Main' | 'Dessert' | 'Beverage';
}

export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  minPurchaseAmount?: number;
  applicableCategory?: string;
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

export interface Invoice {
  id: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue' | 'sent';
  customerName: string;
  items: any[];
  currency: string;
  taxAmount: number;
  payments: PaymentRecord[];
  balanceDue: number;
  referenceType?: string;
  referenceId?: string;
  isRecurring?: boolean;
}

export interface PaymentRecord {
    id: string;
    date: string;
    amount: number;
    method: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  phone: string;
  shippingAddress: Address;
  walletBalance: number;
  walletHistory: WalletTransaction[];
  subscription?: {
      planName: string;
      startDate: string;
      endDate: string;
      status: 'active' | 'paused' | 'cancelled';
      deliverySlot: string;
      pauseHistory: { startDate: string; endDate: string; reason: string }[];
  };
  billing: {
      currentMonthAmount: number;
      invoices: Invoice[];
  };
  consentToProcessPHI: boolean;
  medicalNotes?: string;
}

export interface WalletTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'deposit' | 'payment' | 'refund';
  description: string;
}

export interface MarketingData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_page?: string;
  referrer?: string;
}

export interface ProofOfDelivery {
    timestamp: string;
    signature?: string;
    photo?: string;
    receivedBy: string;
    location: { lat: number; lng: number };
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  taxAmount?: number;
  taxType?: 'INTRA' | 'INTER' | 'UR';
  paidWithWallet?: number;
  status: 'pending' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  date: string;
  shippingAddress: Address;
  marketingData?: MarketingData;
  shippingMethod?: string;
  shippingCost?: number;
  cancellationReason?: string;
  proofOfDelivery?: ProofOfDelivery;
  assignedDriverId?: string;
}

export interface TaxSettings {
  isRegistered: boolean;
  gstin: string;
  state: string;
  lockDate?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  status: 'active' | 'closed';
  lastMessage: string;
  lastActive: string;
  unreadCount: number;
  isAiHandled: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Quote {
    id: string;
    customerName: string;
    items: any[];
    total: number;
    status: 'sent' | 'accepted' | 'rejected' | 'expired';
    expiryDate: string;
}

export interface PurchaseOrder {
    id: string;
    vendorId: string;
    vendorName: string;
    date: string;
    expectedDate: string;
    status: 'ordered' | 'received' | 'cancelled';
    items: { productId: string; productName: string; quantity: number; cost: number }[];
    total: number;
}

export interface Vendor {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    category: string;
    balanceDue: number;
}

export interface Visitor {
    id: string;
    name: string;
    currentPage: string;
    timeOnSite: string;
    device: string;
    status: string;
}

export interface Table {
    id: string;
    name: string;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved' | 'billed';
    x: number;
    y: number;
    type: 'round' | 'square' | 'booth';
    currentTicketId?: string;
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

export interface Reservation {
    id: string;
    tableId: string;
    tableName: string;
    customerName: string;
    customerPhone: string;
    date: string;
    time: string;
    partySize: number;
    status: 'confirmed' | 'cancelled';
    createdAt: string;
}

export interface GiftCard {
    id: string;
    code: string;
    initialValue: number;
    currentValue: number;
    status: 'active' | 'redeemed' | 'expired';
    purchasedByUserId: string;
    createdAt: string;
}

export interface FinancialForecast {
    month: string;
    projectedRevenue: number;
    projectedExpenses: number;
    cashPosition: number;
}

export interface Expense {
    id: string;
    category: string;
    amount: number;
    description: string;
    paymentMethod: string;
    date: string;
    status: 'pending' | 'approved';
    relatedUserId?: string;
}

export interface LedgerEntry {
    id: string;
    date: string;
    description: string;
    referenceId: string;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    status: 'posted' | 'draft';
}

export interface LedgerAccount {
    id: string;
    code: string;
    name: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
    balance: number;
}

export interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'reconciled' | 'unreconciled';
}

export interface SalesOrder {
    id: string;
    date: string;
    customerName: string;
    items: any[];
    total: number;
    status: 'pending_approval' | 'approved' | 'invoiced' | 'cancelled';
    approvalLevel: number;
}

export interface Bill {
    id: string;
    vendorId: string;
    vendorName: string;
    date: string;
    dueDate: string;
    amount: number;
    status: 'pending_approval' | 'open' | 'paid' | 'partial';
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    items: { description: string; amount: number }[];
    isRecurring: boolean;
    payments: PaymentRecord[];
    balanceDue: number;
    attachments?: string[];
}

export interface Project {
    id: string;
    name: string;
    clientName: string;
    status: 'active' | 'completed' | 'hold';
    budget: number;
    totalExpenses: number;
    totalBillableTime: number;
}

export interface VendorCredit {
    id: string;
    vendorId: string;
    vendorName: string;
    date: string;
    amount: number;
    remainingAmount: number;
    reason: string;
    status: 'open' | 'used';
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    actorId: string;
    actorName: string;
    action: string;
    target: string;
    details: string;
    severity: 'info' | 'warning' | 'critical';
    ipAddress: string;
    previousHash: string;
    hash: string;
}

export interface SecurityAlert {
    id: string;
    timestamp: string;
    type: 'stock' | 'churn' | 'revenue_drop' | 'integrity_breach' | 'operational_risk';
    message: string;
    status: 'active' | 'resolved';
    severity?: 'high' | 'medium' | 'low';
}

export interface ChainStore {
    id: string;
    name: string;
    location: string;
    coordinates: { x: number; y: number };
    status: 'operational' | 'warning' | 'critical' | 'closed';
    manager: string;
    liveStats: {
        hourlyRevenue: number;
        laborCostPercent: number;
        activeOrders: number;
        staffOnClock: number;
        efficiencyScore: number;
    };
    alerts: SecurityAlert[];
}

export interface RegionStats {
    totalRevenue: number;
    totalOrders: number;
    avgEfficiency: number;
    openLocations: number;
}

export interface KnowledgeArticle {
    id: string;
    title: string;
    content: string;
    tags: string[];
    status: 'draft' | 'approved';
    lastUpdated: string;
}

export interface Asset {
    id: string;
    name: string;
    cost: number;
    salvageValue: number;
    usefulLifeYears: number;
    category: 'Equipment' | 'Vehicle' | 'Furniture' | 'Technology';
    purchaseDate: string;
    status: 'active' | 'disposed';
    depreciationMethod: string;
    currentBookValue: number;
    depreciationSchedule: AssetDepreciationEntry[];
}

export interface AssetDepreciationEntry {
    year: number;
    startValue: number;
    depreciationExpense: number;
    endValue: number;
}

export interface Payslip {
    id: string;
    userId: string;
    userName: string;
    month: string;
    generatedDate: string;
    earnings: {
        basic: number;
        hra: number;
        transport: number;
        bonus: number;
        reimbursements: number;
        totalEarnings: number;
    };
    deductions: {
        pf: number;
        tax: number;
        unpaidLeave: number;
        totalDeductions: number;
    };
    netSalary: number;
    status: 'draft' | 'processed';
}

export interface SessionRecording {
    id: string;
    visitorId: string;
    location: string;
    duration: string;
    startTime: string;
    pageCount: number;
    device: 'Desktop' | 'Mobile';
    frustrationScore: number;
    events: any[];
}

export interface Experiment {
    id: string;
    name: string;
    status: 'running' | 'concluded';
    type: 'AB';
    startDate: string;
    confidenceLevel: number;
    variants: { name: string; trafficSplit: number; visitors: number; conversions: number; conversionRate: number }[];
}

export interface HeatmapData {
    page: string;
    desktopPoints: { x: number; y: number; intensity: number }[];
    mobilePoints: { x: number; y: number; intensity: number }[];
}

// --- NEW ANALYTICS TYPES ---

export interface ProfitLossStatement {
    period: string; // 'Monthly' | 'YTD'
    revenue: {
        total: number;
        breakdown: { category: string; amount: number }[];
    };
    cogs: number; // Cost of Goods Sold
    grossProfit: number;
    expenses: {
        total: number;
        breakdown: { category: string; amount: number }[];
    };
    netProfit: number;
    netProfitMargin: number; // %
}

export interface CohortData {
    cohortMonth: string; // e.g., "2023-01"
    newCustomers: number;
    retention: {
        monthIndex: number; // 0 (Month 1), 1 (Month 2), etc.
        percentage: number;
        revenue: number;
    }[];
    cac: number; // Customer Acquisition Cost for this cohort
    ltv: number; // Projected LTV
}

export interface ProductJourneyInfo {
    productId: string;
    productName: string;
    isGateway: boolean; // Is it commonly the first purchase?
    firstPurchaseCount: number;
    repurchaseRate: number; // %
    avgLTVAttributed: number;
}
