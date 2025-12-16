
import { CatalogService } from './catalog';
import { SalesService } from './sales';
import { IdentityService } from './identity';
import { WalletService } from './wallet';
import { CustomerService } from './customers';
import { DiscountService } from './discounts';
import { EngagementService } from './engagement';
import { SettingsService } from './settings';
import { FinanceService } from './finance';
import { AssetService } from './assets';
import { PayrollService } from './payroll';
import { DeliveryService } from './delivery';
import { ChainService } from './chainService';
import { MarketingService } from './marketing';
import { Product, Order, User, Review, Discount, TaxSettings, KnowledgeArticle, Asset, Payslip } from '../types';
import { KnowledgeService } from './knowledge';

/**
 * MICROSERVICES API GATEWAY
 * 
 * Orchestrates communication between the Frontend Shell and distributed Backend Domains.
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
        }
    },

    // --- DOMAIN: FINANCE & ERP ---
    Finance: {
        Ledger: {
            getEntries: () => FinanceService.getLedgerEntries(),
            getChartOfAccounts: () => FinanceService.getChartOfAccounts(),
            recordEntry: (entry: any) => FinanceService.recordJournalEntry(entry)
        },
        Payables: {
            getBills: () => FinanceService.getBills(),
            getVendors: () => FinanceService.getVendors()
        },
        Receivables: {
            getInvoices: () => FinanceService.getInvoices(),
            getQuotes: () => FinanceService.getQuotes()
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
            getReport: () => FinanceService.getTaxReport()
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
