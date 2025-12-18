import { FinancialForecast, ProfitLossStatement, BankTransaction } from '../../types';
import { DB, delay } from '../storage';
import { getChartOfAccounts } from './ledger';
import { getExpenses } from './expenses';
import { SalesService } from '../sales';
import { CatalogService } from '../catalog';

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

export const generateStatement = async (start?: string, end?: string): Promise<ProfitLossStatement> => {
    await delay();
    const accounts = await getChartOfAccounts();
    
    const revTotal = accounts.filter(a => a.type === 'Income').reduce((s, a) => s + Math.abs(a.balance), 0);
    const expTotal = accounts.filter(a => a.type === 'Expense').reduce((s, a) => s + Math.abs(a.balance), 0);
    const cogsValue = accounts.find(a => a.code === 5000)?.balance || 0;
    
    if (revTotal === 0 && expTotal === 0) {
         // Fix: Explicitly name all variables in destructuring to avoid syntax elision issues
         const [orders, products, expenses] = await Promise.all([
             SalesService.getOrders(), 
             CatalogService.getProducts(), 
             getExpenses()
         ]);
         
         const r = orders.reduce((sum, o) => sum + o.subtotal, 0);
         const e = expenses.reduce((sum, x) => sum + x.amount, 0);

         const grossProfitFallback = r * 0.6;
         const netProfitFallback = grossProfitFallback - e;
         const netProfitMarginFallback = r > 0 ? (netProfitFallback / r) * 100 : 0;

         return { 
            period: 'Fallback',
            revenue: { total: r, breakdown: [] },
            cogs: r * 0.4,
            grossProfit: grossProfitFallback,
            expenses: { total: e, breakdown: [] },
            netProfit: netProfitFallback,
            netProfitMargin: parseFloat(netProfitMarginFallback.toFixed(2))
         };
    }

    const grossProfitActual = revTotal - Math.abs(cogsValue);
    const netProfitActual = revTotal - expTotal;
    const netProfitMarginActual = revTotal > 0 ? (netProfitActual / revTotal) * 100 : 0;

    return { 
        period: 'Current',
        revenue: { total: revTotal, breakdown: [] },
        cogs: Math.abs(cogsValue), 
        grossProfit: grossProfitActual, 
        expenses: { total: expTotal - Math.abs(cogsValue), breakdown: [] },
        netProfit: netProfitActual, 
        netProfitMargin: parseFloat(netProfitMarginActual.toFixed(2))
    };
};

export const getTaxReport = async () => {
    const accounts = await getChartOfAccounts();
    const taxPayable = accounts.find(a => a.code === 2500)?.balance || 0;
    return { totalTax: taxPayable, igst: taxPayable * 0.5, cgst: taxPayable * 0.25, sgst: taxPayable * 0.25, urSales: 0 };
};