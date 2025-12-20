
export interface ProductVariation {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
  barcode?: string;
  lowStockThreshold?: number;
  cost?: number;
}

export interface SubscriptionPlan {
  duration: 'weekly' | 'bi-weekly' | 'monthly';
  price: number;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type TrackingMode = 'simple' | 'batch' | 'serial';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  wholesalePrice?: number;
  cost?: number; 
  category: string;
  image: string;
  isSubscription: boolean;
  ingredients?: string[];
  stock: number; // Aggregate stock across all warehouses (Legacy/Simple view)
  sku?: string;
  barcode?: string;
  lowStockThreshold?: number;
  subscriptionPlans?: SubscriptionPlan[];
  subscriptionFeatures?: string[];
  variations?: ProductVariation[];
  nutritionalInfo?: NutritionalInfo;
  itemType?: 'good' | 'service';
  hsnSacCode?: string;
  isGiftCard?: boolean;
  trackingMode?: TrackingMode; // New: Tracking logic
}

// New: Granular Inventory Visibility
export interface InventoryRecord {
    id: string;
    productId: string;
    locationId: string; // Warehouse or Store ID
    locationName: string;
    locationType: 'Warehouse' | 'Store' | '3PL';
    onHand: number;      // Physically present
    allocated: number;   // Reserved for orders but not shipped
    available: number;   // On Hand - Allocated (ATP)
    inTransit: number;   // Coming from PO
    returned: number;    // Pending processing
    quarantined: number; // Damaged/Expired
    lastSynced: string;
    sourceSystem: 'Internal' | 'ERP' | 'WMS' | 'POS';
}

export interface Category {
  id: string;
  name: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface SalaryStructure {
    baseSalary: number;
    hra: number;
    transportAllowance: number;
    pfDeduction: number;
    taxDeduction: number;
    customAllowances: { name: string; amount: number }[];
    customDeductions: { name: string; amount: number }[];
}

export type Permission = 'view_financials' | 'manage_inventory' | 'manage_users' | 'view_phi' | 'access_audit_trail' | 'process_refunds' | 'access_pos' | 'manage_orders';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'driver' | 'customer';
  status: 'active' | 'suspended';
  addresses: Address[];
  wishlist: string[];
  phone?: string;
  priceTier?: 'standard' | 'wholesale';
  salaryStructure?: SalaryStructure;
  customPermissions?: Permission[];
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
  selectedPlan?: SubscriptionPlan;
  selectedVariation?: ProductVariation;
  priceTier?: 'standard' | 'wholesale';
  course?: 'Starter' | 'Main' | 'Dessert' | 'Beverage';
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
  applicableCategory?: string;
}

export interface Invoice {
    id: string;
    date: string;
    dueDate: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue' | 'partial';
    customerName: string;
    items: { description: string; amount: number }[];
    currency: string;
    taxAmount: number;
    payments: { id: string; date: string; amount: number; method: string }[];
    balanceDue: number;
    lastPaymentReminder?: string; // Track last reminder date
}

export interface CustomerBilling {
    currentMonthAmount: number;
    invoices: Invoice[];
}

export interface WalletTransaction {
    id: string;
    date: string;
    amount: number;
    type: 'deposit' | 'payment' | 'refund';
    description: string;
}

export interface CustomerProfile {
    id: string;
    userId: string;
    phone: string;
    shippingAddress: Address;
    billing: CustomerBilling;
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
    medicalNotes?: string;
    consentToProcessPHI: boolean;
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
    location?: { lat: number; lng: number };
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
  shippingMethod?: string;
  shippingCost?: number;
  marketingData?: MarketingData;
  assignedDriverId?: string;
  proofOfDelivery?: ProofOfDelivery;
  cancellationReason?: string;
  testimonialRequested?: boolean; // Track if we asked for a review
  fulfillmentType?: 'delivery' | 'pickup'; // New
  pickupLocationId?: string; // New
}

export interface TaxSettings {
    isRegistered: boolean;
    gstin: string;
    state: string;
    lockDate?: string;
}

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
    userId: string;
    userName: string;
    status: 'active' | 'closed';
    lastMessage: string;
    lastActive: string;
    unreadCount: number;
    isAiHandled?: boolean;
}

export interface PurchaseOrder {
    id: string;
    vendorId: string;
    vendorName: string;
    date: string;
    expectedDate: string;
    status: 'ordered' | 'received';
    items: { productId: string; productName: string; quantity: number; cost: number }[];
    total: number;
    currency?: string; // New: Multi-currency
    exchangeRate?: number; // New: Multi-currency
}

export interface Table {
    id: string;
    name: string;
    capacity: number;
    status: 'available' | 'occupied' | 'billed';
    x: number;
    y: number;
    type: 'round' | 'square' | 'rect';
    currentTicketId?: string;
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

// Finance Types
export interface Expense {
    id: string;
    category: string;
    amount: number;
    description: string;
    paymentMethod: string;
    date: string;
    status: 'pending' | 'approved';
    relatedUserId?: string;
    currency?: string;
}

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export interface LedgerAccount {
    id: string;
    code: number;
    name: string;
    type: AccountType;
    subtype?: string; 
    description?: string;
    balance: number; 
    isSystem?: boolean; 
    currency?: string; // Base currency usually
}

export interface JournalLine {
    accountId: string;
    debit: number;
    credit: number;
}

export interface LedgerEntry {
    id: string;
    date: string;
    description: string;
    referenceId?: string;
    referenceType?: 'Order' | 'Bill' | 'Adjustment' | 'Payment';
    lines: JournalLine[];
    totalAmount: number;
    status: 'posted' | 'draft' | 'void';
    createdAt: string;
    currency?: string; // Multi-currency support
    exchangeRate?: number; // Multi-currency support
}

export interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'reconciled' | 'unreconciled';
}

export interface Quote {
    id: string;
    customerName: string;
    items: any[];
    total: number;
    expiryDate: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
}

export interface SalesOrder {
    id: string;
    date: string;
    customerName: string;
    items: any[];
    total: number;
    status: 'pending_approval' | 'approved' | 'invoiced';
    approvalLevel: number;
}

export interface Vendor {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    category: string;
    balanceDue: number;
    currency?: string;
}

export interface Bill {
    id: string;
    vendorId: string;
    vendorName: string;
    date: string;
    dueDate: string;
    amount: number;
    status: 'open' | 'paid' | 'pending_approval' | 'partial';
    items: { description: string; amount: number }[];
    isRecurring: boolean;
    payments: any[];
    balanceDue: number;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    attachments?: string[];
    currency?: string;
}

export interface Project {
    id: string;
    name: string;
    status: 'active' | 'completed';
    budget: number;
    spent: number;
}

export interface VendorCredit {
    id: string;
    vendorId: string;
    vendorName: string;
    date: string;
    amount: number;
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
    depreciationMethod: 'Straight Line';
    currentBookValue: number;
    depreciationSchedule: { year: number; startValue: number; depreciationExpense: number; endValue: number }[];
}

export interface Payslip {
    id: string;
    userId: string;
    userName: string;
    month: string;
    generatedDate: string;
    status: 'draft' | 'processed';
    earnings: { basic: number; hra: number; transport: number; bonus: number; reimbursements: number; totalEarnings: number };
    deductions: { pf: number; tax: number; unpaidLeave: number; totalDeductions: number };
    netSalary: number;
}

export interface ChainStore {
    id: string;
    name: string;
    location: string;
    coordinates: { x: number; y: number };
    status: 'operational' | 'warning' | 'critical' | 'closed';
    manager: string;
    liveStats: { hourlyRevenue: number; laborCostPercent: number; activeOrders: number; staffOnClock: number; efficiencyScore: number };
    alerts: SecurityAlert[];
}

export interface RegionStats {
    totalRevenue: number;
    totalOrders: number;
    avgEfficiency: number;
    openLocations: number;
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
    type: 'stock' | 'operational_risk' | 'churn' | 'revenue_drop' | 'integrity_breach';
    message: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'resolved';
}

export interface Visitor {
    id: string;
    name: string;
    currentPage: string;
    timeOnSite: string;
    device: string;
    status: 'browsing' | 'idle' | 'chatting';
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
    type: 'AB' | 'Multivariate';
    startDate: string;
    confidenceLevel: number;
    variants: { name: string; trafficSplit: number; visitors: number; conversions: number; conversionRate: number }[];
}

export interface HeatmapData {
    page: string;
    desktopPoints: { x: number; y: number; intensity: number }[];
    mobilePoints: { x: number; y: number; intensity: number }[];
}

export interface FinancialForecast {
    month: string;
    projectedRevenue: number;
    projectedExpenses: number;
    cashPosition: number;
}

export interface ProfitLossStatement {
    period: string;
    revenue: { total: number; breakdown: { category: string; amount: number }[] };
    cogs: number;
    grossProfit: number;
    expenses: { total: number; breakdown: { category: string; amount: number }[] };
    netProfit: number;
    netProfitMargin: number;
}

export interface CohortData {
    cohortMonth: string;
    newCustomers: number;
    retention: { monthIndex: number; percentage: number; revenue: number }[];
    cac: number;
    ltv: number;
}

export interface ProductJourneyInfo {
    productId: string;
    productName: string;
    isGateway: boolean;
    firstPurchaseCount: number;
    repurchaseRate: number;
    avgLTVAttributed: number;
}

// Data Models for Graph Logic
export interface Warehouse {
    id: string;
    name: string;
    type: 'Distribution Center' | 'Cold Storage' | 'Retail Outlet';
    address: string;
    manager: string;
}

export interface Batch {
    id: string;
    productId: string;
    warehouseId: string;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    receivedDate: string;
}

export interface SerialNumber {
    id: string;
    productId: string;
    warehouseId: string;
    serialNumber: string;
    status: 'Available' | 'Sold' | 'Defective' | 'RMA';
}

export interface OrganizationNode {
    id: string;
    name: string;
    type: 'Headquarters' | 'Zone' | 'Region' | 'Branch' | 'Warehouse';
    parentId?: string;
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
