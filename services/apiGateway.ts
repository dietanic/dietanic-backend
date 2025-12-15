
import { CatalogService } from './catalog';
import { SalesService } from './sales';
import { IdentityService } from './identity';
import { WalletService } from './wallet';
import { CustomerService } from './customers';
import { DiscountService } from './discounts';
import { EngagementService } from './engagement';
import { SettingsService } from './settings';
import { FinanceService } from './finance';
import { Product, Order, User, CartItem, SubscriptionPlan, ProductVariation, Review, Discount, TaxSettings, CustomerProfile } from '../types';

/**
 * API GATEWAY
 * 
 * The single entry point for the frontend application.
 * In a real architecture, this would route HTTP requests to appropriate microservices.
 * Here, it abstracts the service method calls and provides a unified interface.
 */
export const APIGateway = {
    // Product Catalog
    catalog: {
        list: () => CatalogService.getProducts(),
        get: (id: string) => CatalogService.getProductById(id),
        getCategories: () => CatalogService.getCategories(),
    },

    // Sales & Orders
    order: {
        create: (order: Order) => SalesService.createOrder(order), // Routes to Saga Orchestrator
        listByUser: (userId: string) => SalesService.getOrdersByUser(userId),
        listAll: () => SalesService.getOrders(), // Admin
        updateStatus: (order: Order) => SalesService.updateOrder(order),
    },

    // Identity & Access
    auth: {
        getCurrentUser: () => IdentityService.getCurrentUser(),
        getUsers: () => IdentityService.getUsers(), // Admin
    },

    // Customer & Wallet
    customer: {
        getProfile: (user: User) => CustomerService.ensureCustomerProfile(user),
        getWalletBalance: async (userId: string) => {
            const profile = await CustomerService.getCustomerByUserId(userId);
            return profile?.walletBalance || 0;
        },
        redeemGiftCard: (code: string, userId: string) => WalletService.redeemGiftCard(code, userId),
    },

    // Discounts & Promotions
    promotion: {
        validate: (code: string, amount: number, categories: string[]) => DiscountService.validateDiscount(code, amount, categories),
    },

    // System Settings
    settings: {
        getTax: () => SettingsService.getTaxSettings(),
    },

    // Reviews & Engagement
    engagement: {
        getReviews: (productId: string) => EngagementService.getProductReviews(productId),
        addReview: (review: Review) => EngagementService.addReview(review),
    }
};
