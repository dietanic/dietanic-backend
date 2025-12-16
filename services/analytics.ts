
import { SalesService } from './sales';
import { FinanceService } from './finance';
import { CatalogService } from './catalog';
import { IdentityService } from './identity';
import { ProfitLossStatement, CohortData, ProductJourneyInfo, Order, Expense, Product } from '../types';
import { delay } from './storage';

export const AnalyticsService = {
    // --- 1. Real-time Profit & Loss ---
    getProfitLossStatement: async (period: 'this_month' | 'ytd'): Promise<ProfitLossStatement> => {
        await delay(300);
        const [orders, expenses, products] = await Promise.all([
            SalesService.getOrders(),
            FinanceService.getExpenses(),
            CatalogService.getProducts()
        ]);

        const now = new Date();
        const startOfPeriod = new Date();
        if (period === 'this_month') {
            startOfPeriod.setDate(1); // 1st of current month
        } else {
            startOfPeriod.setMonth(0, 1); // 1st Jan of current year
        }
        startOfPeriod.setHours(0,0,0,0);

        // Filter data by period
        const periodOrders = orders.filter(o => new Date(o.date) >= startOfPeriod && o.status !== 'cancelled');
        const periodExpenses = expenses.filter(e => new Date(e.date) >= startOfPeriod && e.status === 'approved');

        // Revenue Breakdown
        const revenueBreakdown: Record<string, number> = {};
        let totalRevenue = 0;
        let totalCOGS = 0;

        periodOrders.forEach(order => {
            totalRevenue += order.subtotal; // Use subtotal (pre-tax) for revenue
            
            order.items.forEach(item => {
                const category = item.category || 'Other';
                revenueBreakdown[category] = (revenueBreakdown[category] || 0) + (item.price * item.quantity);
                
                // Calculate COGS
                const product = products.find(p => p.id === item.id);
                // If product has defined cost, use it. Else estimate 40%
                const unitCost = product?.cost || (item.price * 0.4); 
                totalCOGS += unitCost * item.quantity;
            });
        });

        // Expense Breakdown
        const expenseBreakdown: Record<string, number> = {};
        let totalExpenses = 0;
        periodExpenses.forEach(exp => {
            totalExpenses += exp.amount;
            expenseBreakdown[exp.category] = (expenseBreakdown[exp.category] || 0) + exp.amount;
        });

        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = grossProfit - totalExpenses;
        const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return {
            period: period === 'this_month' ? 'This Month' : 'Year to Date',
            revenue: {
                total: totalRevenue,
                breakdown: Object.entries(revenueBreakdown).map(([k, v]) => ({ category: k, amount: v }))
            },
            cogs: totalCOGS,
            grossProfit,
            expenses: {
                total: totalExpenses,
                breakdown: Object.entries(expenseBreakdown).map(([k, v]) => ({ category: k, amount: v }))
            },
            netProfit,
            netProfitMargin: parseFloat(margin.toFixed(2))
        };
    },

    // --- 2. Cohort Analysis (Revenue & Retention) ---
    getCohortAnalysis: async (): Promise<CohortData[]> => {
        await delay(500);
        const [orders, users] = await Promise.all([
            SalesService.getOrders(),
            IdentityService.getUsers()
        ]);

        const customers = users.filter(u => u.role === 'customer');
        const cohorts: Record<string, CohortData> = {};

        // Helper to get month string YYYY-MM
        const getMonthStr = (date: string | Date) => new Date(date).toISOString().slice(0, 7);

        // Assign users to cohorts based on First Order Date (or creation date)
        customers.forEach(user => {
            const userOrders = orders.filter(o => o.userId === user.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            if (userOrders.length === 0) return;

            const firstOrderDate = userOrders[0].date;
            const cohortMonth = getMonthStr(firstOrderDate);

            if (!cohorts[cohortMonth]) {
                cohorts[cohortMonth] = {
                    cohortMonth,
                    newCustomers: 0,
                    retention: Array(12).fill(null).map((_, i) => ({ monthIndex: i, percentage: 0, revenue: 0 })),
                    cac: 150 + Math.random() * 50, // Mock CAC variation
                    ltv: 0 // Calc later
                };
            }

            cohorts[cohortMonth].newCustomers++;

            // Calculate Retention & Revenue per relative month
            userOrders.forEach(order => {
                const orderMonth = getMonthStr(order.date);
                
                // Calculate month difference
                const d1 = new Date(cohortMonth + "-01");
                const d2 = new Date(orderMonth + "-01");
                const diffMonths = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());

                if (diffMonths >= 0 && diffMonths < 12) {
                    cohorts[cohortMonth].retention[diffMonths].revenue += order.total;
                    // Note: Calculating exact user retention count requires tracking unique users per bucket, simplified here to just revenue aggregation for demo
                }
            });
        });

        // Post-process: Calculate LTV and normalize
        return Object.values(cohorts).sort((a,b) => b.cohortMonth.localeCompare(a.cohortMonth)).map(cohort => {
            const totalRev = cohort.retention.reduce((sum, r) => sum + r.revenue, 0);
            cohort.ltv = totalRev / cohort.newCustomers;
            return cohort;
        });
    },

    // --- 3. Product Journey Insights ---
    getProductJourneys: async (): Promise<ProductJourneyInfo[]> => {
        await delay(400);
        const [orders, products] = await Promise.all([
            SalesService.getOrders(),
            CatalogService.getProducts()
        ]);

        const stats: Record<string, { first: number, totalRevenueAttributed: number, customers: Set<string> }> = {};

        // Analyze First Purchases
        const userFirstOrders: Record<string, Order> = {};
        orders.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(o => {
            if (!userFirstOrders[o.userId]) {
                userFirstOrders[o.userId] = o;
                
                // Attribute first purchase
                o.items.forEach(item => {
                    if (!stats[item.id]) stats[item.id] = { first: 0, totalRevenueAttributed: 0, customers: new Set() };
                    stats[item.id].first++;
                    stats[item.id].customers.add(o.userId);
                });
            } else {
                // Attribution for LTV: Attribute subsequent spend to the "Gateway Product"
                // Simplified: Split credit among all first-order items
                const firstOrderItems = userFirstOrders[o.userId].items;
                const creditPerItem = o.total / firstOrderItems.length;
                
                firstOrderItems.forEach(firstItem => {
                    if (stats[firstItem.id]) {
                        stats[firstItem.id].totalRevenueAttributed += creditPerItem;
                    }
                });
            }
        });

        // Calculate Repurchase Rate
        // Simplified: (Total Customers who bought this first AND bought again) / (Total Customers who bought this first)
        // Here we just map the data
        return products.map(p => {
            const data = stats[p.id] || { first: 0, totalRevenueAttributed: 0, customers: new Set() };
            const avgLTV = data.first > 0 ? (data.totalRevenueAttributed / data.first) + p.price : p.price; // Initial + attributed
            
            return {
                productId: p.id,
                productName: p.name,
                isGateway: data.first > 10, // Arbitrary threshold
                firstPurchaseCount: data.first,
                repurchaseRate: Math.min(100, (avgLTV / p.price) * 20), // Mock calc based on value multiplier
                avgLTVAttributed: avgLTV
            };
        }).sort((a,b) => b.firstPurchaseCount - a.firstPurchaseCount);
    },

    getBenchmarkData: () => {
        return [
            { metric: 'Avg. Page Load', yourStore: 1.2, industry: 2.5, unit: 's', better: 'lower' },
            { metric: 'Conversion Rate', yourStore: 3.4, industry: 1.8, unit: '%', better: 'higher' },
            { metric: 'SEO Score', yourStore: 85, industry: 72, unit: '', better: 'higher' },
            { metric: 'Mobile Usability', yourStore: 98, industry: 85, unit: '/100', better: 'higher' },
            { metric: 'CAC', yourStore: 180, industry: 250, unit: '₹', better: 'lower' },
            { metric: 'LTV', yourStore: 4500, industry: 3200, unit: '₹', better: 'higher' },
        ];
    }
};
