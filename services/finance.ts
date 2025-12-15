
import { Order, Product, Expense } from '../types';
import { STORAGE_KEYS, delay, getLocalStorage, setLocalStorage } from './storage';
import { CatalogService } from './catalog';
import { SalesService } from './sales';
import { GlobalEventBus, EVENTS } from './eventBus';

// Finance Service listens to system events to update its ledgers
GlobalEventBus.on(EVENTS.ORDER_CREATED, (order: Order) => {
    console.log(`💰 Finance Microservice: Recording transaction for Order ${order.id} (₹${order.total})`);
    // In a real DB, we would insert into a 'Transactions' or 'Revenue' table here.
    // Since our generateStatement pulls from Orders dynamically in this mock, 
    // we just acknowledge the event.
});

const INITIAL_EXPENSES: Expense[] = [
    { id: 'exp_1', category: 'Rent', amount: 15000, date: new Date().toISOString(), description: 'Kitchen Rent - Current Month', paymentMethod: 'Bank Transfer' },
    { id: 'exp_2', category: 'Software', amount: 2000, date: new Date().toISOString(), description: 'POS Subscription', paymentMethod: 'Credit Card' },
    { id: 'exp_3', category: 'Marketing', amount: 5000, date: new Date(Date.now() - 86400000 * 5).toISOString(), description: 'Social Media Ads', paymentMethod: 'Credit Card' },
    { id: 'exp_4', category: 'Salaries', amount: 25000, date: new Date(Date.now() - 86400000 * 15).toISOString(), description: 'Staff Salaries', paymentMethod: 'Bank Transfer' },
];

export const FinanceService = {
    // Expense Management
    getExpenses: async (): Promise<Expense[]> => {
        await delay();
        const stored = getLocalStorage<Expense[]>('dietanic_expenses', []);
        return stored.length > 0 ? stored : INITIAL_EXPENSES;
    },

    addExpense: async (expense: Expense): Promise<void> => {
        await delay();
        const expenses = getLocalStorage<Expense[]>('dietanic_expenses', INITIAL_EXPENSES);
        expenses.push(expense);
        setLocalStorage('dietanic_expenses', expenses);
    },

    deleteExpense: async (id: string): Promise<void> => {
        await delay();
        let expenses = getLocalStorage<Expense[]>('dietanic_expenses', INITIAL_EXPENSES);
        expenses = expenses.filter(e => e.id !== id);
        setLocalStorage('dietanic_expenses', expenses);
    },

    // P&L Generation
    generateStatement: async (startDate?: string, endDate?: string) => {
        await delay(500);
        // Note: In a true microservice, we would request data from Sales/Catalog APIs
        // or maintain our own read-model. For this mock, we reuse the service getters.
        const [orders, products, expenses] = await Promise.all([
            SalesService.getOrders(),
            CatalogService.getProducts(),
            FinanceService.getExpenses()
        ]);

        // Filter by date range if provided
        const filteredOrders = orders.filter(o => {
            const d = new Date(o.date).getTime();
            const start = startDate ? new Date(startDate).getTime() : 0;
            const end = endDate ? new Date(endDate).getTime() : Date.now();
            return d >= start && d <= end && o.status !== 'cancelled';
        });

        const filteredExpenses = expenses.filter(e => {
            const d = new Date(e.date).getTime();
            const start = startDate ? new Date(startDate).getTime() : 0;
            const end = endDate ? new Date(endDate).getTime() : Date.now();
            return d >= start && d <= end;
        });

        // 1. Revenue
        const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.subtotal || o.total), 0); 

        // 2. COGS (Cost of Goods Sold)
        let totalCOGS = 0;
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.id);
                const unitCost = product?.cost || item.price * 0.4; 
                totalCOGS += unitCost * item.quantity;
            });
        });

        // 3. Gross Profit
        const grossProfit = totalRevenue - totalCOGS;

        // 4. Operating Expenses
        const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

        // 5. Net Profit
        const netProfit = grossProfit - totalExpenses;

        // 6. Tax collected (Liability)
        const totalTaxCollected = filteredOrders.reduce((acc, o) => acc + (o.taxAmount || 0), 0);

        return {
            revenue: totalRevenue,
            cogs: totalCOGS,
            grossProfit,
            expenses: totalExpenses,
            netProfit,
            taxLiability: totalTaxCollected,
            orderCount: filteredOrders.length,
            breakdown: {
                orders: filteredOrders,
                expensesList: filteredExpenses
            }
        };
    },

    getTaxReport: async () => {
        await delay();
        const orders = await SalesService.getOrders();
        const validOrders = orders.filter(o => o.status !== 'cancelled');

        const report = {
            totalTax: 0,
            igst: 0,
            cgst: 0,
            sgst: 0,
            urSales: 0 
        };

        validOrders.forEach(o => {
            if (o.taxAmount) {
                report.totalTax += o.taxAmount;
                if (o.taxType === 'INTER') {
                    report.igst += o.taxAmount;
                } else if (o.taxType === 'INTRA') {
                    report.cgst += o.taxAmount / 2;
                    report.sgst += o.taxAmount / 2;
                }
            } else {
                report.urSales += o.total;
            }
        });

        return report;
    }
};
