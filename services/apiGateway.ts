
import { CatalogService } from './catalog';
import { SalesService } from './sales';
import { IdentityService } from './identity';
import { WalletService } from './wallet';
import { CustomerService } from './customers';
import { DiscountService } from './discounts';
import { EngagementService } from './engagement';
import { SettingsService } from './settings';
import { AssetService } from './assets';
import { PayrollService } from './payroll';
import { DeliveryService } from './delivery';
import { ChainService } from './chainService';
import { MarketingService } from './marketing';
import { InventoryService } from './inventory';
import { Product, Order, User, Review, Discount, TaxSettings, KnowledgeArticle, Asset, Payslip } from '../types';
import { KnowledgeService } from './knowledge';

// Import the new granular finance services
import * as LedgerService from './finance/ledger';
import * as ReceivablesService from './finance/receivables';
import * as PayablesService from './finance/payables';
import * as ExpensesService from './finance/expenses';
import * as ReportingService from './finance/reporting';

/**
 * MICROSERVICES API GATEWAY (Domain Facade)
 * 
 * Orchestrates communication between the Frontend Shell (ViewModels) and distributed Backend Domains (Services).
 * Each domain functions as an independent bounded context.
 */
export const APIGateway = {
    // --- DOMAIN: COMMERCE & CATALOG ---
    Commerce: {
        Catalog: {
            listProducts: () => CatalogService.getProducts(),
            getProduct: (id: string) => CatalogService.getProductById(id),
            getCategories: () => CatalogService.getCategories(),
            updateStock: (items: any[]) => CatalogService.reserveStock(items)
        },
        Sales: {
            createOrder: (order: Order) => SalesService.createOrder(order),
            getOrderHistory: (userId: string) => SalesService.getOrdersByUser(userId),
            getAllOrders: () => SalesService.getOrders(),
            processReturn: (orderId: string) => console.log('Return processed via Sales Service')
        },
        Pricing: {
            validateDiscount: (code: string, amount: number, categories: string[]) => DiscountService.validateDiscount(code, amount, categories),
            getDiscounts: () => DiscountService.getDiscounts()
        },
        Inventory: {
            getGlobalView: () => InventoryService.getInventory(),
            getProductATP: (id: string) => InventoryService.getGlobalATP(id),
            syncSource: (source: 'ERP'|'WMS'|'POS') => InventoryService.syncExternalSource(source),
            allocate: (order: Order) => InventoryService.allocateStock(order)
        }
    },

    // --- DOMAIN: FINANCE & ERP ---
    Finance: {
        Ledger: {
            getEntries: () => LedgerService.getLedgerEntries(),
            getChartOfAccounts: () => LedgerService.getChartOfAccounts(),
            recordEntry: (entry: any) => LedgerService.recordJournalEntry(entry),
            createJournalEntry: (entry: any) => LedgerService.createJournalEntry(entry) // Exposed for event handlers
        },
        Payables: {
            getBills: () => PayablesService.getBills(),
            getVendors: () => PayablesService.getVendors(),
            createBill: (bill: any) => PayablesService.createBill(bill),
            approveBill: (id: string) => PayablesService.approveBill(id),
            payBill: (id: string, amount: number) => PayablesService.payBill(id, amount),
            getVendorCredits: () => PayablesService.getVendorCredits(),
            createVendorCredit: (vc: any) => PayablesService.createVendorCredit(vc)
        },
        Receivables: {
            getInvoices: () => ReceivablesService.getInvoices(),
            saveInvoice: (inv: any) => ReceivablesService.saveInvoice(inv),
            recordInvoicePayment: (id: string, amount: number, method: string) => ReceivablesService.recordInvoicePayment(id, amount, method),
            getQuotes: () => ReceivablesService.getQuotes(),
            saveQuote: (q: any) => ReceivablesService.saveQuote(q),
            convertQuoteToSO: (id: string) => ReceivablesService.convertQuoteToSO(id),
            getSalesOrders: () => ReceivablesService.getSalesOrders(),
            saveSalesOrder: (so: any) => ReceivablesService.saveSalesOrder(so),
            approveSalesOrder: (id: string) => ReceivablesService.approveSalesOrder(id)
        },
        Expenses: {
            getExpenses: () => ExpensesService.getExpenses(),
            addExpense: (e: any) => ExpensesService.addExpense(e),
            deleteExpense: (id: string) => ExpensesService.deleteExpense(id)
        },
        Reporting: {
            getForecast: () => ReportingService.getForecast(),
            getBankFeed: () => ReportingService.getBankFeed(),
            autoReconcile: () => ReportingService.autoReconcile(),
            generateStatement: (start?: string, end?: string) => ReportingService.generateStatement(start, end),
            getTaxReport: () => ReportingService.getTaxReport()
        },
        Assets: {
            list: () => AssetService.getAssets(),
            depreciate: (asset: Asset) => AssetService.calculateCurrentValue(asset)
        },
        Payroll: {
            generateSlip: (userId: string, month: string) => PayrollService.generateDraftPayslip(userId, month),
            listSlips: () => PayrollService.getPayslips()
        },
        Tax: {
            getSettings: () => SettingsService.getTaxSettings(),
            getReport: () => ReportingService.getTaxReport() // Reporting service now handles this
        }
    },

    // --- DOMAIN: IDENTITY & CRM ---
    Identity: {
        Auth: {
            getCurrentUser: () => IdentityService.getCurrentUser(),
            switchSession: (id: string) => IdentityService.switchUserSession(id)
        },
        Users: {
            list: () => IdentityService.getUsers(),
            updateRole: (user: User) => IdentityService.updateUser(user)
        },
        CRM: {
            getProfile: (user: User) => CustomerService.ensureCustomerProfile(user),
            getWalletBalance: async (userId: string) => {
                const profile = await CustomerService.getCustomerByUserId(userId);
                return profile?.walletBalance || 0;
            },
            redeemGiftCard: (code: string, userId: string) => WalletService.redeemGiftCard(code, userId),
        }
    },

    // --- DOMAIN: OPERATIONS & LOGISTICS ---
    Operations: {
        Logistics: {
            trackOrder: (id: string) => DeliveryService.getAssignedOrders(id), // Demo logic
            updateRoute: (ids: string[]) => DeliveryService.startDeliveryRoute(ids)
        },
        Chain: {
            getStores: () => ChainService.getStores(),
            getStats: () => ChainService.getAggregatedStats()
        }
    },

    // --- DOMAIN: INTELLIGENCE & ENGAGEMENT ---
    Intelligence: {
        Engagement: {
            getReviews: (id: string) => EngagementService.getProductReviews(id),
            getChatSessions: () => EngagementService.getSessions()
        },
        Marketing: {
            trackEvent: (evt: string, data: any) => MarketingService.trackEvent(evt, data)
        },
        Knowledge: {
            getArticles: () => KnowledgeService.getArticles()
        }
    }
};
