import { FinancialForecast, ProfitLossStatement, BankTransaction } from '../../types';
import { DB, delay, getLocalStorage } from '../storage';
import { getChartOfAccounts } from './ledger'; // Import from local finance microservice
import { getExpenses } from './expenses'; // Import from local finance microservice
import { SalesService } from '../sales';
import { CatalogService } from '../catalog';

// Microservice: Finance Reporting
// Handles forecasts, bank feeds, P&L statements, and tax reports

export const getForecast = async (): Promise<FinancialForecast[]> => {
    await delay();
    const base = 45000;
    return Array.from({length: 6}, (_, i) => ({
        month: new Date(new Date().setMonth(new Date().getMonth()+i)).toLocaleString('default', {month:'short'}),
        projectedRevenue: Math.round(base * (1 + i*0.05)),
        projectedExpenses: Math.round(base * 0.7),
        cashPosition: 120000 + (i * 5000)
    }));
};

export const getBankFeed = async (): Promise<BankTransaction[]> => DB.getAll<BankTransaction>('dietanic_bank', [
    { id: 'bk1', date: new Date().toISOString(), description: 'STRIPE', amount: 4500, status: 'unreconciled' },
    { id: 'bk2', date: new Date().toISOString(), description: 'AWS', amount: -200, status: 'unreconciled' }
]);

export const autoReconcile = async (): Promise<number> => { await delay(500); return 2; };

// Fix: Correctly structure the returned ProfitLossStatement objects
export const generateStatement = async (start?: string, end?: string): Promise<ProfitLossStatement> => {
    await delay();
    const accounts = await getChartOfAccounts(); // Use local ledger service
    
    const revTotal = accounts.filter(a => a.type === 'Income').reduce((s, a) => s + Math.abs(a.balance), 0);
    const expTotal = accounts.filter(a => a.type === 'Expense').reduce((s, a) => s + Math.abs(a.balance), 0);
    const cogsValue = accounts.find(a => a.code === 5000)?.balance || 0;
    
    // Fallback if no actual entries exist (e.g., initial state)
    if (revTotal === 0 && expTotal === 0) {
         const [orders, products, expenses] = await Promise.all([SalesService.getOrders(), CatalogService.getProducts(), getExpenses()]); // Use local expenses service
         const r = orders.reduce((sum, o) => sum + o.subtotal, 0);
         const e = expenses.reduce((sum, x) => sum + x.amount, 0);
         // `taxLiability` is not part of `ProfitLossStatement`
         // const t = orders.reduce((sum, o) => sum + (o.taxAmount||0), 0); 

         const grossProfitFallback = r * 0.6;
         const netProfitFallback = grossProfitFallback - e;
         const netProfitMarginFallback = r > 0 ? (netProfitFallback / r) * 100 : 0;

         return { 
            period: 'Fallback',
            revenue: { total: r, breakdown: [] }, // Provide empty array for breakdown
            cogs: r * 0.4, // Simplified COGS for fallback
            grossProfit: grossProfitFallback,
            expenses: { total: e, breakdown: [] }, // Provide empty array for breakdown
            netProfit: netProfitFallback,
            netProfitMargin: parseFloat(netProfitMarginFallback.toFixed(2)) // Ensure correct type and precision
         };
    }

    // For actual data, we would compute a real breakdown from ledger entries.
    // For simplicity and to match the interface, we provide an empty breakdown for now.
    const grossProfitActual = revTotal - cogsValue;
    const netProfitActual = revTotal - expTotal;
    const netProfitMarginActual = revTotal > 0 ? (netProfitActual / revTotal) * 100 : 0;

    return { 
        period: 'Current', // Placeholder, ideally derived from start/end
        revenue: { total: revTotal, breakdown: [] }, // Fix: Correctly structure revenue
        cogs: cogsValue, 
        grossProfit: grossProfitActual, 
        expenses: { total: expTotal - cogsValue, breakdown: [] }, // Fix: Correctly structure expenses. `expTotal - cogsValue` for operating expenses
        netProfit: netProfitActual, 
        netProfitMargin: parseFloat(netProfitMarginActual.toFixed(2))
    };
};

export const getTaxReport = async () => {
    const accounts = await getChartOfAccounts(); // Use local ledger service
    const taxPayable = accounts.find(a => a.code === 2500)?.balance || 0;
    return { totalTax: taxPayable, igst: taxPayable * 0.5, cgst: taxPayable * 0.25, sgst: taxPayable * 0.25, urSales: 0 };
};